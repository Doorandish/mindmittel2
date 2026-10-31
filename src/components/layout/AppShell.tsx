'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Database,
  Sparkles,
  Activity,
  Globe,
} from 'lucide-react';
import type { AppDictionary, SupportedLocale } from '@/i18n/dictionaries';

export interface AppShellProps {
  children: React.ReactNode;
  locale: SupportedLocale;
  onLocaleChange: (nextLocale: SupportedLocale) => void;
  dict: AppDictionary;
  activeTab?: 'audit' | 'vault' | 'router' | 'system';
  onTabChange?: (tab: 'audit' | 'vault' | 'router' | 'system') => void;
}

/**
 * Clean, High-Readability Mobile-First Liquid Glass Application Shell.
 */
export function AppShell({
  children,
  locale,
  onLocaleChange,
  dict,
  activeTab = 'audit',
  onTabChange,
}: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col justify-between pb-28 md:pb-16 selection:bg-cyan-500/30 selection:text-cyan-100">
      {/* Sticky Floating Frosted Top Navigation Bar */}
      <header className="sticky top-0 z-40 px-4 pt-4 pb-3 md:px-8">
        <div className="max-w-5xl mx-auto liquid-glass-pill px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5 text-slate-950 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-bold tracking-tight text-base md:text-lg text-white">
                  {dict.meta.appName}
                </span>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                  V2.0
                </span>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block">
                {dict.meta.tagline}
              </p>
            </div>
          </div>

          {/* Desktop Focused Tab Switcher */}
          <nav
            aria-label="Primary Workspace Navigation"
            className="hidden md:flex items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-full border border-white/15"
          >
            <button
              type="button"
              onClick={() => onTabChange?.('audit')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'audit'
                  ? 'bg-cyan-400 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/5'
              }`}
            >
              {dict.nav.auditHub}
            </button>
            <button
              type="button"
              onClick={() => onTabChange?.('vault')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'vault'
                  ? 'bg-cyan-400 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/5'
              }`}
            >
              {dict.nav.knowledgeVault}
            </button>
            <button
              type="button"
              onClick={() => onTabChange?.('router')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'router'
                  ? 'bg-cyan-400 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/5'
              }`}
            >
              {dict.nav.aiRouter}
            </button>
            <Link
              href="/system"
              className="px-4 py-2 rounded-full text-sm font-medium text-emerald-300 hover:bg-emerald-400/15 transition-colors flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {dict.nav.systemCenter}
            </Link>
          </nav>

          {/* Bilingual EN / DE Switcher Pill */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              role="group"
              aria-label="Language Selector"
              className="inline-flex items-center bg-slate-950/70 border border-white/20 rounded-full p-1 text-xs md:text-sm"
            >
              <Globe className="w-4 h-4 text-slate-300 ml-2 mr-1.5 hidden sm:inline" />
              <button
                type="button"
                onClick={() => onLocaleChange('en')}
                className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                  locale === 'en'
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLocaleChange('de')}
                className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                  locale === 'de'
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                DE
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container with Generous Breathing Room */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pt-6 pb-12 md:px-8">
        {children}
      </main>

      {/* Mobile-First Native iOS Floating Bottom Tab Dock */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-4 inset-x-4 z-50"
      >
        <div className="liquid-glass-pill px-4 py-2.5 flex items-center justify-around">
          <button
            type="button"
            onClick={() => onTabChange?.('audit')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-colors ${
              activeTab === 'audit'
                ? 'text-cyan-300 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs">{dict.nav.auditHub}</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange?.('vault')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-colors ${
              activeTab === 'vault'
                ? 'text-cyan-300 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Database className="w-5 h-5" />
            <span className="text-xs">{dict.nav.knowledgeVault}</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange?.('router')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-colors ${
              activeTab === 'router'
                ? 'text-cyan-300 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-xs">{dict.nav.aiRouter}</span>
          </button>

          <Link
            href="/system"
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-2xl text-emerald-300 hover:text-emerald-200 transition-colors"
          >
            <Activity className="w-5 h-5" />
            <span className="text-xs">{dict.nav.systemCenter}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
