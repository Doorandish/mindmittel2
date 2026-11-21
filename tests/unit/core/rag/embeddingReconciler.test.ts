import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  OFFLINE_EMBEDDING_MODEL,
  ONLINE_EMBEDDING_MODEL,
  RECONCILE_INTERVAL_MS,
  reconcileOfflineChunksBatch,
  createTenantEmbeddingReconcileScheduler,
  type PendingOfflineChunk,
} from '@/core/rag/embeddingReconciler';

describe('Self-Healing Background Embedding Reconciler (5-Minute Online Upgrade)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('defaults reconciliation interval to 5 minutes (300,000 ms)', () => {
    expect(RECONCILE_INTERVAL_MS).toBe(5 * 60 * 1000);
  });

  it('upgrades pending offline chunks to online text-embedding-004 and atomically replaces them', async () => {
    const pending: PendingOfflineChunk[] = [
      {
        childId: 'parent_1_c0',
        embeddingInput: 'finance-legal budget Procurement cap is €10,000',
      },
      {
        childId: 'parent_1_c1',
        embeddingInput: 'finance-legal budget CFO sign-off required',
      },
    ];

    const upgraded: Array<{
      childId: string;
      modelUsed: string;
      dims: number;
    }> = [];

    const result = await reconcileOfflineChunksBatch({
      pendingChunks: pending,
      embedOnline: async () => ({
        vector: new Array(768).fill(0.05),
        modelUsed: ONLINE_EMBEDDING_MODEL,
      }),
      onChunkUpgraded: async (childId, vector, modelUsed) => {
        upgraded.push({ childId, modelUsed, dims: vector.length });
      },
    });

    expect(result.upgradedCount).toBe(2);
    expect(result.remainingEstimate).toBe(0);
    expect(result.geminiStillUnavailable).toBe(false);
    expect(upgraded).toEqual([
      { childId: 'parent_1_c0', modelUsed: ONLINE_EMBEDDING_MODEL, dims: 768 },
      { childId: 'parent_1_c1', modelUsed: ONLINE_EMBEDDING_MODEL, dims: 768 },
    ]);
  });

  it('stops the batch immediately when Gemini is still unavailable to avoid hammering the API', async () => {
    const pending: PendingOfflineChunk[] = [
      { childId: 'c0', embeddingInput: 'chunk 0' },
      { childId: 'c1', embeddingInput: 'chunk 1' },
      { childId: 'c2', embeddingInput: 'chunk 2' },
    ];

    let embedCalls = 0;
    const onUpgrade = vi.fn();

    const result = await reconcileOfflineChunksBatch({
      pendingChunks: pending,
      embedOnline: async () => {
        embedCalls += 1;
        return {
          vector: new Array(768).fill(0.01),
          modelUsed: OFFLINE_EMBEDDING_MODEL,
        };
      },
      onChunkUpgraded: onUpgrade,
    });

    expect(embedCalls).toBe(1);
    expect(onUpgrade).not.toHaveBeenCalled();
    expect(result.upgradedCount).toBe(0);
    expect(result.remainingEstimate).toBe(3);
    expect(result.geminiStillUnavailable).toBe(true);
  });

  it('retries every 5 minutes per tenant and automatically stops the timer once all offline vectors are healed', async () => {
    vi.useFakeTimers();

    let callCount = 0;
    const scheduler = createTenantEmbeddingReconcileScheduler({
      intervalMs: RECONCILE_INTERVAL_MS,
      runForTenant: async () => {
        callCount += 1;
        // First 5m tick: Gemini still down -> keep timer alive
        if (callCount === 1) {
          return {
            upgradedCount: 0,
            remainingEstimate: 2,
            geminiStillUnavailable: true,
          };
        }
        // Second 5m tick: Gemini recovered -> all healed -> auto-stop timer
        return {
          upgradedCount: 2,
          remainingEstimate: 0,
          geminiStillUnavailable: false,
        };
      },
    });

    scheduler.schedule('acme');
    expect(scheduler.isScheduled('acme')).toBe(true);

    // Advance 5 minutes -> tick 1 (Gemini still down)
    await vi.advanceTimersByTimeAsync(RECONCILE_INTERVAL_MS);
    expect(callCount).toBe(1);
    expect(scheduler.isScheduled('acme')).toBe(true);

    // Advance another 5 minutes -> tick 2 (healed -> timer auto-stops)
    await vi.advanceTimersByTimeAsync(RECONCILE_INTERVAL_MS);
    expect(callCount).toBe(2);
    expect(scheduler.isScheduled('acme')).toBe(false);

    // Advance another 10 minutes -> no further calls
    await vi.advanceTimersByTimeAsync(RECONCILE_INTERVAL_MS * 2);
    expect(callCount).toBe(2);

    scheduler.stopAll();
  });
});
