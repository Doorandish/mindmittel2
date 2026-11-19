import {
  ALL_DEPARTMENTS_WILDCARD,
  canDemoteAdmin,
  DEFAULT_TENANT_DEPARTMENTS,
  isDepartmentDeletionAllowed,
  slugifyDepartmentId,
  type TenantDepartmentItem,
  type TenantUserAccessProfile,
  type TenantUserRole,
  type TenantUserStatus,
} from '@/core/auth/rbac';
import { getMindMittelDb } from '@/infrastructure/db/mongo';
import { COLLECTIONS } from '@/infrastructure/db/schemas';
import { getActiveTenantKey } from '@/infrastructure/tenancy/tenantContext';

interface TenantGovernanceCache {
  users: Map<string, TenantUserAccessProfile>;
  usersHydrated: boolean;
  departments: TenantDepartmentItem[];
  departmentsHydrated: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __mindmittelGovernanceCaches:
    | Map<string, TenantGovernanceCache>
    | undefined;
}

function getTenantCache(): TenantGovernanceCache {
  if (!globalThis.__mindmittelGovernanceCaches) {
    globalThis.__mindmittelGovernanceCaches = new Map();
  }
  const key = getActiveTenantKey();
  let entry = globalThis.__mindmittelGovernanceCaches.get(key);
  if (!entry) {
    entry = {
      users: new Map(),
      usersHydrated: false,
      departments: [],
      departmentsHydrated: false,
    };
    globalThis.__mindmittelGovernanceCaches.set(key, entry);
  }
  return entry;
}

export function resetTenantGovernanceCachesForTests(): void {
  globalThis.__mindmittelGovernanceCaches?.clear();
}

function isMongoConfigured(): boolean {
  const uri = process.env.MONGODB_URI;
  return Boolean(
    uri && (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'))
  );
}

async function ensureUsersHydrated(): Promise<TenantGovernanceCache> {
  const cache = getTenantCache();
  if (cache.usersHydrated) return cache;
  cache.usersHydrated = true;

  if (!isMongoConfigured()) return cache;
  try {
    const db = await getMindMittelDb();
    const docs = await db
      .collection<TenantUserAccessProfile>(COLLECTIONS.USERS)
      .find({})
      .toArray();
    for (const doc of docs) {
      if (doc.email) {
        const email = doc.email.trim().toLowerCase();
        cache.users.set(email, {
          email,
          fullName: doc.fullName || email.split('@')[0] || 'User',
          role:
            doc.role === 'admin' || doc.role === 'editor' || doc.role === 'evaluator'
              ? doc.role
              : 'evaluator',
          status: doc.status === 'active' ? 'active' : 'pending',
          allowedDepartments: Array.isArray(doc.allowedDepartments)
            ? doc.allowedDepartments
            : [],
          lastLoginAt: doc.lastLoginAt,
          createdAt: doc.createdAt,
        });
      }
    }
  } catch {
    // Keep in-memory fallback
  }
  return cache;
}

async function persistUserProfile(
  profile: TenantUserAccessProfile
): Promise<void> {
  const cache = getTenantCache();
  cache.users.set(profile.email, profile);

  if (!isMongoConfigured()) return;
  try {
    const db = await getMindMittelDb();
    await db
      .collection<TenantUserAccessProfile>(COLLECTIONS.USERS)
      .updateOne(
        { email: profile.email },
        { $set: profile },
        { upsert: true }
      );
  } catch {
    // Retained in memory cache
  }
}

/**
 * Records or updates a user on OTP verification.
 * - Emails configured in `tenantAdminEmails` automatically become active `admin` with `['*']`.
 * - Non-admin employees start in `pending` status (Zero-Trust Pending Approval) until a Company Admin approves them.
 * - Backward-compatible safety: if a legacy tenant has zero configured `adminEmails` and zero users yet,
 *   the very first employee becomes `admin` so the tenant is never locked out.
 */
export async function upsertTenantUserOnLogin(params: {
  email: string;
  fullName: string;
  tenantAdminEmails: string[];
}): Promise<TenantUserAccessProfile> {
  const cache = await ensureUsersHydrated();
  const email = params.email.trim().toLowerCase();
  const now = new Date().toISOString();
  const normalizedAdmins = params.tenantAdminEmails.map((e) =>
    e.trim().toLowerCase()
  );
  const isConfiguredAdmin = normalizedAdmins.includes(email);

  const existing = cache.users.get(email);
  if (existing) {
    const updated: TenantUserAccessProfile = {
      ...existing,
      fullName: params.fullName.trim() || existing.fullName,
      role: isConfiguredAdmin ? 'admin' : existing.role,
      status: isConfiguredAdmin ? 'active' : existing.status,
      allowedDepartments: isConfiguredAdmin
        ? [ALL_DEPARTMENTS_WILDCARD]
        : existing.allowedDepartments,
      lastLoginAt: now,
    };
    await persistUserProfile(updated);
    return updated;
  }

  const bootstrapLegacyAdmin =
    normalizedAdmins.length === 0 && cache.users.size === 0;
  const shouldAutoActivateAdmin = isConfiguredAdmin || bootstrapLegacyAdmin;

  const created: TenantUserAccessProfile = {
    email,
    fullName: params.fullName.trim() || email.split('@')[0] || 'User',
    role: shouldAutoActivateAdmin ? 'admin' : 'evaluator',
    status: shouldAutoActivateAdmin ? 'active' : 'pending',
    allowedDepartments: shouldAutoActivateAdmin
      ? [ALL_DEPARTMENTS_WILDCARD]
      : [],
    lastLoginAt: now,
    createdAt: now,
  };
  await persistUserProfile(created);
  return created;
}

export async function getTenantUserAccessProfile(
  rawEmail: string,
  tenantAdminEmails: string[] = []
): Promise<TenantUserAccessProfile | null> {
  const cache = await ensureUsersHydrated();
  const email = rawEmail.trim().toLowerCase();
  const existing = cache.users.get(email);
  const isConfiguredAdmin = tenantAdminEmails
    .map((e) => e.trim().toLowerCase())
    .includes(email);

  if (existing) {
    if (
      isConfiguredAdmin &&
      (existing.role !== 'admin' || existing.status !== 'active')
    ) {
      const upgraded: TenantUserAccessProfile = {
        ...existing,
        role: 'admin',
        status: 'active',
        allowedDepartments: [ALL_DEPARTMENTS_WILDCARD],
      };
      await persistUserProfile(upgraded);
      return upgraded;
    }
    return existing;
  }

  if (isConfiguredAdmin) {
    const now = new Date().toISOString();
    const adminProfile: TenantUserAccessProfile = {
      email,
      fullName: email.split('@')[0] || 'Company Admin',
      role: 'admin',
      status: 'active',
      allowedDepartments: [ALL_DEPARTMENTS_WILDCARD],
      lastLoginAt: now,
      createdAt: now,
    };
    await persistUserProfile(adminProfile);
    return adminProfile;
  }

  return null;
}

export async function listTenantUsers(): Promise<TenantUserAccessProfile[]> {
  const cache = await ensureUsersHydrated();
  return Array.from(cache.users.values()).sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'pending' ? -1 : 1;
    }
    return (b.lastLoginAt ?? '').localeCompare(a.lastLoginAt ?? '');
  });
}

export async function updateTenantUserAccess(params: {
  targetEmail: string;
  role: TenantUserRole;
  status: TenantUserStatus;
  allowedDepartments: string[];
}): Promise<TenantUserAccessProfile> {
  const cache = await ensureUsersHydrated();
  const email = params.targetEmail.trim().toLowerCase();
  const existing = cache.users.get(email);
  if (!existing) {
    throw new Error(`User "${email}" was not found in this company workspace.`);
  }

  const allUsers = Array.from(cache.users.values());
  const isDemotingOrPending =
    existing.role === 'admin' &&
    existing.status === 'active' &&
    (params.role !== 'admin' || params.status !== 'active');

  if (isDemotingOrPending && !canDemoteAdmin(allUsers, email)) {
    throw new Error(
      'Cannot demote the last active Company Admin. Promote another admin first.'
    );
  }

  const cleanedDepts =
    params.role === 'admin' && params.allowedDepartments.length === 0
      ? [ALL_DEPARTMENTS_WILDCARD]
      : Array.from(
          new Set(
            params.allowedDepartments
              .map((d) => d.trim().toLowerCase())
              .filter(Boolean)
          )
        );

  const updated: TenantUserAccessProfile = {
    ...existing,
    role: params.role,
    status: params.status,
    allowedDepartments: cleanedDepts,
  };
  await persistUserProfile(updated);
  return updated;
}

async function ensureDepartmentsHydrated(): Promise<TenantGovernanceCache> {
  const cache = getTenantCache();
  if (cache.departmentsHydrated) return cache;
  cache.departmentsHydrated = true;

  if (isMongoConfigured()) {
    try {
      const db = await getMindMittelDb();
      const rows = await db
        .collection<TenantDepartmentItem>(COLLECTIONS.TENANT_DEPARTMENTS)
        .find({})
        .toArray();
      if (rows.length > 0) {
        cache.departments = rows.map((r) => ({
          id: r.id,
          label: r.label,
          createdAt: r.createdAt,
        }));
        return cache;
      }
    } catch {
      // Fall through to seed defaults
    }
  }

  if (cache.departments.length === 0) {
    const now = new Date().toISOString();
    cache.departments = DEFAULT_TENANT_DEPARTMENTS.map((d) => ({
      id: d.id,
      label: d.label,
      createdAt: now,
    }));
    if (isMongoConfigured()) {
      try {
        const db = await getMindMittelDb();
        await db
          .collection<TenantDepartmentItem>(COLLECTIONS.TENANT_DEPARTMENTS)
          .insertMany(cache.departments);
      } catch {
        // Ignore seed conflict
      }
    }
  }

  return cache;
}

export async function listTenantDepartments(): Promise<TenantDepartmentItem[]> {
  const cache = await ensureDepartmentsHydrated();
  return [...cache.departments];
}

export async function addTenantDepartment(
  rawLabel: string
): Promise<TenantDepartmentItem[]> {
  const cache = await ensureDepartmentsHydrated();
  const label = rawLabel.trim();
  if (label.length < 2 || label.length > 60) {
    throw new Error('Department name must be between 2 and 60 characters.');
  }
  const id = slugifyDepartmentId(label);
  if (!id) {
    throw new Error('Department name must contain letters or digits.');
  }
  if (cache.departments.some((d) => d.id === id)) {
    throw new Error(`Department "${label}" (${id}) already exists.`);
  }

  const created: TenantDepartmentItem = {
    id,
    label,
    createdAt: new Date().toISOString(),
  };
  cache.departments.push(created);

  if (isMongoConfigured()) {
    try {
      const db = await getMindMittelDb();
      await db
        .collection<TenantDepartmentItem>(COLLECTIONS.TENANT_DEPARTMENTS)
        .updateOne({ id }, { $set: created }, { upsert: true });
    } catch {
      // Retained in memory cache
    }
  }

  return [...cache.departments];
}

export async function deleteTenantDepartment(
  rawDepartmentId: string,
  documentCountInDepartment: number
): Promise<TenantDepartmentItem[]> {
  const cache = await ensureDepartmentsHydrated();
  const id = rawDepartmentId.trim().toLowerCase();

  if (!isDepartmentDeletionAllowed(documentCountInDepartment)) {
    throw new Error(
      `DEPARTMENT_HAS_DOCUMENTS: Cannot delete department "${id}" while ${documentCountInDepartment} document(s) are still assigned to it. Move or delete those documents first.`
    );
  }

  const next = cache.departments.filter((d) => d.id !== id);
  if (next.length === cache.departments.length) {
    throw new Error(`Department "${id}" not found.`);
  }
  if (next.length === 0) {
    throw new Error('At least one department must remain in the workspace.');
  }

  cache.departments = next;

  if (isMongoConfigured()) {
    try {
      const db = await getMindMittelDb();
      await db
        .collection<TenantDepartmentItem>(COLLECTIONS.TENANT_DEPARTMENTS)
        .deleteOne({ id });
    } catch {
      // Ignore
    }
  }

  return [...cache.departments];
}
