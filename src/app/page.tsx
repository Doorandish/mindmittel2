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
      <div className="space-y-6">
        {/* Hero Liquid Glass Banner */}
        <section className="liquid-glass-panel p-6 md:p-8 relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/25 text-cyan-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{dict.hero.badge}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
              {dict.hero.title}
            </h1>

            <p className="text-sm md:text-base text-slate-300 leading-relaxed">
              {dict.hero.subtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('vault')}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-semibold text-xs md:text-sm shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
              >
                <span>{dict.hero.primaryCta}</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <Link
                href="/system"
                className="px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-white font-medium text-xs md:text-sm transition-all"
              >
                {dict.hero.secondaryCta}
              </Link>
            </div>
          </div>
        </section>

        {/* Executive Key Metrics Grid (Mobile-First 1-col -> 3-col Desktop) */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassCard accentGlow="cyan" className="p-5">
            <div className="flex items-center justify-between text-slate-300 text-xs mb-2">
              <span>{dict.metrics.governanceScore}</span>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-white">
              94.8%
            </div>
            <p className="text-xs text-emerald-300 mt-1">
              {dict.metrics.governanceDelta}
            </p>
          </GlassCard>

          <GlassCard accentGlow="indigo" className="p-5">
            <div className="flex items-center justify-between text-slate-300 text-xs mb-2">
              <span>{dict.metrics.indexedChunks}</span>
              <Database className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-white">
              mindmittel_v2
            </div>
            <p className="text-xs text-slate-300/80 mt-1">
              {dict.metrics.indexedSub}
            </p>
          </GlassCard>

          <GlassCard accentGlow="emerald" className="p-5">
            <div className="flex items-center justify-between text-slate-300 text-xs mb-2">
              <span>{dict.metrics.activeModel}</span>
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg md:text-xl font-bold text-white truncate">
              {selectedProfile === 'fast'
                ? 'Gemini Flash (Auto)'
                : 'Gemini Pro (Auto)'}
            </div>
            <p className="text-xs text-cyan-300 mt-1">
              {dict.metrics.modelRoutingMode}
            </p>
          </GlassCard>
        </section>

        {/* Two-Column Interactive Workspace: Parent-Child RAG Vault & Dynamic Gemini Router */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Parent-Child RAG Explorer */}
          <GlassCard className="lg:col-span-7 p-5 md:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <span>{dict.ragSection.title}</span>
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  {dict.ragSection.subtitle}
                </p>
              </div>
            </div>

            {/* Search Input with Metadata Filter Pills */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  readOnly
                  placeholder={dict.ragSection.searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 text-xs md:text-sm liquid-glass-input"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.07] border border-white/15 text-slate-200">
                  <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
                  {dict.ragSection.filterDepartment}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.07] border border-white/15 text-slate-200">
                  {dict.ragSection.filterSource}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.07] border border-white/15 text-slate-200">
                  {dict.ragSection.filterFramework}
                </span>
              </div>
            </div>

            {/* Sample Parent-Child Document Cards */}
            <div className="space-y-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-cyan-300">
                  <span className="font-medium">
                    {dict.ragSection.parentLabel} · raw_documents
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-400/15 border border-cyan-400/30">
                    4 {dict.ragSection.childChunksLabel}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white">
                  {dict.ragSection.sampleDoc1Title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {dict.ragSection.sampleDoc1Summary}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] text-slate-300">
                  <span className="px-2 py-0.5 rounded bg-white/10">
                    dept: legal
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/10">
                    source: upload
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/10">
                    tag: board-audit
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-indigo-300">
                  <span className="font-medium">
                    {dict.ragSection.parentLabel} · raw_documents
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-400/15 border border-indigo-400/30">
                    3 {dict.ragSection.childChunksLabel}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white">
                  {dict.ragSection.sampleDoc2Title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {dict.ragSection.sampleDoc2Summary}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] text-slate-300">
                  <span className="px-2 py-0.5 rounded bg-white/10">
                    dept: executive
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/10">
                    source: slack
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/10">
                    tag: ai-governance
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Right 5 Cols: Dynamic Gemini Model Selector Control */}
          <GlassCard className="lg:col-span-5 p-5 md:p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div>
                <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <span>{dict.aiSelectorSection.title}</span>
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  {dict.aiSelectorSection.subtitle}
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedProfile('fast')}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                    selectedProfile === 'fast'
                      ? 'bg-cyan-400/15 border-cyan-400/50 shadow-sm'
                      : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.07]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm font-semibold text-white">
                      {dict.aiSelectorSection.fastProfileLabel}
                    </span>
                    {selectedProfile === 'fast' && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {dict.aiSelectorSection.fastProfileDesc}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProfile('reasoning')}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                    selectedProfile === 'reasoning'
                      ? 'bg-indigo-400/15 border-indigo-400/50 shadow-sm'
                      : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.07]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm font-semibold text-white">
                      {dict.aiSelectorSection.reasoningProfileLabel}
                    </span>
                    {selectedProfile === 'reasoning' && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {dict.aiSelectorSection.reasoningProfileDesc}
                  </p>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-emerald-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {dict.aiSelectorSection.statusReady}
              </span>
            </div>
          </GlassCard>
        </section>
      </div>
    </AppShell>
  );
}
