'use client';

import React, { useState } from 'react';
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Database,
  Globe,
  Lock,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { buildZoneUrl } from '@/core/tenancy/hostResolver';
import {
  DEFAULT_LOCALE,
  getDictionary,
  type SupportedLocale,
} from '@/i18n/dictionaries';

export default function MarketingLandingPage() {
  const [locale, setLocale] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [workspaceSlug, setWorkspaceSlug] = useState<string>('');
  const [slugError, setSlugError] = useState<string | null>(null);

  const dict = getDictionary(locale);

  function navigateToZone(slug: string | null) {
    if (typeof window === 'undefined') return;
    const targetUrl = buildZoneUrl(
      slug,
      window.location.host,
      window.location.protocol
    );
    window.location.href = targetUrl;
  }

  function handleOpenCompanyWorkspace(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = workspaceSlug
      .trim()
      .toLowerCase()
      .replace(/\.mindmittel\.de$/i, '')
      .replace(/[^a-z0-9-]/g, '');

    if (!cleaned || cleaned.length < 2) {
      setSlugError(
        locale === 'de'
          ? 'Bitte geben Sie eine gültige Unternehmens-Subdomain ein (z. B. bosch).'
          : 'Please enter a valid company subdomain (e.g. bosch).'
      );
      return;
    }
    setSlugError(null);
    navigateToZone(cleaned);
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
      {/* Top Marketing Navigation */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              M
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-slate-900 text-base">
                MindMittel
              </span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-mono font-semibold">
                Enterprise Multi-Tenant Cloud
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  locale === 'en'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLocale('de')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  locale === 'de'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                DE
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigateToZone('demo')}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <span>
                {locale === 'de' ? 'Live-Demo starten' : 'Launch Live Demo'}
              </span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero + Subdomain Workspace Launcher */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{dict.hero.badge}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                {dict.hero.titleBlack1}{' '}
                <span className="text-blue-600">{dict.hero.titleBlue}</span>{' '}
                {dict.hero.titleBlack2}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                {dict.hero.subtitle}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigateToZone('demo')}
                  className="px-7 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
                >
                  <span>
                    {locale === 'de'
                      ? 'Interaktive Live-Demo öffnen (demo.mindmittel.de)'
                      : 'Open Interactive Live Demo (demo.mindmittel.de)'}
                  </span>
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>

              <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center gap-6 text-xs sm:text-sm font-medium text-slate-600">
                <span className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  {locale === 'de'
                    ? 'Dedizierte Datenbank pro Unternehmen'
                    : 'Dedicated Database per Company Tenant'}
                </span>
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  {locale === 'de'
                    ? 'OTP-Schutz über Firmen-E-Mail-Domain'
                    : 'Corporate Email Domain + 6-Digit OTP Gate'}
                </span>
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  {dict.hero.trust3}
                </span>
              </div>
            </div>

            {/* Right Column: Company Subdomain Sign-In & Tenant Isolation Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-900/5 p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      {locale === 'de'
                        ? 'Unternehmens-Workspace öffnen'
                        : 'Access Your Company Workspace'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {locale === 'de'
                        ? 'Jeder Mandant besitzt eine eigene Subdomain & isolierte Datenbank.'
                        : 'Each customer operates on an isolated subdomain & database.'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleOpenCompanyWorkspace} className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    {locale === 'de'
                      ? 'Ihre Unternehmens-Subdomain'
                      : 'Your Company Subdomain'}
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-300 bg-slate-50 focus-within:bg-white focus-within:border-blue-600 overflow-hidden">
                    <input
                      type="text"
                      value={workspaceSlug}
                      onChange={(e) => setWorkspaceSlug(e.target.value)}
                      placeholder="bosch"
                      className="flex-1 px-3.5 py-2.5 text-sm bg-transparent focus:outline-none font-mono"
                    />
                    <span className="px-3.5 py-2.5 text-xs font-mono text-slate-500 bg-slate-100 border-l border-slate-200">
                      .mindmittel.de
                    </span>
                  </div>

                  {slugError && (
                    <p className="text-xs text-rose-600 font-semibold">
                      {slugError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <span>
                      {locale === 'de'
                        ? 'Zum Unternehmens-Workspace'
                        : 'Continue to Company Workspace'}
                    </span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="pt-4 border-t border-slate-200/80 space-y-2.5 text-xs text-slate-600">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>
                      {locale === 'de'
                        ? 'Garantierte Mandantentrennung (Zero Data Leakage)'
                        : 'Strict Multi-Tenant Isolation Guarantees'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      {locale === 'de'
                        ? 'Isolierte MongoDB-Datenbank (mindmittel_<firma>) oder eigener Connection-String.'
                        : 'Dedicated database (mindmittel_<company>) or custom connection string.'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      {locale === 'de'
                        ? 'Zugang nur mit verifizierter Firmen-E-Mail-Domain per 6-stelligem OTP-Code.'
                        : 'Restricted to verified corporate email domains via 6-digit OTP.'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      {locale === 'de'
                        ? 'Noch kein Kundenkonto? Testen Sie sofort die öffentliche Live-Demo.'
                        : 'Want to explore first? Try the pre-seeded interactive sandbox on demo.mindmittel.de.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} MindMittel — AI Governance & Decision Audit Engine
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigateToZone('demo')}
              className="hover:text-slate-900 font-medium"
            >
              demo.mindmittel.de
            </button>
            <button
              type="button"
              onClick={() => navigateToZone('admin')}
              className="hover:text-slate-900 font-medium"
            >
              Product Owner Console (admin.mindmittel.de)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
