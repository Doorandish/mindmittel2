import { NextRequest, NextResponse } from 'next/server';
import { withOwnerApi } from '@/infrastructure/http/tenantRequestGuard';
import {
  createTenant,
  deleteTenant,
  listTenants,
  updateTenant,
  type TenantUpdateInput,
} from '@/infrastructure/tenancy/tenantRepository';
import type { TenantInputRaw } from '@/core/tenancy/tenantModel';
import { systemLogger } from '@/infrastructure/logging/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withOwnerApi(request, async () => {
    const tenants = await listTenants();
    return NextResponse.json({ ok: true, tenants });
  });
}

export async function POST(request: NextRequest) {
  return withOwnerApi(request, async (owner) => {
    try {
      const body = (await request.json()) as TenantInputRaw;
      const created = await createTenant(body);
      systemLogger.info(
        'admin.tenants',
        `Owner [${owner.sub}] provisioned tenant [${created.slug}.mindmittel.de] -> DB [${created.dbName}]`
      );
      const tenants = await listTenants();
      return NextResponse.json({ ok: true, tenant: created, tenants });
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error: err instanceof Error ? err.message : 'Failed to create tenant',
        },
        { status: 400 }
      );
    }
  });
}

export async function PUT(request: NextRequest) {
  return withOwnerApi(request, async (owner) => {
    try {
      const body = (await request.json()) as { slug?: string } & TenantUpdateInput;
      if (!body.slug?.trim()) {
        return NextResponse.json(
          { ok: false, error: 'Tenant slug is required.' },
          { status: 400 }
        );
      }
      const updated = await updateTenant(body.slug, body);
      systemLogger.info(
        'admin.tenants',
        `Owner [${owner.sub}] updated tenant [${updated.slug}.mindmittel.de]`
      );
      const tenants = await listTenants();
      return NextResponse.json({ ok: true, tenant: updated, tenants });
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error: err instanceof Error ? err.message : 'Failed to update tenant',
        },
        { status: 400 }
      );
    }
  });
}

export async function DELETE(request: NextRequest) {
  return withOwnerApi(request, async (owner) => {
    const slug = request.nextUrl.searchParams.get('slug')?.trim().toLowerCase();
    if (!slug) {
      return NextResponse.json(
        { ok: false, error: 'slug query parameter is required.' },
        { status: 400 }
      );
    }
    const deleted = await deleteTenant(slug);
    if (!deleted) {
      return NextResponse.json(
        { ok: false, error: `Tenant "${slug}" could not be deleted.` },
        { status: 404 }
      );
    }
    systemLogger.info(
      'admin.tenants',
      `Owner [${owner.sub}] deleted tenant [${slug}.mindmittel.de]`
    );
    const tenants = await listTenants();
    return NextResponse.json({ ok: true, tenants });
  });
}
