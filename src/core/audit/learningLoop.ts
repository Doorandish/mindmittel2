import type { AuditVerdict } from '@/core/audit/decisionEvaluator';

export type FeedbackType = 'helpful' | 'correction';

export type AffectedAuditLayer =
  | 'BetrVG'
  | 'DSGVO'
  | 'EU_AI_ACT'
  | 'NIS2'
  | 'Internal_Policy'
  | 'Scoring';

export type DiagnosticCode =
  | 'PRIOR_APPROVAL_EXISTS'
  | 'WRONG_STATUTE_TRIGGERED'
  | 'SCORE_TOO_STRICT'
  | 'SCORE_TOO_LENIENT'
  | 'POLICY_RETRIEVAL_MISS'
  | 'GERMAN_TONE_OR_CLARITY'
  | 'COMPANY_EXCEPTION';

export type PrecedentStatus = 'pending' | 'approved' | 'rejected' | 'revoked';

export interface CompanyPrecedentRecord {
  id: string;
  tenantSlug: string;
  auditId?: string;
  title: string;
  ruleSummary: string;
  department: string;
  affectedLayer: AffectedAuditLayer;
  diagnosticCode: DiagnosticCode;
  /** ISO date string (YYYY-MM-DD) or null for indefinite (with periodic review recommendation). */
  validUntil: string | null;
  status: PrecedentStatus;
  submittedByEmail: string;
  submittedAt: string;
  reviewedByEmail?: string | null;
  reviewedAt?: string | null;
  revokedByEmail?: string | null;
  revokedAt?: string | null;
  embedding?: number[];
}

export interface MatchedPrecedentPromptInput {
  title: string;
  ruleSummary: string;
  department: string;
  approvedByEmail: string;
  validUntil: string | null;
}

/**
 * Strictly privacy-preserving diagnostic telemetry record stored on the central control plane.
 * Architecturally contains ZERO free-text content, ZERO proposal text, and ZERO company secrets.
 */
export interface PlatformFeedbackTelemetryRecord {
  id: string;
  tenantSlug: string;
  companyName: string;
  feedbackType: FeedbackType;
  affectedLayer: AffectedAuditLayer;
  diagnosticCode: DiagnosticCode;
  modelUsed: string;
  initialVerdict: AuditVerdict;
  initialScore: number;
  precedentStatus: PrecedentStatus | null;
  createdAt: string;
}

export interface ClarificationChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface DraftCompanyPrecedent {
  title: string;
  ruleSummary: string;
  department: string;
  affectedLayer: AffectedAuditLayer;
  diagnosticCode: DiagnosticCode;
  validUntil: string | null;
}

export interface ClarificationReplyResult {
  assistantReply: string;
  quickChips: string[];
  readyToSubmit: boolean;
  draftPrecedent: DraftCompanyPrecedent | null;
}

export interface PlatformTelemetrySummary {
  totalCount: number;
  helpfulCount: number;
  correctionCount: number;
  helpfulRatePct: number;
  byLayer: Record<AffectedAuditLayer, number>;
  byDiagnosticCode: Record<DiagnosticCode, number>;
  tenants: Array<{ slug: string; companyName: string; count: number }>;
  recentRecords: PlatformFeedbackTelemetryRecord[];
}

export const ALL_AFFECTED_LAYERS: readonly AffectedAuditLayer[] = [
  'BetrVG',
  'DSGVO',
  'EU_AI_ACT',
  'NIS2',
  'Internal_Policy',
  'Scoring',
];

export const ALL_DIAGNOSTIC_CODES: readonly DiagnosticCode[] = [
  'PRIOR_APPROVAL_EXISTS',
  'WRONG_STATUTE_TRIGGERED',
  'SCORE_TOO_STRICT',
  'SCORE_TOO_LENIENT',
  'POLICY_RETRIEVAL_MISS',
  'GERMAN_TONE_OR_CLARITY',
  'COMPANY_EXCEPTION',
];

/**
 * Parses an optional YYYY-MM-DD (or ISO) expiration string safely.
 * Returns end-of-day UTC timestamp for date-only values so the listed date remains valid all day.
 */
function parseValidUntilMs(validUntil: string | null | undefined): number | null {
  if (!validUntil || !validUntil.trim()) return null;
  const trimmed = validUntil.trim();
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnlyMatch) {
    return Date.UTC(
      Number(dateOnlyMatch[1]),
      Number(dateOnlyMatch[2]) - 1,
      Number(dateOnlyMatch[3]),
      23,
      59,
      59,
      999
    );
  }
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

export function isPrecedentExpired(
  precedent: Pick<CompanyPrecedentRecord, 'status' | 'validUntil'>,
  now: Date = new Date()
): boolean {
  if (precedent.status !== 'approved') return false;
  const expiryMs = parseValidUntilMs(precedent.validUntil);
  if (expiryMs === null) return false;
  return expiryMs < now.getTime();
}

export function isPrecedentCurrentlyActive(
  precedent: Pick<CompanyPrecedentRecord, 'status' | 'validUntil'>,
  now: Date = new Date()
): boolean {
  if (precedent.status !== 'approved') return false;
  return !isPrecedentExpired(precedent, now);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

function computeKeywordOverlap(query: string, candidate: string): number {
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9äöüß]+/i)
    .filter((w) => w.length >= 3);
  if (tokens.length === 0) return 0;
  const lower = candidate.toLowerCase();
  let hits = 0;
  for (const token of tokens) {
    if (lower.includes(token)) hits += 1;
  }
  return hits / tokens.length;
}

/**
 * Selects up to `maxCount` active, non-expired, department-authorized company precedents
 * ranked by hybrid semantic + keyword relevance.
 */
export function selectRelevantActivePrecedents(
  precedents: readonly CompanyPrecedentRecord[],
  queryEmbedding: number[],
  queryText: string,
  allowedDepartments: readonly string[] | '*',
  maxCount = 3,
  now: Date = new Date()
): CompanyPrecedentRecord[] {
  const allowAll =
    allowedDepartments === '*' ||
    (Array.isArray(allowedDepartments) &&
      (allowedDepartments.length === 0 || allowedDepartments.includes('*')));

  const normalizedAllowed = new Set(
    Array.isArray(allowedDepartments)
      ? allowedDepartments.map((d) => d.trim().toLowerCase())
      : []
  );

  const eligible = precedents.filter((p) => {
    if (!isPrecedentCurrentlyActive(p, now)) return false;
    if (allowAll) return true;
    const dept = (p.department || '*').trim().toLowerCase();
    return dept === '*' || dept === 'all' || normalizedAllowed.has(dept);
  });

  const scored = eligible.map((p) => {
    const vectorScore =
      p.embedding && p.embedding.length === queryEmbedding.length
        ? Math.max(0, cosineSimilarity(queryEmbedding, p.embedding))
        : 0;
    const keywordScore = computeKeywordOverlap(
      queryText,
      `${p.title} ${p.ruleSummary} ${p.affectedLayer}`
    );
    const combined = vectorScore * 0.65 + keywordScore * 0.35;
    return { precedent: p, score: combined };
  });

  return scored
    .filter((s) => s.score >= 0.12)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCount)
    .map((s) => s.precedent);
}

/**
 * Architecturally whitelists ONLY non-sensitive diagnostic telemetry fields.
 * Any free-text, proposal, or secret keys passed accidentally are strictly stripped.
 */
export function sanitizeTelemetryRecord(
  input: Record<string, unknown> & Partial<PlatformFeedbackTelemetryRecord>
): PlatformFeedbackTelemetryRecord {
  const feedbackType: FeedbackType =
    input.feedbackType === 'helpful' ? 'helpful' : 'correction';

  const affectedLayer: AffectedAuditLayer = ALL_AFFECTED_LAYERS.includes(
    input.affectedLayer as AffectedAuditLayer
  )
    ? (input.affectedLayer as AffectedAuditLayer)
    : 'Internal_Policy';

  const diagnosticCode: DiagnosticCode = ALL_DIAGNOSTIC_CODES.includes(
    input.diagnosticCode as DiagnosticCode
  )
    ? (input.diagnosticCode as DiagnosticCode)
    : 'COMPANY_EXCEPTION';

  const initialVerdict: AuditVerdict =
    input.initialVerdict === 'CERTIFIED' ||
    input.initialVerdict === 'POLICY_CONFLICT'
      ? input.initialVerdict
      : 'CONDITIONAL';

  const precedentStatus: PrecedentStatus | null =
    input.precedentStatus === 'pending' ||
    input.precedentStatus === 'approved' ||
    input.precedentStatus === 'rejected' ||
    input.precedentStatus === 'revoked'
      ? input.precedentStatus
      : null;

  return {
    id: String(input.id || `tel-${Date.now()}`),
    tenantSlug: String(input.tenantSlug || 'unknown').toLowerCase().slice(0, 64),
    companyName: String(input.companyName || 'Unknown Company').slice(0, 120),
    feedbackType,
    affectedLayer,
    diagnosticCode,
    modelUsed: String(input.modelUsed || 'unknown').slice(0, 80),
    initialVerdict,
    initialScore: Math.max(0, Math.min(100, Math.round(Number(input.initialScore) || 0))),
    precedentStatus,
    createdAt: String(input.createdAt || new Date().toISOString()),
  };
}

export function aggregatePlatformTelemetry(
  records: readonly PlatformFeedbackTelemetryRecord[],
  tenantSlugFilter?: string
): PlatformTelemetrySummary {
  const tenantMap = new Map<string, { slug: string; companyName: string; count: number }>();
  for (const r of records) {
    const existing = tenantMap.get(r.tenantSlug);
    if (existing) {
      existing.count += 1;
    } else {
      tenantMap.set(r.tenantSlug, {
        slug: r.tenantSlug,
        companyName: r.companyName,
        count: 1,
      });
    }
  }

  const normalizedFilter = tenantSlugFilter?.trim().toLowerCase();
  const filtered =
    normalizedFilter && normalizedFilter !== 'all'
      ? records.filter((r) => r.tenantSlug.toLowerCase() === normalizedFilter)
      : [...records];

  const byLayer: Record<AffectedAuditLayer, number> = {
    BetrVG: 0,
    DSGVO: 0,
    EU_AI_ACT: 0,
    NIS2: 0,
    Internal_Policy: 0,
    Scoring: 0,
  };

  const byDiagnosticCode: Record<DiagnosticCode, number> = {
    PRIOR_APPROVAL_EXISTS: 0,
    WRONG_STATUTE_TRIGGERED: 0,
    SCORE_TOO_STRICT: 0,
    SCORE_TOO_LENIENT: 0,
    POLICY_RETRIEVAL_MISS: 0,
    GERMAN_TONE_OR_CLARITY: 0,
    COMPANY_EXCEPTION: 0,
  };

  let helpfulCount = 0;
  let correctionCount = 0;

  for (const r of filtered) {
    if (r.feedbackType === 'helpful') {
      helpfulCount += 1;
    } else {
      correctionCount += 1;
    }
    byLayer[r.affectedLayer] = (byLayer[r.affectedLayer] ?? 0) + 1;
    byDiagnosticCode[r.diagnosticCode] =
      (byDiagnosticCode[r.diagnosticCode] ?? 0) + 1;
  }

  const totalCount = filtered.length;
  const helpfulRatePct =
    totalCount > 0 ? Math.round((helpfulCount / totalCount) * 100) : 0;

  const recentRecords = [...filtered]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 100);

  return {
    totalCount,
    helpfulCount,
    correctionCount,
    helpfulRatePct,
    byLayer,
    byDiagnosticCode,
    tenants: Array.from(tenantMap.values()).sort((a, b) => b.count - a.count),
    recentRecords,
  };
}

function inferLayerFromText(text: string): AffectedAuditLayer {
  const lower = text.toLowerCase();
  if (/betriebsrat|betrvg|mitbestimmung|works council|betriebsvereinbarung/.test(lower)) {
    return 'BetrVG';
  }
  if (/dsgvo|gdpr|datenschutz|avv|dsfa|dpia|bdsg/.test(lower)) {
    return 'DSGVO';
  }
  if (/ai act|ki-verordnung|hoch\s*risiko|emotion/.test(lower)) {
    return 'EU_AI_ACT';
  }
  if (/nis-?2|bsig|kritis|cyber/.test(lower)) {
    return 'NIS2';
  }
  if (/score|punkt|streng|strict|mild|lenient/.test(lower)) {
    return 'Scoring';
  }
  return 'Internal_Policy';
}

function inferDiagnosticCodeFromText(text: string): DiagnosticCode {
  const lower = text.toLowerCase();
  if (/genehmig|freigabe|vereinbarung|erlaubnis|already approved|prior approval|haben.*lizenz|haben.*erlaubnis|مجوز/.test(lower)) {
    return 'PRIOR_APPROVAL_EXISTS';
  }
  if (/falsch.*gesetz|trifft nicht zu|nicht anwendbar|wrong statute|irrelevant/.test(lower)) {
    return 'WRONG_STATUTE_TRIGGERED';
  }
  if (/zu streng|too strict|überzogen/.test(lower)) {
    return 'SCORE_TOO_STRICT';
  }
  if (/zu mild|übersehen|too lenient|missed risk/.test(lower)) {
    return 'SCORE_TOO_LENIENT';
  }
  if (/dokument.*nicht gefunden|richtlinie.*übersehen|not found/.test(lower)) {
    return 'POLICY_RETRIEVAL_MISS';
  }
  if (/sprache|ton|formulierung|tone|translation/.test(lower)) {
    return 'GERMAN_TONE_OR_CLARITY';
  }
  return 'COMPANY_EXCEPTION';
}

function extractExplicitValidityDate(text: string, now: Date = new Date()): string | null | undefined {
  const isoMatch = /\b(20\d{2}-\d{2}-\d{2})\b/.exec(text);
  if (isoMatch) return isoMatch[1];

  const deDateMatch = /\b(\d{1,2})\.(\d{1,2})\.(20\d{2})\b/.exec(text);
  if (deDateMatch) {
    const day = deDateMatch[1].padStart(2, '0');
    const month = deDateMatch[2].padStart(2, '0');
    return `${deDateMatch[3]}-${month}-${day}`;
  }

  const lower = text.toLowerCase();
  if (/unbefristet|indefinite|no expiry|kein ablauf|نامحدود/.test(lower)) {
    return null;
  }
  if (/6\s*(monat|month)/.test(lower)) {
    const d = new Date(now);
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().slice(0, 10);
  }
  if (/12\s*(monat|month)|1\s*(jahr|year)/.test(lower)) {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  }
  return undefined;
}

/**
 * Deterministic 1-to-2 turn micro-chat clarifier (used directly or as zero-downtime fallback).
 * Ensures the user is never stuck in an endless chat and always produces a structured draft precedent.
 */
export function buildDeterministicClarificationReply(params: {
  messages: readonly ClarificationChatMessage[];
  locale: 'en' | 'de';
  defaultDepartment: string;
  now?: Date;
}): ClarificationReplyResult {
  const { messages, locale, defaultDepartment, now = new Date() } = params;
  const userMessages = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.text.trim())
    .filter(Boolean);

  const combinedText = userMessages.join(' — ');
  const extractedValidity = extractExplicitValidityDate(combinedText, now);
  const userTurns = userMessages.length;

  // Turn 1: If expiration/validity wasn't mentioned yet, ask concisely with 1-click quick chips
  if (userTurns === 1 && extractedValidity === undefined) {
    return {
      assistantReply:
        locale === 'de'
          ? 'Verstanden. Damit Ihr Firmen-Admin diese Regel sauber freigeben kann, nennen Sie bitte kurz: 1) Bis wann ist diese Ausnahme/Genehmigung gültig (z. B. Datum, 12 Monate oder unbefristet)? 2) Gibt es Einschränkungen beim Geltungsbereich (z. B. ohne bestimmte Zusatzfunktionen)?'
          : 'Got it. So your Company Admin can approve this precedent cleanly, please clarify briefly: 1) Until when is this approval/exception valid (e.g., exact date, 12 months, or indefinite)? 2) Are there any scope limitations (e.g., excluding specific add-ons or departments)?',
      quickChips:
        locale === 'de'
          ? ['Gültig 6 Monate', 'Gültig 12 Monate', 'Unbefristet (jährliche Prüfung)']
          : ['Valid 6 months', 'Valid 12 months', 'Indefinite (annual review)'],
      readyToSubmit: false,
      draftPrecedent: null,
    };
  }

  const affectedLayer = inferLayerFromText(combinedText);
  const diagnosticCode = inferDiagnosticCodeFromText(combinedText);
  const firstSentence = userMessages[0] ?? 'Company Governance Precedent';
  const title =
    firstSentence.length > 68
      ? `${firstSentence.slice(0, 65).trim()}…`
      : firstSentence;

  const validUntil = extractedValidity === undefined ? null : extractedValidity;

  return {
    assistantReply:
      locale === 'de'
        ? 'Perfekt — ich habe einen strukturierten Regel-Entwurf erstellt. Prüfen Sie die Angaben unten und senden Sie ihn mit einem Klick zur Freigabe an Ihren Firmen-Admin.'
        : 'Perfect — I have drafted a structured company precedent below. Review the fields and submit it for your Company Admin’s approval with one click.',
    quickChips: [],
    readyToSubmit: true,
    draftPrecedent: {
      title,
      ruleSummary: combinedText.slice(0, 600),
      department: defaultDepartment || '*',
      affectedLayer,
      diagnosticCode,
      validUntil,
    },
  };
}
