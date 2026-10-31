'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  Trash2,
  Play,
  Sparkles,
  Check,
  XCircle,
  Upload,
  Mic,
  Square,
  FileAudio,
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
    labelEn: 'Conflict: Cancel Daily Standups',
    labelDe: 'Konflikt: Tägliche Standups abschaffen',
    proposalEn:
      'We want to cancel all mandatory daily Scrum standup meetings in the engineering team to save time.',
    proposalDe:
      'Wir möchten die täglichen verpflichtenden Scrum-Standup-Meetings im Engineering-Team komplett abschaffen.',
    dept: 'engineering',
  },
  {
    labelEn: 'Conflict: €18,000 Unbudgeted Contract',
    labelDe: 'Konflikt: 18.000 € ungeplanter Vertrag',
    proposalEn:
      'Approve an €18,000 unbudgeted software vendor contract immediately without CFO or Supervisory Board sign-off.',
    proposalDe:
      'Einen ungeplanten Software-Lieferantenvertrag über 18.000 € sofort ohne CFO- oder Vorstands-Genehmigung freigeben.',
    dept: 'finance-legal',
  },
  {
    labelEn: 'Aligned: €6,500 Budgeted Tool',
    labelDe: 'Konform: 6.500 € budgetiertes Tool',
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

  // Inside Workspace Sub-Tabs: 'evaluate' (Default) vs 'brain' (Knowledge Ingestion)
  const [workspaceSubTab, setWorkspaceSubTab] = useState<'evaluate' | 'brain'>(
    'evaluate'
  );

  // Company Brain Documents & Multimodal Ingestion State
  const [documents, setDocuments] = useState<StoredBrainDocumentSummary[]>([]);
  const [docTitle, setDocTitle] = useState<string>('');
  const [docDepartment, setDocDepartment] = useState<string>('Finance & Legal');
  const [docSourceType, setDocSourceType] = useState<'upload' | 'slack'>(
    'upload'
  );
  const [docTags, setDocTags] = useState<string>('policy, approval, budget');
  const [docContent, setDocContent] = useState<string>('');
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestFeedback, setIngestFeedback] = useState<string | null>(null);

  // Multimodal File Upload & Live Voice Recording State
  const [inputMode, setInputMode] = useState<'text' | 'file' | 'voice'>('text');
  const [isExtractingMedia, setIsExtractingMedia] = useState<boolean>(false);
  const [extractionStatus, setExtractionStatus] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  // Decision Audit State
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
    try {
      const res = await fetch('/api/brain/documents');
      const data = await res.json();
      if (data.ok && Array.isArray(data.documents)) {
        setDocuments(data.documents);
      }
    } catch {
      // Ignore network error on initial load
    }
  }

  useEffect(() => {
    fetchBrainDocuments();
  }, []);

  function openLiveWorkspace(initialSubTab: 'evaluate' | 'brain' = 'evaluate') {
    setWorkspaceSubTab(initialSubTab);
    setActiveTab('vault');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleMultimodalFileUpload(
    file: File,
    sourceLabel = 'file'
  ): Promise<void> {
    setIsExtractingMedia(true);
    setExtractionStatus(
      locale === 'de'
        ? `Verarbeite & transkribiere ${file.name}...`
        : `Processing & transcribing ${file.name}...`
    );

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/brain/extract', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.ok && data.extractedText) {
        setDocContent(data.extractedText);
        if (!docTitle.trim() && data.suggestedTitle) {
          setDocTitle(data.suggestedTitle);
        }
        setExtractionStatus(
          locale === 'de'
            ? `✓ Erfolgreich in verarbeitbaren Text umgewandelt (${data.category.toUpperCase()})`
            : `✓ Converted ${sourceLabel} into structured text (${data.category.toUpperCase()})`
        );
      } else {
        setExtractionStatus(data.error ?? 'Extraction failed');
      }
    } catch (err) {
      setExtractionStatus(
        err instanceof Error ? err.message : 'Upload processing error'
      );
    } finally {
      setIsExtractingMedia(false);
    }
  }

  async function startLiveVoiceRecording() {
    setExtractionStatus(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(recordedChunksRef.current, {
          type: 'audio/webm',
        });
        stream.getTracks().forEach((track) => track.stop());
        const audioFile = new File(
          [audioBlob],
          `Voice_Note_${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.webm`,
          { type: 'audio/webm' }
        );
        await handleMultimodalFileUpload(audioFile, 'live voice recording');
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      // Fallback if microphone permission is denied or unavailable
      setExtractionStatus(
        locale === 'de'
          ? 'Mikrofonzugriff nicht verfügbar. Bitte laden Sie eine Audiodatei hoch.'
          : 'Microphone access unavailable in this browser context. Please upload an audio file instead.'
      );
    }
  }

  function stopLiveVoiceRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
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
        setExtractionStatus(null);
        setIngestFeedback(
          locale === 'de'
            ? `✓ Gespeichert (${data.ingestion.childVectorCount} Vektoren)`
            : `✓ Saved to Company Brain (${data.ingestion.childVectorCount} vectors)`
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
      {/* VIEW 1: V1-INSPIRED CRISP ENTERPRISE LANDING PAGE (Updated with Multimodal & Tabbed Workspace Capabilities) */}
      {activeTab === 'overview' && (
        <div className="space-y-24 pb-20">
          {/* SECTION 1: HERO WITH MACOS AUDIT ENGINE MOCKUP WINDOW */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-16">
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
                    onClick={() => openLiveWorkspace('evaluate')}
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
                        COMPANY BRAIN INGESTION
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>PDF / PPTX / Image OCR</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {dict.hero.mockupDoc1Sub}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                          <Mic className="w-3.5 h-3.5 text-rose-500" />
                          <span>Live Voice & Audio Transcription</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Auto-transcribed & sliced into 768-d vectors ✓
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
                          INSTANT DECISION AUDIT
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
                        Multimodal Input
                      </span>
                      <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800">
                        Text · PDF · PPTX · Image
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">
                        Audio & Voice
                      </span>
                      <div className="px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 font-semibold text-blue-700">
                        Live Mic & Transcription
                      </div>
                    </div>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                    <span className="font-medium">
                      Auto-Sliced into 768-d Vectors
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
                    <Mic className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-mono font-bold uppercase">
                    MULTIMODAL & VOICE
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {locale === 'de'
                    ? 'Multimodale Datei- & Sprach-Erfassung'
                    : 'Multimodal File & Live Voice Ingestion'}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {locale === 'de'
                    ? 'Erfassen Sie Text, PDFs, Bilder, PowerPoint-Folien oder Live-Sprachaufnahmen. Gemini transkribiert und konvertiert alles automatisch in durchsuchbare 768-d Vektoren.'
                    : 'Ingest plain text, PDFs, images, PowerPoint decks, audio files, or live microphone dictations—automatically transcribed and indexed into 768-d Company Brain vectors.'}
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
                  onClick={() => openLiveWorkspace('evaluate')}
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

      {/* VIEW 2: COMPACT ABOVE-THE-FOLD WORKSPACE WITH 2 DEDICATED TABS */}
      {activeTab === 'vault' && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
          {/* Compact Top Sub-Tab Switcher Bar (Fits Above the Fold) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setWorkspaceSubTab('evaluate')}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                  workspaceSubTab === 'evaluate'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {locale === 'de'
                    ? 'Entscheidung prüfen (Audit)'
                    : 'Evaluate Decision'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setWorkspaceSubTab('brain')}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                  workspaceSubTab === 'brain'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>
                  {locale === 'de'
                    ? `Company Brain verwalten (${documents.length})`
                    : `Company Brain (${documents.length})`}
                </span>
              </button>
            </div>

            <div className="text-xs font-mono text-slate-500 hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{documents.length} Active Policies Indexed</span>
            </div>
          </div>

          {/* SUB-TAB 1: EVALUATE DECISION (Compact Above-the-Fold Action Button) */}
          {workspaceSubTab === 'evaluate' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  {locale === 'de'
                    ? 'Management-Entscheidung gegen Company Brain prüfen'
                    : 'Evaluate Management Decision Against Company Brain'}
                </h1>

                <div className="flex flex-wrap gap-1.5">
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
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-slate-700 transition-colors"
                    >
                      {locale === 'de' ? preset.labelDe : preset.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleRunExecutiveAudit} className="space-y-3">
                <textarea
                  rows={3}
                  required
                  value={decisionProposal}
                  onChange={(e) => setDecisionProposal(e.target.value)}
                  placeholder={dict.ragSection.searchPlaceholder}
                  className="w-full p-3.5 text-sm sm:text-base liquid-glass-input"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 font-semibold text-blue-900">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        Auto-Routed:{' '}
                        <strong className="font-mono">
                          {inferredProfile === 'reasoning'
                            ? 'Gemini Pro'
                            : 'Gemini Flash'}
                        </strong>
                      </span>
                    </span>

                    <select
                      aria-label="Department Scope"
                      value={auditDepartmentFilter}
                      onChange={(e) => setAuditDepartmentFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 font-semibold"
                    >
                      <option value="all">Scope: All Departments</option>
                      <option value="finance-legal">Finance & Legal</option>
                      <option value="engineering">Engineering</option>
                      <option value="hr-legal">HR & Legal</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isAuditing}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>
                      {isAuditing
                        ? 'Evaluating...'
                        : locale === 'de'
                        ? 'Entscheidung jetzt prüfen'
                        : 'Run Executive Audit'}
                    </span>
                  </button>
                </div>
              </form>

              {auditError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold">
                  {auditError}
                </div>
              )}

              {/* LIVE CERTIFIED EXECUTIVE AUDIT REPORT CARD */}
              {auditReport && (
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div
                    className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
                      auditReport.verdict === 'POLICY_CONFLICT'
                        ? 'bg-rose-50 border-rose-300 text-rose-950'
                        : auditReport.verdict === 'CONDITIONAL'
                        ? 'bg-amber-50 border-amber-300 text-amber-950'
                        : 'bg-emerald-50 border-emerald-400 text-emerald-950'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {auditReport.verdict === 'POLICY_CONFLICT' ? (
                        <XCircle className="w-7 h-7 text-rose-600 shrink-0" />
                      ) : auditReport.verdict === 'CONDITIONAL' ? (
                        <AlertTriangle className="w-7 h-7 text-amber-600 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
                      )}
                      <div>
                        <div className="text-[11px] font-mono font-extrabold uppercase tracking-wider">
                          VERDICT: {auditReport.verdict} · MODEL:{' '}
                          {auditReport.selectedModelId}
                        </div>
                        <div className="text-sm sm:text-base font-extrabold">
                          {auditReport.executiveSummary}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-xl font-extrabold">
                        {auditReport.alignmentScore}%
                      </div>
                      <div className="text-[10px] opacity-80">Alignment</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed">
                    <strong className="block text-xs font-mono text-slate-500 uppercase mb-1">
                      Strategic Policy Cross-Examination
                    </strong>
                    {auditReport.strategicEvaluation}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-1.5">
                      <div className="text-xs font-mono font-bold text-emerald-800 uppercase">
                        Pros
                      </div>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {auditReport.pros.map((pro, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-1.5">
                      <div className="text-xs font-mono font-bold text-rose-800 uppercase">
                        Risks & Policy Conflicts
                      </div>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {auditReport.cons.map((con, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-1.5">
                      <div className="text-xs font-mono font-bold text-blue-800 uppercase">
                        Recommended Actionable Roadmap
                      </div>
                      <ul className="space-y-1 text-xs text-slate-800 font-medium">
                        {auditReport.roadmap.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="text-xs font-mono font-bold text-slate-600 uppercase">
                        Cited Company Brain Policies
                      </div>
                      <div className="space-y-1.5">
                        {auditReport.citations.map((cit) => (
                          <div
                            key={cit.parentId}
                            className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between gap-2"
                          >
                            <span className="font-bold text-slate-900 truncate">
                              {cit.title}
                            </span>
                            <span className="font-mono text-[11px] text-blue-600 shrink-0">
                              {cit.department} ·{' '}
                              {Math.round(cit.similarityScore * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 2: COMPANY BRAIN KNOWLEDGE MANAGEMENT (Multimodal Ingestion + Compact Summary List) */}
          {workspaceSubTab === 'brain' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 7 Columns: Compact Multimodal Knowledge Ingestion Form */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                    {locale === 'de'
                      ? 'Wissen ins Company Brain einspeisen'
                      : 'Add Knowledge to Company Brain'}
                  </h2>

                  {/* Multimodal Input Mode Selector: Text | File Upload | Live Voice */}
                  <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setInputMode('text')}
                      className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                        inputMode === 'text'
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Text</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInputMode('file')}
                      className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                        inputMode === 'file'
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>PDF / PPTX / Image / Audio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInputMode('voice')}
                      className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                        inputMode === 'voice'
                          ? 'bg-white text-rose-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Live Voice</span>
                    </button>
                  </div>
                </div>

                {/* Multimodal File Dropzone (PDF, Image, PPTX, Audio, TXT) */}
                {inputMode === 'file' && (
                  <div className="p-4 rounded-2xl bg-blue-50/50 border-2 border-dashed border-blue-300 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs text-slate-700">
                      <FileAudio className="w-6 h-6 text-blue-600 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900">
                          Upload PDF, PowerPoint (.pptx), Image, Audio (.mp3/.wav), or Text
                        </div>
                        <div className="text-slate-500">
                          Gemini Multimodal automatically extracts text or transcribes audio into the editor below.
                        </div>
                      </div>
                    </div>

                    <label className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shrink-0 transition-colors">
                      <span>{isExtractingMedia ? 'Processing...' : 'Choose File'}</span>
                      <input
                        type="file"
                        accept=".txt,.md,.csv,.json,.pdf,.png,.jpg,.jpeg,.webp,.ppt,.pptx,.mp3,.wav,.webm,.ogg,.m4a"
                        className="hidden"
                        onChange={(e) => {
                          const selected = e.target.files?.[0];
                          if (selected) {
                            handleMultimodalFileUpload(selected);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}

                {/* Live Microphone Voice Dictation Recorder */}
                {inputMode === 'voice' && (
                  <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-xs">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          isRecording
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-rose-100 text-rose-600'
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          {isRecording
                            ? 'Recording Live Voice Dictation...'
                            : 'Record Policy or Meeting Note by Voice'}
                        </div>
                        <div className="text-slate-600">
                          Audio is automatically transcribed into structured text for Company Brain indexing.
                        </div>
                      </div>
                    </div>

                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startLiveVoiceRecording}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Start Recording</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopLiveVoiceRecording}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Stop & Transcribe</span>
                      </button>
                    )}
                  </div>
                )}

                {extractionStatus && (
                  <div className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800">
                    {extractionStatus}
                  </div>
                )}

                <form onSubmit={handleInjectDocument} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      required
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder={
                        locale === 'de'
                          ? 'Dokumenttitel (z. B. IT-Richtlinie)'
                          : 'Document Title (e.g. IT Security Policy)'
                      }
                      className="sm:col-span-1 px-3.5 py-2 text-xs sm:text-sm liquid-glass-input"
                    />

                    <select
                      aria-label="Department"
                      value={docDepartment}
                      onChange={(e) => setDocDepartment(e.target.value)}
                      className="px-3 py-2 text-xs sm:text-sm liquid-glass-input"
                    >
                      <option value="Finance & Legal">Dept: Finance & Legal</option>
                      <option value="Engineering">Dept: Engineering</option>
                      <option value="HR & Legal">Dept: HR & Legal</option>
                      <option value="Executive Board">Dept: Executive Board</option>
                    </select>

                    <input
                      type="text"
                      value={docTags}
                      onChange={(e) => setDocTags(e.target.value)}
                      placeholder="Tags: policy, budget"
                      className="px-3.5 py-2 text-xs font-mono liquid-glass-input"
                    />
                  </div>

                  <textarea
                    rows={3}
                    required
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    placeholder={
                      locale === 'de'
                        ? 'Richtlinien-Text (oder Ergebnis aus Datei-Upload / Sprachaufnahme)...'
                        : 'Policy text or transcribed content (auto-sliced into Parent & 768-d Child vectors)...'
                    }
                    className="w-full p-3 text-xs sm:text-sm liquid-glass-input"
                  />

                  <div className="flex items-center justify-between gap-3">
                    {ingestFeedback ? (
                      <span className="text-xs font-bold text-emerald-700">
                        {ingestFeedback}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">
                        Auto-indexed in MongoDB Atlas (768-d vectors)
                      </span>
                    )}

                    <button
                      type="submit"
                      disabled={isIngesting || isExtractingMedia}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 shrink-0"
                    >
                      <Database className="w-4 h-4" />
                      <span>
                        {isIngesting
                          ? 'Saving...'
                          : locale === 'de'
                          ? 'Ins Company Brain speichern'
                          : 'Save to Company Brain'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right 5 Columns: Compact One-Line Summary List of Stored Documents */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>
                      {locale === 'de'
                        ? 'Gespeicherte Richtlinien'
                        : 'Indexed Brain Documents'}
                    </span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                    {documents.length}
                  </span>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {documents.map((doc) => (
                    <div
                      key={doc.parentId}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-2 hover:border-blue-300 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {doc.title}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                          <span>{doc.department}</span>
                          <span>·</span>
                          <span className="text-blue-600 font-semibold">
                            {doc.childCount} vectors
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.parentId)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
