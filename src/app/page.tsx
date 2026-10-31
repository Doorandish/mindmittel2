'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Layers,
  Cpu,
  ArrowUpRight,
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
  PlusCircle,
  Trash2,
  Play,
  Sparkles,
  Check,
  XCircle,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  getDictionary,
  DEFAULT_LOCALE,
  type SupportedLocale,
} from '@/i18n/dictionaries';
import { inferProfileFromQuery } from '@/core/ai/modelRanking';
import type { ExecutiveAuditReport } from '@/core/audit/decisionEvaluator';

interface StoredBrainDocumentSummary {
  parentId: string;
  title: string;
  department: string;
  sourceType: string;
  tags: string[];
  contentPreview: string;
  childCount: number;
}

const QUICK_DECISION_PRESETS = [
  {
    labelEn: 'Test Conflict: Cancel Daily Scrum Standups',
    labelDe: 'Konflikt-Test: Tägliche Scrum-Standups abschaffen',
    proposalEn:
      'We want to cancel all mandatory daily Scrum standup meetings in the engineering team to save time.',
    proposalDe:
      'Wir möchten die täglichen verpflichtenden Scrum-Standup-Meetings im Engineering-Team komplett abschaffen.',
    dept: 'engineering',
  },
  {
    labelEn: 'Test Conflict: €18,000 Unbudgeted Vendor Contract',
    labelDe: 'Konflikt-Test: 18.000 € ungeplanter Lieferantenvertrag',
    proposalEn:
      'Approve an €18,000 unbudgeted software vendor contract immediately without CFO or Supervisory Board sign-off.',
    proposalDe:
      'Einen ungeplanten Software-Lieferantenvertrag über 18.000 € sofort ohne CFO- oder Vorstands-Genehmigung freigeben.',
    dept: 'finance-legal',
  },
  {
    labelEn: 'Test Aligned: €6,500 Budgeted Engineering Tool',
    labelDe: 'Konform-Test: 6.500 € budgetiertes Engineering-Tool',
    proposalEn:
      'Approve a €6,500 budgeted vendor tool renewal within the standard department head threshold with signed GDPR DPA.',
    proposalDe:
      'Freigabe eines budgetierten Software-Vertrags über 6.500 € im Rahmen der Abteilungsleiter-Grenze inklusive DSGVO-Vertrag.',
    dept: 'all',
  },
];

export default function HomePage() {
  const [locale, setLocale] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [activeTab, setActiveTab] = useState<'overview' | 'vault'>('overview');

  // Phase 1 State: Company Brain Documents & Injection Form
  const [documents, setDocuments] = useState<StoredBrainDocumentSummary[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(false);
  const [docTitle, setDocTitle] = useState<string>('');
  const [docDepartment, setDocDepartment] = useState<string>('Finance & Legal');
  const [docSourceType, setDocSourceType] = useState<'upload' | 'slack'>(
    'upload'
  );
  const [docTags, setDocTags] = useState<string>('policy, approval, budget');
  const [docContent, setDocContent] = useState<string>('');
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestFeedback, setIngestFeedback] = useState<string | null>(null);

  // Phase 2 State: Decision Audit Proposal & Live Report
  const [decisionProposal, setDecisionProposal] = useState<string>(
    QUICK_DECISION_PRESETS[0].proposalEn
  );
  const [auditDepartmentFilter, setAuditDepartmentFilter] =
    useState<string>('all');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditReport, setAuditReport] = useState<ExecutiveAuditReport | null>(
    null
  );
  const [auditError, setAuditError] = useState<string | null>(null);

  const dict = getDictionary(locale);
  const inferredProfile = inferProfileFromQuery(decisionProposal);

  async function fetchBrainDocuments() {
    setIsLoadingDocs(true);
    try {
      const res = await fetch('/api/brain/documents');
      const data = await res.json();
      if (data.ok && Array.isArray(data.documents)) {
        setDocuments(data.documents);
      }
    } catch {
      // Ignore network error on initial load
    } finally {
      setIsLoadingDocs(false);
    }
  }

  useEffect(() => {
    fetchBrainDocuments();
  }, []);

  function openLiveWorkspace() {
    setActiveTab('vault');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleInjectDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim()) return;

    setIsIngesting(true);
    setIngestFeedback(null);

    try {
      const parsedTags = docTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/brain/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: docTitle,
          content: docContent,
          department: docDepartment,
          sourceType: docSourceType,
          tags: parsedTags,
          language: locale,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setDocuments(data.documents ?? []);
        setDocTitle('');
        setDocContent('');
        setIngestFeedback(
          locale === 'de'
            ? `✓ Gespeichert im Company Brain: ${data.ingestion.parentCount} Parent-Dokument & ${data.ingestion.childVectorCount} Child-Vektoren (768-d)`
            : `✓ Injected into Company Brain: ${data.ingestion.parentCount} Parent chunk & ${data.ingestion.childVectorCount} Child vectors (768-d)`
        );
      }
    } finally {
      setIsIngesting(false);
    }
  }

  async function handleDeleteDocument(parentId: string) {
    const res = await fetch(
      `/api/brain/documents?parentId=${encodeURIComponent(parentId)}`,
      { method: 'DELETE' }
    );
    const data = await res.json();
    if (data.ok) {
      setDocuments(data.documents ?? []);
    }
  }

  async function handleRunExecutiveAudit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!decisionProposal.trim()) return;

    setIsAuditing(true);
    setAuditError(null);

    try {
      const res = await fetch('/api/brain/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisionProposal,
          departmentFilter: auditDepartmentFilter,
          locale,
        }),
      });

      const data = await res.json();
      if (data.ok && data.report) {
        setAuditReport(data.report);
      } else {
        setAuditError(data.error ?? 'Audit failed');
      }
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsAuditing(false);
    }
  }

  return (
    <AppShell
      locale={locale}
      onLocaleChange={setLocale}
      dict={dict}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* VIEW 1: V1-INSPIRED CRISP ENTERPRISE LANDING PAGE (Synchronized with V2 Features) */}
      {activeTab === 'overview' && (
        <div className="space-y-24 pb-20">
          {/* SECTION 1: HERO WITH MACOS AUDIT ENGINE MOCKUP WINDOW */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
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

                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
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

          {/* SECTION 3: HOW IT WORKS IN 3 STEPS */}
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

          {/* SECTION 4: 4 KEY ENTERPRISE FEATURES */}
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

      {/* VIEW 2: OPERATIONAL 2-PHASE COMPANY BRAIN & EXECUTIVE AUDIT WORKSPACE */}
      {activeTab === 'vault' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
          {/* Top Workspace Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 md:p-8 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                <BrainCircuit className="w-4 h-4" />
                <span>LIVE 2-PHASE GOVERNANCE ENGINE</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                {dict.ragSection.title}
              </h1>
              <p className="text-sm text-slate-600 max-w-2xl">
                {dict.ragSection.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                ● {documents.length} Active Parent Policies in Brain
              </span>
            </div>
          </div>

          {/* TWO-COLUMN OPERATIONAL WORKSPACE: PHASE 1 (LEFT) & PHASE 2 (RIGHT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT 5 COLUMNS — PHASE 1: INJECT KNOWLEDGE INTO COMPANY BRAIN */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 md:p-7 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-600 uppercase">
                      PHASE 1 — INJECT KNOWLEDGE
                    </span>
                    <h2 className="text-lg md:text-xl font-extrabold text-slate-900 mt-0.5">
                      {locale === 'de'
                        ? 'Richtlinie ins Company Brain einspeisen'
                        : 'Add Policy or Note to Company Brain'}
                    </h2>
                  </div>
                  <PlusCircle className="w-6 h-6 text-blue-600" />
                </div>

                <form onSubmit={handleInjectDocument} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {locale === 'de'
                        ? 'Dokumenttitel / Richtlinie'
                        : 'Document / Policy Title'}
                    </label>
                    <input
                      type="text"
                      required
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder={
                        locale === 'de'
                          ? 'z. B. Homeoffice & IT-Sicherheitsrichtlinie 2026'
                          : 'e.g., Remote Work & Vendor Security Policy 2026'
                      }
                      className="w-full px-4 py-2.5 text-sm liquid-glass-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {locale === 'de' ? 'Abteilung' : 'Department'}
                      </label>
                      <select
                        value={docDepartment}
                        onChange={(e) => setDocDepartment(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm liquid-glass-input"
                      >
                        <option value="Finance & Legal">Finance & Legal</option>
                        <option value="Engineering">Engineering</option>
                        <option value="HR & Legal">HR & Legal</option>
                        <option value="Executive Board">Executive Board</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {locale === 'de' ? 'Quelle' : 'Source Connector'}
                      </label>
                      <select
                        value={docSourceType}
                        onChange={(e) =>
                          setDocSourceType(
                            e.target.value as 'upload' | 'slack'
                          )
                        }
                        className="w-full px-3 py-2.5 text-sm liquid-glass-input"
                      >
                        <option value="upload">Official Policy Upload</option>
                        <option value="slack">Slack #gov-council</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {locale === 'de'
                        ? 'Themen-Tags (kommagetrennt)'
                        : 'Metadata Tags (comma-separated)'}
                    </label>
                    <input
                      type="text"
                      value={docTags}
                      onChange={(e) => setDocTags(e.target.value)}
                      className="w-full px-4 py-2 text-xs font-mono liquid-glass-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {locale === 'de'
                        ? 'Richtlinien-Inhalt (wird in Parent- & Child-Vektoren zerlegt)'
                        : 'Policy Content (auto-sliced into Parent & 768-d Child Vectors)'}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={docContent}
                      onChange={(e) => setDocContent(e.target.value)}
                      placeholder={
                        locale === 'de'
                          ? 'Geben Sie hier die verbindliche Unternehmensregel oder das Vorstandsprotokoll ein...'
                          : 'Paste the corporate rule, board resolution, or department guideline here...'
                      }
                      className="w-full p-3.5 text-sm liquid-glass-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isIngesting}
                    className="w-full py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Database className="w-4 h-4" />
                    <span>
                      {isIngesting
                        ? 'Slicing & Embedding (768-d)...'
                        : locale === 'de'
                        ? 'Ins Company Brain einspeisen'
                        : 'Inject into Company Brain'}
                    </span>
                  </button>

                  {ingestFeedback && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-semibold text-emerald-800">
                      {ingestFeedback}
                    </div>
                  )}
                </form>
              </div>

              {/* Stored Company Brain Documents List */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>
                      {locale === 'de'
                        ? 'Aktive Dokumente im Company Brain'
                        : 'Stored Company Brain Vault'}
                    </span>
                  </h3>
                  <span className="text-xs font-mono text-slate-500">
                    {isLoadingDocs ? 'Loading...' : `${documents.length} docs`}
                  </span>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {documents.map((doc) => (
                    <div
                      key={doc.parentId}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-mono font-bold text-blue-700">
                            dept: {doc.department} · source: {doc.sourceType}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">
                            {doc.title}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.parentId)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Parent & Cascade Child Vectors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {doc.contentPreview}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono">
                        <div className="flex flex-wrap gap-1">
                          {doc.tags.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                          {doc.childCount} Child Vectors
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT 7 COLUMNS — PHASE 2: PROPOSE & AUDIT MANAGEMENT DECISIONS */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 md:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-600 uppercase">
                      PHASE 2 — DECISION AUDIT DASHBOARD
                    </span>
                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-0.5">
                      {locale === 'de'
                        ? 'Management-Entscheidung gegen Company Brain prüfen'
                        : 'Evaluate Management Decision Against Company Brain'}
                    </h2>
                  </div>
                </div>

                {/* One-Click Preset Scenarios for Instant Testing */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 block">
                    {locale === 'de'
                      ? 'Schnelltest-Szenarien (1-Klick):'
                      : 'Quick Audit Scenarios (1-Click Test):'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_DECISION_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setDecisionProposal(
                            locale === 'de'
                              ? preset.proposalDe
                              : preset.proposalEn
                          );
                          setAuditDepartmentFilter(preset.dept);
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-slate-700 transition-colors"
                      >
                        {locale === 'de' ? preset.labelDe : preset.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleRunExecutiveAudit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'de'
                        ? 'Entscheidungsvorlage oder strategischer Vorschlag'
                        : 'Proposed Management Decision or Policy Question'}
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={decisionProposal}
                      onChange={(e) => setDecisionProposal(e.target.value)}
                      placeholder={dict.ragSection.searchPlaceholder}
                      className="w-full p-4 text-sm md:text-base liquid-glass-input"
                    />
                  </div>

                  {/* Autonomous Model Routing & Department Filter Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs">
                    <div className="flex items-center gap-2 font-semibold text-blue-900">
                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        Auto-Routed Model Tier:{' '}
                        <strong className="font-mono">
                          {inferredProfile === 'reasoning'
                            ? 'Gemini Pro (Deep Audit)'
                            : 'Gemini Flash (Fast Lookup)'}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 font-semibold">
                        Scope:
                      </span>
                      <select
                        value={auditDepartmentFilter}
                        onChange={(e) =>
                          setAuditDepartmentFilter(e.target.value)
                        }
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-800 font-semibold"
                      >
                        <option value="all">All Departments</option>
                        <option value="finance-legal">Finance & Legal</option>
                        <option value="engineering">Engineering</option>
                        <option value="hr-legal">HR & Legal</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAuditing}
                    className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-blue-600 disabled:bg-slate-400 text-white font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>
                      {isAuditing
                        ? 'Cross-Examining Company Brain Vectors...'
                        : locale === 'de'
                        ? 'Executive Audit jetzt ausführen'
                        : 'Run Executive Governance Audit'}
                    </span>
                  </button>
                </form>

                {auditError && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-800 font-semibold">
                    {auditError}
                  </div>
                )}

                {/* LIVE CERTIFIED EXECUTIVE AUDIT REPORT CARD */}
                {auditReport && (
                  <div className="pt-4 border-t border-slate-200 space-y-6">
                    {/* Verdict Banner */}
                    <div
                      className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
                        auditReport.verdict === 'POLICY_CONFLICT'
                          ? 'bg-rose-50 border-rose-300 text-rose-950'
                          : auditReport.verdict === 'CONDITIONAL'
                          ? 'bg-amber-50 border-amber-300 text-amber-950'
                          : 'bg-emerald-50 border-emerald-400 text-emerald-950'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {auditReport.verdict === 'POLICY_CONFLICT' ? (
                          <XCircle className="w-8 h-8 text-rose-600 shrink-0" />
                        ) : auditReport.verdict === 'CONDITIONAL' ? (
                          <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                        )}
                        <div>
                          <div className="text-xs font-mono font-extrabold uppercase tracking-wider">
                            AUDIT VERDICT: {auditReport.verdict}
                          </div>
                          <div className="text-base md:text-lg font-extrabold">
                            {auditReport.executiveSummary}
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-2xl font-extrabold">
                          {auditReport.alignmentScore}%
                        </div>
                        <div className="text-[11px] opacity-80">
                          Policy Alignment
                        </div>
                      </div>
                    </div>

                    {/* Strategic Evaluation */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                        <span>I. STRATEGIC POLICY EVALUATION</span>
                        <span>Model: {auditReport.selectedModelId}</span>
                      </div>
                      <p className="text-sm text-slate-800 leading-relaxed font-medium">
                        {auditReport.strategicEvaluation}
                      </p>
                    </div>

                    {/* Pros & Cons Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                        <div className="text-xs font-mono font-bold text-emerald-800 uppercase">
                          Operational Advantages (Pros)
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700">
                          {auditReport.pros.map((pro, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-2">
                        <div className="text-xs font-mono font-bold text-rose-800 uppercase">
                          Governance Risks & Conflicts (Cons)
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700">
                          {auditReport.cons.map((con, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Actionable Roadmap */}
                    <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-2.5">
                      <div className="text-xs font-mono font-bold text-blue-800 uppercase">
                        II. RECOMMENDED GOVERNANCE ROADMAP
                      </div>
                      <ul className="space-y-2 text-xs md:text-sm text-slate-800 font-medium">
                        {auditReport.roadmap.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Cited Parent Documents from Company Brain */}
                    <div className="space-y-2.5">
                      <div className="text-xs font-mono font-bold text-slate-500 uppercase">
                        III. VERIFIED PARENT DOCUMENT CITATIONS (768-D VECTOR
                        MATCHES)
                      </div>
                      <div className="space-y-2">
                        {auditReport.citations.map((cit) => (
                          <div
                            key={cit.parentId}
                            className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span>{cit.title}</span>
                              <span className="font-mono text-blue-600">
                                dept: {cit.department} · match:{' '}
                                {Math.round(cit.similarityScore * 100)}%
                              </span>
                            </div>
                            <p className="text-slate-600 italic">
                              &ldquo;{cit.matchedChildSnippet}&rdquo;
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
