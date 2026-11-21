'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  FileCode2,
  GitBranch,
  HelpCircle,
  Layers,
  Loader2,
  Lock,
  Printer,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import {
  getLivePersianDocsSnapshot,
  type VisualFlowDiagramSpec,
} from '@/system/persianLivingDocsRegistry';
import { InteractiveArchitectureBlueprint } from '@/components/docs/InteractiveArchitectureBlueprint';

type DocTabMode = 'both' | 'blueprint' | 'non-technical' | 'technical';

function getToneClasses(
  tone: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate'
): {
  card: string;
  badge: string;
  stepCircle: string;
} {
  switch (tone) {
    case 'blue':
      return {
        card: 'border-blue-200/90 bg-blue-50/40',
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        stepCircle: 'bg-blue-600 text-white',
      };
    case 'indigo':
      return {
        card: 'border-indigo-200/90 bg-indigo-50/40',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        stepCircle: 'bg-indigo-600 text-white',
      };
    case 'emerald':
      return {
        card: 'border-emerald-200/90 bg-emerald-50/40',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        stepCircle: 'bg-emerald-600 text-white',
      };
    case 'amber':
      return {
        card: 'border-amber-200/90 bg-amber-50/40',
        badge: 'bg-amber-100 text-amber-900 border-amber-200',
        stepCircle: 'bg-amber-600 text-white',
      };
    case 'rose':
      return {
        card: 'border-rose-200/90 bg-rose-50/40',
        badge: 'bg-rose-100 text-rose-800 border-rose-200',
        stepCircle: 'bg-rose-600 text-white',
      };
    default:
      return {
        card: 'border-slate-200/90 bg-slate-50/60',
        badge: 'bg-slate-200/80 text-slate-800 border-slate-300',
        stepCircle: 'bg-slate-800 text-white',
      };
  }
}

function VisualFlowchartCard({ diagram }: { diagram: VisualFlowDiagramSpec }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold">
            <GitBranch className="w-3.5 h-3.5" />
            <span>فلوچارت و دیاگرام بصری سیستم</span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
            {diagram.titleFa}
          </h3>
          <p className="text-xs text-slate-500">{diagram.subtitleFa}</p>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/80 border border-slate-200/70 rounded-xl p-3.5">
        {diagram.summaryFa}
      </p>

      {/* Connected Flowchart Steps */}
      <div className="relative space-y-3">
        {diagram.steps.map((step, index) => {
          const tone = getToneClasses(step.tone);
          const isLast = index === diagram.steps.length - 1;
          return (
            <div key={step.stepNumber} className="relative">
              <div
                className={`rounded-xl border p-4 transition-all ${tone.card}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold shadow-sm ${tone.stepCircle}`}
                    >
                      {step.stepNumber}
                    </span>
                    <h4 className="text-sm sm:text-[15px] font-extrabold text-slate-900">
                      {step.titleFa}
                    </h4>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-md border text-[11px] font-mono font-semibold ${tone.badge}`}
                  >
                    {step.badgeText}
                  </span>
                </div>

                <div
                  dir="ltr"
                  className="text-[11px] font-mono text-slate-500 mb-1.5 text-left"
                >
                  {step.subtitleEn}
                </div>

                <p className="text-xs sm:text-[13.5px] text-slate-700 leading-relaxed">
                  {step.descriptionFa}
                </p>
              </div>

              {!isLast && (
                <div className="flex justify-center my-1" aria-hidden="true">
                  <div className="w-0.5 h-4 bg-slate-300" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminPersianLivingDocsPage() {
  const [checkingSession, setCheckingSession] = useState<boolean>(true);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [ownerEmail, setOwnerEmail] = useState<string>('');
  const [activeTab, setActiveTab] = useState<DocTabMode>('both');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    'dynamic-gemini-router'
  );

  const snapshot = useMemo(() => getLivePersianDocsSnapshot(), []);

  useEffect(() => {
    let cancelled = false;
    async function verifyOwnerSession() {
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
    verifyOwnerSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredApiRoutes = useMemo(() => {
    if (!normalizedQuery) return snapshot.documentedApiRoutes;
    return snapshot.documentedApiRoutes.filter(
      (r) =>
        r.endpoint.toLowerCase().includes(normalizedQuery) ||
        r.sourceFile.toLowerCase().includes(normalizedQuery) ||
        r.technicalSummaryFa.toLowerCase().includes(normalizedQuery) ||
        r.nonTechnicalSummaryFa.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery, snapshot.documentedApiRoutes]);

  const filteredCoreModules = useMemo(() => {
    if (!normalizedQuery) return snapshot.documentedCoreModules;
    return snapshot.documentedCoreModules.filter(
      (m) =>
        m.moduleName.toLowerCase().includes(normalizedQuery) ||
        m.responsibilityFa.toLowerCase().includes(normalizedQuery) ||
        m.failureRecoveryFa.toLowerCase().includes(normalizedQuery) ||
        m.sourceFiles.some((f) => f.toLowerCase().includes(normalizedQuery))
    );
  }, [normalizedQuery, snapshot.documentedCoreModules]);

  const activeNodeSpec =
    snapshot.architectureNodes.find((n) => n.id === selectedNodeId) ??
    snapshot.architectureNodes[0];
  const activeNodeTranslation =
    snapshot.technicalDoc.nodeTranslations.find(
      (n) => n.nodeId === activeNodeSpec.id
    ) ?? snapshot.technicalDoc.nodeTranslations[0];

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-500">
        <div className="flex items-center gap-2.5 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Verifying Product Owner session...</span>
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
              admin.mindmittel.de/admin/docs
            </div>
            <h1 className="text-lg font-extrabold text-white">
              Product Owner Authentication Required
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Living architecture documentation is restricted to authenticated Product Owners. Please sign in via the Control Plane first.
            </p>
          </div>

          <Link
            href="/admin"
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Admin Control Plane (/admin)</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "'Vazirmatn', 'Inter', Tahoma, sans-serif",
        lineHeight: 1.8,
      }}
      className="min-h-screen bg-[#f8fafc] text-slate-900"
    >
      {/* Top Admin Header (English LTR matching admin.mindmittel.de) */}
      <header
        dir="ltr"
        className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 print:hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-sm shadow">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-extrabold flex items-center gap-2">
                <span>MindMittel Control Plane · Architecture Docs</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-mono">
                  Auto-Synced with Code
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Signed in as {ownerEmail} · admin.mindmittel.de/admin/docs
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <Link
              href="/system"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>System Topology (/system)</span>
            </Link>
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Control Plane (/admin)</span>
            </Link>
          </div>
        </div>
      </header>

      <main
        dir="rtl"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
      >
        {/* Live Code-Synchronized Telemetry Banner */}
        <section className="bg-gradient-to-l from-slate-900 via-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-800 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  مستندات دوزبانه پویا (فنی + غیرفنی) متصل به رجیستری کد و گیت
                  تست Vitest
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold leading-snug">
                دانشنامه زنده معماری، جریان داده و سپرهای دفاعی MindMittel V2
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                این صفحه شامل **۲ داکیومنت جامع فارسی** است که مستقیماً از
                رجیستری کدهای پروژه تغذیه می‌شوند: **داکیومنت اول** به زبان
                کاملاً ساده و غیرفنی توضیح می‌دهد زیر کاپوت چه خبر است و چطور
                جلوی خطاها گرفته می‌شود؛ و **داکیومنت دوم** معماری عمیق فنی،
                ارتباط بین ماژول‌ها، فلوچارت‌ها و تمام مسیرهای API را مستند
                می‌کند.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 text-xs space-y-1.5 shrink-0">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>قفل ضدِ انحراف مستندات فعال است</span>
              </div>
              <div dir="ltr" className="font-mono text-[11px] text-slate-300">
                Rule: .agents/rules/living-persian-docs.md
              </div>
              <div dir="ltr" className="font-mono text-[11px] text-slate-400">
                Guard: tests/unit/system/loggerAndDocs.test.ts
              </div>
            </div>
          </div>

          {/* Live Dynamic Counters from Codebase */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
              <div className="text-[11px] text-slate-400">گره‌های معماری فعال</div>
              <div className="text-xl font-extrabold text-emerald-400 mt-1">
                {snapshot.liveMetrics.healthyArchitectureNodes} /{' '}
                {snapshot.liveMetrics.totalArchitectureNodes}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
              <div className="text-[11px] text-slate-400">مسیرهای API ثبت‌شده</div>
              <div className="text-xl font-extrabold text-blue-400 mt-1">
                {snapshot.liveMetrics.totalApiEndpoints} مسیر
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
              <div className="text-[11px] text-slate-400">ماژول‌های هسته و زیرساخت</div>
              <div className="text-xl font-extrabold text-indigo-300 mt-1">
                {snapshot.liveMetrics.totalCoreModules} ماژول
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
              <div className="text-[11px] text-slate-400">کانال‌های ارتباطی داده</div>
              <div className="text-xl font-extrabold text-amber-300 mt-1">
                {snapshot.liveMetrics.totalDataChannels} کانال
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
              <div className="text-[11px] text-slate-400">سپرهای دفاعی ضدخطا</div>
              <div className="text-xl font-extrabold text-emerald-300 mt-1">
                {snapshot.liveMetrics.totalErrorShields} سپر فعال
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
              <div className="text-[11px] text-slate-400">کانکتورهای سازمانی</div>
              <div className="text-xl font-extrabold text-sky-300 mt-1">
                {snapshot.liveMetrics.totalEnterpriseConnectors} کانکتور
              </div>
            </div>
          </div>

          {/* Document Switcher & Search Filter */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10 print:hidden">
            <div className="inline-flex flex-wrap items-center gap-1.5 bg-slate-950/70 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('both')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'both'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                نمایش یکپارچه (نقشه + هر ۲ داکیومنت)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('blueprint')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'blueprint'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                نقشه تعاملی معماری (Blueprint)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('non-technical')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'non-technical'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                داکیومنت غیرفنی (به زبان ساده + ۶ سپر ضدخطا)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('technical')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'technical'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                داکیومنت فنی و معماری مهندسی (Technical Spec)
              </button>
            </div>

            <div className="relative min-w-[260px] flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در ماژول‌ها، مسیرهای API یا مفاهیم..."
                className="w-full pr-10 pl-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* INTERACTIVE LIVING ARCHITECTURE BLUEPRINT (ZONES 0–6)                 */}
        {/* ===================================================================== */}
        {(activeTab === 'both' || activeTab === 'blueprint') && (
          <InteractiveArchitectureBlueprint />
        )}

        {/* ===================================================================== */}
        {/* DOCUMENT 1 (NON-TECHNICAL): UNDER THE HOOD IN PLAIN PERSIAN           */}
        {/* ===================================================================== */}
        {(activeTab === 'both' || activeTab === 'non-technical') && (
          <section className="space-y-8" aria-label="Non-Technical Persian Document">
            <div className="bg-emerald-950 text-white rounded-3xl p-6 sm:p-8 border border-emerald-800 shadow-md space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>داکیومنت اول (غیرفنی — به زبان کاملاً ساده و اجرایی)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold">
                {snapshot.nonTechnicalDoc.title}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200">
                {snapshot.nonTechnicalDoc.subtitle}
              </p>
              <div className="p-4 rounded-2xl bg-white/10 border border-white/15 text-xs sm:text-sm text-white leading-relaxed mt-2">
                {snapshot.nonTechnicalDoc.executiveIntroFa}
              </div>
            </div>

            {/* Non-Technical Visual Flowcharts */}
            <div className="grid grid-cols-1 gap-6">
              {snapshot.nonTechnicalDoc.diagrams.map((diagram) => (
                <VisualFlowchartCard key={diagram.id} diagram={diagram} />
              ))}
            </div>

            {/* Non-Technical Narrative Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {snapshot.nonTechnicalDoc.sections.map((section) => (
                <div
                  key={section.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4"
                >
                  <div className="space-y-1 border-b border-slate-100 pb-3">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                      {section.badgeFa}
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      {section.titleFa}
                    </h3>
                    <p className="text-xs text-slate-500">{section.summaryFa}</p>
                  </div>

                  <div className="space-y-3">
                    {section.bulletsFa.map((b, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1"
                      >
                        <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                          {b.headingFa}
                        </div>
                        <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
                          {b.bodyFa}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* The 6 Error-Prevention Shields (چطور جلوی خطاها گرفته می‌شود؟) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="space-y-1.5 border-b border-slate-100 pb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                  <Shield className="w-3.5 h-3.5" />
                  <span>مکانیزم‌های خودترمیم‌گر و ضدخطا به زبان ساده</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  ۶ سپر دفاعی سیستم: چطور جلوی خطاها، هنگ کردن هوش مصنوعی و تایم‌اوت‌ها گرفته می‌شود؟
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  در جدول و کارت‌های زیر می‌بینید که برای هر خطر احتمالی در دنیای
                  واقعی، چه سپر محافظی در کدهای پروژه تعبیه شده است:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {snapshot.nonTechnicalDoc.errorShields.map((shield) => (
                  <div
                    key={shield.id}
                    className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold">
                          سپر دفاعی شماره {shield.shieldNumber}
                        </span>
                        <span
                          dir="ltr"
                          className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200"
                        >
                          {shield.technicalNameEn}
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                        {shield.titleFa}
                      </h4>

                      <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80 space-y-1">
                        <div className="text-[11px] font-bold text-rose-800">
                          خطر یا مشکل احتمالی چیست؟
                        </div>
                        <p className="text-xs text-rose-950 leading-relaxed">
                          {shield.threatScenarioFa}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1">
                        <div className="text-[11px] font-bold text-blue-800">
                          سیستم چطور جلوی این خطا را می‌گیرد؟
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed">
                          {shield.howShieldPreventsItFa}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 space-y-1">
                        <div className="text-[11px] font-bold text-emerald-800">
                          نتیجه نهایی برای کاربر:
                        </div>
                        <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                          {shield.userExperienceResultFa}
                        </p>
                      </div>
                    </div>

                    <div
                      dir="ltr"
                      className="pt-2 border-t border-slate-200/80 text-[11px] font-mono text-slate-500 text-left"
                    >
                      Source: {shield.sourceFileRef}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Architectural Decisions Explained Simply (Why Chosen, Rejected Alternatives & Limitations) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="space-y-1.5 border-b border-slate-100 pb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>فلسفه طراحی معماری، گزینه‌های جایگزین و محدودیت‌ها به زبان ساده</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  ۸ تصمیم کلیدی معماری: چرا این روش را انتخاب کردیم، چرا جایگزین‌ها رد شدند و چه محدودیتی ایجاد می‌کند؟
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  در مهندسی نرم‌افزار هیچ تصمیمی بدون بده‌بستان (Trade-off) نیست. در این بخش، دلیل انتخاب معماری هر قسمت، مقایسه با گزینه‌های رقیب و محدودیت‌های آن به زبان ساده توضیح داده شده است:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {snapshot.nonTechnicalDoc.architectKeyDecisions.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                          {item.questionFa}
                        </h4>

                        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1">
                          <div className="text-[11px] font-bold text-blue-900">
                            ✓ چرا این معماری انتخاب شد؟ (پاسخ ساده)
                          </div>
                          <p className="text-xs text-slate-800 leading-relaxed">
                            {item.simpleAnswerFa}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-100/90 border border-slate-200/90 space-y-1">
                          <div className="text-[11px] font-bold text-slate-800">
                            ✗ چرا گزینه‌های جایگزین رد شدند؟
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {item.alternativesComparisonFa}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 space-y-1">
                          <div className="text-[11px] font-bold text-amber-900">
                            ⚠ محدودیت یا بده‌بستان این معماری چیست؟
                          </div>
                          <p className="text-xs text-amber-950 leading-relaxed">
                            {item.limitationsAndConstraintsFa}
                          </p>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-xs text-emerald-950">
                        <span className="font-bold">ارزش و نتیجه نهایی: </span>
                        {item.whyItMattersFa}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {/* ===================================================================== */}
        {/* DOCUMENT 2 (TECHNICAL): DEEP SYSTEM ARCHITECTURE & MODULE CONTRACTS   */}
        {/* ===================================================================== */}
        {(activeTab === 'both' || activeTab === 'technical') && (
          <section className="space-y-8" aria-label="Technical Persian Document">
            <div className="bg-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-indigo-800 shadow-md space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
                  <Code2 className="w-4 h-4" />
                  <span>داکیومنت دوم (معماری عمیق فنی و مهندسی — Technical Deep-Dive)</span>
                </div>
                <span
                  dir="ltr"
                  className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-mono text-indigo-200"
                >
                  {snapshot.technicalDoc.version}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold">
                {snapshot.technicalDoc.title}
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200">
                {snapshot.technicalDoc.subtitle}
              </p>
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-xs text-indigo-100">
                {snapshot.technicalDoc.lastUpdatedPolicyFa}
              </div>
            </div>

            {/* Technical Visual Architecture & Pipeline Flowcharts */}
            <div className="grid grid-cols-1 gap-6">
              {snapshot.technicalDoc.diagrams.map((diagram) => (
                <VisualFlowchartCard key={diagram.id} diagram={diagram} />
              ))}
            </div>

            {/* Deep Technical Architecture Sections */}
            <div className="space-y-6">
              {snapshot.technicalDoc.sections.map((section) => (
                <div
                  key={section.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3.5">
                    <div className="space-y-1">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
                        {section.badgeFa}
                      </span>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                        {section.titleFa}
                      </h3>
                    </div>
                    <span
                      dir="ltr"
                      className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md"
                    >
                      {section.subtitleEn}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {section.summaryFa}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {section.bulletsFa.map((b, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-1.5">
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                            {b.headingFa}
                          </h4>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {b.bodyFa}
                          </p>
                        </div>
                        {b.codeRef && (
                          <div
                            dir="ltr"
                            className="pt-2 border-t border-slate-200/80 text-[11px] font-mono text-indigo-700 break-all text-left"
                          >
                            {b.codeRef}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Technical Architecture Decision Records (ADRs: Why Chosen, Rejected Alternatives & Limitations) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="space-y-1.5 border-b border-slate-100 pb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Architecture Decision Records (ADRs) · مهندسی تصمیمات معماری و محدودیت‌ها</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  ۸ سند رسمی تصمیمات معماری (ADRs): چرایی انتخاب، مقایسه فنی با جایگزین‌ها و محدودیت‌های سیستم
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  تحلیل عمیق مهندسی برای هر یک از تصمیمات معماری پلتفرم، دلایل رد گزینه‌های رقیب، محدودیت‌های فنی ایجادشده (Trade-offs) و مسیر مقیاس‌پذیری آینده:
                </p>
              </div>

              <div className="space-y-5">
                {snapshot.technicalDoc.architectureDecisions.map((adr) => (
                  <div
                    key={adr.id}
                    className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 sm:p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200/80 pb-3">
                      <div className="space-y-1">
                        <span
                          dir="ltr"
                          className="inline-block px-2.5 py-0.5 rounded-md bg-slate-900 text-white font-mono text-[11px] font-bold"
                        >
                          {adr.codeBadge}
                        </span>
                        <h4 className="text-base sm:text-lg font-extrabold text-slate-900">
                          {adr.titleFa}
                        </h4>
                      </div>
                      <span
                        dir="ltr"
                        className="text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md"
                      >
                        {adr.subtitleEn}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-xl bg-white border border-slate-200/90 space-y-1.5">
                        <div className="font-extrabold text-slate-900">
                          معماری انتخاب‌شده (Chosen Architecture):
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          {adr.chosenArchitectureFa}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/90 space-y-1.5">
                        <div className="font-extrabold text-blue-900">
                          ✓ چرایی انتخاب این معماری (Engineering Rationale):
                        </div>
                        <p className="text-slate-800 leading-relaxed">
                          {adr.whyChosenFa}
                        </p>
                      </div>
                    </div>

                    {/* Rejected Alternatives */}
                    <div className="p-4 rounded-xl bg-white border border-slate-200/90 space-y-2.5 text-xs">
                      <div className="font-extrabold text-rose-900">
                        ✗ مقایسه با گزینه‌های جایگزین و دلیل رد شدن آن‌ها (Why Chosen Over Alternatives):
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {adr.alternativesRejectedFa.map((alt, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-rose-50/50 border border-rose-200/70 space-y-1"
                          >
                            <div className="font-bold text-slate-900">
                              {alt.optionNameFa}
                            </div>
                            <p className="text-slate-700 leading-relaxed">
                              {alt.whyRejectedFa}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Limitations & Future Mitigation */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 space-y-1.5">
                        <div className="font-extrabold text-amber-900">
                          ⚠ محدودیت‌ها و بده‌بستان‌های فنی (Limitations & Trade-offs):
                        </div>
                        <p className="text-amber-950 leading-relaxed">
                          {adr.limitationsAndTradeoffsFa}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/90 space-y-1.5">
                        <div className="font-extrabold text-emerald-900">
                          راهکار مهار محدودیت و مسیر مقیاس‌پذیری (Mitigation & Scale Path):
                        </div>
                        <p className="text-emerald-950 leading-relaxed">
                          {adr.mitigationOrFuturePathFa}
                        </p>
                      </div>
                    </div>

                    <div
                      dir="ltr"
                      className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-mono text-slate-600"
                    >
                      {adr.sourceFiles.map((sf) => (
                        <span
                          key={sf}
                          className="px-2 py-0.5 rounded bg-slate-200/70 border border-slate-300/70"
                        >
                          {sf}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Click-to-Inspect Dual-Layer Node Explorer (Coupled to ARCHITECTURE_NODES) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="space-y-1 border-b border-slate-100 pb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
                  <Layers className="w-3.5 h-3.5" />
                  <span>بازرس تعاملی گره‌های معماری (Click-to-Inspect Live Nodes)</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  بررسی عمیق ۹ گره اصلی سیستم (توضیح غیرفنی + مشخصات فنی + فایل‌های سورس)
                </h3>
                <p className="text-xs text-slate-500">
                  روی هر یک از گره‌های زیر کلیک کنید تا مشخصات کامل فنی و غیرفنی
                  آن گره را که مستقیماً از `ARCHITECTURE_NODES` خوانده می‌شود
                  مشاهده کنید:
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Node Selector List */}
                <div className="lg:col-span-5 space-y-2">
                  {snapshot.architectureNodes.map((node) => {
                    const tr = snapshot.technicalDoc.nodeTranslations.find(
                      (n) => n.nodeId === node.id
                    );
                    const isSelected = node.id === activeNodeSpec.id;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`w-full text-right p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-600 shadow-sm'
                            : 'bg-slate-50/70 border-slate-200/90 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200/80 text-slate-800">
                            {tr?.categoryLabelFa ?? node.category}
                          </span>
                          <span
                            dir="ltr"
                            className="text-[11px] font-mono text-emerald-700 font-semibold"
                          >
                            ● {node.status}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1.5">
                          {tr?.titleFa ?? node.title}
                        </div>
                        <div
                          dir="ltr"
                          className="text-[11px] font-mono text-slate-500 mt-0.5 truncate text-left"
                        >
                          ID: {node.id}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Node Dual-Layer Specification */}
                <div className="lg:col-span-7 bg-slate-50/70 rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-5">
                  <div className="border-b border-slate-200 pb-3.5 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-md">
                        {activeNodeTranslation.categoryLabelFa}
                      </span>
                      <span
                        dir="ltr"
                        className="text-xs font-mono text-slate-500"
                      >
                        {activeNodeSpec.id}
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-extrabold text-slate-900">
                      {activeNodeTranslation.titleFa}
                    </h4>
                  </div>

                  {/* Layer A: Non-Technical Explanation */}
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/90 space-y-2">
                    <div className="text-xs font-extrabold text-emerald-900">
                      ۱. لایه غیرفنی (هدف و نحوه کارکرد به زبان ساده):
                    </div>
                    <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed">
                      <strong>هدف: </strong>
                      {activeNodeTranslation.nonTechnicalPurposeFa}
                    </p>
                    <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed">
                      <strong>چطور کار می‌کند: </strong>
                      {activeNodeTranslation.nonTechnicalHowItWorksFa}
                    </p>
                  </div>

                  {/* Layer B: Technical Deep-Dive */}
                  <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/90 space-y-2">
                    <div className="text-xs font-extrabold text-indigo-900">
                      ۲. لایه معماری فنی و مکانیزم ضدخطا:
                    </div>
                    <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed">
                      <strong>معماری فنی: </strong>
                      {activeNodeTranslation.technicalArchitectureFa}
                    </p>
                    <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed">
                      <strong>مکانیزم مهار خطا و Fallback: </strong>
                      {activeNodeTranslation.errorPreventionMechanismFa}
                    </p>
                  </div>

                  {/* Source Files & API Contracts directly from ARCHITECTURE_NODES */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileCode2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>فایل‌های سورس مرتبط در مخزن:</span>
                      </div>
                      <ul
                        dir="ltr"
                        className="space-y-1 text-[11px] font-mono text-slate-700 text-left"
                      >
                        {activeNodeSpec.technical.sourceFiles.map((file) => (
                          <li
                            key={file}
                            className="bg-slate-50 px-2 py-1 rounded border border-slate-200/70 break-all"
                          >
                            {file}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                        <span>قراردادهای API و توابع کلیدی:</span>
                      </div>
                      <ul
                        dir="ltr"
                        className="space-y-1 text-[11px] font-mono text-slate-700 text-left"
                      >
                        {activeNodeSpec.technical.apiContracts.map((c) => (
                          <li
                            key={c}
                            className="bg-slate-50 px-2 py-1 rounded border border-slate-200/70 break-all"
                          >
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Complete Core & Infrastructure Modules Matrix */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
              <div className="space-y-1 border-b border-slate-100 pb-4">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  جدول ارتباط بین ماژول‌های هسته (`src/core`) و زیرساخت (`src/infrastructure`)
                </h3>
                <p className="text-xs text-slate-500">
                  نحوه تفکیک وظایف، ارتباط ماژول‌ها با یکدیگر و استراتژی بازیابی
                  خطا در هر لایه:
                </p>
              </div>

              <div className="space-y-4">
                {filteredCoreModules.map((mod) => (
                  <div
                    key={mod.id}
                    className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          dir="ltr"
                          className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-900 text-[11px] font-mono font-bold"
                        >
                          {mod.layer}
                        </span>
                        <h4
                          dir="ltr"
                          className="text-sm font-mono font-extrabold text-slate-900"
                        >
                          {mod.moduleName}
                        </h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                        <div className="font-bold text-slate-900">
                          وظیفه و مسئولیت اصلی:
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          {mod.responsibilityFa}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                        <div className="font-bold text-blue-900">
                          ارتباط با سایر ماژول‌ها:
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          {mod.interactionWithOtherModulesFa}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                        <div className="font-bold text-emerald-900">
                          مکانیزم مهار خطا (Fault Tolerance):
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          {mod.failureRecoveryFa}
                        </p>
                      </div>
                    </div>

                    <div
                      dir="ltr"
                      className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-mono text-slate-600"
                    >
                      {mod.sourceFiles.map((sf) => (
                        <span
                          key={sf}
                          className="px-2 py-0.5 rounded bg-slate-200/70 border border-slate-300/70"
                        >
                          {sf}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live API Route Contracts Table (Auto-Verified Against src/app/api) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    کاتالوگ کامل مسیرهای API سرور ({filteredApiRoutes.length} از{' '}
                    {snapshot.documentedApiRoutes.length} مسیر)
                  </h3>
                  <p className="text-xs text-slate-500">
                    این جدول با تست خودکار Vitest به پوشه `src/app/api` قفل شده
                    است؛ هر مسیر جدیدی که به کد اضافه شود باید در این جدول مستند
                    گردد.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {filteredApiRoutes.map((route) => (
                  <div
                    key={route.sourceFile}
                    className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div dir="ltr" className="flex items-center gap-2">
                        <span className="font-mono text-sm font-extrabold text-blue-700">
                          {route.endpoint}
                        </span>
                        <div className="flex items-center gap-1">
                          {route.methods.map((m) => (
                            <span
                              key={m}
                              className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] font-bold"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div dir="ltr" className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-800 font-mono text-[11px]">
                          Zone: {route.zoneScope}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {route.sourceFile}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                        <div className="font-bold text-emerald-800 mb-1">
                          توضیح ساده (غیرفنی):
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          {route.nonTechnicalSummaryFa}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                        <div className="font-bold text-indigo-800 mb-1">
                          مشخصات فنی و معماری:
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          {route.technicalSummaryFa}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                        <div className="font-bold text-amber-800 mb-1">
                          سپر امنیتی و ضدخطا:
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          {route.errorProtectionFa}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
