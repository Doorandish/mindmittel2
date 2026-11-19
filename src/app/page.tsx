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
  Trash2,
  Play,
  Printer,
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
  Pencil,
  Download,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AppShell, type WorkspaceSubTab } from '@/components/layout/AppShell';
import {
  getDictionary,
  DEFAULT_LOCALE,
  type SupportedLocale,
} from '@/i18n/dictionaries';
import type { ExecutiveAuditReport } from '@/core/audit/decisionEvaluator';
import type { EnterpriseConnectorItem } from '@/core/connectors/connectorRegistry';
import type { StoredAuditHistoryEntry } from '@/infrastructure/rag/brainRepository';
import type { BrainKnowledgeConflictWarning } from '@/core/rag/conflictDetector';
import {
  DEFAULT_TENANT_DEPARTMENTS,
  canAccessDepartment,
  canEditDocuments,
  canManageConnectors,
  canManageGovernance,
  type TenantDepartmentItem,
  type TenantUserAccessProfile,
} from '@/core/auth/rbac';
import { TeamAccessPanel } from '@/components/governance/TeamAccessPanel';

interface StoredBrainDocumentSummary {
  parentId: string;
  allParentIds?: string[];
  title: string;
  department: string;
  sourceType: string;
  connectorId?: string;
  isExternalSource?: boolean;
  tags: string[];
  contentPreview: string;
  childCount: number;
  sectionCount?: number;
  createdByEmail?: string;
  createdByName?: string;
  createdAt?: string;
}

const AUDIT_PIPELINE_STEPS = [
  {
    id: 'intent',
    labelEn: 'Analyzing decision complexity & routing optimal Gemini model',
    labelDe: 'Entscheidungskomplexität analysieren & optimales Gemini-Modell wählen',
  },
  {
    id: 'embedding',
    labelEn: 'Analyzing semantic context of your decision proposal',
    labelDe: 'Semantischen Kontext des Entscheidungsvorschlags analysieren',
  },
  {
    id: 'vector-search',
    labelEn: 'Searching Company Brain policies and board resolutions',
    labelDe: 'Company Brain nach relevanten Richtlinien und Beschlüssen durchsuchen',
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

  // Multi-Tenant Subdomain & Corporate OTP Gate State
  const [tenantStatus, setTenantStatus] = useState<
    'loading' | 'active' | 'suspended' | 'not_found'
  >('loading');
  const [tenantInfo, setTenantInfo] = useState<{
    slug: string;
    companyName: string;
    dbName: string;
    authMode: 'otp' | 'open';
    isDemo: boolean;
    allowedEmailDomains: string[];
  } | null>(null);
  const [tenantAuthenticated, setTenantAuthenticated] = useState<boolean>(false);
  const [userAccess, setUserAccess] = useState<TenantUserAccessProfile | null>(
    null
  );
  const [tenantDepartments, setTenantDepartments] = useState<
    TenantDepartmentItem[]
  >([...DEFAULT_TENANT_DEPARTMENTS]);
  const [pendingUsersCount, setPendingUsersCount] = useState<number>(0);
  const [otpStep, setOtpStep] = useState<'email' | 'code'>('email');
  const [otpCodeInput, setOtpCodeInput] = useState<string>('');
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);

  // Company Brain Documents & Multimodal Ingestion State
  const [documents, setDocuments] = useState<StoredBrainDocumentSummary[]>([]);
  const [brainConflicts, setBrainConflicts] = useState<
    BrainKnowledgeConflictWarning[]
  >([]);
  const [demoDeletedParentIds, setDemoDeletedParentIds] = useState<string[]>(
    []
  );
  const [nextAuditExcludedIds, setNextAuditExcludedIds] = useState<string[]>(
    []
  );
  const [docTitle, setDocTitle] = useState<string>('');
  const [docDepartment, setDocDepartment] = useState<string>('finance-legal');
  const [docSourceType, setDocSourceType] = useState<'upload' | 'slack'>(
    'upload'
  );
  const [docTags, setDocTags] = useState<string>('policy, approval, budget');
  const [docContent, setDocContent] = useState<string>('');
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestFeedback, setIngestFeedback] = useState<string | null>(null);

  // Online In-Place Document Editor State
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDepartment, setEditDepartment] =
    useState<string>('Finance & Legal');
  const [editTags, setEditTags] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');
  const [isUpdatingDoc, setIsUpdatingDoc] = useState<boolean>(false);

  // Multimodal File Upload & Live Voice Recording State
  const [inputMode, setInputMode] = useState<'text' | 'file' | 'voice'>('text');
  const [isExtractingMedia, setIsExtractingMedia] = useState<boolean>(false);
  const [extractionStatus, setExtractionStatus] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  // Decision Audit & History Ledger State
  const [decisionProposal, setDecisionProposal] = useState<string>(
    DEFAULT_LOCALE === 'de'
      ? QUICK_DECISION_PRESETS[0].proposalDe
      : QUICK_DECISION_PRESETS[0].proposalEn
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

  function syncDocumentsAndConflicts(
    rawDocs?: StoredBrainDocumentSummary[],
    rawConflicts?: BrainKnowledgeConflictWarning[],
    deletedIds: string[] = demoDeletedParentIds
  ) {
    const docsInput = rawDocs ?? documents;
    const conflictsInput = rawConflicts ?? brainConflicts;

    if (!tenantInfo?.isDemo || deletedIds.length === 0) {
      if (rawDocs !== undefined) setDocuments(docsInput);
      if (rawConflicts !== undefined) setBrainConflicts(conflictsInput);
      return;
    }

    const deletedSet = new Set(deletedIds);
    if (rawDocs !== undefined) {
      setDocuments(
        docsInput.filter(
          (doc) =>
            !deletedSet.has(doc.parentId) &&
            !(doc.allParentIds ?? []).some((id) => deletedSet.has(id))
        )
      );
    }
    if (rawConflicts !== undefined) {
      setBrainConflicts(
        conflictsInput.filter(
          (conflict) =>
            !deletedSet.has(conflict.newerDocument.parentId) &&
            !deletedSet.has(conflict.existingDocument.parentId)
        )
      );
    }
  }

  async function fetchBrainDocuments() {
    try {
      const res = await fetch('/api/brain/documents');
      const data = await res.json();
      if (data.ok) {
        syncDocumentsAndConflicts(
          Array.isArray(data.documents) ? data.documents : undefined,
          Array.isArray(data.conflicts) ? data.conflicts : undefined
        );
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
        requestedTab === 'connectors'
      ) {
        setActiveTab('vault');
        setWorkspaceSubTab(requestedTab);
      }

      // When accessed on a tenant subdomain (e.g. demo.mindmittel.de or bosch.mindmittel.de), open workspace directly
      const host = window.location.hostname.toLowerCase();
      if (
        host.endsWith('.mindmittel.de') ||
        host.endsWith('.localhost') ||
        params.get('tenant')
      ) {
        setActiveTab('vault');
      }
    } catch {
      // Ignore storage access errors
    }

    async function bootstrapTenantWorkspace() {
      try {
        const res = await fetch('/api/tenant/context');
        const data = await res.json();
        if (!res.ok || data.status === 'not_found') {
          setTenantStatus('not_found');
          return;
        }
        if (data.status === 'suspended') {
          setTenantInfo(data.tenant ?? null);
          setTenantStatus('suspended');
          return;
        }
        setTenantInfo(data.tenant ?? null);
        setTenantStatus('active');

        if (Array.isArray(data.departments) && data.departments.length > 0) {
          setTenantDepartments(data.departments);
        }
        if (data.userAccess) {
          setUserAccess(data.userAccess);
        }

        if (data.user) {
          setUserEmail(data.user.email);
          setUserFullName(data.user.fullName);
          setUserDepartment(data.user.department);
          setAuthEmailInput(data.user.email);
          setAuthNameInput(data.user.fullName);
          setAuthDeptInput(data.user.department);
        } else if (
          data.tenant?.allowedEmailDomains?.length > 0 &&
          authEmailInput === 'amir@mindmittel.de'
        ) {
          setAuthEmailInput(`executive@${data.tenant.allowedEmailDomains[0]}`);
        }

        const isAuthed = Boolean(data.authenticated);
        setTenantAuthenticated(isAuthed);
        const accessObj = data.userAccess as TenantUserAccessProfile | null;
        const isActiveAccess =
          !accessObj || accessObj.status === 'active';
        if (isAuthed && isActiveAccess) {
          fetchBrainDocuments();
          fetchAuditHistory();
          if (!accessObj || canManageConnectors(accessObj)) {
            fetchConnectors();
          }
          if (accessObj && canManageGovernance(accessObj) && !data.tenant?.isDemo) {
            fetch('/api/tenant/governance')
              .then((r) => r.json())
              .then((g) => {
                if (g.ok && Array.isArray(g.users)) {
                  setPendingUsersCount(
                    g.users.filter(
                      (u: TenantUserAccessProfile) => u.status === 'pending'
                    ).length
                  );
                }
              })
              .catch(() => {});
          }
        }
      } catch {
        setTenantStatus('active');
        setTenantAuthenticated(true);
        fetchBrainDocuments();
        fetchAuditHistory();
        fetchConnectors();
      }
    }

    bootstrapTenantWorkspace();
  }, []);

  async function handleRequestOtpCode(e: React.FormEvent) {
    e.preventDefault();
    setAuthFeedback(null);
    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmailInput }),
      });
      const data = await res.json();
      if (data.ok) {
        setOtpStep('code');
      } else {
        setAuthFeedback(data.error ?? 'Could not send verification code.');
      }
    } catch (err) {
      setAuthFeedback(
        err instanceof Error ? err.message : 'Failed to request OTP code'
      );
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function handleVerifyOtpCode(e: React.FormEvent) {
    e.preventDefault();
    setAuthFeedback(null);
    setIsVerifyingOtp(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmailInput,
          code: otpCodeInput,
          fullName: authNameInput,
          department: authDeptInput,
        }),
      });
      const data = await res.json();
      if (data.ok && data.user) {
        setUserEmail(data.user.email);
        setUserFullName(data.user.fullName);
        setUserDepartment(data.user.department);
        const accessObj = (data.userAccess ?? null) as TenantUserAccessProfile | null;
        setUserAccess(accessObj);
        setTenantAuthenticated(true);
        setShowAuthModal(false);
        setOtpCodeInput('');
        if (!accessObj || accessObj.status === 'active') {
          fetchBrainDocuments();
          fetchAuditHistory();
          if (!accessObj || canManageConnectors(accessObj)) {
            fetchConnectors();
          }
        }
      } else {
        setAuthFeedback(data.error ?? 'Invalid verification code.');
      }
    } catch (err) {
      setAuthFeedback(
        err instanceof Error ? err.message : 'OTP verification failed'
      );
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  async function handleTenantSignOut() {
    await fetch('/api/auth/session', { method: 'DELETE' });
    setTenantAuthenticated(false);
    setUserAccess(null);
    setOtpStep('email');
    setOtpCodeInput('');
    setDocuments([]);
    setAuditHistory([]);
  }

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

  /**
   * Knowledge-gap shortcut: jumps from the advisory report to the Company Brain
   * ingestion form, pre-filled with a suggested policy title and department.
   */
  function handleFillKnowledgeGap(suggestedTitle: string, suggestedDepartment: string) {
    setDocTitle(suggestedTitle);
    setDocDepartment(suggestedDepartment);
    setDocContent('');
    setInputMode('text');
    setIngestFeedback(null);
    openLiveWorkspace('brain');
  }

  async function fetchJsonWithHeartbeat<T = Record<string, unknown>>(
    url: string,
    init?: RequestInit
  ): Promise<T | null> {
    const headers = new Headers(init?.headers ?? {});
    headers.set('x-mindmittel-stream', '1');
    const res = await fetch(url, { ...init, headers });
    const rawText = await res.text();
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const parsed = JSON.parse(lines[i]) as {
          type?: string;
          data?: T;
        } & T;
        if (parsed && typeof parsed === 'object') {
          if (parsed.type === 'result' && parsed.data !== undefined) {
            return parsed.data;
          }
          if (parsed.type !== 'heartbeat') {
            return parsed as T;
          }
        }
      } catch {
        // Ignore non-JSON or HTML lines
      }
    }

    try {
      return JSON.parse(rawText) as T;
    } catch {
      return null;
    }
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

      const data = await fetchJsonWithHeartbeat<{
        ok?: boolean;
        extractedText?: string;
        suggestedTitle?: string;
        category?: string;
        error?: string;
      }>('/api/brain/extract', {
        method: 'POST',
        body: formData,
      });

      if (!data) {
        setExtractionStatus(
          locale === 'de'
            ? 'Der Server ist vorübergehend ausgelastet. Bitte versuchen Sie es in wenigen Sekunden erneut.'
            : 'The server is temporarily busy. Please try again in a few seconds.'
        );
      } else if (data.ok && data.extractedText) {
        setDocContent(data.extractedText);
        if (!docTitle.trim() && data.suggestedTitle) {
          setDocTitle(data.suggestedTitle);
        }
        setExtractionStatus(
          locale === 'de'
            ? `✓ Erfolgreich in verarbeitbaren Text umgewandelt (${(data.category ?? 'text').toUpperCase()})`
            : `✓ Converted ${sourceLabel} into structured text (${(data.category ?? 'text').toUpperCase()})`
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

      const data = await fetchJsonWithHeartbeat<{
        ok?: boolean;
        documents?: StoredBrainDocumentSummary[];
        conflicts?: BrainKnowledgeConflictWarning[];
      }>('/api/brain/documents', {
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

      if (data?.ok) {
        syncDocumentsAndConflicts(
          data.documents ?? [],
          Array.isArray(data.conflicts) ? data.conflicts : undefined
        );
        setDocTitle('');
        setDocContent('');
        setExtractionStatus(null);
        setIngestFeedback(
          locale === 'de'
            ? `✓ Gespeichert von ${userEmail}`
            : `✓ Saved by ${userEmail} into Company Brain`
        );
      }
    } finally {
      setIsIngesting(false);
    }
  }

  async function handleDeleteDocument(parentId: string) {
    if (tenantInfo?.isDemo) {
      const targetDoc = documents.find(
        (d) =>
          d.parentId === parentId || (d.allParentIds ?? []).includes(parentId)
      );
      const idsToHide =
        targetDoc?.allParentIds && targetDoc.allParentIds.length > 0
          ? targetDoc.allParentIds
          : [parentId];
      const nextDeleted = Array.from(
        new Set([...demoDeletedParentIds, ...idsToHide])
      );
      setDemoDeletedParentIds(nextDeleted);
      syncDocumentsAndConflicts(documents, brainConflicts, nextDeleted);
      return;
    }

    const res = await fetch(
      `/api/brain/documents?parentId=${encodeURIComponent(parentId)}`,
      { method: 'DELETE' }
    );
    const data = await res.json();
    if (data.ok) {
      syncDocumentsAndConflicts(
        data.documents ?? [],
        Array.isArray(data.conflicts) ? data.conflicts : undefined
      );
    }
  }

  function openOnlineDocumentEditor(doc: {
    parentId: string;
    title: string;
    department: string;
    content: string;
    tags?: string[];
  }) {
    const fullDoc = documents.find((d) => d.parentId === doc.parentId);
    setEditingDocId(doc.parentId);
    setEditTitle(fullDoc?.title ?? doc.title);
    setEditDepartment(fullDoc?.department ?? doc.department);
    setEditTags((fullDoc?.tags ?? doc.tags ?? []).join(', '));
    setEditContent(fullDoc?.contentPreview ?? doc.content);
  }

  async function handleUpdateDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDocId || !editTitle.trim() || !editContent.trim()) return;

    setIsUpdatingDoc(true);
    try {
      const parsedTags = editTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const data = await fetchJsonWithHeartbeat<{
        ok?: boolean;
        documents?: StoredBrainDocumentSummary[];
        conflicts?: BrainKnowledgeConflictWarning[];
      }>('/api/brain/documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: editingDocId,
          title: editTitle,
          content: editContent,
          department: editDepartment,
          tags: parsedTags,
          updatedByEmail: userEmail,
          updatedByName: userFullName,
        }),
      });
      if (data?.ok) {
        syncDocumentsAndConflicts(
          data.documents ?? [],
          Array.isArray(data.conflicts) ? data.conflicts : undefined
        );
        setEditingDocId(null);
        setIngestFeedback(
          locale === 'de'
            ? `✓ Dokument aktualisiert`
            : `✓ Updated online & re-indexed`
        );
      }
    } finally {
      setIsUpdatingDoc(false);
    }
  }

  function handleDownloadDocument(doc: {
    parentId: string;
    title: string;
    department: string;
    content: string;
    createdByEmail?: string;
  }) {
    const fullDoc = documents.find((d) => d.parentId === doc.parentId);
    const bodyText = [
      `Title: ${fullDoc?.title ?? doc.title}`,
      `Department: ${fullDoc?.department ?? doc.department}`,
      `Author: ${fullDoc?.createdByEmail ?? doc.createdByEmail ?? userEmail}`,
      `Document ID: ${doc.parentId}`,
      '----------------------------------------',
      '',
      fullDoc?.contentPreview ?? doc.content,
    ].join('\n');

    const blob = new Blob([bodyText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (fullDoc?.title ?? doc.title)
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '_')
      .slice(0, 48);
    link.href = url;
    link.download = `${safeName || 'company_brain_policy'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function isDocExcludedForNextAudit(doc: {
    parentId: string;
    allParentIds?: string[];
  }): boolean {
    if (nextAuditExcludedIds.length === 0) return false;
    const excludedSet = new Set(nextAuditExcludedIds);
    return (
      excludedSet.has(doc.parentId) ||
      (doc.allParentIds ?? []).some((id) => excludedSet.has(id))
    );
  }

  function toggleExcludeForNextAudit(doc: {
    parentId: string;
    allParentIds?: string[];
  }) {
    const fullDoc = documents.find(
      (d) =>
        d.parentId === doc.parentId ||
        (d.allParentIds ?? []).includes(doc.parentId)
    );
    const targetIds =
      fullDoc?.allParentIds && fullDoc.allParentIds.length > 0
        ? fullDoc.allParentIds
        : doc.allParentIds && doc.allParentIds.length > 0
        ? doc.allParentIds
        : [doc.parentId];
    const targetSet = new Set(targetIds);
    const currentlyExcluded = nextAuditExcludedIds.some((id) =>
      targetSet.has(id)
    );
    if (currentlyExcluded) {
      setNextAuditExcludedIds((prev) =>
        prev.filter((id) => !targetSet.has(id))
      );
    } else {
      setNextAuditExcludedIds((prev) =>
        Array.from(new Set([...prev, ...targetIds]))
      );
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

    const combinedExcludedIds = Array.from(
      new Set([
        ...(tenantInfo?.isDemo ? demoDeletedParentIds : []),
        ...nextAuditExcludedIds,
      ])
    );

    try {
      const data = await fetchJsonWithHeartbeat<{
        ok?: boolean;
        report?: ExecutiveAuditReport;
        entry?: { auditedByEmail?: string };
        history?: StoredAuditHistoryEntry[];
        error?: string;
      }>('/api/brain/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisionProposal,
          departmentFilter: auditDepartmentFilter,
          locale,
          auditedByEmail: userEmail,
          auditedByName: userFullName,
          excludedParentIds:
            combinedExcludedIds.length > 0 ? combinedExcludedIds : undefined,
        }),
      });

      stepTimers.forEach((timer) => clearTimeout(timer));

      // Sequentially check off any remaining steps so the user sees every task ticked
      setAuditCompletedSteps(AUDIT_PIPELINE_STEPS.length);

      if (!data) {
        setAuditError(
          locale === 'de'
            ? 'Der Server ist vorübergehend ausgelastet. Bitte versuchen Sie es in wenigen Sekunden erneut.'
            : 'The server is temporarily busy. Please try again in a few seconds.'
        );
      } else if (data.ok && data.report) {
        setAuditReport(data.report);
        setLastAuditedByEmail(
          data.entry?.auditedByEmail ?? userEmail
        );
        if (Array.isArray(data.history)) {
          setAuditHistory(data.history);
        }
        // Automatically re-enable any one-shot excluded documents right after this decision evaluation
        setNextAuditExcludedIds([]);
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
      const data = await fetchJsonWithHeartbeat<{
        ok?: boolean;
        connectors?: EnterpriseConnectorItem[];
        documents?: StoredBrainDocumentSummary[];
        conflicts?: BrainKnowledgeConflictWarning[];
        unchanged?: boolean;
        syncedTitle?: string;
        error?: string;
      }>('/api/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          connectorId,
          userEmail,
          userName: userFullName,
        }),
      });
      if (!data) {
        setConnectorFeedback(
          locale === 'de'
            ? 'Der Server ist vorübergehend ausgelastet. Bitte versuchen Sie es in wenigen Sekunden erneut.'
            : 'The server is temporarily busy. Please try again in a few seconds.'
        );
      } else if (data.ok) {
        if (Array.isArray(data.connectors)) {
          setConnectors(data.connectors);
        }
        syncDocumentsAndConflicts(
          Array.isArray(data.documents) ? data.documents : undefined,
          Array.isArray(data.conflicts) ? data.conflicts : undefined
        );
        if (data.unchanged) {
          setConnectorFeedback(
            locale === 'de'
              ? `✓ Alles aktuell: Keine Änderungen in Google Drive erkannt (0 Token verbraucht)`
              : `✓ Up-to-date: No modifications in Google Drive (0 tokens used)`
          );
        } else {
          setConnectorFeedback(
            locale === 'de'
              ? `✓ Synchronisiert: "${data.syncedTitle}"`
              : `✓ Synced into Company Brain: "${data.syncedTitle}"`
          );
        }
      } else {
        setConnectorFeedback(data.error ?? 'Sync failed');
      }
    } finally {
      setSyncingConnectorId(null);
    }
  }

  if (tenantStatus === 'loading') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs font-mono font-medium">
            {locale === 'de'
              ? 'Arbeitsbereich wird geladen...'
              : 'Loading workspace...'}
          </span>
        </div>
      </div>
    );
  }

  if (tenantStatus === 'not_found' || tenantStatus === 'suspended') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-7 space-y-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-extrabold text-slate-900">
              {tenantStatus === 'suspended'
                ? locale === 'de'
                  ? 'Unternehmens-Workspace gesperrt'
                  : 'Company Workspace Suspended'
                : locale === 'de'
                ? 'Unternehmens-Workspace nicht registriert'
                : 'Company Workspace Not Registered'}
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              {tenantStatus === 'suspended'
                ? locale === 'de'
                  ? 'Diese Unternehmens-Subdomain wurde vorübergehend vom Plattform-Administrator deaktiviert.'
                  : 'This company subdomain has been temporarily suspended by the platform administrator.'
                : locale === 'de'
                ? 'Diese Subdomain wurde noch nicht eingerichtet. Bitte bitten Sie die Systemadministration, Ihr Unternehmen unter admin.mindmittel.de zu registrieren.'
                : 'This subdomain has not been provisioned yet. Please ask the product owner to register your company on admin.mindmittel.de.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <a
              href="https://mindmittel.de"
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700"
            >
              mindmittel.de
            </a>
            <a
              href="https://demo.mindmittel.de"
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white"
            >
              {locale === 'de' ? 'Live-Demo öffnen' : 'Open Live Demo'}
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (tenantInfo?.authMode === 'otp' && !tenantAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                <img
                  src="/images/mindmittel-logo.svg"
                  alt="MindMittel Logo"
                  className="w-7 h-7 object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-mono font-bold text-blue-600 uppercase truncate">
                  {tenantInfo.slug}.mindmittel.de
                </div>
                <h1 className="text-lg font-extrabold text-slate-900 truncate">
                  {tenantInfo.companyName}
                </h1>
              </div>
            </div>

            <div className="inline-flex items-center bg-slate-100 border border-slate-200 rounded-md p-0.5 text-[11px] font-medium shrink-0">
              <button
                type="button"
                onClick={() => setLocale('de')}
                className={`px-2 py-0.5 rounded ${
                  locale === 'de'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-500'
                }`}
              >
                DE
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`px-2 py-0.5 rounded ${
                  locale === 'en'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-500'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {locale === 'de' ? (
              <>
                Dieser Workspace ist strikt isoliert. Melden Sie sich mit Ihrer
                autorisierten{' '}
                <strong>
                  {tenantInfo.allowedEmailDomains.length > 0
                    ? tenantInfo.allowedEmailDomains
                        .map((d) => `@${d}`)
                        .join(' oder ')
                    : 'Firmen'}
                </strong>
                -E-Mail-Adresse an, um einen 6-stelligen Einmalcode zu erhalten.
              </>
            ) : (
              <>
                This workspace is strictly isolated. Sign in with your
                authorized{' '}
                <strong>
                  {tenantInfo.allowedEmailDomains.length > 0
                    ? tenantInfo.allowedEmailDomains
                        .map((d) => `@${d}`)
                        .join(' or ')
                    : 'corporate'}
                </strong>{' '}
                email address to receive a 6-digit verification code.
              </>
            )}
          </p>

          {otpStep === 'email' ? (
            <form onSubmit={handleRequestOtpCode} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === 'de'
                    ? 'Firmen-E-Mail-Adresse *'
                    : 'Corporate Email Address *'}
                </label>
                <input
                  type="email"
                  required
                  value={authEmailInput}
                  onChange={(e) => setAuthEmailInput(e.target.value)}
                  placeholder={
                    tenantInfo.allowedEmailDomains[0]
                      ? `name@${tenantInfo.allowedEmailDomains[0]}`
                      : 'name@company.de'
                  }
                  className="w-full px-3.5 py-2.5 text-sm liquid-glass-input font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === 'de' ? 'Vollständiger Name' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={authNameInput}
                  onChange={(e) => setAuthNameInput(e.target.value)}
                  placeholder={locale === 'de' ? 'Vor- und Nachname' : 'Executive Name'}
                  className="w-full px-3.5 py-2.5 text-sm liquid-glass-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === 'de' ? 'Abteilung / Rolle' : 'Department / Role'}
                </label>
                <select
                  value={authDeptInput}
                  onChange={(e) => setAuthDeptInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm liquid-glass-input"
                >
                  <option value="Executive Board">
                    {locale === 'de' ? 'Vorstand / Geschäftsführung' : 'Executive Board'}
                  </option>
                  <option value="Finance & Legal">
                    {locale === 'de' ? 'Finanzen & Recht' : 'Finance & Legal'}
                  </option>
                  <option value="Engineering">
                    {locale === 'de' ? 'Engineering & IT' : 'Engineering'}
                  </option>
                  <option value="HR & Legal">
                    {locale === 'de' ? 'Personal & Recht' : 'HR & Legal'}
                  </option>
                </select>
              </div>

              {authFeedback && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                  {authFeedback}
                </div>
              )}

              <button
                type="submit"
                disabled={isSendingOtp}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-sm"
              >
                {isSendingOtp
                  ? locale === 'de'
                    ? '6-stelligen Code senden...'
                    : 'Sending 6-Digit Code...'
                  : locale === 'de'
                  ? '6-stelligen Bestätigungscode senden'
                  : 'Send 6-Digit Verification Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtpCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === 'de'
                    ? `6-stelliger Code gesendet an ${authEmailInput}`
                    : `6-Digit Code sent to ${authEmailInput}`}
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCodeInput}
                  onChange={(e) =>
                    setOtpCodeInput(e.target.value.replace(/\D/g, ''))
                  }
                  placeholder="123456"
                  className="w-full px-3.5 py-2.5 text-center text-lg tracking-widest font-mono font-bold liquid-glass-input"
                />
              </div>

              {authFeedback && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                  {authFeedback}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep('email');
                    setAuthFeedback(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  {locale === 'de' ? 'Zurück' : 'Back'}
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpCodeInput.length !== 6}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-sm"
                >
                  {isVerifyingOtp
                    ? locale === 'de'
                      ? 'Wird geprüft...'
                      : 'Verifying...'
                    : locale === 'de'
                    ? 'Bestätigen & Workspace öffnen'
                    : 'Verify & Open Workspace'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Pending Approval Screen (Zero-Trust: New employees await Company Admin approval & department assignment)
  if (
    tenantInfo?.authMode === 'otp' &&
    tenantAuthenticated &&
    userAccess?.status === 'pending'
  ) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-amber-200/90 shadow-xl p-7 sm:p-8 space-y-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-700 font-bold">
              {tenantInfo.companyName} · {tenantInfo.slug}.mindmittel.de
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">
              {locale === 'de'
                ? 'Freigabe durch Unternehmens-Admin ausstehend'
                : 'Awaiting Company Admin Approval'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {locale === 'de'
                ? `Ihre E-Mail (${userEmail}) wurde erfolgreich verifiziert. Ihr Unternehmens-Administrator muss noch Ihre Rolle und zugelassenen Abteilungen freigeben.`
                : `Your corporate email (${userEmail}) is verified. Your Company Admin needs to approve your role and assign your allowed departments before you can access the workspace.`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>
                {locale === 'de' ? 'Status erneut prüfen' : 'Check Approval Status'}
              </span>
            </button>
            <button
              type="button"
              onClick={handleTenantSignOut}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold"
            >
              {locale === 'de' ? 'Abmelden' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const canEditBrainDocs = !userAccess || canEditDocuments(userAccess);
  const canAccessConnectorsTab = !userAccess || canManageConnectors(userAccess);
  const canAccessTeamTab = Boolean(
    userAccess && canManageGovernance(userAccess) && !tenantInfo?.isDemo
  );
  const accessibleDepartments =
    userAccess && userAccess.status === 'active'
      ? tenantDepartments.filter((d) => canAccessDepartment(userAccess, d.id))
      : tenantDepartments;

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
      canManageConnectors={canAccessConnectorsTab}
      canManageTeam={canAccessTeamTab}
      pendingUsersCount={pendingUsersCount}
      onSignOut={tenantInfo?.authMode === 'otp' ? handleTenantSignOut : undefined}
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
                          Auto-transcribed &amp; indexed into Company Brain ✓
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
                      Indexed into Company Brain
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
                    ? 'Erfassen Sie Text, PDFs, Bilder, PowerPoint-Folien oder Live-Sprachaufnahmen. Gemini transkribiert und speichert alles automatisch im Company Brain.'
                    : 'Ingest plain text, PDFs, images, PowerPoint decks, audio files, or live microphone dictations—automatically transcribed and indexed into your Company Brain.'}
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                    <Plug className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-[11px] font-mono font-bold uppercase">
                    7 CONNECTORS + CUSTOM API
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {locale === 'de'
                    ? '7 Unternehmens-Konnektoren & Offene API'
                    : '7 Enterprise Connectors & Custom Extensibility'}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {locale === 'de'
                    ? 'Verbinden Sie Google Drive, Slack, Microsoft Teams, Confluence, Notion, Zoom und Google Meet mit sicheren Schlüsseln. Über die offene API können Sie jederzeit beliebige eigene ERP-, SAP- oder Jira-Systeme als Custom Connector anbinden.'
                    : 'Live-synchronize Google Drive, Slack, Microsoft Teams, Confluence, Notion, Zoom, and Google Meet with secure credentials. The extensible connector architecture lets any enterprise plug in internal ERPs, SAP, or custom APIs in minutes.'}
                </p>

                {/* 7 Connectors Visual Pills Grid */}
                <div className="pt-2 flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-medium border border-slate-200/80">
                    Google Drive
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-medium border border-slate-200/80">
                    Slack
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-medium border border-slate-200/80">
                    Microsoft Teams
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-medium border border-slate-200/80">
                    Confluence
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-medium border border-slate-200/80">
                    Notion
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-medium border border-slate-200/80">
                    Zoom
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-medium border border-slate-200/80">
                    Google Meet
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-[11px] font-bold border border-blue-200">
                    + Custom Connector
                  </span>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-mono font-bold uppercase">
                    SMART DELTA SYNC
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {dict.featuresSection.feat3Title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {dict.featuresSection.feat3Desc}
                </p>
                <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {locale === 'de'
                      ? '0 Token-Verschwendung bei unveränderten Dateien'
                      : 'Zero AI token waste on unchanged files'}
                  </span>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-[11px] font-mono font-bold uppercase">
                    {dict.featuresSection.feat4Badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {dict.featuresSection.feat4Title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {dict.featuresSection.feat4Desc}
                </p>
                <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-violet-700 font-semibold bg-violet-50 px-2.5 py-1 rounded-md border border-violet-200">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {locale === 'de'
                      ? 'Revisionssicher & DSGVO-konform'
                      : 'Enterprise Audit & DSGVO Verifiable'}
                  </span>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-mono font-bold uppercase">
                    AUTONOMOUS ROUTER & OBSERVE
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {locale === 'de'
                    ? 'Autonomer Gemini-Router & System-Telemetrie'
                    : 'Autonomous Gemini Router & System Telemetry'}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {locale === 'de'
                    ? 'Analysiert die Komplexität jeder Führungsentscheidung und wählt automatisch das passende KI-Modell für Tempo oder tiefgehende Compliance-Prüfungen.'
                    : 'Inspects query complexity in real time and automatically routes between fast synthesis and deep multi-policy reasoning.'}
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
                      onClick={() => openLiveWorkspace('evaluate')}
                      className="hover:text-blue-600 text-left"
                    >
                      {locale === 'de'
                        ? 'Entscheidungen prüfen'
                        : 'Decision Audit Console'}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => openLiveWorkspace('brain')}
                      className="hover:text-blue-600 text-left"
                    >
                      {locale === 'de'
                        ? 'Unternehmenswissen (Company Brain)'
                        : 'Company Brain Knowledge Vault'}
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
                      onClick={() => setLocale('de')}
                      className="hover:text-blue-600"
                    >
                      Deutsch (Standard)
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setLocale('en')}
                      className="hover:text-blue-600"
                    >
                      English (EN)
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
                  {locale === 'de'
                    ? 'Firmen-E-Mail-Adresse *'
                    : 'Corporate Email Address *'}
                </label>
                <input
                  type="email"
                  required
                  value={authEmailInput}
                  onChange={(e) => setAuthEmailInput(e.target.value)}
                  placeholder="name@company.de"
                  className="w-full px-3.5 py-2.5 text-sm liquid-glass-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === 'de' ? 'Vollständiger Name' : 'Full Name'}
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
                  {locale === 'de' ? 'Abteilung / Rolle' : 'Department / Role'}
                </label>
                <select
                  value={authDeptInput}
                  onChange={(e) => setAuthDeptInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm liquid-glass-input"
                >
                  <option value="Executive Board">
                    {locale === 'de'
                      ? 'Vorstand / Geschäftsführung'
                      : 'Executive Board'}
                  </option>
                  <option value="Finance & Legal">
                    {locale === 'de' ? 'Finanzen & Recht' : 'Finance & Legal'}
                  </option>
                  <option value="Engineering">
                    {locale === 'de' ? 'Engineering & IT' : 'Engineering'}
                  </option>
                  <option value="HR & Legal">
                    {locale === 'de' ? 'Personal & Recht' : 'HR & Legal'}
                  </option>
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
                  {locale === 'de' ? 'Abbrechen' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm"
                >
                  {locale === 'de'
                    ? 'Speichern & E-Mail bestätigen'
                    : 'Save & Authenticate Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 2: LEFT-SIDEBAR WORKSPACE CANVAS (Evaluate Decision + Stacked Audit History, Company Brain, Connectors) */}
      {activeTab === 'vault' && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-4 print:max-w-none print:p-0 print:space-y-0">
          {tenantInfo && (
            <div className="bg-white rounded-xl border border-slate-200/85 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs print:hidden">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 font-extrabold text-slate-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>{tenantInfo.companyName}</span>
                </span>
              </div>
            </div>
          )}
          {/* Mobile-Only Compact User Identity Bar (Desktop uses the Left Sidebar) */}
          <div className="md:hidden bg-white rounded-xl border border-slate-200/85 px-3.5 py-2.5 flex items-center justify-between gap-3 print:hidden">
            <span className="text-xs font-mono text-slate-700 truncate">
              {locale === 'de' ? 'Angemeldet:' : 'Signed in:'}{' '}
              <strong>{userEmail}</strong>
            </span>
            {tenantInfo?.authMode === 'otp' && (
              <button
                type="button"
                onClick={handleTenantSignOut}
                className="text-xs font-semibold text-rose-600 underline shrink-0"
              >
                {locale === 'de' ? 'Abmelden' : 'Sign Out'}
              </button>
            )}
          </div>

          {/* SECTION 1: EVALUATE DECISION (Input Form on Top + Previous Audit Reports Stacked Directly Below) */}
          {workspaceSubTab === 'evaluate' && (
            <div className="space-y-5 print:space-y-0">
              {/* Top Card: Decision Proposal Input + Live Pipeline Checklist + Active Audit Report */}
              <div className="bg-white rounded-xl border border-slate-200/85 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-5 sm:p-6 space-y-4 print:shadow-none print:border-none print:p-0">
                <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
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

                {nextAuditExcludedIds.length > 0 && (
                  <div className="p-3.5 rounded-lg bg-amber-50/90 border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950 print:hidden">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <EyeOff className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-semibold">
                          {locale === 'de'
                            ? 'Temporärer Ausschluss nur für die nächste Entscheidungsprüfung aktiv:'
                            : 'Temporary exclusion active for the next decision evaluation only:'}
                        </div>
                        <div className="text-[11.5px] text-amber-800">
                          {documents
                            .filter((d) => isDocExcludedForNextAudit(d))
                            .map((d) => d.title)
                            .join(' · ')}{' '}
                          <span className="text-amber-700/90">
                            {locale === 'de'
                              ? '(wird im Prüfbericht vermerkt und danach automatisch wieder aktiviert)'
                              : '(recorded in the audit report and automatically re-enabled afterward)'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNextAuditExcludedIds([])}
                      className="h-7 px-2.5 rounded-md bg-white hover:bg-amber-100/60 border border-amber-300 text-[11.5px] font-semibold text-amber-900 shrink-0 transition-colors"
                    >
                      {locale === 'de'
                        ? 'Alle wieder aktivieren'
                        : 'Re-enable all'}
                    </button>
                  </div>
                )}

                <form
                  onSubmit={handleRunExecutiveAudit}
                  className="space-y-3 print:hidden"
                >
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
                      <select
                        aria-label="Department Scope"
                        value={auditDepartmentFilter}
                        onChange={(e) =>
                          setAuditDepartmentFilter(e.target.value)
                        }
                        className="h-8 px-2.5 rounded-md bg-white border border-slate-200/90 text-slate-700 font-medium text-[12px]"
                      >
                        <option value="all">
                          {locale === 'de'
                            ? 'Bereich: Alle zugelassenen Abteilungen'
                            : 'Scope: All Allowed Departments'}
                        </option>
                        {accessibleDepartments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.label}
                          </option>
                        ))}
                      </select>

                      <span className="text-slate-400 font-mono text-[11.5px] hidden sm:inline">
                        {locale === 'de' ? 'Prüfer:' : 'Auditor:'} {userEmail}
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
                  <div className="p-3.5 rounded-lg bg-slate-50/90 border border-slate-200/80 space-y-2 print:hidden">
                    <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-slate-600">
                      <span>
                        {locale === 'de'
                          ? 'Live-Audit-Pipeline'
                          : 'Live Audit Execution Pipeline'}
                      </span>
                      <span className="text-blue-600">
                        {auditCompletedSteps}/{AUDIT_PIPELINE_STEPS.length}{' '}
                        {locale === 'de' ? 'Abgeschlossen' : 'Completed'}
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
                                ? locale === 'de'
                                  ? '✓ Fertig'
                                  : '✓ Done'
                                : isCurrent
                                ? locale === 'de'
                                  ? 'Läuft...'
                                  : 'Running...'
                                : locale === 'de'
                                ? 'Wartend'
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
                  <div className="pt-4 border-t border-slate-200/80 space-y-3.5 print:border-none print:pt-0">
                    {/* Dedicated Official Executive Print Header (Visible only in Print/PDF) */}
                    <div className="hidden print:flex items-center justify-between pb-4 mb-2 border-b-2 border-slate-200">
                      <div className="flex items-center gap-3">
                        <img
                          src="/images/mindmittel-logo.svg"
                          alt="MindMittel Logo"
                          className="w-9 h-9 object-contain"
                        />
                        <div>
                          <div className="text-base font-bold text-slate-900">
                            {tenantInfo?.companyName || 'MindMittel'} —{' '}
                            {locale === 'de'
                              ? 'Vorstands-Prüfbericht'
                              : 'Executive Governance Audit Report'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {locale === 'de' ? 'Geprüfte Vorlage:' : 'Proposal:'}{' '}
                            &ldquo;{decisionProposal}&rdquo;
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-[11px] font-mono text-slate-500">
                        <div>
                          {new Date(auditReport.evaluatedAt).toLocaleString(
                            locale === 'de' ? 'de-DE' : 'en-US'
                          )}
                        </div>
                        <div>{lastAuditedByEmail}</div>
                      </div>
                    </div>

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
                            {locale === 'de' ? 'URTEIL:' : 'VERDICT:'}{' '}
                            {auditReport.verdict} ·{' '}
                            {locale === 'de' ? 'MODELL:' : 'MODEL:'}{' '}
                            {auditReport.selectedModelId} ·{' '}
                            {locale === 'de' ? 'PRÜFER:' : 'AUDITED BY:'}{' '}
                            {lastAuditedByEmail}
                          </div>
                          <div className="text-[14px] font-semibold tracking-[-0.01em] mt-0.5">
                            {auditReport.executiveSummary}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right font-mono">
                          <div className="text-lg font-bold">
                            {auditReport.alignmentScore}%
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {locale === 'de' ? 'Übereinstimmung' : 'Alignment'}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="h-8 px-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-[12px] font-semibold text-slate-700 inline-flex items-center gap-1.5 shadow-sm transition-colors print:hidden"
                          title={
                            locale === 'de'
                              ? 'Prüfbericht als PDF speichern'
                              : 'Save Audit Report as PDF'
                          }
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-600" />
                          <span>
                            {locale === 'de'
                              ? 'PDF herunterladen'
                              : 'Download PDF'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-200/80 text-[13px] text-slate-700 leading-relaxed">
                      <strong className="block text-[11px] font-mono font-semibold text-slate-500 uppercase mb-1">
                        {locale === 'de'
                          ? 'Strategische Richtlinien-Prüfung'
                          : 'Strategic Policy Cross-Examination'}
                      </strong>
                      {auditReport.strategicEvaluation}
                    </div>

                    {auditReport.excludedDocuments &&
                      auditReport.excludedDocuments.length > 0 && (
                        <div className="p-3.5 rounded-lg bg-amber-50/85 border border-amber-200/90 space-y-1.5">
                          <div className="flex items-center gap-2 text-[11px] font-mono font-semibold text-amber-900 uppercase">
                            <EyeOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span>
                              {locale === 'de'
                                ? 'Revisionshinweis: Bewusst ausgeschlossene Richtlinien bei dieser Prüfung'
                                : 'Audit Compliance Disclosure: Policies Intentionally Excluded from This Evaluation'}
                            </span>
                          </div>
                          <p className="text-[12px] text-amber-900 leading-relaxed">
                            {locale === 'de'
                              ? 'Die folgenden Dokumente wurden vom Prüfer für diese Einzelentscheidung temporär deaktiviert und nicht in die Bewertung einbezogen:'
                              : 'The following documents were temporarily excluded by the auditor for this single decision and were not factored into the verdict:'}
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {auditReport.excludedDocuments.map((exDoc) => (
                              <span
                                key={exDoc.parentId}
                                className="px-2.5 py-1 rounded-md bg-white border border-amber-300 text-[11.5px] font-semibold text-amber-950 inline-flex items-center gap-1.5"
                              >
                                <EyeOff className="w-3 h-3 text-amber-700" />
                                <span>{exDoc.title}</span>
                                <span className="font-mono text-[10.5px] text-amber-700">
                                  ({exDoc.department})
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* GERMAN REGULATORY & BETRIEBSRAT ADVISORY (DACH Pre-Decision Check + Company Brain Coverage) */}
                    {auditReport.germanAdvisory && (
                      <div className="p-4 rounded-lg bg-white border border-slate-200/90 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="text-[11px] font-mono font-semibold text-slate-500 uppercase">
                              {locale === 'de'
                                ? 'Gesetzliche Vorprüfung Deutschland & Betriebsrat'
                                : 'German Regulatory & Betriebsrat Advisory'}
                            </div>
                            <p className="text-[11.5px] text-slate-400 mt-0.5">
                              {locale === 'de'
                                ? auditReport.germanAdvisory.disclaimerDe
                                : auditReport.germanAdvisory.disclaimerEn}
                            </p>
                          </div>
                          {auditReport.germanAdvisory.betriebsratInvolvementRequired && (
                            <span className="px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-[11px] font-semibold text-rose-800">
                              {locale === 'de'
                                ? 'Betriebsrat einbinden'
                                : 'Betriebsrat involvement required'}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {auditReport.germanAdvisory.checks.map((check) => (
                            <div
                              key={check.framework}
                              className={`p-3 rounded-lg border space-y-1 ${
                                check.status === 'TRIGGERED'
                                  ? 'bg-rose-50/50 border-rose-200'
                                  : check.status === 'REVIEW'
                                  ? 'bg-amber-50/50 border-amber-200'
                                  : 'bg-slate-50/60 border-slate-200/80'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[12.5px] font-semibold text-slate-900">
                                  {check.label}
                                </span>
                                <span
                                  className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                    check.status === 'TRIGGERED'
                                      ? 'bg-rose-100 text-rose-800'
                                      : check.status === 'REVIEW'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {check.status === 'TRIGGERED'
                                    ? locale === 'de'
                                      ? 'BETROFFEN'
                                      : 'TRIGGERED'
                                    : check.status === 'REVIEW'
                                    ? locale === 'de'
                                      ? 'PRÜFEN'
                                      : 'REVIEW'
                                    : 'OK'}
                                </span>
                              </div>
                              <div className="text-[10.5px] font-mono text-slate-500">
                                {check.legalReference}
                              </div>
                              <p className="text-[12px] text-slate-700 leading-relaxed">
                                {locale === 'de' ? check.findingDe : check.findingEn}
                              </p>
                              {check.matchedSignals.length > 0 && (
                                <ul className="text-[11px] text-slate-500 list-disc pl-4">
                                  {check.matchedSignals.map((signal) => (
                                    <li key={signal}>{signal}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>

                        <div
                          className={`p-3 rounded-lg border flex flex-wrap items-center justify-between gap-3 ${
                            auditReport.germanAdvisory.knowledgeCoverage.status ===
                            'COVERED_BY_BRAIN'
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : auditReport.germanAdvisory.knowledgeCoverage.status ===
                                'PARTIAL_COVERAGE'
                              ? 'bg-amber-50/50 border-amber-200'
                              : 'bg-blue-50/50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <BookOpen className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <div className="text-[11px] font-mono font-semibold text-slate-600 uppercase">
                                {auditReport.germanAdvisory.knowledgeCoverage.status ===
                                'COVERED_BY_BRAIN'
                                  ? locale === 'de'
                                    ? 'Abdeckung im Company Brain'
                                    : 'Company Brain Coverage'
                                  : auditReport.germanAdvisory.knowledgeCoverage.status ===
                                    'PARTIAL_COVERAGE'
                                  ? locale === 'de'
                                    ? 'Teilweise Abdeckung im Company Brain'
                                    : 'Partial Company Brain Coverage'
                                  : locale === 'de'
                                  ? 'Wissenslücke im Company Brain'
                                  : 'Company Brain Knowledge Gap'}
                              </div>
                              <p className="text-[12px] text-slate-700 leading-relaxed">
                                {locale === 'de'
                                  ? auditReport.germanAdvisory.knowledgeCoverage.messageDe
                                  : auditReport.germanAdvisory.knowledgeCoverage.messageEn}
                              </p>
                            </div>
                          </div>

                          {auditReport.germanAdvisory.knowledgeCoverage.status !==
                            'COVERED_BY_BRAIN' && (
                            <button
                              type="button"
                              onClick={() =>
                                handleFillKnowledgeGap(
                                  auditReport.germanAdvisory!.knowledgeCoverage
                                    .suggestedTitle,
                                  auditReport.germanAdvisory!.knowledgeCoverage
                                    .suggestedDepartment
                                )
                              }
                              className="h-8 px-3 rounded-md bg-slate-900 hover:bg-blue-600 text-white text-[12px] font-medium shrink-0 transition-colors"
                            >
                              {locale === 'de'
                                ? '+ Richtlinie im Company Brain anlegen'
                                : '+ Add Policy to Company Brain'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="p-3.5 rounded-lg bg-emerald-50/40 border border-emerald-200/80 space-y-1.5">
                        <div className="text-[11px] font-mono font-semibold text-emerald-800 uppercase">
                          {locale === 'de' ? 'Vorteile' : 'Pros'}
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
                          {locale === 'de'
                            ? 'Risiken & Richtlinienkonflikte'
                            : 'Risks & Policy Conflicts'}
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
                          {locale === 'de'
                            ? 'Empfohlener Maßnahmenplan'
                            : 'Recommended Actionable Roadmap'}
                        </div>
                        <ul className="space-y-1 text-[12.5px] text-slate-800 font-medium">
                          {auditReport.roadmap.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                        <div className="text-[11px] font-mono font-semibold text-slate-600 uppercase">
                          {locale === 'de'
                            ? 'Zitierte Company-Brain-Richtlinien'
                            : 'Cited Company Brain Policies'}
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
              <div className="bg-white rounded-xl border border-slate-200/85 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-5 sm:p-6 space-y-4 print:hidden">
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
                    {auditHistory.length}{' '}
                    {locale === 'de' ? 'Gespeichert' : 'Saved'}
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
                              {locale === 'de' ? 'Von:' : 'By:'}{' '}
                              <strong>{item.auditedByEmail}</strong>
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              ·{' '}
                              {new Date(item.createdAt).toLocaleString(
                                locale === 'de' ? 'de-DE' : 'en-US'
                              )}
                            </span>
                          </div>

                          <div className="text-[13.5px] font-semibold text-slate-900 tracking-[-0.01em]">
                            &ldquo;{item.decisionProposal}&rdquo;
                          </div>

                          <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed">
                            {item.report.executiveSummary}
                          </p>

                          {item.report.excludedDocuments &&
                            item.report.excludedDocuments.length > 0 && (
                              <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-amber-900">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100/90 border border-amber-200 font-semibold">
                                  <EyeOff className="w-3 h-3 text-amber-700" />
                                  <span>
                                    {locale === 'de'
                                      ? 'Bei dieser Prüfung ausgeschlossen:'
                                      : 'Excluded from this evaluation:'}{' '}
                                    {item.report.excludedDocuments
                                      .map((d) => d.title)
                                      .join(', ')}
                                  </span>
                                </span>
                              </div>
                            )}
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
                            {locale === 'de' ? 'Bericht öffnen' : 'View Report'}
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
                        : `Attributed to your corporate email (${userEmail}) and stored in your Company Brain.`}
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
                      <span>
                        {locale === 'de'
                          ? 'PDF / PPTX / Bild / Audio'
                          : 'PDF / PPTX / Image / Audio'}
                      </span>
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
                      <span>
                        {locale === 'de' ? 'Sprachaufnahme' : 'Live Voice'}
                      </span>
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
                          {locale === 'de'
                            ? 'PDF, PowerPoint (.pptx), Bild, Audio (.mp3/.wav) oder Text hochladen'
                            : 'Upload PDF, PowerPoint (.pptx), Image, Audio (.mp3/.wav), or Text'}
                        </div>
                        <div className="text-slate-500 text-[12px]">
                          {locale === 'de'
                            ? 'Texte und Sprachinhalte werden automatisch extrahiert und unten eingefügt.'
                            : 'Multimodal extraction automatically transcribes text and audio into the editor below.'}
                        </div>
                      </div>
                    </div>

                    <label className="h-8 px-3.5 rounded-md bg-slate-900 hover:bg-blue-600 text-white text-[12px] font-medium cursor-pointer shrink-0 transition-colors inline-flex items-center">
                      <span>
                        {isExtractingMedia
                          ? locale === 'de'
                            ? 'Verarbeitung...'
                            : 'Processing...'
                          : locale === 'de'
                          ? 'Datei auswählen'
                          : 'Choose File'}
                      </span>
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
                            ? locale === 'de'
                              ? 'Live-Sprachaufnahme läuft...'
                              : 'Recording Live Voice Dictation...'
                            : locale === 'de'
                            ? 'Richtlinie oder Besprechungsnotiz per Sprache diktieren'
                            : 'Record Policy or Meeting Note by Voice'}
                        </div>
                        <div className="text-slate-500 text-[12px]">
                          {locale === 'de'
                            ? 'Die Aufnahme wird automatisch als strukturierter Text für Ihr Company Brain transkribiert.'
                            : 'Audio is automatically transcribed into structured text for Company Brain indexing.'}
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
                        <span>
                          {locale === 'de'
                            ? 'Aufnahme starten'
                            : 'Start Recording'}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopLiveVoiceRecording}
                        className="h-8 px-3.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-medium flex items-center gap-1.5 shrink-0"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>
                          {locale === 'de'
                            ? 'Stoppen & transkribieren'
                            : 'Stop & Transcribe'}
                        </span>
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
                        {accessibleDepartments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {locale === 'de'
                              ? `Abteilung: ${dept.label}`
                              : `Department: ${dept.label}`}
                          </option>
                        ))}
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
                        : 'Policy text or transcribed content (automatically indexed into your Company Brain)...'
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
                        {locale === 'de' ? (
                          <>
                            Autor: <strong>{userEmail}</strong> · Isolierter
                            Company Brain
                          </>
                        ) : (
                          <>
                            Author attribution: <strong>{userEmail}</strong> ·
                            Isolated Company Brain
                          </>
                        )}
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
                          ? locale === 'de'
                            ? 'Wird gespeichert...'
                            : 'Saving...'
                          : locale === 'de'
                          ? 'Ins Company Brain speichern'
                          : 'Save to Company Brain'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>

              {/* MIDDLE SECTION: KNOWLEDGE CONFLICT WARNINGS (Placed directly between Ingestion Box and Indexed Brain Documents List) */}
              {brainConflicts.length > 0 && (
                <div className="w-full bg-rose-50/70 rounded-xl border border-rose-200/90 shadow-[0_1px_3px_rgba(225,29,72,0.06)] p-5 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold tracking-[-0.015em] text-rose-950">
                          {locale === 'de'
                            ? 'Konfliktwarnung im Company Brain (Widersprüchliche Richtlinien erkannt)'
                            : 'Knowledge Conflict Warning — Contradictory Brain Data Detected'}
                        </h3>
                        <p className="text-[12px] text-rose-700">
                          {locale === 'de'
                            ? 'Bitte bearbeiten Sie das fehlerhafte Dokument direkt online in der Datenbank oder löschen Sie den veralteten Eintrag.'
                            : 'Review conflicting clauses below: edit the inaccurate document directly online in the database, download a backup, or delete the outdated entry.'}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-md bg-rose-100 border border-rose-200 text-[11px] font-mono font-semibold text-rose-800">
                      {brainConflicts.length}{' '}
                      {locale === 'de'
                        ? brainConflicts.length === 1
                          ? 'Konflikt'
                          : 'Konflikte'
                        : brainConflicts.length === 1
                        ? 'Conflict'
                        : 'Conflicts'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {brainConflicts.map((conflict) => (
                      <div
                        key={conflict.conflictId}
                        className="p-4 rounded-lg bg-white border border-rose-200/90 space-y-3 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                          <span className="text-[12.5px] font-semibold text-rose-800">
                            {locale === 'de'
                              ? conflict.conflictReasonDe
                              : conflict.conflictReasonEn}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {locale === 'de'
                              ? 'Themen-Ähnlichkeit:'
                              : 'Topic Similarity:'}{' '}
                            {Math.round(conflict.similarityScore * 100)}%
                          </span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {[
                            {
                              badge:
                                locale === 'de'
                                  ? 'Neuerer Eintrag'
                                  : 'Newer Document',
                              doc: conflict.newerDocument,
                            },
                            {
                              badge:
                                locale === 'de'
                                  ? 'Bestehende Richtlinie'
                                  : 'Existing Document in Brain',
                              doc: conflict.existingDocument,
                            },
                          ].map(({ badge, doc }) => (
                            <div
                              key={doc.parentId}
                              className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-200/90 flex flex-col justify-between gap-3"
                            >
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center justify-between gap-1.5">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-slate-200/80 text-slate-700">
                                    {badge}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-500">
                                    {doc.department} ·{' '}
                                    {doc.createdByEmail ??
                                      'governance-board@mindmittel.de'}
                                  </span>
                                </div>

                                <div className="text-[13.5px] font-semibold text-slate-900">
                                  {doc.title}
                                </div>

                                <p className="text-[12px] text-slate-600 leading-relaxed line-clamp-3">
                                  {doc.content}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/70">
                                {!doc.isExternalSource ? (
                                  <button
                                    type="button"
                                    onClick={() => openOnlineDocumentEditor(doc)}
                                    className="h-7 px-2.5 rounded-md bg-slate-900 hover:bg-blue-600 text-white text-[11.5px] font-medium flex items-center gap-1.5 transition-colors"
                                  >
                                    <Pencil className="w-3 h-3" />
                                    <span>
                                      {locale === 'de'
                                        ? 'Online bearbeiten'
                                        : 'Edit Online'}
                                    </span>
                                  </button>
                                ) : (
                                  <span className="h-7 px-2.5 rounded-md bg-slate-100 border border-slate-200/90 text-slate-600 text-[11px] font-medium inline-flex items-center gap-1.5">
                                    <Lock className="w-3 h-3 text-slate-400" />
                                    <span>
                                      {locale === 'de'
                                        ? 'Nur im Quellsystem änderbar'
                                        : 'Edit in source system only'}
                                    </span>
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => toggleExcludeForNextAudit(doc)}
                                  className={`h-7 px-2.5 rounded-md border text-[11.5px] font-medium flex items-center gap-1.5 transition-colors ${
                                    isDocExcludedForNextAudit(doc)
                                      ? 'bg-amber-100 border-amber-300 text-amber-950'
                                      : 'bg-white hover:bg-slate-100 border-slate-200/90 text-slate-700'
                                  }`}
                                >
                                  {isDocExcludedForNextAudit(doc) ? (
                                    <Eye className="w-3 h-3 text-amber-700" />
                                  ) : (
                                    <EyeOff className="w-3 h-3 text-slate-500" />
                                  )}
                                  <span>
                                    {isDocExcludedForNextAudit(doc)
                                      ? locale === 'de'
                                        ? '1× Ausgeschlossen'
                                        : '1× Excluded'
                                      : locale === 'de'
                                      ? 'Für nächste Prüfung ausschließen'
                                      : 'Exclude for next audit'}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDownloadDocument(doc)}
                                  className="h-7 px-2.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200/90 text-slate-700 text-[11.5px] font-medium flex items-center gap-1.5 transition-colors"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>
                                    {locale === 'de'
                                      ? 'Herunterladen'
                                      : 'Download'}
                                  </span>
                                </button>

                                {!doc.isExternalSource && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteDocument(doc.parentId)
                                    }
                                    className="h-7 px-2.5 rounded-md bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11.5px] font-medium flex items-center gap-1.5 transition-colors ml-auto"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>
                                      {locale === 'de' ? 'Löschen' : 'Delete'}
                                    </span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ONLINE IN-PLACE DOCUMENT EDITOR MODAL */}
              {editingDocId && (
                <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-[15.5px] font-semibold text-slate-900">
                          {locale === 'de'
                            ? 'Richtlinie bearbeiten'
                            : 'Edit Company Policy'}
                        </h3>
                        <p className="text-[12px] text-slate-500">
                          {locale === 'de'
                            ? 'Änderungen aktualisieren sofort das Dokument und prüfen auf Konflikte.'
                            : 'Saving updates the policy in place and re-runs conflict checks.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingDocId(null)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-700"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleUpdateDocument} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11.5px] font-medium text-slate-600 mb-1">
                            {locale === 'de'
                              ? 'Dokumenttitel'
                              : 'Document Title'}
                          </label>
                          <input
                            type="text"
                            required
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full h-9 px-3 text-[13px] liquid-glass-input"
                          />
                        </div>

                        <div>
                          <label className="block text-[11.5px] font-medium text-slate-600 mb-1">
                            {locale === 'de' ? 'Abteilung' : 'Department'}
                          </label>
                          <select
                            aria-label="Edit Department"
                            value={editDepartment}
                            onChange={(e) => setEditDepartment(e.target.value)}
                            className="w-full h-9 px-3 text-[13px] liquid-glass-input"
                          >
                            {accessibleDepartments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.label}
                              </option>
                            ))}
                            {!accessibleDepartments.some(
                              (d) =>
                                d.id.toLowerCase() ===
                                editDepartment.trim().toLowerCase()
                            ) &&
                              editDepartment.trim() && (
                                <option value={editDepartment}>
                                  {editDepartment}
                                </option>
                              )}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11.5px] font-medium text-slate-600 mb-1">
                          {locale === 'de'
                            ? 'Richtlinientext (widersprüchliche Zahlen oder Klauseln direkt korrigieren)'
                            : 'Policy Content (Fix conflicting numbers or clauses here)'}
                        </label>
                        <textarea
                          rows={6}
                          required
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-3 text-[13.5px] leading-relaxed liquid-glass-input"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingDocId(null)}
                          className="h-8 px-3.5 rounded-md text-[12.5px] font-medium text-slate-600 hover:bg-slate-100"
                        >
                          {locale === 'de' ? 'Abbrechen' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          disabled={isUpdatingDoc}
                          className="h-8 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-medium shadow-sm"
                        >
                          {isUpdatingDoc
                            ? locale === 'de'
                              ? 'Wird gespeichert...'
                              : 'Saving...'
                            : locale === 'de'
                            ? 'Änderungen speichern'
                            : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

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
                    {documents.length}{' '}
                    {locale === 'de' ? 'Gespeichert' : 'Indexed'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {documents.map((doc) => (
                    <div
                      key={doc.parentId}
                      className="px-3.5 py-3 rounded-lg bg-slate-50/60 border border-slate-200/85 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[13.5px] font-semibold text-slate-900 truncate tracking-[-0.01em]">
                            {doc.title}
                          </span>
                          {doc.isExternalSource && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-200/75 text-slate-600 text-[10px] font-mono font-semibold inline-flex items-center gap-1 shrink-0">
                              <Lock className="w-2.5 h-2.5" />
                              <span>
                                {locale === 'de'
                                  ? 'Quellsystem (Read-Only)'
                                  : 'External Source (Read-Only)'}
                              </span>
                            </span>
                          )}
                          {isDocExcludedForNextAudit(doc) && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-mono font-semibold inline-flex items-center gap-1 shrink-0">
                              <EyeOff className="w-2.5 h-2.5" />
                              <span>
                                {locale === 'de'
                                  ? '1× Ausgeschlossen'
                                  : '1× Excluded'}
                              </span>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] font-mono text-slate-500 mt-0.5">
                          <span>{doc.department}</span>
                          <span>·</span>
                          <span className="text-blue-600 font-medium">
                            {doc.sectionCount && doc.sectionCount > 1
                              ? `${doc.sectionCount} ${locale === 'de' ? 'Abschnitte' : 'sections'}`
                              : `${doc.childCount} ${locale === 'de' ? 'Abschnitte' : 'sections'}`}
                          </span>
                          <span>·</span>
                          <span className="text-slate-500 truncate">
                            {doc.createdByEmail ?? 'governance-board@mindmittel.de'}
                          </span>
                          {doc.createdAt && (
                            <>
                              <span>·</span>
                              <span className="text-slate-400">
                                {new Date(doc.createdAt).toLocaleString(
                                  locale === 'de' ? 'de-DE' : 'en-US',
                                  {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleExcludeForNextAudit(doc)}
                          className={`h-7 px-2 rounded-md flex items-center gap-1 text-[11px] font-medium transition-colors ${
                            isDocExcludedForNextAudit(doc)
                              ? 'bg-amber-100 border border-amber-300 text-amber-900'
                              : 'text-slate-500 hover:text-amber-800 hover:bg-amber-50'
                          }`}
                          title={
                            locale === 'de'
                              ? 'Nur für die nächste Entscheidungsprüfung ausschließen (danach automatisch wieder aktiv)'
                              : 'Exclude for the next decision evaluation only (auto re-enables after)'
                          }
                        >
                          {isDocExcludedForNextAudit(doc) ? (
                            <Eye className="w-3.5 h-3.5 text-amber-700" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline">
                            {isDocExcludedForNextAudit(doc)
                              ? locale === 'de'
                                ? 'Aktivieren'
                                : 'Re-enable'
                              : locale === 'de'
                              ? '1× Ausblenden'
                              : '1× Exclude'}
                          </span>
                        </button>

                        {!doc.isExternalSource && (
                          <button
                            type="button"
                            onClick={() =>
                              openOnlineDocumentEditor({
                                parentId: doc.parentId,
                                title: doc.title,
                                department: doc.department,
                                content: doc.contentPreview,
                                tags: doc.tags,
                              })
                            }
                            className="h-7 w-7 rounded-md flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit Document Online"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadDocument({
                              parentId: doc.parentId,
                              title: doc.title,
                              department: doc.department,
                              content: doc.contentPreview,
                              createdByEmail: doc.createdByEmail,
                            })
                          }
                          className="h-7 w-7 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
                          title="Download Document (.txt)"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {(!doc.isExternalSource || tenantInfo?.isDemo) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.parentId)}
                            className="h-7 w-7 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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
                                  {conn.lastSyncedAt && (
                                    <span className="text-[11px] font-mono text-slate-400">
                                      ·{' '}
                                      {locale === 'de'
                                        ? 'Synchronisiert:'
                                        : 'Synced:'}{' '}
                                      {new Date(conn.lastSyncedAt).toLocaleString(
                                        locale === 'de' ? 'de-DE' : 'en-US',
                                        {
                                          year: 'numeric',
                                          month: '2-digit',
                                          day: '2-digit',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        }
                                      )}
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
                                    ? locale === 'de'
                                      ? 'Zugangsdaten aktualisieren'
                                      : 'Update Credentials'
                                    : locale === 'de'
                                    ? 'Zugangsdaten eingeben'
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
                                      ? locale === 'de'
                                        ? 'Synchronisiere...'
                                        : 'Syncing...'
                                      : locale === 'de'
                                      ? 'Jetzt synchronisieren'
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
                                    placeholder={
                                      locale === 'de'
                                        ? 'API-Token / OAuth-Schlüssel einfügen...'
                                        : 'Paste API Token / OAuth Secret...'
                                    }
                                    className="w-full h-8 px-2.5 text-xs font-mono liquid-glass-input"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                    {locale === 'de'
                                      ? 'Ziel-Kanal / Bereich / Ordner'
                                      : 'Target Channel / Space / Meeting Series'}
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
                                    {locale === 'de' ? 'Abbrechen' : 'Cancel'}
                                  </button>
                                  <button
                                    type="submit"
                                    className="h-7 px-3 rounded-md bg-slate-900 hover:bg-blue-600 text-white text-xs font-medium"
                                  >
                                    {locale === 'de'
                                      ? 'Speichern & aktivieren'
                                      : 'Save & Switch ON'}
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

          {/* SECTION 4: COMPANY ADMIN TEAM & ACCESS GOVERNANCE (Admin Only) */}
          {workspaceSubTab === 'team' && canAccessTeamTab && (
            <TeamAccessPanel
              locale={locale}
              currentUserEmail={userEmail}
              onDepartmentsChanged={(nextDepts) => {
                if (nextDepts.length > 0) {
                  setTenantDepartments(nextDepts);
                }
              }}
              onPendingCountChanged={setPendingUsersCount}
            />
          )}
        </div>
      )}
    </AppShell>
  );
}
