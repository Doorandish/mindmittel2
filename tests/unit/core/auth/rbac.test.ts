import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TENANT_DEPARTMENTS,
  normalizeAdminEmails,
  canAccessDepartment,
  resolveEffectiveDepartmentFilter,
  canEditDocuments,
  canManageGovernance,
  canManageConnectors,
  canDemoteAdmin,
  slugifyDepartmentId,
  isDepartmentDeletionAllowed,
  type TenantUserAccessProfile,
} from '@/core/auth/rbac';

describe('Tenant RBAC, Pending Approval & Custom Department Governance', () => {
  const activeAdmin: TenantUserAccessProfile = {
    email: 'admin@bosch.de',
    fullName: 'Bosch Admin',
    role: 'admin',
    status: 'active',
    allowedDepartments: ['*'],
  };

  const activeEditor: TenantUserAccessProfile = {
    email: 'editor@bosch.de',
    fullName: 'Finance Editor',
    role: 'editor',
    status: 'active',
    allowedDepartments: ['finance-legal', 'hr-people'],
  };

  const activeEvaluator: TenantUserAccessProfile = {
    email: 'eval@bosch.de',
    fullName: 'HR Evaluator',
    role: 'evaluator',
    status: 'active',
    allowedDepartments: ['hr-people'],
  };

  const pendingUser: TenantUserAccessProfile = {
    email: 'newbie@bosch.de',
    fullName: 'New Employee',
    role: 'evaluator',
    status: 'pending',
    allowedDepartments: [],
  };

  it('provides 5 standard default departments and slugifies custom German/English names', () => {
    expect(DEFAULT_TENANT_DEPARTMENTS.length).toBe(5);
    expect(slugifyDepartmentId('Produktion Werk München')).toBe(
      'produktion-werk-muenchen'
    );
    expect(slugifyDepartmentId('Einkauf & Logistik')).toBe('einkauf-logistik');
  });

  it('normalizes comma/newline separated company admin emails', () => {
    expect(
      normalizeAdminEmails('  Admin@Bosch.DE, cto@bosch.de \n admin@bosch.de ')
    ).toEqual(['admin@bosch.de', 'cto@bosch.de']);
  });

  it('blocks pending users from all department access, document edits, connectors, and governance', () => {
    expect(canAccessDepartment(pendingUser, 'hr-people')).toBe(false);
    expect(canEditDocuments(pendingUser, 'hr-people')).toBe(false);
    expect(canManageConnectors(pendingUser)).toBe(false);
    expect(canManageGovernance(pendingUser)).toBe(false);
    expect(resolveEffectiveDepartmentFilter(pendingUser, 'all')).toEqual([]);
  });

  it('enforces 3-role matrix and per-department scoping for admin, editor, and evaluator', () => {
    // Admin
    expect(canAccessDepartment(activeAdmin, 'engineering')).toBe(true);
    expect(canEditDocuments(activeAdmin, 'engineering')).toBe(true);
    expect(canManageConnectors(activeAdmin)).toBe(true);
    expect(canManageGovernance(activeAdmin)).toBe(true);
    expect(resolveEffectiveDepartmentFilter(activeAdmin, 'all')).toBe('all');
    expect(resolveEffectiveDepartmentFilter(activeAdmin, 'engineering')).toEqual([
      'engineering',
    ]);

    // Editor (restricted to finance-legal + hr-people)
    expect(canAccessDepartment(activeEditor, 'finance-legal')).toBe(true);
    expect(canAccessDepartment(activeEditor, 'engineering')).toBe(false);
    expect(canEditDocuments(activeEditor, 'finance-legal')).toBe(true);
    expect(canEditDocuments(activeEditor, 'engineering')).toBe(false);
    expect(canManageConnectors(activeEditor)).toBe(false);
    expect(canManageGovernance(activeEditor)).toBe(false);
    expect(resolveEffectiveDepartmentFilter(activeEditor, 'all')).toEqual([
      'finance-legal',
      'hr-people',
    ]);
    expect(
      resolveEffectiveDepartmentFilter(activeEditor, 'engineering')
    ).toEqual([]);

    // Evaluator (read/evaluate only in hr-people)
    expect(canAccessDepartment(activeEvaluator, 'hr-people')).toBe(true);
    expect(canAccessDepartment(activeEvaluator, 'finance-legal')).toBe(false);
    expect(canEditDocuments(activeEvaluator, 'hr-people')).toBe(false);
    expect(canManageConnectors(activeEvaluator)).toBe(false);
    expect(canManageGovernance(activeEvaluator)).toBe(false);
  });

  it('prevents demoting the last active company admin (Anti-Lockout Guard)', () => {
    expect(
      canDemoteAdmin([activeAdmin, activeEditor], 'admin@bosch.de')
    ).toBe(false);
    const secondAdmin: TenantUserAccessProfile = {
      ...activeAdmin,
      email: 'coadmin@bosch.de',
    };
    expect(
      canDemoteAdmin([activeAdmin, secondAdmin], 'admin@bosch.de')
    ).toBe(true);
  });

  it('blocks deleting any department that still owns 1 or more documents', () => {
    expect(isDepartmentDeletionAllowed(0)).toBe(true);
    expect(isDepartmentDeletionAllowed(1)).toBe(false);
    expect(isDepartmentDeletionAllowed(12)).toBe(false);
  });
});
