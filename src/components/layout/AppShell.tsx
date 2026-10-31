'use client';

import React from 'react';
import Link from 'next/link';
import {
  BrainCircuit,
  Database,
  Activity,
  ArrowUpRight,
  Home,
} from 'lucide-react';
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
 * MindMittel V1-Inspired Crisp White Enterprise Header & Mobile Bottom Bar.
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
    <div className="min-h-screen flex flex-col justify-between pb-24 md:pb-0 selection:bg-blue-600 selection:text-white">
      {/* Sticky Crisp White Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Left Brand Logo */}
          <button
            type="button"
            onClick={() => onTabChange?.('overview')}
            className="flex items-center gap-3 text-left group shrink-0"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/25 group-hover:bg-blue-700 transition-colors">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-lg text-slate-900">
                  {dict.meta.appName}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  V2
                </span>
              </div>
              <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                {dict.meta.tagline}
              </p>
            </div>
          </button>

          {/* Center Navigation Links (Matches V1 Screenshot) */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600"
          >
            {activeTab === 'overview' ? (
              <>
                <a
                  href="#why-mindmittel"
                  className="hover:text-blue-600 transition-colors whitespace-nowrap"
                >
                  {dict.nav.whyMindMittel}
                </a>
                <a
                  href="#how-it-works"
                  className="hover:text-blue-600 transition-colors whitespace-nowrap"
                >
                  {dict.nav.howItWorks}
                </a>
                <a
                  href="#features"
                  className="hover:text-blue-600 transition-colors whitespace-nowrap"
                >
                  {dict.nav.features}
                </a>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onTabChange?.('overview')}
                className="text-slate-700 hover:text-blue-600 font-semibold transition-colors flex items-center gap-1.5"
              >
                ← {dict.nav.backToLanding}
              </button>
            )}

            <Link
              href="/system"
              className="text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{dict.nav.systemCenter}</span>
            </Link>
          </nav>

          {/* Right Language Toggle & Primary Blue CTA Button */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              role="group"
              aria-label="Language Selector"
              className="inline-flex items-center bg-slate-100 border border-slate-200 rounded-full p-1 text-xs font-semibold"
            >
              <button
                type="button"
                onClick={() => onLocaleChange('en')}
                className={`px-2.5 py-1 rounded-full transition-colors ${
                  locale === 'en'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLocaleChange('de')}
                className={`px-2.5 py-1 rounded-full transition-colors ${
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
              onClick={() => onTabChange?.('vault')}
              className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>{dict.nav.launchApp}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full">{children}</main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-4 inset-x-4 z-50"
      >
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg rounded-full px-4 py-2.5 flex items-center justify-around">
          <button
            type="button"
            onClick={() => onTabChange?.('overview')}
            className={`flex flex-col items-center gap-1 px-4 py-1 rounded-full text-xs font-semibold ${
              activeTab === 'overview' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>{dict.nav.backToLanding}</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange?.('vault')}
            className={`flex flex-col items-center gap-1 px-4 py-1 rounded-full text-xs font-semibold ${
              activeTab === 'vault' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Database className="w-5 h-5" />
            <span>{dict.nav.launchApp}</span>
          </button>

          <Link
            href="/system"
            className="flex flex-col items-center gap-1 px-4 py-1 rounded-full text-xs font-semibold text-emerald-600"
          >
            <Activity className="w-5 h-5" />
            <span>{dict.nav.systemCenter}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
