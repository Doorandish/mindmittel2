'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Sparkles,
  Database,
  Search,
  Layers,
  Cpu,
  ArrowUpRight,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/glass/GlassCard';
import {
  getDictionary,
  DEFAULT_LOCALE,
  type SupportedLocale,
} from '@/i18n/dictionaries';

export default function HomePage() {
  const [locale, setLocale] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [activeTab, setActiveTab] = useState<
    'audit' | 'vault' | 'router' | 'system'
  >('audit');
  const [selectedProfile, setSelectedProfile] = useState<'fast' | 'reasoning'>(
    'fast'
  );

  const dict = getDictionary(locale);

  return (
    <AppShell
      locale={locale}
      onLocaleChange={setLocale}
      dict={dict}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* TAB 1: AUDIT HUB (Clean Executive Overview & KPIs) */}
      {activeTab === 'audit' && (
        <div className="space-y-8">
          <section className="liquid-glass-panel p-7 md:p-10">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-400/15 border border-cyan-400/30 text-cyan-200 text-xs md:text-sm font-medium">
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>{dict.hero.badge}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                {dict.hero.title}
              </h1>

              <p className="text-base md:text-lg text-slate-200 leading-relaxed">
                {dict.hero.subtitle}
              </p>

              <div className="pt-3 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('vault')}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-semibold text-sm md:text-base shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all flex items-center gap-2"
                >
                  <span>{dict.hero.primaryCta}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>

                <Link
                  href="/system"
                  className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/25 text-white font-medium text-sm md:text-base transition-colors"
                >
                  {dict.hero.secondaryCta}
                </Link>
              </div>
            </div>
          </section>

          {/* Seam-Free High-Contrast KPI Row */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard accentGlow="cyan" className="p-6 space-y-2">
              <div className="flex items-center justify-between text-slate-200 text-sm font-medium">
                <span>{dict.metrics.governanceScore}</span>
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                94.8%
              </div>
              <p className="text-sm text-emerald-300 font-medium pt-1">
                {dict.metrics.governanceDelta}
              </p>
            </GlassCard>

            <GlassCard
              accentGlow="indigo"
              interactive
              className="p-6 space-y-2"
            >
              <button
                type="button"
                onClick={() => setActiveTab('vault')}
                className="w-full text-left space-y-2"
              >
                <div className="flex items-center justify-between text-slate-200 text-sm font-medium">
                  <span>{dict.metrics.indexedChunks}</span>
                  <Database className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white tracking-tight font-mono">
                  mindmittel_v2
                </div>
                <p className="text-sm text-slate-300 pt-1">
                  {dict.metrics.indexedSub} →
                </p>
              </button>
            </GlassCard>

            <GlassCard
              accentGlow="emerald"
              interactive
              className="p-6 space-y-2"
            >
              <button
                type="button"
                onClick={() => setActiveTab('router')}
                className="w-full text-left space-y-2"
              >
                <div className="flex items-center justify-between text-slate-200 text-sm font-medium">
                  <span>{dict.metrics.activeModel}</span>
                  <Cpu className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  {selectedProfile === 'fast'
                    ? 'Gemini Flash'
                    : 'Gemini Pro'}
                </div>
                <p className="text-sm text-cyan-300 pt-1">
                  {dict.metrics.modelRoutingMode} →
                </p>
              </button>
            </GlassCard>
          </section>
        </div>
      )}

      {/* TAB 2: PARENT-CHILD RAG KNOWLEDGE VAULT (Dedicated Uncluttered View) */}
      {activeTab === 'vault' && (
        <div className="space-y-6">
          <GlassCard className="p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
                <Layers className="w-6 h-6 text-cyan-400" />
                <span>{dict.ragSection.title}</span>
              </h2>
              <p className="text-sm md:text-base text-slate-200 leading-relaxed max-w-3xl">
                {dict.ragSection.subtitle}
              </p>
            </div>

            {/* High-Contrast Search Input & Metadata Filter Pills */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  readOnly
                  placeholder={dict.ragSection.searchPlaceholder}
                  className="w-full pl-12 pr-5 py-3.5 text-sm md:text-base liquid-glass-input"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-xs md:text-sm">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-white/20 text-slate-100 font-medium">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                  {dict.ragSection.filterDepartment}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-white/20 text-slate-100 font-medium">
                  {dict.ragSection.filterSource}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-white/20 text-slate-100 font-medium">
                  {dict.ragSection.filterFramework}
                </span>
              </div>
            </div>

            {/* Spacious Parent-Child Document Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/15 space-y-3">
                <div className="flex items-center justify-between text-xs text-cyan-300 font-medium">
                  <span className="font-mono">
                    {dict.ragSection.parentLabel} · raw_documents
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-cyan-400/15 border border-cyan-400/30">
                    4 {dict.ragSection.childChunksLabel}
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-white">
                  {dict.ragSection.sampleDoc1Title}
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {dict.ragSection.sampleDoc1Summary}
                </p>
                <div className="flex flex-wrap gap-2 pt-2 text-xs text-slate-200 font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-white/10">
                    dept: legal
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/10">
                    source: upload
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/10">
                    tag: board-audit
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/15 space-y-3">
                <div className="flex items-center justify-between text-xs text-indigo-300 font-medium">
                  <span className="font-mono">
                    {dict.ragSection.parentLabel} · raw_documents
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-400/15 border border-indigo-400/30">
                    3 {dict.ragSection.childChunksLabel}
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-white">
                  {dict.ragSection.sampleDoc2Title}
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {dict.ragSection.sampleDoc2Summary}
                </p>
                <div className="flex flex-wrap gap-2 pt-2 text-xs text-slate-200 font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-white/10">
                    dept: executive
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/10">
                    source: slack
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/10">
                    tag: ai-governance
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 3: DYNAMIC GEMINI MODEL ROUTER (Dedicated Uncluttered View) */}
      {activeTab === 'router' && (
        <div className="space-y-6">
          <GlassCard className="p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
                <Sparkles className="w-6 h-6 text-emerald-400" />
                <span>{dict.aiSelectorSection.title}</span>
              </h2>
              <p className="text-sm md:text-base text-slate-200 leading-relaxed max-w-3xl">
                {dict.aiSelectorSection.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <button
                type="button"
                onClick={() => setSelectedProfile('fast')}
                className={`w-full text-left p-6 rounded-2xl border transition-colors ${
                  selectedProfile === 'fast'
                    ? 'bg-cyan-400/15 border-cyan-400 shadow-sm'
                    : 'bg-slate-950/60 border-white/15 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base md:text-lg font-bold text-white">
                    {dict.aiSelectorSection.fastProfileLabel}
                  </span>
                  {selectedProfile === 'fast' && (
                    <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                  )}
                </div>
                <p className="text-sm text-slate-200 mt-2 leading-relaxed">
                  {dict.aiSelectorSection.fastProfileDesc}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedProfile('reasoning')}
                className={`w-full text-left p-6 rounded-2xl border transition-colors ${
                  selectedProfile === 'reasoning'
                    ? 'bg-indigo-400/15 border-indigo-400 shadow-sm'
                    : 'bg-slate-950/60 border-white/15 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base md:text-lg font-bold text-white">
                    {dict.aiSelectorSection.reasoningProfileLabel}
                  </span>
                  {selectedProfile === 'reasoning' && (
                    <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                  )}
                </div>
                <p className="text-sm text-slate-200 mt-2 leading-relaxed">
                  {dict.aiSelectorSection.reasoningProfileDesc}
                </p>
              </button>
            </div>

            <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-sm text-emerald-300 font-medium">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                {dict.aiSelectorSection.statusReady}
              </span>
              <Link
                href="/system"
                className="text-cyan-300 hover:underline font-semibold"
              >
                {dict.aiSelectorSection.evaluateButton} →
              </Link>
            </div>
          </GlassCard>
        </div>
      )}
    </AppShell>
  );
}
