import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_ROOT_DOMAIN,
  resolveHostZone,
  type HostZone,
} from '@/core/tenancy/hostResolver';
import { DEMO_TENANT, type ResolvedTenant } from '@/core/tenancy/tenantModel';
import {
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
  type SessionRole,
} from '@/core/security/sessionToken';
import { getSessionSigningKey } from '@/infrastructure/security/masterKey';
import { resolveTenantBySlug } from '@/infrastructure/tenancy/tenantRepository';
import { runWithTenantContext } from '@/infrastructure/tenancy/tenantContext';

export const TENANT_SESSION_COOKIE = 'mm_tenant_session';
export const OWNER_SESSION_COOKIE = 'mm_owner_session';
export const SESSION_TTL_SECONDS = 12 * 60 * 60; // 12 hours

export function extractRequestHost(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    ''
  );
}

export function resolveRequestZone(request: NextRequest): HostZone {
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim() || DEFAULT_ROOT_DOMAIN;
  const headerTenant = request.headers.get('x-mindmittel-tenant')?.trim().toLowerCase();
  if (headerTenant) {
    return { zone: 'tenant', slug: headerTenant };
  }
  return resolveHostZone(extractRequestHost(request), rootDomain);
}

export function readTenantSession(
  request: NextRequest,
  expectedTenantSlug: string
): SessionPayload | null {
  const raw = request.cookies.get(TENANT_SESSION_COOKIE)?.value;
  const payload = verifySessionToken(raw, getSessionSigningKey());
  if (!payload || payload.kind !== 'tenant') return null;
  if (payload.tenant !== expectedTenantSlug) return null;
  return payload;
}

export function readOwnerSession(request: NextRequest): SessionPayload | null {
  const raw = request.cookies.get(OWNER_SESSION_COOKIE)?.value;
  const payload = verifySessionToken(raw, getSessionSigningKey());
  if (!payload || payload.kind !== 'owner' || payload.tenant !== '__owner__') {
    return null;
  }
  return payload;
}

export function attachTenantSessionCookie(
  response: NextResponse,
  claims: {
    email: string;
    name: string;
    department: string;
    role: SessionRole;
    tenantSlug: string;
  }
): void {
  const token = signSessionToken(
    {
      kind: 'tenant',
      sub: claims.email.trim().toLowerCase(),
      name: claims.name,
      department: claims.department,
      role: claims.role,
      tenant: claims.tenantSlug,
    },
    getSessionSigningKey(),
    SESSION_TTL_SECONDS
  );

  response.cookies.set(TENANT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function attachOwnerSessionCookie(
  response: NextResponse,
  email: string
): void {
  const token = signSessionToken(
    {
      kind: 'owner',
      sub: email.trim().toLowerCase(),
      name: 'Product Owner',
      department: 'Platform Administration',
      role: 'admin',
      tenant: '__owner__',
    },
    getSessionSigningKey(),
    SESSION_TTL_SECONDS
  );

  response.cookies.set(OWNER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(
  response: NextResponse,
  cookieName: string
): void {
  response.cookies.set(cookieName, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Wraps a workspace API handler so that:
 * 1. The active tenant is resolved from the subdomain (or defaults to `demo` when called on localhost in tests).
 * 2. Unknown or suspended tenants are rejected with 404 / 403.
 * 3. Customer tenants (`authMode === 'otp'`) require a valid `mm_tenant_session` cookie bound to that exact subdomain.
 * 4. All database & memory operations inside `handler` execute within `runWithTenantContext`.
 */
export async function withTenantApi(
  request: NextRequest,
  handler: (ctx: {
    tenant: ResolvedTenant;
    session: SessionPayload | null;
  }) => Promise<NextResponse>
): Promise<NextResponse> {
  const zone = resolveRequestZone(request);
  const slug = zone.zone === 'tenant' ? zone.slug : DEMO_TENANT.slug;

  const tenant = await resolveTenantBySlug(slug);
  if (!tenant) {
    return NextResponse.json(
      {
        ok: false,
        error: `Workspace "${slug}" is not registered on MindMittel.`,
        code: 'TENANT_NOT_FOUND',
      },
      { status: 404 }
    );
  }

  if (tenant.status !== 'active') {
    return NextResponse.json(
      {
        ok: false,
        error: `Workspace "${tenant.companyName}" is currently suspended.`,
        code: 'TENANT_SUSPENDED',
      },
      { status: 403 }
    );
  }

  const session = readTenantSession(request, tenant.slug);
  if (tenant.authMode === 'otp' && !session) {
    return NextResponse.json(
      {
        ok: false,
        error: `Please sign in with an authorized ${tenant.companyName} corporate email to access this workspace.`,
        code: 'TENANT_AUTH_REQUIRED',
      },
      { status: 401 }
    );
  }

  return runWithTenantContext({ tenant, session }, () =>
    handler({ tenant, session })
  );
}

/**
 * Wraps a super-admin API handler (`/api/admin/*`) and enforces product-owner authentication.
 */
export async function withOwnerApi(
  request: NextRequest,
  handler: (session: SessionPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = readOwnerSession(request);
  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Product owner authentication is required.',
        code: 'OWNER_AUTH_REQUIRED',
      },
      { status: 401 }
    );
  }
  return handler(session);
}
