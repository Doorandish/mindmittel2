export type TenantUserRole = 'admin' | 'editor' | 'evaluator';
export type TenantUserStatus = 'pending' | 'active';

export interface TenantDepartmentItem {
  id: string;
  label: string;
  createdAt?: string;
}

export interface TenantUserAccessProfile {
  email: string;
  fullName: string;
  role: TenantUserRole;
  status: TenantUserStatus;
  /**
   * `['*']` grants access to all departments of the company.
   * Otherwise, lists specific department IDs (e.g. `['finance-legal', 'hr-people']`).
   */
  allowedDepartments: string[];
  lastLoginAt?: string;
  createdAt?: string;
}

export const ALL_DEPARTMENTS_WILDCARD = '*';

export const DEFAULT_TENANT_DEPARTMENTS: readonly TenantDepartmentItem[] = [
  { id: 'executive-board', label: 'Executive Board' },
  { id: 'finance-legal', label: 'Finance & Legal' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'hr-people', label: 'HR & People' },
  { id: 'operations-it', label: 'Operations & IT' },
] as const;

export const OPEN_DEMO_USER_ACCESS: TenantUserAccessProfile = {
  email: 'guest@demo.mindmittel.de',
  fullName: 'MindMittel Demo User',
  role: 'admin',
  status: 'active',
  allowedDepartments: [ALL_DEPARTMENTS_WILDCARD],
};

export function normalizeAdminEmails(raw: string | string[] | undefined): string[] {
  const parts = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
    ? raw.split(/[\n,;]+/)
    : [];
  const normalized = new Set<string>();
  for (const item of parts) {
    const email = item.trim().toLowerCase();
    if (email && email.includes('@')) {
      normalized.add(email);
    }
  }
  return Array.from(normalized);
}

export function slugifyDepartmentId(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function hasAllDepartmentsAccess(user: TenantUserAccessProfile): boolean {
  return (
    user.status === 'active' &&
    user.allowedDepartments.includes(ALL_DEPARTMENTS_WILDCARD)
  );
}

export function canAccessDepartment(
  user: TenantUserAccessProfile,
  departmentId: string
): boolean {
  if (user.status !== 'active') return false;
  if (user.allowedDepartments.includes(ALL_DEPARTMENTS_WILDCARD)) return true;
  const target = departmentId.trim().toLowerCase();
  return user.allowedDepartments.some((d) => d.trim().toLowerCase() === target);
}

/**
 * Computes the strict server-side department filter for RAG / Document queries.
 * - Returns `'all'` only if the user is active and holds wildcard (`*`) access and requested `'all'`.
 * - Returns `string[]` (possibly empty `[]` if unauthorized) so the backend NEVER leaks unauthorized documents.
 */
export function resolveEffectiveDepartmentFilter(
  user: TenantUserAccessProfile,
  requestedDepartment?: string | null
): 'all' | string[] {
  if (user.status !== 'active') return [];

  const normalizedReq = (requestedDepartment ?? 'all').trim().toLowerCase();
  const hasWildcard = user.allowedDepartments.includes(ALL_DEPARTMENTS_WILDCARD);

  if (!normalizedReq || normalizedReq === 'all') {
    return hasWildcard ? 'all' : [...user.allowedDepartments];
  }

  if (hasWildcard) {
    return [normalizedReq];
  }

  return canAccessDepartment(user, normalizedReq) ? [normalizedReq] : [];
}

export function canEditDocuments(
  user: TenantUserAccessProfile,
  departmentId?: string
): boolean {
  if (user.status !== 'active') return false;
  if (user.role !== 'admin' && user.role !== 'editor') return false;
  if (!departmentId) return true;
  return canAccessDepartment(user, departmentId);
}

export function canManageGovernance(user: TenantUserAccessProfile): boolean {
  return user.status === 'active' && user.role === 'admin';
}

export function canManageConnectors(user: TenantUserAccessProfile): boolean {
  return user.status === 'active' && user.role === 'admin';
}

/**
 * Anti-Lockout Guard: prevents demoting the last active company admin.
 */
export function canDemoteAdmin(
  allUsers: readonly TenantUserAccessProfile[],
  targetEmail: string
): boolean {
  const normalizedTarget = targetEmail.trim().toLowerCase();
  const otherActiveAdmins = allUsers.filter(
    (u) =>
      u.status === 'active' &&
      u.role === 'admin' &&
      u.email.trim().toLowerCase() !== normalizedTarget
  );
  return otherActiveAdmins.length > 0;
}

/**
 * Prevents deleting a department while any document is still assigned to it.
 */
export function isDepartmentDeletionAllowed(documentCount: number): boolean {
  return documentCount === 0;
}
