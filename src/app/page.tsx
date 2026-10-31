'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Sparkles,
  Search,
  Layers,
  Cpu,
  ArrowUpRight,
  SlidersHorizontal,
  Scale,
  CheckCircle2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/glass/GlassCard';
import {
  getDictionary,
  DEFAULT_LOCALE,
  type SupportedLocale,
} from '@/i18n/dictionaries';
import { inferProfileFromQuery } from '@/core/ai/modelRanking';

export default function HomePage() {
  const [locale, setLocale] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [activeTab, setActiveTab] = useState<'overview' | 'vault'>('overview');
  const [sampleQuery, setSampleQuery] = useState<string>('');

  const dict = getDictionary(locale);
  const inferredProfile = inferProfileFromQuery(sampleQuery);

  return (
    <AppShell
      locale={locale}
      onLocaleChange={setLocale}
      dict={dict}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* VIEW 1: PURPOSE-DRIVEN EXECUTIVE LANDING PAGE */}
      {activeTab === 'overview' && (
        <div className="space-y-10">
          {/* Hero Value Proposition */}
          <section className="liquid-glass-panel p-7 md:p-11">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-400/15 border border-cyan-400/30 text-cyan-200 text-xs md:text-sm font-semibold">
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
                  className="px-6 py-3.5 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-semibold text-sm md:text-base shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all flex items-center gap-2"
                >
                  <span>{dict.hero.primaryCta}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>

                <Link
                  href="/system"
                  className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/25 text-white font-medium text-sm md:text-base transition-colors"
                >
                  {dict.hero.secondaryCta}
                </Link>
              </div>
            </div>
          </section>

          {/* Why MindMittel V2 Exists — The Core Problem Solved */}
          <GlassCard accentGlow="cyan" className="p-7 md:p-9 space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-semibold">
              {dict.problemSection.eyebrow}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              {dict.problemSection.title}
            </h2>
            <p className="text-base text-slate-200 leading-relaxed">
              {dict.problemSection.description}
            </p>
          </GlassCard>

          {/* 3 Value Pillars: Capabilities that Deliver Real Value */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard accentGlow="cyan" className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-400/15 border border-cyan-400/30 flex items-center justify-center">
                <Scale className="w-5 h-5 text-cyan-300" />
              </div>
              <h3 className="text-lg font-bold text-white leading-snug">
                {dict.pillars.pillar1Title}
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                {dict.pillars.pillar1Desc}
              </p>
            </GlassCard>

            <GlassCard accentGlow="indigo" className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-400/15 border border-indigo-400/30 flex items-center justify-center">
                <Layers className="w-5 h-5 text-indigo-300" />
              </div>
              <h3 className="text-lg font-bold text-white leading-snug">
                {dict.pillars.pillar2Title}
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                {dict.pillars.pillar2Desc}
              </p>
            </GlassCard>

            <GlassCard accentGlow="emerald" className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-emerald-300" />
              </div>
              <h3 className="text-lg font-bold text-white leading-snug">
                {dict.pillars.pillar3Title}
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                {dict.pillars.pillar3Desc}
              </p>
            </GlassCard>
          </section>

          {/* How It Works in 3 Steps */}
          <GlassCard className="p-7 md:p-9 space-y-6">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              {dict.workflowSection.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
                <div className="text-xs font-mono text-cyan-300 font-semibold">
                  STEP 01
                </div>
                <h3 className="text-base font-bold text-white">
                  {dict.workflowSection.step1Title}
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {dict.workflowSection.step1Desc}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
                <div className="text-xs font-mono text-indigo-300 font-semibold">
                  STEP 02
                </div>
                <h3 className="text-base font-bold text-white">
                  {dict.workflowSection.step2Title}
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {dict.workflowSection.step2Desc}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
                <div className="text-xs font-mono text-emerald-300 font-semibold">
                  STEP 03
                </div>
                <h3 className="text-base font-bold text-white">
                  {dict.workflowSection.step3Title}
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {dict.workflowSection.step3Desc}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* VIEW 2: AUDIT & PARENT-CHILD RAG KNOWLEDGE VAULT */}
      {activeTab === 'vault' && (
        <div className="space-y-6">
          <GlassCard className="p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
                <span>{dict.ragSection.title}</span>
              </h2>
              <p className="text-sm md:text-base text-slate-200 leading-relaxed max-w-3xl">
                {dict.ragSection.subtitle}
              </p>
            </div>

            {/* Interactive Query Input with Autonomous Model Routing Indicator */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={sampleQuery}
                  onChange={(e) => setSampleQuery(e.target.value)}
                  placeholder={dict.ragSection.searchPlaceholder}
                  className="w-full pl-12 pr-5 py-3.5 text-sm md:text-base liquid-glass-input"
                />
              </div>

              {/* Autonomous Model Routing Status Pill (Zero user intervention required) */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-xs text-slate-200">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{dict.ragSection.autoRoutingNotice}</span>
                </span>
                <span className="font-mono text-cyan-300 font-semibold">
                  Auto-Selected Tier:{' '}
                  {inferredProfile === 'reasoning'
                    ? 'Gemini Pro (Deep Audit)'
                    : 'Gemini Flash (Rapid Lookup)'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-xs md:text-sm pt-1">
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
    </AppShell>
  );
}
