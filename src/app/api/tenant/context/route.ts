import { NextRequest, NextResponse } from 'next/server';
import { DEMO_TENANT } from '@/core/tenancy/tenantModel';
import {
  readTenantSession,
  resolveRequestZone,
} from '@/infrastructure/http/tenantRequestGuard';
import { resolveTenantBySlug } from '@/infrastructure/tenancy/tenantRepository';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const zone = resolveRequestZone(request);
  const slug = zone.zone === 'tenant' ? zone.slug : DEMO_TENANT.slug;
  const tenant = await resolveTenantBySlug(slug);

  if (!tenant) {
    return NextResponse.json(
      {
        ok: false,
        status: 'not_found',
        slug,
        error: `Workspace "${slug}" is not registered.`,
      },
      { status: 404 }
    );
  }

  const session = readTenantSession(request, tenant.slug);

  return NextResponse.json({
    ok: true,
    status: tenant.status,
    tenant: {
      slug: tenant.slug,
      companyName: tenant.companyName,
      dbName: tenant.dbName,
      authMode: tenant.authMode,
      isDemo: tenant.isDemo,
      allowedEmailDomains: tenant.allowedEmailDomains,
      hasCustomGeminiKey: Boolean(tenant.geminiApiKey),
    },
    authenticated: tenant.authMode === 'open' ? true : Boolean(session),
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
