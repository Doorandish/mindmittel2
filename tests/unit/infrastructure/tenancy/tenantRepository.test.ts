import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTenant,
  updateTenant,
  deleteTenant,
  listTenants,
  resolveTenantBySlug,
  resetTenantRepositoryForTests,
} from '@/infrastructure/tenancy/tenantRepository';
import { createRingBufferLogger } from '@/infrastructure/logging/logger';

describe('control-plane tenant repository (in-memory mode)', () => {
  beforeEach(() => {
    delete process.env.MONGODB_URI;
    resetTenantRepositoryForTests();
  });

  it('creates a tenant and resolves it with decrypted secrets', async () => {
    const view = await createTenant({
      slug: 'bosch',
      companyName: 'Robert Bosch GmbH',
      allowedEmailDomains: 'bosch.de',
      geminiApiKey: 'AIza-bosch-secret-key-1234',
    });

    expect(view.dbName).toBe('mindmittel_bosch');
    expect(view.hasCustomGeminiKey).toBe(true);
    expect(JSON.stringify(view)).not.toContain('AIza-bosch-secret-key-1234');

    const resolved = await resolveTenantBySlug('bosch');
    expect(resolved?.geminiApiKey).toBe('AIza-bosch-secret-key-1234');
    expect(resolved?.authMode).toBe('otp');
    expect(resolved?.seedSamplePolicies).toBe(false);
  });

  it('rejects duplicate slugs and the reserved demo slug', async () => {
    await createTenant({ slug: 'acme', companyName: 'Acme', allowedEmailDomains: 'acme.de' });
    await expect(
      createTenant({ slug: 'acme', companyName: 'Acme 2', allowedEmailDomains: 'acme.de' })
    ).rejects.toThrow(/already exists/i);
    await expect(
      createTenant({ slug: 'demo', companyName: 'X', allowedEmailDomains: 'x.de' })
    ).rejects.toThrow();
  });

  it('keeps existing secrets when an update leaves them blank and clears them on request', async () => {
    await createTenant({
      slug: 'acme',
      companyName: 'Acme',
      allowedEmailDomains: 'acme.de',
      mongoUri: 'mongodb+srv://a:b@acme.net/x',
      geminiApiKey: 'acme-key',
    });

    await updateTenant('acme', { companyName: 'Acme AG', allowedEmailDomains: 'acme.de, acme.com' });
    let resolved = await resolveTenantBySlug('acme');
    expect(resolved?.companyName).toBe('Acme AG');
    expect(resolved?.mongoUri).toBe('mongodb+srv://a:b@acme.net/x');
    expect(resolved?.allowedEmailDomains).toEqual(['acme.de', 'acme.com']);

    await updateTenant('acme', { clearGeminiApiKey: true, clearMongoUri: true });
    resolved = await resolveTenantBySlug('acme');
    expect(resolved?.geminiApiKey).toBeNull();
    expect(resolved?.mongoUri).toBeNull();
  });

  it('lists masked admin views and deletes tenants', async () => {
    await createTenant({
      slug: 'acme',
      companyName: 'Acme',
      allowedEmailDomains: 'acme.de',
      mongoUri: 'mongodb+srv://a:topsecret@acme.net/x',
    });
    const [view] = await listTenants();
    expect(view.connectionStringPreview).toContain('****');
    expect(view.connectionStringPreview).not.toContain('topsecret');
    expect(view.usesCustomDatabase).toBe(true);

    expect(await deleteTenant('acme')).toBe(true);
    expect(await resolveTenantBySlug('acme')).toBeNull();
  });

  it('always resolves the builtin demo tenant and returns null for unknown slugs', async () => {
    expect((await resolveTenantBySlug('demo'))?.isDemo).toBe(true);
    expect(await resolveTenantBySlug('unknown-co')).toBeNull();
  });
});

describe('tenant-tagged observability logs', () => {
  it('tags entries with the active tenant and filters snapshots per tenant', () => {
    let active: string | undefined = 'bosch';
    const logger = createRingBufferLogger({ maxEntries: 10, resolveTenant: () => active });
    logger.info('rag', 'bosch secret doc ingested');
    active = 'siemens';
    logger.info('rag', 'siemens doc ingested');
    active = undefined;
    logger.info('system', 'platform event');

    expect(logger.getRecentLogs(10, 'bosch').map((e) => e.message)).toEqual([
      'bosch secret doc ingested',
    ]);
    expect(logger.getRecentLogs(10).length).toBe(3);
    expect(logger.getRecentLogs(10, 'siemens')[0].tenant).toBe('siemens');
  });
});
