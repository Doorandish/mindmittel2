'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Lock, Shield } from 'lucide-react';
import { SystemObservabilityPanel } from '@/components/system/SystemObservabilityPanel';
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from '@/i18n/dictionaries';

/**
 * Product Owner System Architecture Topology & Live SSE Console (`admin.mindmittel.de/system`).
 * Strictly isolated from customer workspaces and gated behind `/api/admin/session`.
 */
export default function SystemObservabilityPage() {
  const [locale, setLocale] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [checkingSession, setCheckingSession] = useState<boolean>(true);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [ownerEmail, setOwnerEmail] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function checkOwnerSession() {
      try {
        const res = await fetch('/api/admin/session');
        const data = await res.json();
        if (!cancelled && data.ok && data.authenticated) {
          setAuthenticated(true);
          setOwnerEmail(data.owner?.email ?? 'amir.doorandish@gmail.com');
        }
      } catch {
        // Leave unauthenticated on network error
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    checkOwnerSession();
    return () => {
      cancelled = true;
    };
  }, []);

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-500">
        <div className="flex items-center gap-2.5 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>
            {locale === 'de'
              ? 'Admin-Sitzung wird überprüft...'
              : 'Verifying Product Owner session...'}
          </span>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-7 sm:p-8 space-y-5 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-blue-400">
              admin.mindmittel.de/system
            </div>
            <h1 className="text-lg font-extrabold text-white">
              {locale === 'de'
                ? 'Zugriff nur für System-Administratoren'
                : 'Product Owner Authentication Required'}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              {locale === 'de'
                ? 'Die System-Topologie und Live-Telemetrie sind ausschließlich für den Plattform-Administrator zugänglich. Bitte melden Sie sich zuerst im Control Plane an.'
                : 'System topology inspection and live SSE telemetry are restricted to authenticated Product Owners. Sign in via the Admin Control Plane first.'}
            </p>
          </div>

          <Link
            href="/admin"
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {locale === 'de'
                ? 'Zurück zur Anmeldung (/admin)'
                : 'Go to Admin Control Plane (/admin)'}
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/85">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/images/mindmittel-logo.svg"
              alt="MindMittel Logo"
              className="w-7 h-7 object-contain shrink-0"
            />
            <div className="flex items-center gap-2 min-w-0">
              <Shield className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-bold text-sm text-slate-900 truncate">
                {locale === 'de'
                  ? 'MindMittel Control Plane · System & Telemetrie'
                  : 'MindMittel Control Plane · System & Telemetry'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {ownerEmail && (
              <span className="hidden sm:inline text-xs font-mono text-slate-500">
                {ownerEmail}
              </span>
            )}

            <div
              role="group"
              aria-label="Language Selector"
              className="inline-flex items-center bg-slate-100 border border-slate-200/80 rounded-md p-0.5 text-[11px] font-medium"
            >
              <button
                type="button"
                onClick={() => setLocale('de')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  locale === 'de'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                DE
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  locale === 'en'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </button>
            </div>

            <Link
              href="/admin"
              className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>
                {locale === 'de' ? 'Mandanten (/admin)' : 'Tenants (/admin)'}
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 break-all sm:break-normal">
        <SystemObservabilityPanel />
      </main>
    </div>
  );
}
