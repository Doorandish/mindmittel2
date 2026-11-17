import { NextRequest, NextResponse } from 'next/server';
import { DEMO_TENANT } from '@/core/tenancy/tenantModel';
import {
  attachTenantSessionCookie,
  clearSessionCookie,
  readTenantSession,
  resolveRequestZone,
  TENANT_SESSION_COOKIE,
} from '@/infrastructure/http/tenantRequestGuard';
import { resolveTenantBySlug } from '@/infrastructure/tenancy/tenantRepository';
import { runWithTenantContext } from '@/infrastructure/tenancy/tenantContext';
import { upsertAuthenticatedUser } from '@/infrastructure/rag/brainRepository';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const zone = resolveRequestZone(request);
  const slug = zone.zone === 'tenant' ? zone.slug : DEMO_TENANT.slug;
  const session = readTenantSession(request, slug);
  return NextResponse.json({
    ok: true,
    authenticated: Boolean(session),
    user: session
      ? {
          email: session.sub,
          fullName: session.name,
          department: session.department,
          role: session.role,
          tenantSlug: session.tenant,
        }
      : null,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      fullName?: string;
      department?: string;
      role?: 'admin' | 'auditor' | 'executive' | 'viewer';
    };

    if (!body.email?.trim()) {
      return NextResponse.json(
        { ok: false, error: 'A valid corporate email address is required.' },
        { status: 400 }
      );
    }

    const zone = resolveRequestZone(request);
    const slug = zone.zone === 'tenant' ? zone.slug : DEMO_TENANT.slug;
    const tenant = (await resolveTenantBySlug(slug)) ?? DEMO_TENANT;

    // Customer workspaces require 6-digit OTP verification; passwordless sign-in is only allowed in open/demo mode
    if (tenant.authMode === 'otp') {
      return NextResponse.json(
        {
          ok: false,
          error: 'This company workspace requires 6-digit email verification (OTP).',
          code: 'OTP_REQUIRED',
        },
        { status: 403 }
      );
    }

    const user = await runWithTenantContext({ tenant, session: null }, () =>
      upsertAuthenticatedUser({
        email: body.email!,
        fullName: body.fullName,
        department: body.department,
        role: body.role,
      })
    );

    const response = NextResponse.json({
      ok: true,
      user,
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
        error: err instanceof Error ? err.message : 'Authentication failed',
      },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response, TENANT_SESSION_COOKIE);
  return response;
}
