import { NextRequest, NextResponse } from 'next/server';
import {
  canManageGovernance,
  type TenantUserRole,
  type TenantUserStatus,
} from '@/core/auth/rbac';
import { withTenantApi } from '@/infrastructure/http/tenantRequestGuard';
import {
  addTenantDepartment,
  deleteTenantDepartment,
  listTenantDepartments,
  listTenantUsers,
  updateTenantUserAccess,
} from '@/infrastructure/tenancy/tenantGovernanceRepository';
import { listBrainDocuments } from '@/infrastructure/rag/brainRepository';
import { systemLogger } from '@/infrastructure/logging/logger';
import {
  updateDemoComplianceProfile,
  updateTenant,
} from '@/infrastructure/tenancy/tenantRepository';
import type { TenantComplianceProfile } from '@/core/tenancy/tenantModel';

export const dynamic = 'force-dynamic';

async function buildDepartmentsWithDocumentCounts() {
  const [departments, docs] = await Promise.all([
    listTenantDepartments(),
    listBrainDocuments(),
  ]);

  const counts = new Map<string, number>();
  for (const doc of docs) {
    const key = doc.department.trim().toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return departments.map((dept) => ({
    ...dept,
    documentCount: counts.get(dept.id.trim().toLowerCase()) ?? 0,
  }));
}

export async function GET(request: NextRequest) {
  return withTenantApi(request, async ({ userAccess }) => {
    if (!canManageGovernance(userAccess)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Only Company Admins can access Team & Access Governance.',
          code: 'FORBIDDEN_ADMIN_ONLY',
        },
        { status: 403 }
      );
    }

    const [users, departments] = await Promise.all([
      listTenantUsers(),
      buildDepartmentsWithDocumentCounts(),
    ]);

    return NextResponse.json({
      ok: true,
      users,
      departments,
    });
  });
}

export async function PUT(request: NextRequest) {
  return withTenantApi(request, async ({ tenant, userAccess }) => {
    if (!canManageGovernance(userAccess)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Only Company Admins can update employee roles and permissions.',
          code: 'FORBIDDEN_ADMIN_ONLY',
        },
        { status: 403 }
      );
    }

    try {
      const body = (await request.json()) as {
        email?: string;
        role?: TenantUserRole;
        status?: TenantUserStatus;
        allowedDepartments?: string[];
      };

      if (!body.email?.trim()) {
        return NextResponse.json(
          { ok: false, error: 'Employee email is required.' },
          { status: 400 }
        );
      }

      const role: TenantUserRole =
        body.role === 'admin' ||
        body.role === 'editor' ||
        body.role === 'evaluator'
          ? body.role
          : 'evaluator';
      const status: TenantUserStatus =
        body.status === 'active' ? 'active' : 'pending';
      const allowedDepartments = Array.isArray(body.allowedDepartments)
        ? body.allowedDepartments.filter(
            (d): d is string => typeof d === 'string' && d.trim().length > 0
          )
        : [];

      const updatedUser = await updateTenantUserAccess({
        targetEmail: body.email,
        role,
        status,
        allowedDepartments,
      });

      systemLogger.info(
        'tenant.governance',
        `Admin [${userAccess.email}] updated user [${updatedUser.email}] on [${tenant.slug}] -> role=${updatedUser.role}, status=${updatedUser.status}`
      );

      const [users, departments] = await Promise.all([
        listTenantUsers(),
        buildDepartmentsWithDocumentCounts(),
      ]);

      return NextResponse.json({
        ok: true,
        user: updatedUser,
        users,
        departments,
      });
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error:
            err instanceof Error
              ? err.message
              : 'Failed to update employee permissions.',
        },
        { status: 400 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withTenantApi(request, async ({ tenant, userAccess }) => {
    if (!canManageGovernance(userAccess)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Only Company Admins can add custom departments.',
          code: 'FORBIDDEN_ADMIN_ONLY',
        },
        { status: 403 }
      );
    }

    try {
      const body = (await request.json()) as { label?: string };
      if (!body.label?.trim()) {
        return NextResponse.json(
          { ok: false, error: 'Department name is required.' },
          { status: 400 }
        );
      }

      await addTenantDepartment(body.label);
      systemLogger.info(
        'tenant.governance',
        `Admin [${userAccess.email}] added department [${body.label.trim()}] on [${tenant.slug}]`
      );

      const departments = await buildDepartmentsWithDocumentCounts();
      return NextResponse.json({ ok: true, departments });
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error:
            err instanceof Error ? err.message : 'Failed to create department.',
        },
        { status: 400 }
      );
    }
  });
}

export async function DELETE(request: NextRequest) {
  return withTenantApi(request, async ({ tenant, userAccess }) => {
    if (!canManageGovernance(userAccess)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Only Company Admins can delete custom departments.',
          code: 'FORBIDDEN_ADMIN_ONLY',
        },
        { status: 403 }
      );
    }

    try {
      const departmentId = request.nextUrl.searchParams
        .get('departmentId')
        ?.trim()
        .toLowerCase();
      if (!departmentId) {
        return NextResponse.json(
          { ok: false, error: 'departmentId query parameter is required.' },
          { status: 400 }
        );
      }

      const docs = await listBrainDocuments();
      const docCount = docs.filter(
        (d) => d.department.trim().toLowerCase() === departmentId
      ).length;

      await deleteTenantDepartment(departmentId, docCount);
      systemLogger.info(
        'tenant.governance',
        `Admin [${userAccess.email}] deleted department [${departmentId}] on [${tenant.slug}]`
      );

      const departments = await buildDepartmentsWithDocumentCounts();
      return NextResponse.json({ ok: true, departments });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete department.';
      const isConflict = message.includes('DEPARTMENT_HAS_DOCUMENTS');
      return NextResponse.json(
        {
          ok: false,
          error: message.replace('DEPARTMENT_HAS_DOCUMENTS: ', ''),
          code: isConflict ? 'DEPARTMENT_HAS_DOCUMENTS' : 'BAD_REQUEST',
        },
        { status: isConflict ? 409 : 400 }
      );
    }
  });
}

export async function PATCH(request: NextRequest) {
  return withTenantApi(request, async ({ tenant, userAccess }) => {
    if (!canManageGovernance(userAccess)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Only Company Admins can update the company profile.',
          code: 'FORBIDDEN_ADMIN_ONLY',
        },
        { status: 403 }
      );
    }

    try {
      const body = (await request.json()) as {
        logoDataUrl?: string | null;
        clearLogo?: boolean;
        complianceProfile?: Partial<TenantComplianceProfile>;
      };

      const isLogoUpdate =
        body.clearLogo !== undefined || body.logoDataUrl !== undefined;
      const isProfileUpdate = body.complianceProfile !== undefined;

      if (tenant.isDemo) {
        if (isLogoUpdate && !isProfileUpdate) {
          return NextResponse.json(
            {
              ok: false,
              error: 'Company logo cannot be changed in the public live demo.',
              code: 'FORBIDDEN_DEMO',
            },
            { status: 403 }
          );
        }
        const nextProfile = updateDemoComplianceProfile(
          body.complianceProfile ?? {}
        );
        systemLogger.info(
          'tenant.governance',
          `Demo user updated compliance profile -> hasBetriebsrat=${nextProfile.hasBetriebsrat}, nis2Applicable=${nextProfile.nis2Applicable}`
        );
        return NextResponse.json({
          ok: true,
          logoDataUrl: tenant.logoDataUrl ?? null,
          complianceProfile: nextProfile,
        });
      }

      const updated = await updateTenant(tenant.slug, {
        ...(isLogoUpdate
          ? {
              logoDataUrl: body.clearLogo ? null : body.logoDataUrl ?? null,
              clearLogo: Boolean(body.clearLogo),
            }
          : {}),
        ...(isProfileUpdate
          ? { complianceProfile: body.complianceProfile }
          : {}),
      });

      systemLogger.info(
        'tenant.governance',
        `Admin [${userAccess.email}] updated company profile on [${tenant.slug}]`
      );
      return NextResponse.json({
        ok: true,
        logoDataUrl: updated.logoDataUrl,
        complianceProfile: updated.complianceProfile,
      });
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error:
            err instanceof Error
              ? err.message
              : 'Failed to update company profile.',
        },
        { status: 400 }
      );
    }
  });
}
