import { NextRequest, NextResponse } from 'next/server';
import {
  DEMO_TENANT,
  isEmailAllowedForTenant,
} from '@/core/tenancy/tenantModel';
import {
  attachTenantSessionCookie,
  resolveRequestZone,
} from '@/infrastructure/http/tenantRequestGuard';
import { resolveTenantBySlug } from '@/infrastructure/tenancy/tenantRepository';
import { verifyTenantOtp } from '@/infrastructure/auth/otpService';
import { runWithTenantContext } from '@/infrastructure/tenancy/tenantContext';
import { upsertAuthenticatedUser } from '@/infrastructure/rag/brainRepository';
import { upsertTenantUserOnLogin } from '@/infrastructure/tenancy/tenantGovernanceRepository';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      code?: string;
      fullName?: string;
      department?: string;
      role?: 'admin' | 'auditor' | 'executive' | 'viewer';
      tenantSlug?: string;
    };

    const email = (body.email ?? '').trim().toLowerCase();
    const code = (body.code ?? '').trim();

    if (!email || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'A valid corporate email and 6-digit verification code are required.',
        },
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
        adminEmails: tenant.adminEmails,
      })
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'This email domain is not authorized for this company workspace.',
        },
        { status: 403 }
      );
    }

    const outcome = await verifyTenantOtp({
      tenantSlug: tenant.slug,
      email,
      code,
    });

    if (outcome !== 'ok') {
      const messages: Record<string, string> = {
        invalid: 'Invalid verification code. Please check the 6-digit code and try again.',
        expired: 'Verification code has expired. Please request a new code.',
        locked: 'Too many failed attempts. Please request a new verification code.',
        missing: 'No active verification code found. Please request a code first.',
      };
      return NextResponse.json(
        { ok: false, error: messages[outcome] ?? 'Verification failed.' },
        { status: 401 }
      );
    }

    const { user, userAccess } = await runWithTenantContext(
      { tenant, session: null },
      async () => {
        const upsertedUser = await upsertAuthenticatedUser({
          email,
          fullName: body.fullName,
          department: body.department,
          role: body.role,
        });
        const access = await upsertTenantUserOnLogin({
          email: upsertedUser.email,
          fullName: upsertedUser.fullName,
          tenantAdminEmails: tenant.adminEmails ?? [],
        });
        return { user: upsertedUser, userAccess: access };
      }
    );

    const response = NextResponse.json({
      ok: true,
      user,
      userAccess,
      tenant: {
        slug: tenant.slug,
        companyName: tenant.companyName,
        dbName: tenant.dbName,
      },
    });

    attachTenantSessionCookie(response, {
      email: user.email,
      name: user.fullName,
      department: user.department,
      role: user.role,
      tenantSlug: tenant.slug,
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'OTP verification failed.',
      },
      { status: 400 }
    );
  }
}
