'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Database, Activity, Globe } from 'lucide-react';
import type { AppDictionary, SupportedLocale } from '@/i18n/dictionaries';

export interface AppShellProps {
  children: React.ReactNode;
  locale: SupportedLocale;
  onLocaleChange: (nextLocale: SupportedLocale) => void;
  dict: AppDictionary;
  activeTab?: 'overview' | 'vault';
  onTabChange?: (tab: 'overview' | 'vault') => void;
}

/**
 * Clean, High-Readability Mobile-First Liquid Glass Application Shell.
 * No redundant manual model selection tabs—focused strictly on user value.
 */
export function AppShell({
  children,
  locale,
  onLocaleChange,
  dict,
  activeTab = 'overview',
  onTabChange,
}: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col justify-between pb-28 md:pb-16 selection:bg-cyan-500/30 selection:text-cyan-100">
      {/* Sticky Floating Frosted Top Navigation Bar */}
      <header className="sticky top-0 z-40 px-4 pt-4 pb-3 md:px-8">
        <div className="max-w-5xl mx-auto liquid-glass-pill px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5 text-slate-950 stroke-[2.3]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="font-bold tracking-tight text-base md:text-lg text-white whitespace-nowrap">
                  {dict.meta.appName}
                </span>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 whitespace-nowrap">
                  V2.0
                </span>
              </div>
              <p className="text-xs text-slate-300 hidden lg:block truncate">
                {dict.meta.tagline}
              </p>
            </div>
          </div>

          {/* Desktop Focused Navigation Pills (Single-line whitespace-nowrap) */}
          <nav
            aria-label="Primary Workspace Navigation"
            className="hidden md:flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-full border border-white/15 shrink-0"
          >
            <button
              type="button"
              onClick={() => onTabChange?.('overview')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'overview'
                  ? 'bg-cyan-400 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/5'
              }`}
            >
              {dict.nav.overview}
            </button>
            <button
              type="button"
              onClick={() => onTabChange?.('vault')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'vault'
                  ? 'bg-cyan-400 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/5'
              }`}
            >
              {dict.nav.knowledgeVault}
            </button>
            <Link
              href="/system"
              className="px-4 py-2 rounded-full text-sm font-medium text-emerald-300 hover:bg-emerald-400/15 whitespace-nowrap transition-colors flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>{dict.nav.systemCenter}</span>
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

      {/* Main Content Container */}
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
            onClick={() => onTabChange?.('overview')}
            className={`flex flex-col items-center gap-1 px-4 py-1 rounded-2xl transition-colors ${
              activeTab === 'overview'
                ? 'text-cyan-300 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs whitespace-nowrap">
              {dict.nav.overview}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange?.('vault')}
            className={`flex flex-col items-center gap-1 px-4 py-1 rounded-2xl transition-colors ${
              activeTab === 'vault'
                ? 'text-cyan-300 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Database className="w-5 h-5" />
            <span className="text-xs whitespace-nowrap">
              {dict.nav.knowledgeVault}
            </span>
          </button>

          <Link
            href="/system"
            className="flex flex-col items-center gap-1 px-4 py-1 rounded-2xl text-emerald-300 hover:text-emerald-200 transition-colors"
          >
            <Activity className="w-5 h-5" />
            <span className="text-xs whitespace-nowrap">
              {dict.nav.systemCenter}
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
