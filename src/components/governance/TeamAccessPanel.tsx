'use client';

import React, { useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import {
  ALL_DEPARTMENTS_WILDCARD,
  type TenantDepartmentItem,
  type TenantUserAccessProfile,
  type TenantUserRole,
} from '@/core/auth/rbac';
import type { SupportedLocale } from '@/i18n/dictionaries';

interface DepartmentWithCount extends TenantDepartmentItem {
  documentCount: number;
}

interface TeamAccessPanelProps {
  locale: SupportedLocale;
  currentUserEmail: string;
  onDepartmentsChanged: (departments: TenantDepartmentItem[]) => void;
  onPendingCountChanged?: (count: number) => void;
}

export function TeamAccessPanel({
  locale,
  currentUserEmail,
  onDepartmentsChanged,
  onPendingCountChanged,
}: TeamAccessPanelProps) {
  const [users, setUsers] = useState<TenantUserAccessProfile[]>([]);
  const [departments, setDepartments] = useState<DepartmentWithCount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{
    type: 'ok' | 'err';
    message: string;
  } | null>(null);
  const [savingEmail, setSavingEmail] = useState<string | null>(null);

  // Draft edits keyed by user email
  const [drafts, setDrafts] = useState<
    Record<
      string,
      {
        role: TenantUserRole;
        allDepartments: boolean;
        selectedDepartments: string[];
      }
    >
  >({});

  const [newDeptLabel, setNewDeptLabel] = useState<string>('');
  const [isAddingDept, setIsAddingDept] = useState<boolean>(false);
  const [deletingDeptId, setDeletingDeptId] = useState<string | null>(null);

  function syncDrafts(loadedUsers: TenantUserAccessProfile[]) {
    const next: Record<
      string,
      {
        role: TenantUserRole;
        allDepartments: boolean;
        selectedDepartments: string[];
      }
    > = {};
    for (const u of loadedUsers) {
      const hasAll = u.allowedDepartments.includes(ALL_DEPARTMENTS_WILDCARD);
      next[u.email] = {
        role: u.role,
        allDepartments: hasAll,
        selectedDepartments: hasAll
          ? []
          : u.allowedDepartments.filter((d) => d !== ALL_DEPARTMENTS_WILDCARD),
      };
    }
    setDrafts(next);
  }

  async function loadGovernanceData() {
    setLoading(true);
    try {
      const res = await fetch('/api/tenant/governance');
      const data = await res.json();
      if (data.ok) {
        const loadedUsers: TenantUserAccessProfile[] = data.users ?? [];
        const loadedDepts: DepartmentWithCount[] = data.departments ?? [];
        setUsers(loadedUsers);
        setDepartments(loadedDepts);
        syncDrafts(loadedUsers);
        onDepartmentsChanged(
          loadedDepts.map(({ id, label, createdAt }) => ({
            id,
            label,
            createdAt,
          }))
        );
        onPendingCountChanged?.(
          loadedUsers.filter((u) => u.status === 'pending').length
        );
      } else if (data.error) {
        setFeedback({ type: 'err', message: data.error });
      }
    } catch {
      setFeedback({
        type: 'err',
        message:
          locale === 'de'
            ? 'Team- und Zugriffsdaten konnten nicht geladen werden.'
            : 'Failed to load team governance data.',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGovernanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaveUser(targetUser: TenantUserAccessProfile) {
    const draft = drafts[targetUser.email];
    if (!draft) return;

    const allowedDepartments = draft.allDepartments
      ? [ALL_DEPARTMENTS_WILDCARD]
      : draft.selectedDepartments;

    if (!draft.allDepartments && allowedDepartments.length === 0) {
      setFeedback({
        type: 'err',
        message:
          locale === 'de'
            ? `Bitte wählen Sie mindestens eine Abteilung (oder "Alle Abteilungen") für ${targetUser.email} aus.`
            : `Please select at least one department (or "All Departments") for ${targetUser.email}.`,
      });
      return;
    }

    setSavingEmail(targetUser.email);
    setFeedback(null);
    try {
      const res = await fetch('/api/tenant/governance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetUser.email,
          role: draft.role,
          status: 'active',
          allowedDepartments,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        const updatedUsers: TenantUserAccessProfile[] = data.users ?? [];
        setUsers(updatedUsers);
        syncDrafts(updatedUsers);
        onPendingCountChanged?.(
          updatedUsers.filter((u) => u.status === 'pending').length
        );
        setFeedback({
          type: 'ok',
          message:
            locale === 'de'
              ? `✓ Berechtigungen für ${targetUser.email} gespeichert & freigegeben.`
              : `✓ Permissions saved & approved for ${targetUser.email}.`,
        });
      } else {
        setFeedback({
          type: 'err',
          message: data.error ?? 'Failed to save user permissions.',
        });
      }
    } finally {
      setSavingEmail(null);
    }
  }

  async function handleAddDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!newDeptLabel.trim()) return;
    setIsAddingDept(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/tenant/governance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newDeptLabel.trim() }),
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.departments)) {
        const loadedDepts: DepartmentWithCount[] = data.departments;
        setDepartments(loadedDepts);
        onDepartmentsChanged(
          loadedDepts.map(({ id, label, createdAt }) => ({
            id,
            label,
            createdAt,
          }))
        );
        setNewDeptLabel('');
        setFeedback({
          type: 'ok',
          message:
            locale === 'de'
              ? `✓ Abteilung "${newDeptLabel.trim()}" hinzugefügt.`
              : `✓ Added department "${newDeptLabel.trim()}".`,
        });
      } else {
        setFeedback({
          type: 'err',
          message: data.error ?? 'Failed to add department.',
        });
      }
    } finally {
      setIsAddingDept(false);
    }
  }

  async function handleDeleteDepartment(dept: DepartmentWithCount) {
    setDeletingDeptId(dept.id);
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/tenant/governance?departmentId=${encodeURIComponent(dept.id)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.ok && Array.isArray(data.departments)) {
        const loadedDepts: DepartmentWithCount[] = data.departments;
        setDepartments(loadedDepts);
        onDepartmentsChanged(
          loadedDepts.map(({ id, label, createdAt }) => ({
            id,
            label,
            createdAt,
          }))
        );
        setFeedback({
          type: 'ok',
          message:
            locale === 'de'
              ? `✓ Abteilung "${dept.label}" gelöscht.`
              : `✓ Deleted department "${dept.label}".`,
        });
      } else {
        setFeedback({
          type: 'err',
          message: data.error ?? 'Cannot delete department.',
        });
      }
    } finally {
      setDeletingDeptId(null);
    }
  }

  function toggleDepartmentForDraft(email: string, deptId: string) {
    setDrafts((prev) => {
      const current = prev[email];
      if (!current) return prev;
      const exists = current.selectedDepartments.includes(deptId);
      const nextSelected = exists
        ? current.selectedDepartments.filter((id) => id !== deptId)
        : [...current.selectedDepartments, deptId];
      return {
        ...prev,
        [email]: {
          ...current,
          allDepartments: false,
          selectedDepartments: nextSelected,
        },
      };
    });
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-10 flex items-center justify-center gap-2.5 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        <span>
          {locale === 'de'
            ? 'Lade Team- & Abteilungsberechtigungen...'
            : 'Loading team & department governance...'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Section 1: Employee Directory & Role / Department Access Control */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {locale === 'de'
                  ? 'Benutzer, Rollen & Abteilungszugriff'
                  : 'Employees, Roles & Department Access'}
              </h2>
              <p className="text-xs text-slate-500">
                {locale === 'de'
                  ? 'Neue Mitarbeiter starten im Status "Ausstehend" (Pending Approval), bis Sie Rolle und Abteilungen freigeben.'
                  : 'New employees start in Pending Approval until you approve their role and allowed departments.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadGovernanceData}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{locale === 'de' ? 'Aktualisieren' : 'Refresh'}</span>
          </button>
        </div>

        <div className="space-y-4">
          {users.map((u) => {
            const draft = drafts[u.email] ?? {
              role: u.role,
              allDepartments: u.allowedDepartments.includes(
                ALL_DEPARTMENTS_WILDCARD
              ),
              selectedDepartments: u.allowedDepartments.filter(
                (d) => d !== ALL_DEPARTMENTS_WILDCARD
              ),
            };
            const isSelf =
              u.email.trim().toLowerCase() ===
              currentUserEmail.trim().toLowerCase();
            const isPending = u.status === 'pending';

            return (
              <div
                key={u.email}
                className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
                  isPending
                    ? 'bg-amber-50/50 border-amber-300/90'
                    : 'bg-slate-50/70 border-slate-200/90'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900">
                        {u.fullName}
                      </span>
                      {isSelf && (
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                          {locale === 'de' ? 'Sie' : 'You'}
                        </span>
                      )}
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold">
                          <Clock className="w-3 h-3" />
                          <span>
                            {locale === 'de'
                              ? 'Freigabe ausstehend'
                              : 'Pending Approval'}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{locale === 'de' ? 'Aktiv' : 'Active'}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-slate-500 mt-0.5">
                      {u.email}
                      {u.lastLoginAt && (
                        <span className="ml-2 text-slate-400">
                          · {locale === 'de' ? 'Letzter Login:' : 'Last login:'}{' '}
                          {new Date(u.lastLoginAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Role selector */}
                  <div className="flex items-center gap-2">
                    <select
                      value={draft.role}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [u.email]: {
                            ...draft,
                            role: e.target.value as TenantUserRole,
                          },
                        }))
                      }
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                    >
                      <option value="admin">
                        {locale === 'de'
                          ? 'Company Admin (Vollzugriff)'
                          : 'Company Admin (Full Control)'}
                      </option>
                      <option value="editor">
                        {locale === 'de'
                          ? 'Knowledge Editor (Lesen & Bearbeiten)'
                          : 'Knowledge Editor (Read & Edit)'}
                      </option>
                      <option value="evaluator">
                        {locale === 'de'
                          ? 'Decision Evaluator (Nur Prüfen)'
                          : 'Decision Evaluator (Evaluate Only)'}
                      </option>
                    </select>

                    <button
                      type="button"
                      disabled={savingEmail === u.email}
                      onClick={() => handleSaveUser(u)}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-colors"
                    >
                      {savingEmail === u.email
                        ? '...'
                        : isPending
                        ? locale === 'de'
                          ? 'Freigeben & Speichern'
                          : 'Approve & Save'
                        : locale === 'de'
                        ? 'Speichern'
                        : 'Save'}
                    </button>
                  </div>
                </div>

                {/* Department Scope Checkboxes */}
                <div className="pt-3 border-t border-slate-200/80 space-y-2">
                  <div className="text-[11px] font-bold text-slate-600">
                    {locale === 'de'
                      ? 'Zugelassene Abteilungen (wirkt direkt auf Company Brain & KI-Auswertung):'
                      : 'Allowed Departments (enforced in Company Brain & AI Decision Audit):'}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDrafts((prev) => ({
                          ...prev,
                          [u.email]: {
                            ...draft,
                            allDepartments: !draft.allDepartments,
                          },
                        }))
                      }
                      className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                        draft.allDepartments
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {locale === 'de'
                        ? '★ Alle Abteilungen (*)'
                        : '★ All Departments (*)'}
                    </button>

                    {!draft.allDepartments &&
                      departments.map((dept) => {
                        const checked = draft.selectedDepartments.includes(
                          dept.id
                        );
                        return (
                          <button
                            key={dept.id}
                            type="button"
                            onClick={() =>
                              toggleDepartmentForDraft(u.email, dept.id)
                            }
                            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                              checked
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {dept.label}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Custom Company Departments */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              {locale === 'de'
                ? 'Unternehmensabteilungen verwalten'
                : 'Manage Company Departments'}
            </h2>
            <p className="text-xs text-slate-500">
              {locale === 'de'
                ? 'Fügen Sie eigene Abteilungen hinzu. Abteilungen mit vorhandenen Dokumenten sind vor dem Löschen geschützt.'
                : 'Add custom departments tailored to your company. Departments containing documents cannot be deleted until documents are moved or removed.'}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleAddDepartment}
          className="flex flex-wrap items-center gap-2.5"
        >
          <input
            type="text"
            value={newDeptLabel}
            onChange={(e) => setNewDeptLabel(e.target.value)}
            placeholder={
              locale === 'de'
                ? 'z.B. Produktion, Einkauf, Vertrieb...'
                : 'e.g. Procurement, Production, Sales...'
            }
            className="flex-1 min-w-[220px] px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
          />
          <button
            type="submit"
            disabled={isAddingDept || !newDeptLabel.trim()}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>
              {locale === 'de' ? 'Abteilung hinzufügen' : 'Add Department'}
            </span>
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {departments.map((dept) => {
            const hasDocs = dept.documentCount > 0;
            return (
              <div
                key={dept.id}
                className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {dept.label}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    {dept.id} ·{' '}
                    <span
                      className={
                        hasDocs
                          ? 'text-blue-700 font-semibold'
                          : 'text-slate-400'
                      }
                    >
                      {dept.documentCount}{' '}
                      {locale === 'de' ? 'Dokumente' : 'docs'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={hasDocs || deletingDeptId === dept.id}
                  onClick={() => handleDeleteDepartment(dept)}
                  title={
                    hasDocs
                      ? locale === 'de'
                        ? 'Verschieben oder löschen Sie zuerst die Dokumente dieser Abteilung.'
                        : 'Move or delete documents in this department first.'
                      : locale === 'de'
                      ? 'Abteilung löschen'
                      : 'Delete department'
                  }
                  className="p-2 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            {locale === 'de'
              ? 'Anti-Lockout-Schutz aktiv: Der letzte aktive Company Admin kann nicht herabgestuft werden.'
              : 'Anti-Lockout Guard active: The last active Company Admin cannot be demoted.'}
          </span>
        </div>
      </div>
    </div>
  );
}
