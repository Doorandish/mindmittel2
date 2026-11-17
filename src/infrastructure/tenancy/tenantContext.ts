import { AsyncLocalStorage } from 'async_hooks';
import type { ResolvedTenant } from '@/core/tenancy/tenantModel';
import type { SessionPayload } from '@/core/security/sessionToken';

export interface TenantRequestContext {
  tenant: ResolvedTenant;
  session: SessionPayload | null;
}

const storage = new AsyncLocalStorage<TenantRequestContext>();

export function runWithTenantContext<T>(
  ctx: TenantRequestContext,
  fn: () => T
): T {
  return storage.run(ctx, fn);
}

export function getTenantContext(): TenantRequestContext | undefined {
  return storage.getStore();
}

export function getActiveTenant(): ResolvedTenant | null {
  return storage.getStore()?.tenant ?? null;
}

/**
 * Key used to partition in-memory caches per tenant.
 * Falls back to `__default__` when invoked outside a tenant request (e.g. unit tests).
 */
export function getActiveTenantKey(): string {
  return storage.getStore()?.tenant.slug ?? '__default__';
}
