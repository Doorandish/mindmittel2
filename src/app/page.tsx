'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  Loader2,
  History,
  Plug,
  UserCheck,
  KeyRound,
  RefreshCw,
  Video,
  BookOpen,
} from 'lucide-react';
import { AppShell, type WorkspaceSubTab } from '@/components/layout/AppShell';
import { SystemObservabilityPanel } from '@/components/system/SystemObservabilityPanel';
import {
  getDictionary,
  DEFAULT_LOCALE,
  type SupportedLocale,
} from '@/i18n/dictionaries';
import { inferProfileFromQuery } from '@/core/ai/modelRanking';
import type { ExecutiveAuditReport } from '@/core/audit/decisionEvaluator';
import type { EnterpriseConnectorItem } from '@/core/connectors/connectorRegistry';
import type { StoredAuditHistoryEntry } from '@/infrastructure/rag/brainRepository';

interface StoredBrainDocumentSummary {
  parentId: string;
  title: string;
  department: string;
  sourceType: string;
  tags: string[];
  contentPreview: string;
  childCount: number;
  createdByEmail?: string;
  createdByName?: string;
}

const AUDIT_PIPELINE_STEPS = [
  {
    id: 'intent',
    labelEn: 'Analyzing decision complexity & routing optimal Gemini model',
    labelDe: 'Entscheidungskomplexität analysieren & optimales Gemini-Modell wählen',
  },
  {
    id: 'embedding',
    labelEn: 'Generating 768-dimensional semantic embedding vector',
    labelDe: '768-dimensionalen semantischen Embedding-Vektor generieren',
  },
  {
    id: 'vector-search',
    labelEn: 'Searching Company Brain policies & Parent-Child vectors in MongoDB Atlas',
    labelDe: 'Company Brain Richtlinien & Parent-Child-Vektoren in MongoDB Atlas durchsuchen',
  },
  {
    id: 'synthesis',
    labelEn: 'Cross-examining governance rules, risks & synthesizing executive verdict',
    labelDe: 'Richtlinien-Abgleich, Risikoanalyse & Vorstands-Urteil erstellen',
  },
];

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

  // Inside Workspace Sub-Tabs: 'evaluate' | 'brain' | 'history' | 'connectors'
  const [workspaceSubTab, setWorkspaceSubTab] =
    useState<WorkspaceSubTab>('evaluate');

  // Email Authentication & Attribution State
  const [userEmail, setUserEmail] = useState<string>('amir@mindmittel.de');
  const [userFullName, setUserFullName] = useState<string>('Amir Doorandish');
  const [userDepartment, setUserDepartment] =
    useState<string>('Executive Board');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authEmailInput, setAuthEmailInput] = useState<string>(
    'amir@mindmittel.de'
  );
  const [authNameInput, setAuthNameInput] =
    useState<string>('Amir Doorandish');
  const [authDeptInput, setAuthDeptInput] =
    useState<string>('Executive Board');
  const [authFeedback, setAuthFeedback] = useState<string | null>(null);

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

  // Decision Audit & History Ledger State
  const [decisionProposal, setDecisionProposal] = useState<string>(
    QUICK_DECISION_PRESETS[0].proposalEn
  );
  const [auditDepartmentFilter, setAuditDepartmentFilter] =
    useState<string>('all');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditCompletedSteps, setAuditCompletedSteps] = useState<number>(0);
  const [showAuditChecklist, setShowAuditChecklist] = useState<boolean>(false);
  const [auditReport, setAuditReport] = useState<ExecutiveAuditReport | null>(
    null
  );
  const [lastAuditedByEmail, setLastAuditedByEmail] =
    useState<string>('amir@mindmittel.de');
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditHistory, setAuditHistory] = useState<StoredAuditHistoryEntry[]>(
    []
  );

  // Enterprise Connectors Hub State (Chat, Knowledge Management, Online Meetings)
  const [connectors, setConnectors] = useState<EnterpriseConnectorItem[]>([]);
  const [activeConfigConnectorId, setActiveConfigConnectorId] = useState<
    string | null
  >(null);
  const [connectorApiSecret, setConnectorApiSecret] = useState<string>('');
  const [connectorTargetScope, setConnectorTargetScope] = useState<string>('');
  const [connectorFeedback, setConnectorFeedback] = useState<string | null>(
    null
  );
  const [syncingConnectorId, setSyncingConnectorId] = useState<string | null>(
    null
  );

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

  async function fetchAuditHistory() {
    try {
      const res = await fetch('/api/brain/audit');
      const data = await res.json();
      if (data.ok && Array.isArray(data.history)) {
        setAuditHistory(data.history);
      }
    } catch {
      // Ignore network error on initial load
    }
  }

  async function fetchConnectors() {
    try {
      const res = await fetch('/api/connectors');
      const data = await res.json();
      if (data.ok && Array.isArray(data.connectors)) {
        setConnectors(data.connectors);
      }
    } catch {
      // Ignore network error on initial load
    }
  }

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('mindmittel_v2_user');
      if (saved) {
        const parsed = JSON.parse(saved) as {
          email?: string;
          fullName?: string;
          department?: string;
        };
        if (parsed.email) {
          setUserEmail(parsed.email);
          setAuthEmailInput(parsed.email);
        }
        if (parsed.fullName) {
          setUserFullName(parsed.fullName);
          setAuthNameInput(parsed.fullName);
        }
        if (parsed.department) {
          setUserDepartment(parsed.department);
          setAuthDeptInput(parsed.department);
        }
      }
      const params = new URLSearchParams(window.location.search);
      const requestedTab = params.get('tab');
      if (
        requestedTab === 'evaluate' ||
        requestedTab === 'brain' ||
        requestedTab === 'connectors' ||
        requestedTab === 'system'
      ) {
        setActiveTab('vault');
        setWorkspaceSubTab(requestedTab);
      }
    } catch {
      // Ignore storage access errors
    }

    fetchBrainDocuments();
    fetchAuditHistory();
    fetchConnectors();
  }, []);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setAuthFeedback(null);

    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmailInput,
          fullName: authNameInput,
          department: authDeptInput,
        }),
      });
      const data = await res.json();

      if (data.ok && data.user) {
        setUserEmail(data.user.email);
        setUserFullName(data.user.fullName);
        setUserDepartment(data.user.department);
        try {
          window.localStorage.setItem(
            'mindmittel_v2_user',
            JSON.stringify(data.user)
          );
        } catch {
          // Ignore storage error
        }
        setShowAuthModal(false);
      } else {
        setAuthFeedback(data.error ?? 'Invalid email');
      }
    } catch (err) {
      setAuthFeedback(
        err instanceof Error ? err.message : 'Authentication error'
      );
    }
  }

  function openLiveWorkspace(initialSubTab: WorkspaceSubTab = 'evaluate') {
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
          createdByEmail: userEmail,
          createdByName: userFullName,
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
            ? `✓ Gespeichert von ${userEmail} (${data.ingestion.childVectorCount} Vektoren)`
            : `✓ Saved by ${userEmail} (${data.ingestion.childVectorCount} vectors)`
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
    setAuditReport(null);
    setShowAuditChecklist(true);
    setAuditCompletedSteps(0);

    const stepTimers = [
      setTimeout(() => setAuditCompletedSteps(1), 220),
      setTimeout(() => setAuditCompletedSteps(2), 550),
      setTimeout(() => setAuditCompletedSteps(3), 900),
    ];

    try {
      const res = await fetch('/api/brain/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisionProposal,
          departmentFilter: auditDepartmentFilter,
          locale,
          auditedByEmail: userEmail,
          auditedByName: userFullName,
        }),
      });

      const data = await res.json();
      stepTimers.forEach((timer) => clearTimeout(timer));

      // Sequentially check off any remaining steps so the user sees every task ticked
      setAuditCompletedSteps(AUDIT_PIPELINE_STEPS.length);

      if (data.ok && data.report) {
        setAuditReport(data.report);
        setLastAuditedByEmail(
          data.entry?.auditedByEmail ?? userEmail
        );
        if (Array.isArray(data.history)) {
          setAuditHistory(data.history);
        }
      } else {
        setAuditError(data.error ?? 'Audit failed');
      }
    } catch (err) {
      stepTimers.forEach((timer) => clearTimeout(timer));
      setAuditError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsAuditing(false);
    }
  }

  async function handleDeleteAuditHistory(auditId: string) {
    const res = await fetch(
      `/api/brain/audit?auditId=${encodeURIComponent(auditId)}`,
      { method: 'DELETE' }
    );
    const data = await res.json();
    if (data.ok && Array.isArray(data.history)) {
      setAuditHistory(data.history);
    }
  }

  async function handleToggleConnector(connector: EnterpriseConnectorItem) {
    setConnectorFeedback(null);
    const nextEnabled = !connector.enabled;

    // If user tries to switch ON an unconfigured connector, open its credential form directly
    if (nextEnabled && !connector.configured) {
      setActiveConfigConnectorId(connector.id);
      setConnectorTargetScope(connector.targetScope);
      setConnectorFeedback(
        locale === 'de'
          ? `Bitte geben Sie zuerst den API-Schlüssel für ${connector.name} ein, um den Schalter zu aktivieren.`
          : `Please enter authentication credentials for ${connector.name} below to switch it ON.`
      );
      return;
    }

    const res = await fetch('/api/connectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'toggle',
        connectorId: connector.id,
        enabled: nextEnabled,
        userEmail,
      }),
    });
    const data = await res.json();
    if (data.ok && Array.isArray(data.connectors)) {
      setConnectors(data.connectors);
    } else if (data.error) {
      setConnectorFeedback(data.error);
    }
  }

  async function handleConfigureConnector(
    e: React.FormEvent,
    connectorId: string
  ) {
    e.preventDefault();
    setConnectorFeedback(null);

    const res = await fetch('/api/connectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'configure',
        connectorId,
        apiSecret: connectorApiSecret,
        targetScope: connectorTargetScope,
        userEmail,
      }),
    });
    const data = await res.json();
    if (data.ok && Array.isArray(data.connectors)) {
      setConnectors(data.connectors);
      setActiveConfigConnectorId(null);
      setConnectorApiSecret('');
      setConnectorFeedback(
        locale === 'de'
          ? '✓ Zugangsdaten gespeichert & Connector aktiviert'
          : '✓ Credentials verified & connector switched ON'
      );
    } else {
      setConnectorFeedback(data.error ?? 'Failed to configure connector');
    }
  }

  async function handleSyncConnector(connectorId: string) {
    setSyncingConnectorId(connectorId);
    setConnectorFeedback(null);

    try {
      const res = await fetch('/api/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          connectorId,
          userEmail,
          userName: userFullName,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        if (Array.isArray(data.connectors)) {
          setConnectors(data.connectors);
        }
        if (Array.isArray(data.documents)) {
          setDocuments(data.documents);
        }
        setConnectorFeedback(
          locale === 'de'
            ? `✓ Synchronisiert: "${data.syncedTitle}" (${data.childVectorCount} Vektoren)`
            : `✓ Synced into Company Brain: "${data.syncedTitle}" (${data.childVectorCount} vectors)`
        );
      } else {
        setConnectorFeedback(data.error ?? 'Sync failed');
      }
    } finally {
      setSyncingConnectorId(null);
    }
  }

  return (
    <AppShell
      locale={locale}
      onLocaleChange={setLocale}
      dict={dict}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      workspaceSubTab={workspaceSubTab}
      onWorkspaceSubTabChange={setWorkspaceSubTab}
      currentUserEmail={userEmail}
      currentUserName={userFullName}
      currentUserDepartment={userDepartment}
      brainCount={documents.length}
      auditHistoryCount={auditHistory.length}
      enabledConnectorsCount={connectors.filter((c) => c.enabled).length}
      totalConnectorsCount={connectors.length || 7}
      onOpenAuthModal={() => setShowAuthModal(true)}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                    <Plug className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-[11px] font-mono font-bold uppercase">
                    CONNECTORS HUB
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {locale === 'de'
                    ? 'Enterprise Connectors (iOS-Schalter)'
                    : 'iOS-Toggle Enterprise Connectors'}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {locale === 'de'
                    ? 'Verbinden Sie Slack, MS Teams, Confluence, Notion, Google Drive, Zoom und Google Meet per API-Token und schalten Sie Datenquellen jederzeit ein oder aus.'
                    : 'Connect corporate chat (Slack, Teams), knowledge bases (Confluence, Notion, Drive), and online meetings (Zoom, Meet) with credential-gated iOS toggle switches.'}
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-[11px] font-mono font-bold uppercase">
                    EMAIL AUTH & LEDGER
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {locale === 'de'
                    ? 'E-Mail-Zuordnung & Audit-Archiv'
                    : 'Email Attribution & Audit History'}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {locale === 'de'
                    ? 'Jedes eingespeiste Dokument und jeder Audit-Bericht wird der E-Mail des Nutzers zugeordnet und im verwaltbaren Audit-Verlauf gespeichert.'
                    : 'Track exactly which executive email added each policy or requested each decision audit, backed by a searchable and deletable Audit History Ledger.'}
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
                    <button
                      type="button"
                      onClick={() => openLiveWorkspace('system')}
                      className="hover:text-blue-600 text-left"
                    >
                      Interactive System Topology (/system)
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => openLiveWorkspace('system')}
                      className="hover:text-blue-600 text-left"
                    >
                      Live SSE Telemetry Stream
                    </button>
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

      {/* EMAIL AUTHENTICATION & ATTRIBUTION MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    {locale === 'de'
                      ? 'E-Mail-Authentifizierung'
                      : 'Corporate Email Authentication'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {locale === 'de'
                      ? 'Jeder Eintrag & jedes Audit wird Ihrer E-Mail zugeordnet.'
                      : 'Every ingested document & audit report is attributed to your email.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEmailSignIn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Corporate Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={authEmailInput}
                  onChange={(e) => setAuthEmailInput(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3.5 py-2.5 text-sm liquid-glass-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={authNameInput}
                  onChange={(e) => setAuthNameInput(e.target.value)}
                  placeholder="Amir Doorandish"
                  className="w-full px-3.5 py-2.5 text-sm liquid-glass-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department / Role
                </label>
                <select
                  value={authDeptInput}
                  onChange={(e) => setAuthDeptInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm liquid-glass-input"
                >
                  <option value="Executive Board">Executive Board</option>
                  <option value="Finance & Legal">Finance & Legal</option>
                  <option value="Engineering">Engineering</option>
                  <option value="HR & Legal">HR & Legal</option>
                </select>
              </div>

              {authFeedback && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                  {authFeedback}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm"
                >
                  Save & Authenticate Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 2: LEFT-SIDEBAR WORKSPACE CANVAS (Evaluate Decision + Stacked Audit History, Company Brain, Connectors) */}
      {activeTab === 'vault' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
          {/* Mobile-Only Compact User Identity Bar (Desktop uses the Left Sidebar) */}
          <div className="md:hidden bg-white rounded-xl border border-slate-200/85 px-3.5 py-2.5 flex items-center justify-between gap-3">
            <span className="text-xs font-mono text-slate-700 truncate">
              Signed in: <strong>{userEmail}</strong>
            </span>
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="text-xs font-semibold text-blue-600 underline shrink-0"
            >
              Switch Profile
            </button>
          </div>

          {/* SECTION 1: EVALUATE DECISION (Input Form on Top + Previous Audit Reports Stacked Directly Below) */}
          {workspaceSubTab === 'evaluate' && (
            <div className="space-y-5">
              {/* Top Card: Decision Proposal Input + Live Pipeline Checklist + Active Audit Report */}
              <div className="bg-white rounded-xl border border-slate-200/85 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h1 className="text-[16px] sm:text-[17px] font-semibold tracking-[-0.02em] text-slate-900">
                      {locale === 'de'
                        ? 'Management-Entscheidung gegen Company Brain prüfen'
                        : 'Evaluate Management Decision Against Company Brain'}
                    </h1>
                    <p className="text-[12.5px] text-slate-500 mt-0.5">
                      {locale === 'de'
                        ? 'Prüft Ihr Vorhaben in Echtzeit gegen gespeicherte Unternehmensrichtlinien.'
                        : 'Cross-examine proposed leadership actions against indexed company policies.'}
                    </p>
                  </div>

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
                        className="px-2.5 py-1 rounded-md text-[11.5px] font-medium bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/80 text-slate-700 transition-colors"
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
                    className="w-full p-3 text-[13.5px] leading-relaxed liquid-glass-input"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2.5 text-[12px]">
                      <span className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md bg-slate-100 border border-slate-200/80 font-medium text-slate-700">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          Auto-Routed:{' '}
                          <strong className="font-mono font-semibold text-slate-900">
                            {inferredProfile === 'reasoning'
                              ? 'Gemini Pro'
                              : 'Gemini Flash'}
                          </strong>
                        </span>
                      </span>

                      <select
                        aria-label="Department Scope"
                        value={auditDepartmentFilter}
                        onChange={(e) =>
                          setAuditDepartmentFilter(e.target.value)
                        }
                        className="h-8 px-2.5 rounded-md bg-white border border-slate-200/90 text-slate-700 font-medium text-[12px]"
                      >
                        <option value="all">Scope: All Departments</option>
                        <option value="finance-legal">Finance & Legal</option>
                        <option value="engineering">Engineering</option>
                        <option value="hr-legal">HR & Legal</option>
                      </select>

                      <span className="text-slate-400 font-mono text-[11.5px] hidden sm:inline">
                        Auditor: {userEmail}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isAuditing}
                      className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium text-[13px] shadow-sm transition-colors flex items-center gap-2"
                    >
                      {isAuditing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                      <span>
                        {isAuditing
                          ? locale === 'de'
                            ? 'Prüfung läuft...'
                            : 'Evaluating Decision...'
                          : locale === 'de'
                          ? 'Entscheidung jetzt prüfen'
                          : 'Run Executive Audit'}
                      </span>
                    </button>
                  </div>
                </form>

                {/* LIVE STEP-BY-STEP AUDIT PIPELINE PROGRESS CHECKLIST */}
                {showAuditChecklist && (
                  <div className="p-3.5 rounded-lg bg-slate-50/90 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-slate-600">
                      <span>
                        {locale === 'de'
                          ? 'Live-Audit-Pipeline'
                          : 'Live Audit Execution Pipeline'}
                      </span>
                      <span className="text-blue-600">
                        {auditCompletedSteps}/{AUDIT_PIPELINE_STEPS.length}{' '}
                        Completed
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {AUDIT_PIPELINE_STEPS.map((step, index) => {
                        const isDone = index < auditCompletedSteps;
                        const isCurrent =
                          isAuditing && index === auditCompletedSteps;

                        return (
                          <div
                            key={step.id}
                            className={`px-3 py-2 rounded-md border text-[12px] flex items-center justify-between gap-2 transition-all ${
                              isDone
                                ? 'bg-emerald-50/70 border-emerald-200/90 text-emerald-950 font-medium'
                                : isCurrent
                                ? 'bg-blue-50/80 border-blue-200 text-blue-950 font-medium'
                                : 'bg-white border-slate-200/80 text-slate-500'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : isCurrent ? (
                                <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" />
                              )}
                              <span className="truncate">
                                {locale === 'de' ? step.labelDe : step.labelEn}
                              </span>
                            </div>

                            <span
                              className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded shrink-0 ${
                                isDone
                                  ? 'bg-emerald-100/80 text-emerald-700'
                                  : isCurrent
                                  ? 'bg-blue-100/80 text-blue-700'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {isDone
                                ? '✓ Done'
                                : isCurrent
                                ? 'Running...'
                                : 'Queued'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {auditError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                    {auditError}
                  </div>
                )}

                {/* LIVE CERTIFIED EXECUTIVE AUDIT REPORT CARD */}
                {auditReport && (
                  <div className="pt-4 border-t border-slate-200/80 space-y-3.5">
                    <div
                      className={`p-4 rounded-lg border flex flex-wrap items-center justify-between gap-4 ${
                        auditReport.verdict === 'POLICY_CONFLICT'
                          ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                          : auditReport.verdict === 'CONDITIONAL'
                          ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                          : 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {auditReport.verdict === 'POLICY_CONFLICT' ? (
                          <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                        ) : auditReport.verdict === 'CONDITIONAL' ? (
                          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                        )}
                        <div>
                          <div className="text-[11px] font-mono font-semibold text-slate-600">
                            VERDICT: {auditReport.verdict} · MODEL:{' '}
                            {auditReport.selectedModelId} · AUDITED BY:{' '}
                            {lastAuditedByEmail}
                          </div>
                          <div className="text-[14px] font-semibold tracking-[-0.01em] mt-0.5">
                            {auditReport.executiveSummary}
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-lg font-bold">
                          {auditReport.alignmentScore}%
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Alignment
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-200/80 text-[13px] text-slate-700 leading-relaxed">
                      <strong className="block text-[11px] font-mono font-semibold text-slate-500 uppercase mb-1">
                        Strategic Policy Cross-Examination
                      </strong>
                      {auditReport.strategicEvaluation}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="p-3.5 rounded-lg bg-emerald-50/40 border border-emerald-200/80 space-y-1.5">
                        <div className="text-[11px] font-mono font-semibold text-emerald-800 uppercase">
                          Pros
                        </div>
                        <ul className="space-y-1 text-[12.5px] text-slate-700">
                          {auditReport.pros.map((pro, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3.5 rounded-lg bg-rose-50/40 border border-rose-200/80 space-y-1.5">
                        <div className="text-[11px] font-mono font-semibold text-rose-800 uppercase">
                          Risks & Policy Conflicts
                        </div>
                        <ul className="space-y-1 text-[12.5px] text-slate-700">
                          {auditReport.cons.map((con, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="p-3.5 rounded-lg bg-blue-50/40 border border-blue-200/80 space-y-1.5">
                        <div className="text-[11px] font-mono font-semibold text-blue-800 uppercase">
                          Recommended Actionable Roadmap
                        </div>
                        <ul className="space-y-1 text-[12.5px] text-slate-800 font-medium">
                          {auditReport.roadmap.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                        <div className="text-[11px] font-mono font-semibold text-slate-600 uppercase">
                          Cited Company Brain Policies
                        </div>
                        <div className="space-y-1.5">
                          {auditReport.citations.map((cit) => (
                            <div
                              key={cit.parentId}
                              className="p-2 rounded-md bg-white border border-slate-200/80 text-[12px] flex items-center justify-between gap-2"
                            >
                              <span className="font-semibold text-slate-900 truncate">
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

              {/* Bottom Card (Stacked Directly Below Evaluate Decision): Previous Executive Audit Reports */}
              <div className="bg-white rounded-xl border border-slate-200/85 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-slate-900 flex items-center gap-2">
                      <History className="w-4 h-4 text-slate-500" />
                      <span>
                        {locale === 'de'
                          ? 'Frühere Executive Audit-Berichte'
                          : 'Previous Executive Audit Reports'}
                      </span>
                    </h2>
                    <p className="text-[12.5px] text-slate-500 mt-0.5">
                      {locale === 'de'
                        ? 'Alle geprüften Entscheidungen direkt unter dem Eingabefeld inklusive Prüfer-E-Mail und Löschfunktion.'
                        : 'Evaluated management decisions with auditor email attribution and one-click deletion.'}
                    </p>
                  </div>

                  <span className="text-[11.5px] font-mono font-medium text-slate-600 bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-md">
                    {auditHistory.length} Saved
                  </span>
                </div>

                {auditHistory.length === 0 ? (
                  <div className="p-5 rounded-lg bg-slate-50/70 border border-slate-200/80 text-center">
                    <p className="text-[12.5px] text-slate-500">
                      {locale === 'de'
                        ? 'Noch keine Audit-Berichte gespeichert. Prüfen Sie oben eine Entscheidung, um sie hier zu archivieren.'
                        : 'No executive audit reports saved yet. Run an audit above to automatically record it here.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {auditHistory.map((item) => (
                      <div
                        key={item.auditId}
                        className="p-3.5 rounded-lg bg-slate-50/60 border border-slate-200/85 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:border-slate-300 transition-colors"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-semibold uppercase ${
                                item.report.verdict === 'POLICY_CONFLICT'
                                  ? 'bg-rose-100/80 text-rose-800'
                                  : item.report.verdict === 'CONDITIONAL'
                                  ? 'bg-amber-100/80 text-amber-800'
                                  : 'bg-emerald-100/80 text-emerald-800'
                              }`}
                            >
                              {item.report.verdict} (
                              {item.report.alignmentScore}%)
                            </span>
                            <span className="text-[11.5px] font-mono text-slate-500">
                              By: <strong>{item.auditedByEmail}</strong>
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              · {new Date(item.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <div className="text-[13.5px] font-semibold text-slate-900 tracking-[-0.01em]">
                            &ldquo;{item.decisionProposal}&rdquo;
                          </div>

                          <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed">
                            {item.report.executiveSummary}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setAuditReport(item.report);
                              setDecisionProposal(item.decisionProposal);
                              setLastAuditedByEmail(item.auditedByEmail);
                            }}
                            className="h-8 px-3 rounded-md bg-white hover:bg-slate-100 border border-slate-200/90 text-[12px] font-medium text-slate-700 transition-colors shadow-sm"
                          >
                            View Report
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteAuditHistory(item.auditId)
                            }
                            className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Audit Report"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-TAB 2: COMPANY BRAIN KNOWLEDGE MANAGEMENT (Full-Width Ingestion Form on Top + Indexed List Below) */}
          {workspaceSubTab === 'brain' && (
            <div className="space-y-5">
              {/* Top Full-Width Card: Wide Multimodal Knowledge Ingestion Form */}
              <div className="w-full bg-white rounded-xl border border-slate-200/85 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[16px] sm:text-[17px] font-semibold tracking-[-0.02em] text-slate-900">
                      {locale === 'de'
                        ? 'Wissen ins Company Brain einspeisen'
                        : 'Add Knowledge to Company Brain'}
                    </h2>
                    <p className="text-[12.5px] text-slate-500 mt-0.5">
                      {locale === 'de'
                        ? `Wird unter Ihrer E-Mail (${userEmail}) gespeichert & indexiert.`
                        : `Attributed to your corporate email (${userEmail}) and indexed into 768-d vectors.`}
                    </p>
                  </div>

                  {/* Multimodal Input Mode Selector: Text | File Upload | Live Voice */}
                  <div className="inline-flex flex-wrap items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80 text-[12px] font-medium gap-0.5">
                    <button
                      type="button"
                      onClick={() => setInputMode('text')}
                      className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                        inputMode === 'text'
                          ? 'bg-white text-slate-900 font-semibold shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Text</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInputMode('file')}
                      className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                        inputMode === 'file'
                          ? 'bg-white text-slate-900 font-semibold shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>PDF / PPTX / Image / Audio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInputMode('voice')}
                      className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                        inputMode === 'voice'
                          ? 'bg-white text-rose-600 font-semibold shadow-sm'
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
                  <div className="p-4 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-[12.5px] text-slate-700">
                      <FileAudio className="w-5 h-5 text-blue-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900">
                          Upload PDF, PowerPoint (.pptx), Image, Audio (.mp3/.wav), or Text
                        </div>
                        <div className="text-slate-500 text-[12px]">
                          Gemini Multimodal automatically extracts text or transcribes audio into the editor below.
                        </div>
                      </div>
                    </div>

                    <label className="h-8 px-3.5 rounded-md bg-slate-900 hover:bg-blue-600 text-white text-[12px] font-medium cursor-pointer shrink-0 transition-colors inline-flex items-center">
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
                  <div className="p-4 rounded-lg bg-rose-50/50 border border-rose-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-[12.5px]">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isRecording
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-rose-100 text-rose-600'
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {isRecording
                            ? 'Recording Live Voice Dictation...'
                            : 'Record Policy or Meeting Note by Voice'}
                        </div>
                        <div className="text-slate-500 text-[12px]">
                          Audio is automatically transcribed into structured text for Company Brain indexing.
                        </div>
                      </div>
                    </div>

                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startLiveVoiceRecording}
                        className="h-8 px-3.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-medium flex items-center gap-1.5 shrink-0"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Start Recording</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopLiveVoiceRecording}
                        className="h-8 px-3.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-medium flex items-center gap-1.5 shrink-0"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Stop & Transcribe</span>
                      </button>
                    )}
                  </div>
                )}

                {extractionStatus && (
                  <div className="px-3.5 py-2 rounded-lg bg-blue-50/80 border border-blue-200 text-[12.5px] font-medium text-blue-800">
                    {extractionStatus}
                  </div>
                )}

                <form onSubmit={handleInjectDocument} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-5">
                      <input
                        type="text"
                        required
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        placeholder={
                          locale === 'de'
                            ? 'Dokumenttitel (z. B. IT-Sicherheitsrichtlinie 2026)'
                            : 'Document Title (e.g. IT Security Policy 2026)'
                        }
                        className="w-full h-9 px-3 text-[13px] liquid-glass-input"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <select
                        aria-label="Department"
                        value={docDepartment}
                        onChange={(e) => setDocDepartment(e.target.value)}
                        className="w-full h-9 px-3 text-[13px] liquid-glass-input"
                      >
                        <option value="Finance & Legal">
                          Department: Finance & Legal
                        </option>
                        <option value="Engineering">
                          Department: Engineering
                        </option>
                        <option value="HR & Legal">
                          Department: HR & Legal
                        </option>
                        <option value="Executive Board">
                          Department: Executive Board
                        </option>
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <input
                        type="text"
                        value={docTags}
                        onChange={(e) => setDocTags(e.target.value)}
                        placeholder="Tags: policy, approval, budget"
                        className="w-full h-9 px-3 text-[12.5px] font-mono liquid-glass-input"
                      />
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    required
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    placeholder={
                      locale === 'de'
                        ? 'Richtlinien-Text (oder Ergebnis aus Datei-Upload / Sprachaufnahme)...'
                        : 'Policy text or transcribed content (auto-sliced into Parent & 768-d Child vectors)...'
                    }
                    className="w-full p-3 text-[13.5px] leading-relaxed liquid-glass-input"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
                    {ingestFeedback ? (
                      <span className="text-[12.5px] font-semibold text-emerald-700">
                        {ingestFeedback}
                      </span>
                    ) : (
                      <span className="text-[12px] text-slate-500">
                        Author attribution: <strong>{userEmail}</strong> · 768-d Atlas Vector Store
                      </span>
                    )}

                    <button
                      type="submit"
                      disabled={isIngesting || isExtractingMedia}
                      className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium text-[13px] shadow-sm transition-colors flex items-center gap-2 shrink-0"
                    >
                      <Database className="w-3.5 h-3.5" />
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

              {/* Bottom Full-Width Card (Stacked Below Input Form): Indexed Brain Documents */}
              <div className="w-full bg-white rounded-xl border border-slate-200/85 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-5 sm:p-6 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold tracking-[-0.015em] text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-500" />
                    <span>
                      {locale === 'de'
                        ? 'Gespeicherte Richtlinien im Company Brain'
                        : 'Indexed Brain Documents'}
                    </span>
                  </h3>
                  <span className="text-[11.5px] font-mono font-medium text-slate-600 bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-md">
                    {documents.length} Indexed
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {documents.map((doc) => (
                    <div
                      key={doc.parentId}
                      className="px-3.5 py-3 rounded-lg bg-slate-50/60 border border-slate-200/85 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-semibold text-slate-900 truncate tracking-[-0.01em]">
                          {doc.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] font-mono text-slate-500 mt-0.5">
                          <span>{doc.department}</span>
                          <span>·</span>
                          <span className="text-blue-600 font-medium">
                            {doc.childCount} vectors
                          </span>
                          <span>·</span>
                          <span className="text-slate-500 truncate">
                            {doc.createdByEmail ?? 'governance-board@mindmittel.de'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.parentId)}
                        className="h-7 w-7 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: ENTERPRISE CONNECTORS HUB (iOS-Style Toggle Switches + Auth Credentials) */}
          {workspaceSubTab === 'connectors' && (
            <div className="bg-white rounded-xl border border-slate-200/85 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-[16px] sm:text-[17px] font-semibold tracking-[-0.02em] text-slate-900 flex items-center gap-2">
                    <Plug className="w-4 h-4 text-blue-600" />
                    <span>
                      {locale === 'de'
                        ? 'Enterprise Connectors (Chat, Wissensmanagement & Online-Meetings)'
                        : 'Enterprise Connectors Hub'}
                    </span>
                  </h2>
                  <p className="text-[12.5px] text-slate-500 mt-0.5">
                    {locale === 'de'
                      ? 'Hinterlegen Sie API-Zugangsdaten und schalten Sie Plattformen per iOS-Schalter ein oder aus.'
                      : 'Configure platform credentials and toggle data ingestion switches ON or OFF at any time.'}
                  </p>
                </div>
              </div>

              {connectorFeedback && (
                <div className="px-3.5 py-2.5 rounded-lg bg-blue-50/80 border border-blue-200 text-[12.5px] font-medium text-blue-900">
                  {connectorFeedback}
                </div>
              )}

              {(
                [
                  {
                    category: 'chat',
                    titleEn: 'Corporate Chat Platforms',
                    titleDe: 'Unternehmens-Chat-Plattformen',
                    icon: MessageSquare,
                  },
                  {
                    category: 'knowledge',
                    titleEn: 'Knowledge Management & Docs',
                    titleDe: 'Wissensmanagement & Dokumente',
                    icon: BookOpen,
                  },
                  {
                    category: 'meetings',
                    titleEn: 'Online Meetings & Voice Conferencing',
                    titleDe: 'Online-Meetings & Videokonferenzen',
                    icon: Video,
                  },
                ] as const
              ).map((group) => {
                const IconComp = group.icon;
                const items = connectors.filter(
                  (c) => c.category === group.category
                );

                return (
                  <div key={group.category} className="space-y-2.5">
                    <div className="flex items-center gap-2 text-[11.5px] font-semibold text-slate-500">
                      <IconComp className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {locale === 'de' ? group.titleDe : group.titleEn}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {items.map((conn) => {
                        const isConfigOpen =
                          activeConfigConnectorId === conn.id;

                        return (
                          <div
                            key={conn.id}
                            className={`p-4 rounded-lg border transition-all space-y-3 ${
                              conn.enabled
                                ? 'bg-emerald-50/25 border-emerald-300/90'
                                : 'bg-slate-50/50 border-slate-200/85'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[14px] font-semibold tracking-[-0.01em] text-slate-900">
                                    {conn.name}
                                  </span>
                                  {conn.configured && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-white text-slate-600 border border-slate-200/80">
                                      {conn.maskedCredential}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[12px] text-slate-500 leading-relaxed">
                                  {locale === 'de'
                                    ? conn.descriptionDe
                                    : conn.descriptionEn}
                                </p>
                              </div>

                              {/* iOS-Style Pill Toggle Switch */}
                              <button
                                type="button"
                                role="switch"
                                aria-checked={conn.enabled}
                                aria-label={`Toggle ${conn.name}`}
                                onClick={() => handleToggleConnector(conn)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  conn.enabled
                                    ? 'bg-emerald-500'
                                    : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                    conn.enabled
                                      ? 'translate-x-5'
                                      : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-200/60 text-[12px]">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isConfigOpen) {
                                    setActiveConfigConnectorId(null);
                                  } else {
                                    setActiveConfigConnectorId(conn.id);
                                    setConnectorTargetScope(conn.targetScope);
                                    setConnectorApiSecret('');
                                  }
                                }}
                                className="font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                                <span>
                                  {conn.configured
                                    ? 'Update Credentials'
                                    : 'Enter Auth Credentials'}
                                </span>
                              </button>

                              {conn.enabled && (
                                <button
                                  type="button"
                                  disabled={syncingConnectorId === conn.id}
                                  onClick={() => handleSyncConnector(conn.id)}
                                  className="h-7 px-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11.5px] font-medium flex items-center gap-1.5 shadow-sm"
                                >
                                  <RefreshCw
                                    className={`w-3 h-3 ${
                                      syncingConnectorId === conn.id
                                        ? 'animate-spin'
                                        : ''
                                    }`}
                                  />
                                  <span>
                                    {syncingConnectorId === conn.id
                                      ? 'Syncing...'
                                      : 'Sync Now'}
                                  </span>
                                </button>
                              )}
                            </div>

                            {/* Inline Credentials Configuration Drawer */}
                            {isConfigOpen && (
                              <form
                                onSubmit={(e) =>
                                  handleConfigureConnector(e, conn.id)
                                }
                                className="p-3 rounded-lg bg-white border border-slate-200/90 space-y-2.5"
                              >
                                <div>
                                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                    {locale === 'de'
                                      ? conn.authFieldLabelDe
                                      : conn.authFieldLabelEn}
                                  </label>
                                  <input
                                    type="password"
                                    required
                                    value={connectorApiSecret}
                                    onChange={(e) =>
                                      setConnectorApiSecret(e.target.value)
                                    }
                                    placeholder="Paste API Token / OAuth Secret..."
                                    className="w-full h-8 px-2.5 text-xs font-mono liquid-glass-input"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                    Target Channel / Space / Meeting Series
                                  </label>
                                  <input
                                    type="text"
                                    value={connectorTargetScope}
                                    onChange={(e) =>
                                      setConnectorTargetScope(e.target.value)
                                    }
                                    placeholder={conn.scopePlaceholder}
                                    className="w-full h-8 px-2.5 text-xs liquid-glass-input"
                                  />
                                </div>

                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveConfigConnectorId(null)
                                    }
                                    className="h-7 px-2.5 rounded-md text-xs font-medium text-slate-500 hover:bg-slate-100"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    className="h-7 px-3 rounded-md bg-slate-900 hover:bg-blue-600 text-white text-xs font-medium"
                                  >
                                    Save & Switch ON
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SECTION 4: SYSTEM ARCHITECTURE & LIVE TELEMETRY (With Left Sidebar) */}
          {workspaceSubTab === 'system' && <SystemObservabilityPanel />}
        </div>
      )}
    </AppShell>
  );
}
