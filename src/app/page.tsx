'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  Layers,
  Cpu,
  ArrowUpRight,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Database,
  Zap,
  FileText,
  MessageSquare,
  Globe,
  Lock,
  BrainCircuit,
  Activity,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
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

  function openLiveWorkspace() {
    setActiveTab('vault');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <AppShell
      locale={locale}
      onLocaleChange={setLocale}
      dict={dict}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* VIEW 1: V1-INSPIRED CRISP ENTERPRISE LANDING PAGE (Updated for V2 Architecture) */}
      {activeTab === 'overview' && (
        <div className="space-y-24 pb-20">
          {/* SECTION 1: HERO WITH MACOS AUDIT ENGINE MOCKUP WINDOW */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left 6 Columns: Headline & Direct CTA (No Video Button) */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>{dict.hero.badge}</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                  {dict.hero.titleBlack1}{' '}
                  <span className="text-blue-600">{dict.hero.titleBlue}</span>{' '}
                  {dict.hero.titleBlack2}
                </h1>

                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                  {dict.hero.subtitle}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={openLiveWorkspace}
                    className="px-7 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
                  >
                    <span>{dict.hero.primaryCta}</span>
                    <ArrowUpRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Bottom Trust Badges */}
                <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center gap-6 text-xs sm:text-sm font-medium text-slate-600">
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    {dict.hero.trust1}
                  </span>
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-600" />
                    {dict.hero.trust2}
                  </span>
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    {dict.hero.trust3}
                  </span>
                </div>
              </div>

              {/* Right 6 Columns: V2 Interactive MacBook Window Graphic */}
              <div className="lg:col-span-6">
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-blue-950/10 overflow-hidden">
                  {/* macOS Window Title Bar */}
                  <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-400" />
                      <span className="w-3 h-3 rounded-full bg-amber-400" />
                      <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-xs font-mono text-slate-500 font-medium">
                      {dict.hero.mockupWindowTitle}
                    </span>
                  </div>

                  {/* Two-Column Phase Preview inside Mockup */}
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                    {/* Phase 1: Inject & Slice (V2 Parent-Child RAG) */}
                    <div className="space-y-3.5 pr-0 sm:pr-4">
                      <div className="text-[11px] font-mono font-bold tracking-wider text-blue-600 uppercase">
                        {dict.hero.mockupPhase1}
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>{dict.hero.mockupDoc1Title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {dict.hero.mockupDoc1Sub}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                          <Database className="w-3.5 h-3.5 text-rose-500" />
                          <span>{dict.hero.mockupDoc2Title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {dict.hero.mockupDoc2Sub}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                          <span>{dict.hero.mockupDoc3Title}</span>
                        </div>
                        <p className="text-[11px] text-blue-600 leading-snug">
                          {dict.hero.mockupDoc3Sub}
                        </p>
                      </div>

                      <div className="pt-1 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                        <Database className="w-3.5 h-3.5" />
                        <span>{dict.hero.mockupStoredBadge}</span>
                      </div>
                    </div>

                    {/* Phase 2: Autonomous Audit */}
                    <div className="space-y-4 pt-4 sm:pt-0 sm:pl-6 flex flex-col justify-between">
                      <div className="space-y-3.5">
                        <div className="text-[11px] font-mono font-bold tracking-wider text-emerald-600 uppercase">
                          {dict.hero.mockupPhase2}
                        </div>

                        <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-1">
                          <div className="text-[11px] font-bold text-amber-800">
                            {dict.hero.mockupDecisionLabel}
                          </div>
                          <p className="text-xs italic text-amber-900 leading-snug">
                            {dict.hero.mockupDecisionText}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                          <div className="px-3.5 py-2 bg-slate-900 text-white text-[11px] font-mono flex items-center justify-between">
                            <span>{dict.hero.mockupReportHeader}</span>
                            <span className="text-emerald-400 font-sans font-bold">
                              ● LIVE
                            </span>
                          </div>
                          <div className="p-3.5 space-y-2 text-xs text-slate-700">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{dict.hero.mockupReportItem1}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Cpu className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{dict.hero.mockupReportItem2}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>{dict.hero.mockupReportItem3}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-1 flex justify-center">
                        <span className="inline-flex items-center gap-1.5 px-5 py-1.5 rounded-full bg-emerald-50 border border-emerald-500 text-emerald-700 text-xs font-extrabold tracking-wider">
                          <CheckCircle2 className="w-4 h-4" />
                          {dict.hero.mockupCertifiedBadge}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: THE PROBLEM VS. THE MINDMITTEL V2 SOLUTION */}
          <section
            id="why-mindmittel"
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24 space-y-12"
          >
            <div className="text-center space-y-3">
              <div className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">
                {dict.problemSolution.eyebrow}
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                {dict.problemSolution.title}
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Red-Tinted Problem Card */}
              <div className="p-8 sm:p-10 rounded-3xl bg-rose-50/60 border border-rose-200/80 space-y-7">
                <div className="inline-flex items-center gap-2 text-xs font-mono font-extrabold tracking-wider text-rose-600 uppercase">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                  <span>{dict.problemSolution.problemHeader}</span>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0 text-rose-600">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900">
                        {dict.problemSolution.prob1Title}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        {dict.problemSolution.prob1Desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0 text-rose-600">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900">
                        {dict.problemSolution.prob2Title}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        {dict.problemSolution.prob2Desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0 text-rose-600">
                      <Database className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900">
                        {dict.problemSolution.prob3Title}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        {dict.problemSolution.prob3Desc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Green-Tinted Solution Card */}
              <div className="p-8 sm:p-10 rounded-3xl bg-emerald-50/60 border border-emerald-200/80 space-y-7">
                <div className="inline-flex items-center gap-2 text-xs font-mono font-extrabold tracking-wider text-emerald-700 uppercase">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span>{dict.problemSolution.solutionHeader}</span>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-700">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900">
                        {dict.problemSolution.sol1Title}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        {dict.problemSolution.sol1Desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-700">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900">
                        {dict.problemSolution.sol2Title}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        {dict.problemSolution.sol2Desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-700">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900">
                        {dict.problemSolution.sol3Title}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        {dict.problemSolution.sol3Desc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: HOW IT WORKS IN 3 STEPS (With Updated V2 Interactive Mockup Cards) */}
          <section
            id="how-it-works"
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24 space-y-12"
          >
            <div className="text-center space-y-3">
              <div className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">
                {dict.howItWorksSection.eyebrow}
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                {dict.howItWorksSection.titleBlack}{' '}
                <span className="text-blue-600">
                  {dict.howItWorksSection.titleBlue}
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="space-y-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                      1
                    </span>
                    <div>
                      <div className="text-[11px] font-mono text-slate-400 font-bold uppercase">
                        {dict.howItWorksSection.step1Label}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {dict.howItWorksSection.step1Title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    {dict.howItWorksSection.step1Desc}
                  </p>
                </div>

                {/* V2 Step 1 Mockup Card */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-1">
                        Department
                      </span>
                      <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800">
                        Finance & Legal
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">
                        Connector Source
                      </span>
                      <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800">
                        Upload / Slack
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">
                      Parent-Child Chunking Pipeline
                    </span>
                    <div className="px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 flex items-center justify-between">
                      <span>Parent (2,000c) → 4 Child Vectors</span>
                      <span>768-d</span>
                    </div>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                    <span className="font-medium">
                      Board_Charter_2026.pdf
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                      2
                    </span>
                    <div>
                      <div className="text-[11px] font-mono text-slate-400 font-bold uppercase">
                        {dict.howItWorksSection.step2Label}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {dict.howItWorksSection.step2Title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    {dict.howItWorksSection.step2Desc}
                  </p>
                </div>

                {/* V2 Step 2 Mockup Card */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <span className="text-xs text-slate-400 block">
                    Management Decision Query
                  </span>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 italic leading-relaxed">
                    &ldquo;Approve €18,000 unbudgeted software vendor contract
                    without secondary board approval.&rdquo;
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-medium text-amber-800">
                    ⚡ Metadata Filter + 768-d Cosine Vector Match
                  </div>
                  <div className="px-3.5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-mono flex items-center justify-between">
                    <span>Auto-Selected: Gemini Pro</span>
                    <span className="text-blue-400">● Reasoning</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                      3
                    </span>
                    <div>
                      <div className="text-[11px] font-mono text-slate-400 font-bold uppercase">
                        {dict.howItWorksSection.step3Label}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {dict.howItWorksSection.step3Title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    {dict.howItWorksSection.step3Desc}
                  </p>
                </div>

                {/* V2 Step 3 Mockup Card */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-slate-600">
                      Audit_Result_V2.json
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                      ● Verified
                    </span>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-800 text-xs font-semibold">
                    › I. Strategic Policy Alignment
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-900 text-xs font-semibold">
                    › II. Citation: Board_Charter_2026 (§4.2)
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-500 text-emerald-800 text-xs font-extrabold text-center">
                    ✓ {dict.hero.mockupCertifiedBadge}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: 4 KEY ENTERPRISE FEATURES (2x2 Grid) */}
          <section
            id="features"
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24 space-y-12"
          >
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">
                {dict.featuresSection.eyebrow}
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                {dict.featuresSection.title}
              </h2>
              <p className="text-base text-slate-600">
                {dict.featuresSection.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-mono font-bold uppercase">
                    {dict.featuresSection.feat1Badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {dict.featuresSection.feat1Title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {dict.featuresSection.feat1Desc}
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                    <Layers className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-mono font-bold uppercase">
                    {dict.featuresSection.feat2Badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {dict.featuresSection.feat2Title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {dict.featuresSection.feat2Desc}
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-mono font-bold uppercase">
                    {dict.featuresSection.feat3Badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {dict.featuresSection.feat3Title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {dict.featuresSection.feat3Desc}
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <Activity className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-mono font-bold uppercase">
                    {dict.featuresSection.feat4Badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {dict.featuresSection.feat4Title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {dict.featuresSection.feat4Desc}
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 5: DARK NAVY CALL-TO-ACTION BANNER & CLEAN FOOTER */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-slate-950 text-white p-10 sm:p-16 text-center space-y-6 shadow-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span>{dict.ctaBanner.badge}</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight">
                {dict.ctaBanner.titleWhite}{' '}
                <span className="text-blue-400">
                  {dict.ctaBanner.titleBlue}
                </span>
              </h2>

              <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
                {dict.ctaBanner.subtitle}
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={openLiveWorkspace}
                  className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-lg shadow-blue-600/30 transition-all inline-flex items-center gap-2"
                >
                  <span>{dict.ctaBanner.buttonText}</span>
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </section>

          {/* Enterprise Footer */}
          <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-sm text-slate-600">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-slate-900 text-base">
                    MindMittel V2
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {dict.footer.description}
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-slate-900 uppercase">
                  {dict.footer.productCol}
                </div>
                <ul className="space-y-1.5 text-xs">
                  <li>
                    <a href="#why-mindmittel" className="hover:text-blue-600">
                      {dict.nav.whyMindMittel}
                    </a>
                  </li>
                  <li>
                    <a href="#how-it-works" className="hover:text-blue-600">
                      {dict.nav.howItWorks}
                    </a>
                  </li>
                  <li>
                    <a href="#features" className="hover:text-blue-600">
                      {dict.nav.features}
                    </a>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-slate-900 uppercase">
                  {dict.footer.companyCol}
                </div>
                <ul className="space-y-1.5 text-xs">
                  <li>
                    <Link href="/system" className="hover:text-blue-600">
                      Interactive System Topology (/system)
                    </Link>
                  </li>
                  <li>
                    <Link href="/system" className="hover:text-blue-600">
                      Live SSE Telemetry Stream
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-slate-900 uppercase">
                  {dict.footer.legalCol}
                </div>
                <ul className="space-y-1.5 text-xs">
                  <li>
                    <button
                      type="button"
                      onClick={() => setLocale('en')}
                      className="hover:text-blue-600"
                    >
                      English (Default)
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setLocale('de')}
                      className="hover:text-blue-600"
                    >
                      Deutsch (DE)
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* VIEW 2: INTERACTIVE AUDIT & PARENT-CHILD RAG WORKSPACE */}
      {activeTab === 'vault' && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div className="liquid-glass-panel p-7 md:p-10 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>LIVE GOVERNANCE WORKSPACE</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                {dict.ragSection.title}
              </h1>
              <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-3xl">
                {dict.ragSection.subtitle}
              </p>
            </div>

            {/* Interactive Query Input with Autonomous Model Routing Indicator */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={sampleQuery}
                  onChange={(e) => setSampleQuery(e.target.value)}
                  placeholder={dict.ragSection.searchPlaceholder}
                  className="w-full pl-12 pr-5 py-4 text-sm md:text-base liquid-glass-input"
                />
              </div>

              {/* Autonomous Model Routing Status Pill */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs md:text-sm text-slate-700">
                <span className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{dict.ragSection.autoRoutingNotice}</span>
                </span>
                <span className="font-mono text-blue-700 font-bold">
                  Auto-Selected Tier:{' '}
                  {inferredProfile === 'reasoning'
                    ? 'Gemini Pro (Deep Audit)'
                    : 'Gemini Flash (Rapid Lookup)'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-xs md:text-sm pt-1">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                  {dict.ragSection.filterDepartment}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                  {dict.ragSection.filterSource}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                  {dict.ragSection.filterAccess}
                </span>
              </div>
            </div>

            {/* Spacious Parent-Child Document Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between text-xs text-blue-700 font-bold">
                  <span className="font-mono">
                    {dict.ragSection.parentLabel} · raw_documents
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 border border-blue-200">
                    4 {dict.ragSection.childChunksLabel}
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-bold text-slate-900">
                  {dict.ragSection.sampleDoc1Title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {dict.ragSection.sampleDoc1Summary}
                </p>
                <div className="flex flex-wrap gap-2 pt-2 text-xs text-slate-600 font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">
                    dept: legal
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">
                    source: upload
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">
                    tag: board-audit
                  </span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between text-xs text-indigo-700 font-bold">
                  <span className="font-mono">
                    {dict.ragSection.parentLabel} · raw_documents
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-100 border border-indigo-200">
                    3 {dict.ragSection.childChunksLabel}
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-bold text-slate-900">
                  {dict.ragSection.sampleDoc2Title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {dict.ragSection.sampleDoc2Summary}
                </p>
                <div className="flex flex-wrap gap-2 pt-2 text-xs text-slate-600 font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">
                    dept: executive
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">
                    source: slack
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">
                    tag: ai-governance
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
