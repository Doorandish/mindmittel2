import { describe, it, expect, beforeEach } from 'vitest';
import {
  runWithTenantContext,
  getTenantContext,
  getActiveTenantKey,
} from '@/infrastructure/tenancy/tenantContext';
import { resolveGeminiApiKey } from '@/infrastructure/tenancy/geminiKey';
import { resolveDatabaseTarget } from '@/infrastructure/db/databaseTarget';
import { DEMO_TENANT, type ResolvedTenant } from '@/core/tenancy/tenantModel';
import {
  ingestDocumentIntoBrain,
  listBrainDocuments,
  listAuditHistory,
  searchBrainByVectorSimilarity,
} from '@/infrastructure/rag/brainRepository';

function makeTenant(slug: string, overrides: Partial<ResolvedTenant> = {}): ResolvedTenant {
  return {
    slug,
    companyName: slug.toUpperCase(),
    allowedEmailDomains: [`${slug}.de`],
    allowedEmails: [],
    status: 'active',
    dbName: `mindmittel_${slug}`,
    mongoUri: null,
    geminiApiKey: null,
    authMode: 'otp',
    seedSamplePolicies: false,
    isDemo: false,
    ...overrides,
  };
}

describe('tenant request context (AsyncLocalStorage)', () => {
  it('isolates concurrent async flows', async () => {
    const seen: string[] = [];
    await Promise.all(
      ['bosch', 'siemens'].map((slug) =>
        runWithTenantContext({ tenant: makeTenant(slug), session: null }, async () => {
          await new Promise((r) => setTimeout(r, slug === 'bosch' ? 15 : 1));
          seen.push(`${slug}:${getActiveTenantKey()}`);
        })
      )
    );
    expect(seen.sort()).toEqual(['bosch:bosch', 'siemens:siemens']);
    expect(getTenantContext()).toBeUndefined();
    expect(getActiveTenantKey()).toBe('__default__');
  });
});

describe('per-tenant Gemini key resolution', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'server-default-key';
  });

  it('prefers the tenant key and falls back to the server key', () => {
    const own = makeTenant('bosch', { geminiApiKey: 'bosch-key' });
    expect(runWithTenantContext({ tenant: own, session: null }, () => resolveGeminiApiKey())).toBe(
      'bosch-key'
    );
    expect(
      runWithTenantContext({ tenant: makeTenant('siemens'), session: null }, () =>
        resolveGeminiApiKey()
      )
    ).toBe('server-default-key');
    delete process.env.GEMINI_API_KEY;
  });
});

describe('database target resolution', () => {
  const env = {
    MONGODB_URI: 'mongodb+srv://u:p@cluster0.net/mindmittel2?appName=X',
    MONGODB_DB_NAME: 'mindmittel_v2',
  };

  it('routes shared tenants to their own database on the shared cluster', () => {
    expect(resolveDatabaseTarget(makeTenant('bosch'), env)).toEqual({
      mode: 'shared',
      uri: env.MONGODB_URI,
      dbName: 'mindmittel_bosch',
    });
  });

  it('routes tenants with a custom connection string to an isolated client', () => {
    const t = makeTenant('bosch', { mongoUri: 'mongodb+srv://b:q@bosch-cluster.net/x' });
    expect(resolveDatabaseTarget(t, env)).toEqual({
      mode: 'isolated',
      uri: 'mongodb+srv://b:q@bosch-cluster.net/x',
      dbName: 'mindmittel_bosch',
    });
  });

  it('uses the control-plane database when no tenant context exists', () => {
    expect(resolveDatabaseTarget(null, env).dbName).toBe('mindmittel_v2');
    expect(resolveDatabaseTarget(makeTenant('x'), {}).mode).toBe('none');
  });
});

describe('Company Brain isolation between tenants (in-memory mode)', () => {
  beforeEach(() => {
    delete process.env.MONGODB_URI;
    delete process.env.GEMINI_API_KEY;
  });

  it('never exposes one tenant\'s documents to another tenant', async () => {
    const bosch = makeTenant('bosch-iso');
    const siemens = makeTenant('siemens-iso');

    await runWithTenantContext({ tenant: bosch, session: null }, () =>
      ingestDocumentIntoBrain({
        title: 'Bosch Confidential Pricing Policy',
        content: 'Internal pricing floor for all Bosch automotive contracts is strictly confidential.',
        department: 'Finance & Legal',
        sourceType: 'upload',
        language: 'en',
        createdByEmail: 'cfo@bosch-iso.de',
      })
    );

    const boschDocs = await runWithTenantContext({ tenant: bosch, session: null }, () =>
      listBrainDocuments()
    );
    const siemensDocs = await runWithTenantContext({ tenant: siemens, session: null }, () =>
      listBrainDocuments()
    );

    expect(boschDocs.map((d) => d.title)).toContain('Bosch Confidential Pricing Policy');
    expect(siemensDocs.map((d) => d.title)).not.toContain('Bosch Confidential Pricing Policy');
  });

  it('seeds sample policies only for the demo tenant', async () => {
    const fresh = makeTenant('fresh-co');
    const freshDocs = await runWithTenantContext({ tenant: fresh, session: null }, () =>
      listBrainDocuments()
    );
    expect(freshDocs).toHaveLength(0);

    const demoDocs = await runWithTenantContext({ tenant: DEMO_TENANT, session: null }, () =>
      listBrainDocuments()
    );
    expect(demoDocs.length).toBeGreaterThanOrEqual(3);

    const freshHistory = await runWithTenantContext({ tenant: fresh, session: null }, () =>
      listAuditHistory()
    );
    expect(freshHistory).toHaveLength(0);
  });

  it('excludes client-deleted demo parentIds (Option B) from searchBrainByVectorSimilarity while keeping baseline demo documents intact in storage', async () => {
    const demoDocsBefore = await runWithTenantContext({ tenant: DEMO_TENANT, session: null }, () =>
      listBrainDocuments()
    );
    const standupDoc = demoDocsBefore.find((d) =>
      d.title.includes('Engineering Agile')
    );
    expect(standupDoc).toBeDefined();

    const hitsWithPolicy = await runWithTenantContext({ tenant: DEMO_TENANT, session: null }, () =>
      searchBrainByVectorSimilarity({
        query: 'Cancel all mandatory daily Scrum standup meetings',
        topK: 3,
      })
    );
    expect(hitsWithPolicy.some((h) => h.parentId === standupDoc!.parentId)).toBe(true);

    const hitsWithoutDeleted = await runWithTenantContext(
      { tenant: DEMO_TENANT, session: null },
      () =>
        searchBrainByVectorSimilarity({
          query: 'Cancel all mandatory daily Scrum standup meetings',
          topK: 3,
          excludedParentIds: [standupDoc!.parentId],
        })
    );
    expect(
      hitsWithoutDeleted.some((h) => h.parentId === standupDoc!.parentId)
    ).toBe(false);

    // Underlying shared demo repository must remain untouched for other visitors / page reload
    const demoDocsAfter = await runWithTenantContext({ tenant: DEMO_TENANT, session: null }, () =>
      listBrainDocuments()
    );
    expect(demoDocsAfter.some((d) => d.parentId === standupDoc!.parentId)).toBe(true);
  });
});
