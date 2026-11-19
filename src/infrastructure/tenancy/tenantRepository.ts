import {
  buildTenantConnectionString,
  DEMO_TENANT,
  DEMO_TENANT_SLUG,
  maskConnectionString,
  maskSecretTail,
  parseAccessPolicy,
  parseCompanyName,
  parseOptionalDbName,
  parseOptionalMongoUri,
  parseTenantInput,
  type ResolvedTenant,
  type TenantInputRaw,
  type TenantStatus,
} from '@/core/tenancy/tenantModel';
import { decryptSecret, encryptSecret } from '@/core/security/secretBox';
import { getTenantSecretKey } from '@/infrastructure/security/masterKey';
import { getControlPlaneDb } from '@/infrastructure/db/mongo';
import { COLLECTIONS } from '@/infrastructure/db/schemas';

export interface StoredTenantRecord {
  slug: string;
  companyName: string;
  allowedEmailDomains: string[];
  allowedEmails: string[];
  adminEmails?: string[];
  status: TenantStatus;
  dbName: string;
  encryptedMongoUri: string | null;
  encryptedGeminiApiKey: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Safe view returned to the product owner's admin console (never exposes plaintext secrets). */
export interface AdminTenantView {
  slug: string;
  companyName: string;
  allowedEmailDomains: string[];
  allowedEmails: string[];
  adminEmails: string[];
  status: TenantStatus;
  dbName: string;
  usesCustomDatabase: boolean;
  connectionStringPreview: string;
  hasCustomGeminiKey: boolean;
  geminiKeyPreview: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantUpdateInput {
  companyName?: string;
  allowedEmailDomains?: string[] | string;
  allowedEmails?: string[] | string;
  adminEmails?: string[] | string;
  status?: TenantStatus;
  dbName?: string;
  mongoUri?: string | null;
  clearMongoUri?: boolean;
  geminiApiKey?: string | null;
  clearGeminiApiKey?: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __mindmittelTenantMemoryStore: Map<string, StoredTenantRecord> | undefined;
}

function getMemoryStore(): Map<string, StoredTenantRecord> {
  if (!globalThis.__mindmittelTenantMemoryStore) {
    globalThis.__mindmittelTenantMemoryStore = new Map();
  }
  return globalThis.__mindmittelTenantMemoryStore;
}

function isMongoConfigured(): boolean {
  const uri = process.env.MONGODB_URI;
  return Boolean(
    uri && (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'))
  );
}

function safeDecrypt(ciphertext: string | null | undefined): string | null {
  if (!ciphertext) return null;
  try {
    return decryptSecret(ciphertext, getTenantSecretKey());
  } catch {
    return null;
  }
}

function toResolvedTenant(record: StoredTenantRecord): ResolvedTenant {
  return {
    slug: record.slug,
    companyName: record.companyName,
    allowedEmailDomains: record.allowedEmailDomains ?? [],
    allowedEmails: record.allowedEmails ?? [],
    adminEmails: record.adminEmails ?? [],
    status: record.status,
    dbName: record.dbName,
    mongoUri: safeDecrypt(record.encryptedMongoUri),
    geminiApiKey: safeDecrypt(record.encryptedGeminiApiKey),
    authMode: 'otp',
    seedSamplePolicies: false,
    isDemo: false,
  };
}

function toAdminView(record: StoredTenantRecord): AdminTenantView {
  const decryptedUri = safeDecrypt(record.encryptedMongoUri);
  const decryptedGemini = safeDecrypt(record.encryptedGeminiApiKey);
  const baseClusterUri =
    process.env.MONGODB_URI || 'mongodb+srv://cluster.mongodb.net/mindmittel2';
  const effectiveUri =
    decryptedUri ?? buildTenantConnectionString(baseClusterUri, record.dbName);

  return {
    slug: record.slug,
    companyName: record.companyName,
    allowedEmailDomains: record.allowedEmailDomains ?? [],
    allowedEmails: record.allowedEmails ?? [],
    adminEmails: record.adminEmails ?? [],
    status: record.status,
    dbName: record.dbName,
    usesCustomDatabase: Boolean(decryptedUri),
    connectionStringPreview: maskConnectionString(effectiveUri),
    hasCustomGeminiKey: Boolean(decryptedGemini),
    geminiKeyPreview: decryptedGemini ? maskSecretTail(decryptedGemini) : null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function resetTenantRepositoryForTests(): void {
  getMemoryStore().clear();
}

export async function resolveTenantBySlug(
  rawSlug: string
): Promise<ResolvedTenant | null> {
  const slug = rawSlug.trim().toLowerCase();
  if (!slug) return null;
  if (slug === DEMO_TENANT_SLUG) return DEMO_TENANT;

  const mem = getMemoryStore();

  if (isMongoConfigured()) {
    try {
      const db = await getControlPlaneDb();
      const found = await db
        .collection<StoredTenantRecord>(COLLECTIONS.TENANTS)
        .findOne({ slug });
      if (found) {
        mem.set(slug, found);
        return toResolvedTenant(found);
      }
      return null;
    } catch {
      // Fallback to in-memory store if offline
    }
  }

  const cached = mem.get(slug);
  return cached ? toResolvedTenant(cached) : null;
}

export async function listTenants(): Promise<AdminTenantView[]> {
  const mem = getMemoryStore();

  if (isMongoConfigured()) {
    try {
      const db = await getControlPlaneDb();
      const rows = await db
        .collection<StoredTenantRecord>(COLLECTIONS.TENANTS)
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      for (const r of rows) {
        mem.set(r.slug, r);
      }
      return rows.map(toAdminView);
    } catch {
      // Fallback to memory store
    }
  }

  return Array.from(mem.values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toAdminView);
}

export async function createTenant(input: TenantInputRaw): Promise<AdminTenantView> {
  const parsed = parseTenantInput(input);
  const existing = await resolveTenantBySlug(parsed.slug);
  if (existing) {
    throw new Error(`A tenant with subdomain "${parsed.slug}" already exists.`);
  }

  const key = getTenantSecretKey();
  const now = new Date().toISOString();
  const record: StoredTenantRecord = {
    slug: parsed.slug,
    companyName: parsed.companyName,
    allowedEmailDomains: parsed.allowedEmailDomains,
    allowedEmails: parsed.allowedEmails,
    adminEmails: parsed.adminEmails,
    status: parsed.status,
    dbName: parsed.dbName,
    encryptedMongoUri: parsed.mongoUri ? encryptSecret(parsed.mongoUri, key) : null,
    encryptedGeminiApiKey: parsed.geminiApiKey
      ? encryptSecret(parsed.geminiApiKey, key)
      : null,
    createdAt: now,
    updatedAt: now,
  };

  getMemoryStore().set(record.slug, record);

  if (isMongoConfigured()) {
    try {
      const db = await getControlPlaneDb();
      await db
        .collection<StoredTenantRecord>(COLLECTIONS.TENANTS)
        .updateOne({ slug: record.slug }, { $set: record }, { upsert: true });
    } catch {
      // Kept in memory store if offline
    }
  }

  return toAdminView(record);
}

export async function updateTenant(
  rawSlug: string,
  patch: TenantUpdateInput
): Promise<AdminTenantView> {
  const slug = rawSlug.trim().toLowerCase();
  const mem = getMemoryStore();

  let current = mem.get(slug) ?? null;
  if (!current && isMongoConfigured()) {
    try {
      const db = await getControlPlaneDb();
      current = await db
        .collection<StoredTenantRecord>(COLLECTIONS.TENANTS)
        .findOne({ slug });
    } catch {
      // Ignore
    }
  }

  if (!current) {
    throw new Error(`Tenant "${slug}" not found.`);
  }

  const companyName =
    patch.companyName !== undefined
      ? parseCompanyName(patch.companyName)
      : current.companyName;

  const policy =
    patch.allowedEmailDomains !== undefined ||
    patch.allowedEmails !== undefined ||
    patch.adminEmails !== undefined
      ? parseAccessPolicy({
          allowedEmailDomains:
            patch.allowedEmailDomains ?? current.allowedEmailDomains,
          allowedEmails: patch.allowedEmails ?? current.allowedEmails,
          adminEmails: patch.adminEmails ?? current.adminEmails ?? [],
        })
      : {
          allowedEmailDomains: current.allowedEmailDomains,
          allowedEmails: current.allowedEmails,
          adminEmails: current.adminEmails ?? [],
        };

  const dbName =
    patch.dbName !== undefined
      ? parseOptionalDbName(patch.dbName, slug)
      : current.dbName;

  const key = getTenantSecretKey();
  let encryptedMongoUri = current.encryptedMongoUri;
  if (patch.clearMongoUri) {
    encryptedMongoUri = null;
  } else if (patch.mongoUri && patch.mongoUri.trim()) {
    const validUri = parseOptionalMongoUri(patch.mongoUri);
    encryptedMongoUri = validUri ? encryptSecret(validUri, key) : null;
  }

  let encryptedGeminiApiKey = current.encryptedGeminiApiKey;
  if (patch.clearGeminiApiKey) {
    encryptedGeminiApiKey = null;
  } else if (patch.geminiApiKey && patch.geminiApiKey.trim()) {
    encryptedGeminiApiKey = encryptSecret(patch.geminiApiKey.trim(), key);
  }

  const updated: StoredTenantRecord = {
    ...current,
    companyName,
    allowedEmailDomains: policy.allowedEmailDomains,
    allowedEmails: policy.allowedEmails,
    adminEmails: policy.adminEmails,
    status: patch.status ?? current.status,
    dbName,
    encryptedMongoUri,
    encryptedGeminiApiKey,
    updatedAt: new Date().toISOString(),
  };

  mem.set(slug, updated);

  if (isMongoConfigured()) {
    try {
      const db = await getControlPlaneDb();
      await db
        .collection<StoredTenantRecord>(COLLECTIONS.TENANTS)
        .updateOne({ slug }, { $set: updated });
    } catch {
      // Kept in memory store
    }
  }

  return toAdminView(updated);
}

export async function deleteTenant(rawSlug: string): Promise<boolean> {
  const slug = rawSlug.trim().toLowerCase();
  if (!slug || slug === DEMO_TENANT_SLUG) return false;

  const mem = getMemoryStore();
  const existedInMem = mem.delete(slug);

  if (isMongoConfigured()) {
    try {
      const db = await getControlPlaneDb();
      const res = await db
        .collection<StoredTenantRecord>(COLLECTIONS.TENANTS)
        .deleteOne({ slug });
      return res.deletedCount > 0 || existedInMem;
    } catch {
      // Fallback
    }
  }

  return existedInMem;
}
