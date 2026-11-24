import crypto from 'node:crypto';
import {
  aggregatePlatformTelemetry,
  sanitizeTelemetryRecord,
  selectRelevantActivePrecedents,
  type AffectedAuditLayer,
  type CompanyPrecedentRecord,
  type DiagnosticCode,
  type FeedbackType,
  type PlatformFeedbackTelemetryRecord,
  type PlatformTelemetrySummary,
  type PrecedentStatus,
} from '@/core/audit/learningLoop';
import type { AuditVerdict } from '@/core/audit/decisionEvaluator';
import { generateDeterministicSemanticEmbedding } from '@/core/rag/vectorMath';
import { generateGeminiEmbedding768 } from '@/infrastructure/gemini/embeddingService';
import { getControlPlaneDb, getMindMittelDb } from '@/infrastructure/db/mongo';
import { COLLECTIONS } from '@/infrastructure/db/schemas';
import { systemLogger } from '@/infrastructure/logging/logger';

declare global {
  // eslint-disable-next-line no-var
  var __mindmittelPrecedentStore:
    | Map<string, CompanyPrecedentRecord[]>
    | undefined;
  // eslint-disable-next-line no-var
  var __mindmittelTelemetryStore:
    | PlatformFeedbackTelemetryRecord[]
    | undefined;
}

function getMemoryPrecedentStore(): Map<string, CompanyPrecedentRecord[]> {
  if (!globalThis.__mindmittelPrecedentStore) {
    globalThis.__mindmittelPrecedentStore = new Map();
  }
  return globalThis.__mindmittelPrecedentStore;
}

function getMemoryTelemetryStore(): PlatformFeedbackTelemetryRecord[] {
  if (!globalThis.__mindmittelTelemetryStore) {
    globalThis.__mindmittelTelemetryStore = [];
  }
  return globalThis.__mindmittelTelemetryStore;
}

async function computePrecedentEmbedding(text: string): Promise<number[]> {
  try {
    const res = await generateGeminiEmbedding768(text);
    if (Array.isArray(res.vector) && res.vector.length > 0) {
      return res.vector;
    }
  } catch {
    // Fallback cleanly to deterministic semantic vector
  }
  return generateDeterministicSemanticEmbedding(text);
}

/**
 * Persists a strictly zero-free-text diagnostic telemetry record on the central control plane.
 */
export async function recordPlatformFeedbackTelemetry(params: {
  tenantSlug: string;
  companyName: string;
  feedbackType: FeedbackType;
  affectedLayer: AffectedAuditLayer;
  diagnosticCode: DiagnosticCode;
  modelUsed: string;
  initialVerdict: AuditVerdict;
  initialScore: number;
  precedentStatus: PrecedentStatus | null;
}): Promise<PlatformFeedbackTelemetryRecord> {
  const safeRecord = sanitizeTelemetryRecord({
    id: `tel_${crypto.randomBytes(6).toString('hex')}`,
    ...params,
    createdAt: new Date().toISOString(),
  });

  if (process.env.MONGODB_URI) {
    try {
      const db = await getControlPlaneDb();
      await db
        .collection<PlatformFeedbackTelemetryRecord>(
          COLLECTIONS.PLATFORM_FEEDBACK_TELEMETRY
        )
        .insertOne(safeRecord);
      return safeRecord;
    } catch (err) {
      systemLogger.warn(
        'learningLoop.telemetry',
        'Control-plane telemetry Mongo write failed; falling back to memory',
        { error: err instanceof Error ? err.message : String(err) }
      );
    }
  }

  getMemoryTelemetryStore().unshift(safeRecord);
  return safeRecord;
}

/**
 * Creates a new PENDING company precedent inside the active tenant's isolated database.
 */
export async function createPendingCompanyPrecedent(params: {
  tenantSlug: string;
  auditId?: string;
  title: string;
  ruleSummary: string;
  department: string;
  affectedLayer: AffectedAuditLayer;
  diagnosticCode: DiagnosticCode;
  validUntil: string | null;
  submittedByEmail: string;
}): Promise<CompanyPrecedentRecord> {
  const record: CompanyPrecedentRecord = {
    id: `prec_${crypto.randomBytes(6).toString('hex')}`,
    tenantSlug: params.tenantSlug,
    auditId: params.auditId,
    title: params.title.trim().slice(0, 140),
    ruleSummary: params.ruleSummary.trim().slice(0, 1000),
    department: params.department.trim() || '*',
    affectedLayer: params.affectedLayer,
    diagnosticCode: params.diagnosticCode,
    validUntil: params.validUntil ? params.validUntil.trim() : null,
    status: 'pending',
    submittedByEmail: params.submittedByEmail,
    submittedAt: new Date().toISOString(),
    reviewedByEmail: null,
    reviewedAt: null,
    revokedByEmail: null,
    revokedAt: null,
  };

  if (process.env.MONGODB_URI) {
    try {
      const db = await getMindMittelDb();
      await db
        .collection<CompanyPrecedentRecord>(COLLECTIONS.COMPANY_PRECEDENTS)
        .insertOne(record);
      return record;
    } catch (err) {
      systemLogger.warn(
        'learningLoop.precedents',
        'Tenant precedent Mongo insert failed; falling back to memory',
        { error: err instanceof Error ? err.message : String(err) }
      );
    }
  }

  const store = getMemoryPrecedentStore();
  const list = store.get(params.tenantSlug) ?? [];
  list.unshift(record);
  store.set(params.tenantSlug, list);
  return record;
}

/**
 * Lists all company precedents for the active tenant (newest first, with full audit trail).
 */
export async function listTenantPrecedents(
  tenantSlug: string
): Promise<CompanyPrecedentRecord[]> {
  if (process.env.MONGODB_URI) {
    try {
      const db = await getMindMittelDb();
      const rows = await db
        .collection<CompanyPrecedentRecord>(COLLECTIONS.COMPANY_PRECEDENTS)
        .find({})
        .sort({ submittedAt: -1 })
        .limit(200)
        .toArray();
      return rows.map((r) => ({
        id: r.id,
        tenantSlug: r.tenantSlug,
        auditId: r.auditId,
        title: r.title,
        ruleSummary: r.ruleSummary,
        department: r.department,
        affectedLayer: r.affectedLayer,
        diagnosticCode: r.diagnosticCode,
        validUntil: r.validUntil ?? null,
        status: r.status,
        submittedByEmail: r.submittedByEmail,
        submittedAt: r.submittedAt,
        reviewedByEmail: r.reviewedByEmail ?? null,
        reviewedAt: r.reviewedAt ?? null,
        revokedByEmail: r.revokedByEmail ?? null,
        revokedAt: r.revokedAt ?? null,
        embedding: r.embedding,
      }));
    } catch (err) {
      systemLogger.warn(
        'learningLoop.precedents',
        'Tenant precedent Mongo read failed; falling back to memory',
        { error: err instanceof Error ? err.message : String(err) }
      );
    }
  }

  return [...(getMemoryPrecedentStore().get(tenantSlug) ?? [])];
}

export interface PrecedentReviewEdits {
  title?: string;
  ruleSummary?: string;
  department?: string;
  validUntil?: string | null;
}

/**
 * Company Admin review action: approve (computes 768-d embedding for RAG), reject, or revoke.
 */
export async function reviewTenantPrecedent(params: {
  tenantSlug: string;
  precedentId: string;
  action: 'approve' | 'reject' | 'revoke';
  reviewerEmail: string;
  edits?: PrecedentReviewEdits;
}): Promise<CompanyPrecedentRecord | null> {
  const existingList = await listTenantPrecedents(params.tenantSlug);
  const target = existingList.find((p) => p.id === params.precedentId);
  if (!target) return null;

  const nowIso = new Date().toISOString();
  const nextTitle = params.edits?.title?.trim() || target.title;
  const nextRuleSummary =
    params.edits?.ruleSummary?.trim() || target.ruleSummary;
  const nextDepartment = params.edits?.department?.trim() || target.department;
  const nextValidUntil =
    params.edits && 'validUntil' in params.edits
      ? params.edits.validUntil
        ? params.edits.validUntil.trim()
        : null
      : target.validUntil;

  let nextStatus: PrecedentStatus = target.status;
  let embedding = target.embedding;
  let reviewedByEmail = target.reviewedByEmail ?? null;
  let reviewedAt = target.reviewedAt ?? null;
  let revokedByEmail = target.revokedByEmail ?? null;
  let revokedAt = target.revokedAt ?? null;

  if (params.action === 'approve') {
    nextStatus = 'approved';
    reviewedByEmail = params.reviewerEmail;
    reviewedAt = nowIso;
    revokedByEmail = null;
    revokedAt = null;
    embedding = await computePrecedentEmbedding(
      `${nextTitle}\n${nextRuleSummary}\n${target.affectedLayer}`
    );
  } else if (params.action === 'reject') {
    nextStatus = 'rejected';
    reviewedByEmail = params.reviewerEmail;
    reviewedAt = nowIso;
  } else if (params.action === 'revoke') {
    nextStatus = 'revoked';
    revokedByEmail = params.reviewerEmail;
    revokedAt = nowIso;
  }

  const updated: CompanyPrecedentRecord = {
    ...target,
    title: nextTitle,
    ruleSummary: nextRuleSummary,
    department: nextDepartment,
    validUntil: nextValidUntil,
    status: nextStatus,
    reviewedByEmail,
    reviewedAt,
    revokedByEmail,
    revokedAt,
    embedding,
  };

  if (process.env.MONGODB_URI) {
    try {
      const db = await getMindMittelDb();
      await db
        .collection<CompanyPrecedentRecord>(COLLECTIONS.COMPANY_PRECEDENTS)
        .updateOne({ id: params.precedentId }, { $set: updated });
      return updated;
    } catch (err) {
      systemLogger.warn(
        'learningLoop.precedents',
        'Tenant precedent Mongo update failed; falling back to memory',
        { error: err instanceof Error ? err.message : String(err) }
      );
    }
  }

  const store = getMemoryPrecedentStore();
  const list = store.get(params.tenantSlug) ?? [];
  const idx = list.findIndex((p) => p.id === params.precedentId);
  if (idx >= 0) {
    list[idx] = updated;
    store.set(params.tenantSlug, list);
  }
  return updated;
}

/**
 * Retrieves up to `maxCount` active, non-expired, department-scoped company precedents for a Decision Audit.
 */
export async function searchActiveTenantPrecedents(params: {
  tenantSlug: string;
  queryText: string;
  allowedDepartments: readonly string[] | '*';
  maxCount?: number;
}): Promise<CompanyPrecedentRecord[]> {
  const all = await listTenantPrecedents(params.tenantSlug);
  if (all.length === 0) return [];
  const queryEmbedding = await computePrecedentEmbedding(params.queryText);
  return selectRelevantActivePrecedents(
    all,
    queryEmbedding,
    params.queryText,
    params.allowedDepartments,
    params.maxCount ?? 3
  );
}

/**
 * Product Owner control-plane query: returns strictly zero-free-text aggregated telemetry.
 */
export async function getPlatformTelemetrySummary(
  tenantSlugFilter?: string
): Promise<PlatformTelemetrySummary> {
  let records: PlatformFeedbackTelemetryRecord[] = [];

  if (process.env.MONGODB_URI) {
    try {
      const db = await getControlPlaneDb();
      const raw = await db
        .collection<PlatformFeedbackTelemetryRecord>(
          COLLECTIONS.PLATFORM_FEEDBACK_TELEMETRY
        )
        .find({})
        .sort({ createdAt: -1 })
        .limit(1000)
        .toArray();
      records = raw.map((r) => sanitizeTelemetryRecord(r as unknown as Record<string, unknown>));
    } catch (err) {
      systemLogger.warn(
        'learningLoop.telemetry',
        'Control-plane telemetry Mongo read failed; falling back to memory',
        { error: err instanceof Error ? err.message : String(err) }
      );
      records = getMemoryTelemetryStore();
    }
  } else {
    records = getMemoryTelemetryStore();
  }

  return aggregatePlatformTelemetry(records, tenantSlugFilter);
}
