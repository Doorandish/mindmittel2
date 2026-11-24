'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  Clock,
  Edit3,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  XCircle,
} from 'lucide-react';
import type { SupportedLocale } from '@/i18n/dictionaries';
import {
  isPrecedentExpired,
  type CompanyPrecedentRecord,
} from '@/core/audit/learningLoop';

interface CompanyPrecedentsManagerProps {
  locale: SupportedLocale;
  onPendingCountChange?: (count: number) => void;
}

type FilterTab = 'pending' | 'active' | 'expired' | 'inactive';

export function CompanyPrecedentsManager({
  locale,
  onPendingCountChange,
}: CompanyPrecedentsManagerProps) {
  const isDe = locale === 'de';
  const [precedents, setPrecedents] = useState<CompanyPrecedentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editValidUntil, setEditValidUntil] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadPrecedents = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/brain/feedback', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to load company precedents.');
      }
      const list: CompanyPrecedentRecord[] = Array.isArray(data.precedents)
        ? data.precedents
        : [];
      setPrecedents(list);
      onPendingCountChange?.(
        typeof data.pendingCount === 'number'
          ? data.pendingCount
          : list.filter((p) => p.status === 'pending').length
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Load error.');
    } finally {
      setLoading(false);
    }
  }, [onPendingCountChange]);

  useEffect(() => {
    void loadPrecedents();
  }, [loadPrecedents]);

  function startEditing(item: CompanyPrecedentRecord) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditSummary(item.ruleSummary);
    setEditValidUntil(item.validUntil ?? '');
  }

  async function handleReview(
    precedentId: string,
    action: 'approve' | 'reject' | 'revoke',
    withEdits = false
  ) {
    setBusyId(precedentId);
    setErrorMsg(null);
    try {
      const payload: Record<string, unknown> = { precedentId, action };
      if (withEdits) {
        payload.edits = {
          title: editTitle,
          ruleSummary: editSummary,
          validUntil: editValidUntil ? editValidUntil : null,
        };
      }
      const res = await fetch('/api/brain/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Review action failed.');
      }
      setEditingId(null);
      await loadPrecedents();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Review action failed.');
    } finally {
      setBusyId(null);
    }
  }

  const now = new Date();
  const pendingItems = precedents.filter((p) => p.status === 'pending');
  const activeItems = precedents.filter(
    (p) => p.status === 'approved' && !isPrecedentExpired(p, now)
  );
  const expiredItems = precedents.filter((p) => isPrecedentExpired(p, now));
  const inactiveItems = precedents.filter(
    (p) => p.status === 'rejected' || p.status === 'revoked'
  );

  const visibleItems =
    activeTab === 'pending'
      ? pendingItems
      : activeTab === 'active'
      ? activeItems
      : activeTab === 'expired'
      ? expiredItems
      : inactiveItems;

  return (
    <section className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#004ac6]" />
            <h3 className="text-base font-bold text-[#131b2e]">
              {isDe
                ? 'Freigabe-Warteschlange & Lern-Protokoll (Unternehmensregeln)'
                : 'Precedent Approval Queue & Governance Audit Log'}
            </h3>
            {pendingItems.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold">
                {pendingItems.length} {isDe ? 'offen' : 'pending'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {isDe
              ? 'Feedback von Entscheidern landet hier zur Vier-Augen-Prüfung. Erst nach Ihrer Freigabe fließt eine Regel in zukünftige Prüfungen ein — inklusive vollständigem Audit-Log und jederzeitiger Deaktivierung.'
              : 'Manager feedback arrives here for four-eyes review. Only precedents you approve are injected into future audits — with a full audit trail and 1-click deactivation.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadPrecedents()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{isDe ? 'Aktualisieren' : 'Refresh'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-3">
        {(
          [
            {
              key: 'pending',
              label: isDe ? 'Ausstehend' : 'Pending',
              count: pendingItems.length,
            },
            {
              key: 'active',
              label: isDe ? 'Aktiv' : 'Active',
              count: activeItems.length,
            },
            {
              key: 'expired',
              label: isDe ? 'Abgelaufen' : 'Expired',
              count: expiredItems.length,
            },
            {
              key: 'inactive',
              label: isDe ? 'Deaktiviert / Abgelehnt' : 'Revoked / Rejected',
              count: inactiveItems.length,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-[#131b2e] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-800 font-medium">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{isDe ? 'Lade Lern-Protokoll…' : 'Loading audit log…'}</span>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="py-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
          {isDe
            ? 'In dieser Kategorie liegen aktuell keine Einträge vor.'
            : 'No entries in this category yet.'}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => {
            const isEditing = editingId === item.id;
            const isBusy = busyId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-bold text-[#131b2e]">
                        {item.title}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[10.5px] font-mono font-semibold text-[#004ac6]">
                        {item.affectedLayer}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10.5px] font-mono text-slate-600">
                        {item.department === '*'
                          ? isDe
                            ? 'Alle Abteilungen'
                            : 'All Departments'
                          : item.department}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-mono">
                    <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-600">
                      {item.validUntil
                        ? `${isDe ? 'Gültig bis' : 'Valid until'}: ${item.validUntil}`
                        : isDe
                        ? 'Unbefristet'
                        : 'Indefinite'}
                    </span>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-2 bg-white p-3 rounded-lg border border-blue-200">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                    />
                    <textarea
                      rows={2}
                      value={editSummary}
                      onChange={(e) => setEditSummary(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                        <span>{isDe ? 'Gültig bis:' : 'Valid until:'}</span>
                        <input
                          type="date"
                          value={editValidUntil}
                          onChange={(e) => setEditValidUntil(e.target.value)}
                          className="rounded border border-slate-200 px-2 py-1 text-xs"
                        />
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-600"
                        >
                          {isDe ? 'Abbrechen' : 'Cancel'}
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            void handleReview(item.id, 'approve', true)
                          }
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {isDe
                              ? 'Speichern & freigeben'
                              : 'Save & Approve'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-700 leading-relaxed bg-white rounded-lg p-2.5 border border-slate-200/70">
                    {item.ruleSummary}
                  </p>
                )}

                {/* Full Governance Audit Trail */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {isDe ? 'Eingereicht:' : 'Submitted:'}{' '}
                      <strong className="text-slate-700">
                        {item.submittedByEmail}
                      </strong>{' '}
                      ({new Date(item.submittedAt).toLocaleString(isDe ? 'de-DE' : 'en-US')})
                    </span>
                    {item.reviewedByEmail && (
                      <span className="inline-flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        {isDe ? 'Geprüft:' : 'Reviewed:'}{' '}
                        <strong className="text-slate-700">
                          {item.reviewedByEmail}
                        </strong>
                      </span>
                    )}
                    {item.revokedByEmail && (
                      <span className="inline-flex items-center gap-1 text-rose-700">
                        <ShieldAlert className="w-3 h-3" />
                        {isDe ? 'Deaktiviert von:' : 'Revoked by:'}{' '}
                        <strong>{item.revokedByEmail}</strong>
                      </span>
                    )}
                  </div>

                  {/* Admin Action Buttons */}
                  {!isEditing && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditing(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{isDe ? 'Bearbeiten' : 'Edit'}</span>
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              void handleReview(item.id, 'approve', false)
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          >
                            {isBusy ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            <span>{isDe ? 'Freigeben' : 'Approve'}</span>
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              void handleReview(item.id, 'reject', false)
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>{isDe ? 'Ablehnen' : 'Reject'}</span>
                          </button>
                        </>
                      )}

                      {item.status === 'approved' && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            void handleReview(item.id, 'revoke', false)
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold"
                        >
                          {isBusy ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Ban className="w-3 h-3" />
                          )}
                          <span>{isDe ? 'Deaktivieren' : 'Deactivate'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
