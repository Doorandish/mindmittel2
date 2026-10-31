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
 * Mobile-First Liquid Glass Application Shell.
 * Features an iOS-inspired floating frosted top bar and thumb-friendly bottom navigation dock.
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
    <div className="min-h-screen relative flex flex-col justify-between pb-28 md:pb-16 selection:bg-cyan-500/30 selection:text-cyan-100">
      {/* Ambient Liquid Mesh Gradient Background */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
      >
        <div className="absolute -top-28 -left-24 w-96 h-96 rounded-full bg-indigo-600/25 blur-3xl" />
        <div className="absolute top-1/4 -right-24 w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl" />
      </div>

      {/* Sticky Floating Frosted Top Navigation Bar */}
      <header className="sticky top-0 z-40 px-4 pt-3 pb-2 md:px-8">
        <div className="max-w-6xl mx-auto liquid-glass-pill px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <ShieldCheck className="w-5 h-5 text-slate-950 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-sm md:text-base text-white">
                  {dict.meta.appName}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-400/15 text-cyan-300 border border-cyan-400/25">
                  V2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-300/80 hidden sm:block">
                {dict.meta.tagline}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.04] p-1 rounded-full border border-white/10">
            <button
              type="button"
              onClick={() => onTabChange?.('audit')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === 'audit'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {dict.nav.auditHub}
            </button>
            <button
              type="button"
              onClick={() => onTabChange?.('vault')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === 'vault'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {dict.nav.knowledgeVault}
            </button>
            <button
              type="button"
              onClick={() => onTabChange?.('router')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === 'router'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {dict.nav.aiRouter}
            </button>
            <Link
              href="/system"
              className="px-3.5 py-1.5 rounded-full text-xs font-medium text-emerald-300 hover:bg-emerald-400/15 transition-all flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {dict.nav.systemCenter}
            </Link>
          </nav>

          {/* Bilingual EN / DE Switcher Pill */}
          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label="Language Selector"
              className="inline-flex items-center bg-white/[0.06] border border-white/15 rounded-full p-0.5 text-xs"
            >
              <Globe className="w-3.5 h-3.5 text-slate-300 ml-2 mr-1 hidden xs:inline" />
              <button
                type="button"
                onClick={() => onLocaleChange('en')}
                className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                  locale === 'en'
                    ? 'bg-cyan-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLocaleChange('de')}
                className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                  locale === 'de'
                    ? 'bg-cyan-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                DE
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 pt-4 pb-8 md:px-8">
        {children}
      </main>

      {/* Mobile-First Native iOS Floating Bottom Tab Dock */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-4 inset-x-4 z-50"
      >
        <div className="liquid-glass-pill px-3 py-2 flex items-center justify-around">
          <button
            type="button"
            onClick={() => onTabChange?.('audit')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all ${
              activeTab === 'audit'
                ? 'text-cyan-300 scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] font-medium">{dict.nav.auditHub}</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange?.('vault')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all ${
              activeTab === 'vault'
                ? 'text-cyan-300 scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-5 h-5" />
            <span className="text-[10px] font-medium">
              {dict.nav.knowledgeVault}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange?.('router')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all ${
              activeTab === 'router'
                ? 'text-cyan-300 scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium">{dict.nav.aiRouter}</span>
          </button>

          <Link
            href="/system"
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-2xl text-emerald-300 hover:text-emerald-200 transition-all"
          >
            <Activity className="w-5 h-5" />
            <span className="text-[10px] font-medium">
              {dict.nav.systemCenter}
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
