import { NextRequest, NextResponse } from 'next/server';
import {
  DEMO_TENANT,
  isEmailAllowedForTenant,
} from '@/core/tenancy/tenantModel';
import { createFixedWindowRateLimiter } from '@/core/security/rateLimiter';
import { resolveRequestZone } from '@/infrastructure/http/tenantRequestGuard';
import { resolveTenantBySlug } from '@/infrastructure/tenancy/tenantRepository';
import { issueAndSendTenantOtp } from '@/infrastructure/auth/otpService';

export const dynamic = 'force-dynamic';

const otpRequestLimiter = createFixedWindowRateLimiter({
  limit: 6,
  windowMs: 10 * 60 * 1000,
});

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      tenantSlug?: string;
    };

    const email = (body.email ?? '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'Corporate email address is required.' },
        { status: 400 }
      );
    }

    const zone = resolveRequestZone(request);
    const slug =
      body.tenantSlug?.trim().toLowerCase() ||
      (zone.zone === 'tenant' ? zone.slug : DEMO_TENANT.slug);

    const tenant = await resolveTenantBySlug(slug);
    if (!tenant || tenant.status !== 'active') {
      return NextResponse.json(
        { ok: false, error: 'This company workspace is not active.' },
        { status: 404 }
      );
    }

    if (
      tenant.authMode === 'otp' &&
      !isEmailAllowedForTenant(email, {
        allowedEmailDomains: tenant.allowedEmailDomains,
        allowedEmails: tenant.allowedEmails,
      })
    ) {
      const domainHint =
        tenant.allowedEmailDomains.length > 0
          ? tenant.allowedEmailDomains.map((d) => `@${d}`).join(', ')
          : 'authorized corporate addresses';
      return NextResponse.json(
        {
          ok: false,
          error: `Access denied: only ${domainHint} email addresses are permitted on ${tenant.slug}.mindmittel.de.`,
        },
        { status: 403 }
      );
    }

    const rate = otpRequestLimiter.hit(`${tenant.slug}:${email}`);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Too many verification code requests. Please wait a few minutes.',
        },
        { status: 429 }
      );
    }

    const dispatch = await issueAndSendTenantOtp({
      tenantSlug: tenant.slug,
      companyName: tenant.companyName,
      email,
    });

    return NextResponse.json({
      ok: true,
      deliveredVia: dispatch.deliveredVia,
      expiresAt: dispatch.expiresAt,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to send verification code.';
    const isSmtpError = message.toLowerCase().includes('smtp');
    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: isSmtpError ? 503 : 400 }
    );
  }
}
