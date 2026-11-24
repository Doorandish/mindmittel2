'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Filter,
  Loader2,
  Lock,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import {
  ALL_AFFECTED_LAYERS,
  ALL_DIAGNOSTIC_CODES,
  type DiagnosticCode,
  type PlatformTelemetrySummary,
} from '@/core/audit/learningLoop';

const DIAGNOSTIC_LABELS: Record<DiagnosticCode, string> = {
  PRIOR_APPROVAL_EXISTS: 'Prior Internal Approval Exists',
  WRONG_STATUTE_TRIGGERED: 'Wrong Statute Triggered',
  SCORE_TOO_STRICT: 'Risk Score Too Strict',
  SCORE_TOO_LENIENT: 'Risk Score Too Lenient',
  POLICY_RETRIEVAL_MISS: 'Policy Retrieval Miss',
  GERMAN_TONE_OR_CLARITY: 'German Tone / Clarity',
  COMPANY_EXCEPTION: 'General / Helpful Signal',
};

export function AdminTelemetryPanel() {
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [summary, setSummary] = useState<PlatformTelemetrySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTelemetry = useCallback(async (tenantFilter: string) => {
    setLoading(true);
    setError(null);
    try {
      const qs =
        tenantFilter && tenantFilter !== 'all'
          ? `?tenantSlug=${encodeURIComponent(tenantFilter)}`
          : '';
      const res = await fetch(`/api/admin/feedback-telemetry${qs}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to load audit telemetry.');
      }
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Telemetry fetch error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTelemetry(selectedTenant);
  }, [selectedTenant, loadTelemetry]);

  return (
    <section className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#004ac6]" />
            <h2 className="text-lg font-bold text-[#131b2e]">
              Audit Engine Quality Telemetry (Zero-Leak Diagnostics)
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
              <Lock className="w-3 h-3" />
              <span>DSGVO Privacy-by-Architecture • 0 Klartextdaten</span>
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Monitor audit accuracy across all tenants by framework and diagnostic code without ever accessing confidential board text or company secrets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              aria-label="Filter telemetry by company"
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold outline-none"
            >
              <option value="all">All Companies</option>
              {(summary?.tenants ?? []).map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.companyName} ({t.slug}) — {t.count}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => void loadTelemetry(selectedTenant)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-800">
          {error}
        </div>
      )}

      {loading && !summary ? (
        <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading diagnostic telemetry…</span>
        </div>
      ) : summary ? (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <div className="text-[11px] font-mono uppercase text-slate-500">
                Total Signals
              </div>
              <div className="text-2xl font-extrabold text-[#131b2e] mt-1">
                {summary.totalCount}
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
              <div className="text-[11px] font-mono uppercase text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Helpful Rate</span>
              </div>
              <div className="text-2xl font-extrabold text-emerald-900 mt-1">
                {summary.helpfulRatePct}%
              </div>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5">
              <div className="text-[11px] font-mono uppercase text-blue-700 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                <span>Helpful Votes</span>
              </div>
              <div className="text-2xl font-extrabold text-blue-950 mt-1">
                {summary.helpfulCount}
              </div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
              <div className="text-[11px] font-mono uppercase text-amber-800 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Corrections / Precedents</span>
              </div>
              <div className="text-2xl font-extrabold text-amber-950 mt-1">
                {summary.correctionCount}
              </div>
            </div>
          </div>

          {/* Layer & Diagnostic Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 p-4 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Signals by Audit Layer
              </h3>
              <div className="space-y-2">
                {ALL_AFFECTED_LAYERS.map((layer) => {
                  const count = summary.byLayer[layer] ?? 0;
                  const pct =
                    summary.totalCount > 0
                      ? Math.round((count / summary.totalCount) * 100)
                      : 0;
                  return (
                    <div key={layer} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold text-slate-700">
                          {layer}
                        </span>
                        <span className="text-slate-500 font-mono">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#004ac6]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Diagnostic Failure / Signal Codes
              </h3>
              <div className="space-y-1.5">
                {ALL_DIAGNOSTIC_CODES.map((code) => {
                  const count = summary.byDiagnosticCode[code] ?? 0;
                  return (
                    <div
                      key={code}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-b-0"
                    >
                      <span className="text-slate-700 font-medium">
                        {DIAGNOSTIC_LABELS[code]}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-800">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Zero-Text Diagnostic Log */}
          {summary.recentRecords.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-mono uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Company</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Layer</th>
                    <th className="px-3 py-2">Diagnostic Code</th>
                    <th className="px-3 py-2">Model / Score</th>
                    <th className="px-3 py-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.recentRecords.slice(0, 20).map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="px-3 py-2 font-semibold text-slate-800">
                        {r.companyName}{' '}
                        <span className="font-mono text-[10.5px] text-slate-400">
                          ({r.tenantSlug})
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                            r.feedbackType === 'helpful'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {r.feedbackType}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-700">
                        {r.affectedLayer}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                        {r.diagnosticCode}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                        {r.modelUsed} • {r.initialVerdict} ({r.initialScore})
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-500">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
