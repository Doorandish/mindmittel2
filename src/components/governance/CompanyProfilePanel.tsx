'use client';

import React, { useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ImageIcon,
  Landmark,
  Loader2,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import type { SupportedLocale } from '@/i18n/dictionaries';
import type { TenantComplianceProfile } from '@/core/tenancy/tenantModel';
import { readAndResizeCompanyLogo } from '@/lib/logoUpload';
import { CompanyPrecedentsManager } from '@/components/governance/CompanyPrecedentsManager';

interface CompanyProfilePanelProps {
  locale: SupportedLocale;
  companyName?: string;
  isDemo?: boolean;
  companyLogoUrl?: string | null;
  complianceProfile: TenantComplianceProfile;
  onComplianceProfileChanged: (next: TenantComplianceProfile) => void;
  onLogoChanged?: (nextLogoUrl: string | null) => void;
}

export function CompanyProfilePanel({
  locale,
  companyName,
  isDemo = false,
  companyLogoUrl,
  complianceProfile,
  onComplianceProfileChanged,
  onLogoChanged,
}: CompanyProfilePanelProps) {
  const [hasBetriebsrat, setHasBetriebsrat] = useState<boolean>(
    complianceProfile.hasBetriebsrat
  );
  const [nis2Applicable, setNis2Applicable] = useState<boolean>(
    complianceProfile.nis2Applicable
  );
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [isSavingLogo, setIsSavingLogo] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: 'ok' | 'err';
    message: string;
  } | null>(null);

  useEffect(() => {
    setHasBetriebsrat(complianceProfile.hasBetriebsrat);
    setNis2Applicable(complianceProfile.nis2Applicable);
  }, [complianceProfile.hasBetriebsrat, complianceProfile.nis2Applicable]);

  async function saveCompliancePatch(next: TenantComplianceProfile) {
    setIsSavingProfile(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/tenant/governance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complianceProfile: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to save company profile.');
      }
      const saved: TenantComplianceProfile = data.complianceProfile ?? next;
      setHasBetriebsrat(saved.hasBetriebsrat);
      setNis2Applicable(saved.nis2Applicable);
      onComplianceProfileChanged(saved);
      setFeedback({
        type: 'ok',
        message:
          locale === 'de'
            ? 'Unternehmensprofil gespeichert. Zukünftige Entscheidungsprüfungen nutzen diese Einstellungen sofort.'
            : 'Company Profile saved. Future Decision Audits will apply these settings immediately.',
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        message:
          err instanceof Error ? err.message : 'Failed to save company profile.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  }

  function handleToggleBetriebsrat() {
    const nextVal = !hasBetriebsrat;
    setHasBetriebsrat(nextVal);
    void saveCompliancePatch({ hasBetriebsrat: nextVal, nis2Applicable });
  }

  function handleToggleNis2() {
    const nextVal = !nis2Applicable;
    setNis2Applicable(nextVal);
    void saveCompliancePatch({ hasBetriebsrat, nis2Applicable: nextVal });
  }

  async function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsSavingLogo(true);
    setFeedback(null);
    try {
      const dataUrl = await readAndResizeCompanyLogo(file);
      const res = await fetch('/api/tenant/governance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoDataUrl: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to upload company logo.');
      }
      onLogoChanged?.(data.logoDataUrl ?? dataUrl);
      setFeedback({
        type: 'ok',
        message:
          locale === 'de'
            ? 'Firmenlogo wurde erfolgreich aktualisiert.'
            : 'Company logo updated successfully.',
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        message:
          err instanceof Error ? err.message : 'Failed to upload company logo.',
      });
    } finally {
      setIsSavingLogo(false);
    }
  }

  async function handleRemoveLogo() {
    setIsSavingLogo(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/tenant/governance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearLogo: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to remove company logo.');
      }
      onLogoChanged?.(null);
      setFeedback({
        type: 'ok',
        message:
          locale === 'de'
            ? 'Firmenlogo wurde entfernt.'
            : 'Company logo removed.',
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        message:
          err instanceof Error ? err.message : 'Failed to remove company logo.',
      });
    } finally {
      setIsSavingLogo(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm font-medium flex items-center gap-2 ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 1. Regulatory & Legal Applicability Card */}
      <div className="liquid-glass-panel p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-700 flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {locale === 'de'
                  ? 'Unternehmensprofil & Gesetzliche Anwendbarkeit'
                  : 'Company Profile & Regulatory Applicability'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {locale === 'de'
                  ? 'Passen Sie an, welche deutschen und europäischen Gesetzesprüfungen für Ihr Unternehmen gelten, um Fehlalarme bei Entscheidungsprüfungen zu vermeiden.'
                  : 'Configure which German & EU statutory frameworks apply to your organization to eliminate false alarms during Decision Audits.'}
              </p>
            </div>
          </div>

          {isSavingProfile && (
            <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{locale === 'de' ? 'Speichern...' : 'Saving...'}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Toggle 1: Betriebsrat (BetrVG) */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 sm:p-5 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {locale === 'de'
                      ? 'Betriebsrat vorhanden (BetrVG §87 / §111)'
                      : 'Works Council Active (BetrVG §87 / §111)'}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    BetrVG §87, §90, §111
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={hasBetriebsrat}
                  disabled={isSavingProfile}
                  onClick={handleToggleBetriebsrat}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    hasBetriebsrat ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                      hasBetriebsrat ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {locale === 'de'
                  ? 'Aktivieren Sie diese Option, wenn Ihr Unternehmen einen Betriebsrat hat. Bei Deaktivierung werden Mitbestimmungs-Warnungen (z. B. Homeoffice, Zeiterfassung, Software-Rollouts) in der Entscheidungsprüfung übersprungen.'
                  : 'Enable if your company has an elected Works Council (Betriebsrat). When turned off, BetrVG co-determination warnings and verdict downgrades are skipped during Decision Audits.'}
              </p>
            </div>
            <div className="text-[11px] font-semibold text-slate-500 pt-2 border-t border-slate-200/70">
              {hasBetriebsrat
                ? locale === 'de'
                  ? 'Status: Aktiv — BetrVG-Prüfung schützt vor einseitigen Beschlüssen'
                  : 'Status: Active — BetrVG screening enforced on all audits'
                : locale === 'de'
                ? 'Status: Deaktiviert — BetrVG-Prüfung wird übersprungen'
                : 'Status: Disabled — BetrVG checks skipped'}
            </div>
          </div>

          {/* Toggle 2: NIS-2 Directive */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 sm:p-5 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {locale === 'de'
                      ? 'NIS-2 Cybersicherheitspflicht (BSIG)'
                      : 'NIS-2 Cybersecurity Scope (BSIG)'}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    NIS-2 Art. 20, 21 · NIS2UmsuCG
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={nis2Applicable}
                  disabled={isSavingProfile}
                  onClick={handleToggleNis2}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    nis2Applicable ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                      nis2Applicable ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {locale === 'de'
                  ? 'Aktivieren Sie diese Option, falls Ihr Unternehmen unter NIS-2 fällt (z. B. ab 50 Mitarbeitenden oder in regulierten Sektoren). Bei Deaktivierung blockieren NIS-2-Hinweise keine Freigaben.'
                  : 'Enable if your company falls under EU NIS-2 obligations (e.g. >= 50 employees or regulated sectors). When turned off, NIS-2 checks will not block or downgrade verdicts.'}
              </p>
            </div>
            <div className="text-[11px] font-semibold text-slate-500 pt-2 border-t border-slate-200/70">
              {nis2Applicable
                ? locale === 'de'
                  ? 'Status: Aktiv — NIS-2-Prüfung für IT & Lieferkette aktiv'
                  : 'Status: Active — NIS-2 ICT & supply-chain checks enforced'
                : locale === 'de'
                ? 'Status: Deaktiviert — NIS-2-Prüfung wird übersprungen'
                : 'Status: Disabled — NIS-2 checks skipped'}
            </div>
          </div>
        </div>

        {/* Always-On Frameworks Info Note */}
        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            {locale === 'de'
              ? 'Hinweis: DSGVO / BDSG §26 und EU AI Act gelten grundsätzlich für alle Unternehmen in der EU und bleiben daher immer aktiv.'
              : 'Note: GDPR (DSGVO / BDSG §26) and the EU AI Act apply broadly across all EU organizations and remain always active.'}
          </span>
        </div>
      </div>

      {/* 2. Company Branding & White-Label Logo Card (Customer Tenants) */}
      {!isDemo && (
        <div className="liquid-glass-panel p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-700 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {locale === 'de'
                  ? 'Unternehmens-Branding & Logo'
                  : 'Company Branding & Logo'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {locale === 'de'
                  ? `Das Logo von ${companyName || 'Ihrem Unternehmen'} erscheint in der Seitenleiste, auf dem Login-Bildschirm und auf PDF-Berichten.`
                  : `The logo for ${companyName || 'your company'} appears in the sidebar, login screen, and exported A4 PDF reports.`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden p-2 shrink-0">
              {companyLogoUrl ? (
                <img
                  src={companyLogoUrl}
                  alt={`${companyName || 'Company'} Logo`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <ImageIcon className="w-6 h-6 text-slate-400" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-colors">
                {isSavingLogo ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>
                  {locale === 'de' ? 'Logo hochladen' : 'Upload Logo'}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoFileChange}
                  disabled={isSavingLogo}
                  className="hidden"
                />
              </label>

              {companyLogoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={isSavingLogo}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{locale === 'de' ? 'Entfernen' : 'Remove'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Company Admin Approval Queue & Learning Loop Audit Log */}
      <CompanyPrecedentsManager locale={locale} />
    </div>
  );
}
