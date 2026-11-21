/**
 * Self-Healing Background Embedding Reconciler (`src/core/rag/embeddingReconciler.ts`).
 *
 * When Google Gemini's embedding API (`text-embedding-004`) is temporarily unreachable during
 * ingestion, MindMittel writes a deterministic 768-d fallback vector (`deterministic-semantic-768d`)
 * so the user's upload never fails.
 *
 * This module periodically retries every 5 minutes in the background to upgrade those pending
 * offline vectors into online `text-embedding-004` vectors and atomically replaces them in-place,
 * stopping its timer automatically once 0 offline vectors remain.
 */

export const OFFLINE_EMBEDDING_MODEL = 'deterministic-semantic-768d';
export const ONLINE_EMBEDDING_MODEL = 'text-embedding-004';
export const RECONCILE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
export const DEFAULT_RECONCILE_BATCH_SIZE = 20;

export interface PendingOfflineChunk {
  childId: string;
  embeddingInput: string;
}

export interface ReconcileBatchResult {
  upgradedCount: number;
  remainingEstimate: number;
  geminiStillUnavailable: boolean;
}

export interface ReconcileBatchParams {
  pendingChunks: readonly PendingOfflineChunk[];
  embedOnline: (
    text: string
  ) => Promise<{ vector: number[]; modelUsed: string }>;
  onChunkUpgraded: (
    childId: string,
    vector: number[],
    modelUsed: string
  ) => Promise<void> | void;
  batchSize?: number;
}

/**
 * Processes a bounded batch of offline-embedded child chunks and upgrades them to online vectors.
 * Fails fast on the first offline fallback/error so an unavailable Gemini API is never hammered.
 */
export async function reconcileOfflineChunksBatch(
  params: ReconcileBatchParams
): Promise<ReconcileBatchResult> {
  const {
    pendingChunks,
    embedOnline,
    onChunkUpgraded,
    batchSize = DEFAULT_RECONCILE_BATCH_SIZE,
  } = params;

  const totalPending = pendingChunks.length;
  if (totalPending === 0) {
    return {
      upgradedCount: 0,
      remainingEstimate: 0,
      geminiStillUnavailable: false,
    };
  }

  const batch = pendingChunks.slice(0, Math.max(1, batchSize));
  let upgradedCount = 0;

  for (const chunk of batch) {
    try {
      const { vector, modelUsed } = await embedOnline(chunk.embeddingInput);
      if (modelUsed === OFFLINE_EMBEDDING_MODEL || vector.length === 0) {
        return {
          upgradedCount,
          remainingEstimate: totalPending - upgradedCount,
          geminiStillUnavailable: true,
        };
      }

      await onChunkUpgraded(chunk.childId, vector, modelUsed);
      upgradedCount += 1;
    } catch {
      return {
        upgradedCount,
        remainingEstimate: totalPending - upgradedCount,
        geminiStillUnavailable: true,
      };
    }
  }

  return {
    upgradedCount,
    remainingEstimate: Math.max(0, totalPending - upgradedCount),
    geminiStillUnavailable: false,
  };
}

export interface TenantReconcileSchedulerOptions {
  intervalMs?: number;
  runForTenant: (tenantKey: string) => Promise<ReconcileBatchResult>;
}

/**
 * Per-tenant background interval scheduler with overlap protection and automatic shutdown
 * when all offline vectors for a tenant have been upgraded.
 */
export function createTenantEmbeddingReconcileScheduler(
  options: TenantReconcileSchedulerOptions
) {
  const intervalMs = options.intervalMs ?? RECONCILE_INTERVAL_MS;
  const timers = new Map<string, ReturnType<typeof setInterval>>();
  const inFlight = new Set<string>();

  function stop(tenantKey: string): void {
    const existing = timers.get(tenantKey);
    if (existing) {
      clearInterval(existing);
      timers.delete(tenantKey);
    }
  }

  function schedule(tenantKey: string): void {
    if (timers.has(tenantKey)) return;

    const timer = setInterval(() => {
      if (inFlight.has(tenantKey)) return;
      inFlight.add(tenantKey);

      options
        .runForTenant(tenantKey)
        .then((result) => {
          if (!result.geminiStillUnavailable && result.remainingEstimate === 0) {
            stop(tenantKey);
          }
        })
        .catch(() => {
          // Keep timer alive to retry on next 5-minute tick
        })
        .finally(() => {
          inFlight.delete(tenantKey);
        });
    }, intervalMs);

    if (typeof (timer as { unref?: () => void }).unref === 'function') {
      (timer as { unref: () => void }).unref();
    }

    timers.set(tenantKey, timer);
  }

  function isScheduled(tenantKey: string): boolean {
    return timers.has(tenantKey);
  }

  function stopAll(): void {
    for (const key of Array.from(timers.keys())) {
      stop(key);
    }
  }

  return {
    schedule,
    stop,
    stopAll,
    isScheduled,
  };
}
