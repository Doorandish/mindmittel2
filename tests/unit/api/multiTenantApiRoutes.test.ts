import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as adminLoginPost } from '@/app/api/admin/session/route';
import {
  GET as adminTenantsGet,
  POST as adminTenantsPost,
} from '@/app/api/admin/tenants/route';
import { POST as otpRequestPost } from '@/app/api/auth/otp/request/route';
import { POST as otpVerifyPost } from '@/app/api/auth/otp/verify/route';
import {
  GET as docsGet,
  POST as docsPost,
} from '@/app/api/brain/documents/route';
import { resetTenantRepositoryForTests } from '@/infrastructure/tenancy/tenantRepository';

function extractCookieValue(
  setCookieHeader: string | null,
  name: string
): string {
  if (!setCookieHeader) return '';
  const match = setCookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : '';
}

describe('End-to-End Multi-Tenant Subdomain API Isolation & OTP Flow', () => {
  beforeEach(() => {
    delete process.env.MONGODB_URI;
    delete process.env.GEMINI_API_KEY;
    delete process.env.RESEND_API_KEY;
    resetTenantRepositoryForTests();
  });

  it('authenticates the product owner on admin.mindmittel.de and provisions a customer tenant', async () => {
    const badLogin = new NextRequest('https://admin.mindmittel.de/api/admin/session', {
      method: 'POST',
      headers: {
        host: 'admin.mindmittel.de',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: 'amir.doorandish@gmail.com',
        password: 'wrong-password',
      }),
    });
    const badRes = await adminLoginPost(badLogin);
    expect(badRes.status).toBe(401);

    const goodLogin = new NextRequest('https://admin.mindmittel.de/api/admin/session', {
      method: 'POST',
      headers: {
        host: 'admin.mindmittel.de',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: 'amir.doorandish@gmail.com',
        password: 'Amir.13659684',
      }),
    });
    const loginRes = await adminLoginPost(goodLogin);
    expect(loginRes.status).toBe(200);
    const ownerCookie = extractCookieValue(
      loginRes.headers.get('set-cookie'),
      'mm_owner_session'
    );
    expect(ownerCookie).toBeTruthy();

    const createReq = new NextRequest('https://admin.mindmittel.de/api/admin/tenants', {
      method: 'POST',
      headers: {
        host: 'admin.mindmittel.de',
        'content-type': 'application/json',
        cookie: `mm_owner_session=${ownerCookie}`,
      },
      body: JSON.stringify({
        slug: 'bosch',
        companyName: 'Robert Bosch GmbH',
        allowedEmailDomains: 'bosch.de',
      }),
    });
    const createRes = await adminTenantsPost(createReq);
    expect(createRes.status).toBe(200);
    const createData = await createRes.json();
    expect(createData.tenant.slug).toBe('bosch');
    expect(createData.tenant.dbName).toBe('mindmittel_bosch');
    expect(createData.tenant.connectionStringPreview).toContain(
      '/mindmittel_bosch'
    );

    const listReq = new NextRequest('https://admin.mindmittel.de/api/admin/tenants', {
      headers: {
        host: 'admin.mindmittel.de',
        cookie: `mm_owner_session=${ownerCookie}`,
      },
    });
    const listRes = await adminTenantsGet(listReq);
    const listData = await listRes.json();
    expect(listData.tenants).toHaveLength(1);
  });

  it('enforces corporate email domain + 6-digit OTP and prevents cross-subdomain session or data leakage', async () => {
    // 1. Owner provisions both bosch and siemens
    const loginRes = await adminLoginPost(
      new NextRequest('https://admin.mindmittel.de/api/admin/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'amir.doorandish@gmail.com',
          password: 'Amir.13659684',
        }),
      })
    );
    const ownerCookie = extractCookieValue(
      loginRes.headers.get('set-cookie'),
      'mm_owner_session'
    );

    for (const t of [
      { slug: 'bosch', companyName: 'Robert Bosch GmbH', allowedEmailDomains: 'bosch.de' },
      { slug: 'siemens', companyName: 'Siemens AG', allowedEmailDomains: 'siemens.de' },
    ]) {
      await adminTenantsPost(
        new NextRequest('https://admin.mindmittel.de/api/admin/tenants', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            cookie: `mm_owner_session=${ownerCookie}`,
          },
          body: JSON.stringify(t),
        })
      );
    }

    // 2. Unauthenticated call to bosch.mindmittel.de is blocked with 401
    const unauthRes = await docsGet(
      new NextRequest('https://bosch.mindmittel.de/api/brain/documents', {
        headers: { host: 'bosch.mindmittel.de' },
      })
    );
    expect(unauthRes.status).toBe(401);

    // 3. Outsider email domain (@siemens.de or @gmail.com) is rejected on bosch.mindmittel.de with 403
    const outsiderOtpRes = await otpRequestPost(
      new NextRequest('https://bosch.mindmittel.de/api/auth/otp/request', {
        method: 'POST',
        headers: {
          host: 'bosch.mindmittel.de',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email: 'spy@siemens.de' }),
      })
    );
    expect(outsiderOtpRes.status).toBe(403);

    // 4. Authorized @bosch.de employee requests and verifies 6-digit OTP
    const otpReqRes = await otpRequestPost(
      new NextRequest('https://bosch.mindmittel.de/api/auth/otp/request', {
        method: 'POST',
        headers: {
          host: 'bosch.mindmittel.de',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email: 'cfo@bosch.de' }),
      })
    );
    expect(otpReqRes.status).toBe(200);
    const otpReqData = await otpReqRes.json();
    expect(otpReqData.sandboxCode).toMatch(/^\d{6}$/);

    const verifyRes = await otpVerifyPost(
      new NextRequest('https://bosch.mindmittel.de/api/auth/otp/verify', {
        method: 'POST',
        headers: {
          host: 'bosch.mindmittel.de',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'cfo@bosch.de',
          code: otpReqData.sandboxCode,
          fullName: 'Bosch CFO',
          department: 'Finance & Legal',
        }),
      })
    );
    expect(verifyRes.status).toBe(200);
    const boschSessionCookie = extractCookieValue(
      verifyRes.headers.get('set-cookie'),
      'mm_tenant_session'
    );
    expect(boschSessionCookie).toBeTruthy();

    // 5. Bosch CFO ingests a confidential document into bosch.mindmittel.de
    const ingestRes = await docsPost(
      new NextRequest('https://bosch.mindmittel.de/api/brain/documents', {
        method: 'POST',
        headers: {
          host: 'bosch.mindmittel.de',
          'content-type': 'application/json',
          cookie: `mm_tenant_session=${boschSessionCookie}`,
        },
        body: JSON.stringify({
          title: 'Bosch Secret M&A Strategy 2027',
          content: 'Strictly confidential acquisition targets for Robert Bosch GmbH.',
          department: 'Finance & Legal',
        }),
      })
    );
    expect(ingestRes.status).toBe(200);

    // 6. Replay of Bosch's session cookie on siemens.mindmittel.de is rejected with 401!
    const crossTenantReplay = await docsGet(
      new NextRequest('https://siemens.mindmittel.de/api/brain/documents', {
        headers: {
          host: 'siemens.mindmittel.de',
          cookie: `mm_tenant_session=${boschSessionCookie}`,
        },
      })
    );
    expect(crossTenantReplay.status).toBe(401);

    // 7. Public demo (demo.mindmittel.de) never sees Bosch's document
    const demoDocsRes = await docsGet(
      new NextRequest('https://demo.mindmittel.de/api/brain/documents', {
        headers: { host: 'demo.mindmittel.de' },
      })
    );
    expect(demoDocsRes.status).toBe(200);
    const demoDocsData = await demoDocsRes.json();
    expect(
      demoDocsData.documents.map((d: { title: string }) => d.title)
    ).not.toContain('Bosch Secret M&A Strategy 2027');
  });
});
