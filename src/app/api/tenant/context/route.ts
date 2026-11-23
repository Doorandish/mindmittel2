import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_COMPLIANCE_PROFILE,
  DEMO_TENANT,
} from '@/core/tenancy/tenantModel';
import {
  OPEN_DEMO_USER_ACCESS,
  type TenantDepartmentItem,
  type TenantUserAccessProfile,
} from '@/core/auth/rbac';
import {
  readTenantSession,
  resolveRequestZone,
} from '@/infrastructure/http/tenantRequestGuard';
import { resolveTenantBySlug } from '@/infrastructure/tenancy/tenantRepository';
import { runWithTenantContext } from '@/infrastructure/tenancy/tenantContext';
import {
  getTenantUserAccessProfile,
  listTenantDepartments,
} from '@/infrastructure/tenancy/tenantGovernanceRepository';

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

  const { userAccess, departments } = await runWithTenantContext(
    { tenant, session },
    async (): Promise<{
      userAccess: TenantUserAccessProfile | null;
      departments: TenantDepartmentItem[];
    }> => {
      const depts = await listTenantDepartments();
      if (tenant.authMode === 'open') {
        return { userAccess: OPEN_DEMO_USER_ACCESS, departments: depts };
      }
      if (!session) {
        return { userAccess: null, departments: depts };
      }
      const resolved = await getTenantUserAccessProfile(
        session.sub,
        tenant.adminEmails ?? []
      );
      return {
        userAccess: resolved ?? {
          email: session.sub,
          fullName: session.name,
          role: 'evaluator',
          status: 'pending',
          allowedDepartments: [],
        },
        departments: depts,
      };
    }
  );

  return NextResponse.json({
    ok: true,
    status: tenant.status,
    tenant: {
      slug: tenant.slug,
      companyName: tenant.companyName,
      logoDataUrl: tenant.logoDataUrl ?? null,
      complianceProfile: tenant.complianceProfile ?? {
        ...DEFAULT_COMPLIANCE_PROFILE,
      },
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
    userAccess,
    departments,
  });
}
