'use client';

import React, { useEffect } from 'react';
import {
  BookOpen,
  Clock,
  ExternalLink,
  KeyRound,
  Lock,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { SupportedLocale } from '@/i18n/dictionaries';
import type { EnterpriseConnectorItem } from '@/core/connectors/connectorRegistry';
import type { ConnectorSetupGuide } from '@/core/connectors/connectorGuides';

interface ConnectorGuideModalProps {
  connector: EnterpriseConnectorItem;
  guide: ConnectorSetupGuide;
  locale: SupportedLocale;
  onClose: () => void;
  onOpenCredentials: (connector: EnterpriseConnectorItem) => void;
}

export function ConnectorGuideModal({
  connector,
  guide,
  locale,
  onClose,
  onOpenCredentials,
}: ConnectorGuideModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isDe = locale === 'de';
  const steps = isDe ? guide.stepsDe : guide.stepsEn;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={`${connector.name} Setup Guide`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] bg-white rounded-2xl border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/90 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {isDe
                    ? `Verbindungsanleitung: ${connector.name}`
                    : `Connection Setup Guide: ${connector.name}`}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 text-[11px] font-medium">
                  <Clock className="w-3 h-3" />
                  <span>
                    ~{guide.estimatedMinutes} {isDe ? 'Min.' : 'min'}
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isDe ? connector.descriptionDe : connector.descriptionEn}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors cursor-pointer shrink-0"
            aria-label={isDe ? 'Schließen' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Direct Portal Link + Read-Only Scopes */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/70">
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                {isDe
                  ? '1. Entwickler- / Admin-Portal öffnen'
                  : '1. Open Developer / Admin Portal'}
              </div>
              <div className="text-xs text-slate-600 font-mono truncate max-w-md">
                {guide.portalUrl}
              </div>
            </div>
            <a
              href={guide.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs shrink-0"
            >
              <span>{isDe ? guide.portalLabelDe : guide.portalLabelEn}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Minimal Read-Only Permissions */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {isDe
                  ? 'Erforderliche Berechtigungen (strikt Read-Only / Nur Lesen):'
                  : 'Required Permissions (Strictly Read-Only):'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {guide.requiredScopes.map((scope) => (
                <code
                  key={scope}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-900 font-mono text-[11px]"
                >
                  {scope}
                </code>
              ))}
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-800">
              {isDe
                ? 'Schritt-für-Schritt-Einrichtung:'
                : 'Step-by-Step Setup Instructions:'}
            </div>
            <ol className="space-y-2">
              {steps.map((step, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs sm:text-[13px] text-slate-700 leading-relaxed"
                >
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Expected Formats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-700">
                {isDe ? guide.tokenFormatLabelDe : guide.tokenFormatLabelEn}
              </div>
              <code className="block text-[11px] font-mono text-slate-600 bg-white border border-slate-200/70 rounded-lg p-2 break-all">
                {guide.tokenExample}
              </code>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-700">
                {isDe
                  ? 'Beispiel Ziel-Bereich / Ordner / Kanal'
                  : 'Example Target Scope / Folder / Channel'}
              </div>
              <code className="block text-[11px] font-mono text-slate-600 bg-white border border-slate-200/70 rounded-lg p-2 break-all">
                {guide.scopeExample}
              </code>
            </div>
          </div>

          {/* Security & Privacy Note */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5 text-xs text-emerald-950 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{isDe ? guide.securityNoteDe : guide.securityNoteEn}</span>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            {isDe ? 'Schließen' : 'Close'}
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCredentials(connector);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>
              {isDe
                ? 'Zugangsdaten jetzt eingeben'
                : 'Enter Credentials Now'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
