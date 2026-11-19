import {
  rankGeminiModels,
  type ModelSelectionProfile,
  type RankedGeminiModel,
  type RawGeminiModelInfo,
} from '@/core/ai/modelRanking';
import { resolveGeminiApiKey } from '@/infrastructure/tenancy/geminiKey';

export interface ModelSelectionResult {
  selectedModel: RankedGeminiModel;
  fallbackChain: RankedGeminiModel[];
  fromCache: boolean;
  staleCacheFallback: boolean;
  evaluatedAt: string;
}

export interface DynamicModelSelectorOptions {
  apiKey?: string;
  ttlMs?: number;
  cooldownMs?: number;
  now?: () => number;
  fetchAvailableModels?: () => Promise<RawGeminiModelInfo[]>;
}

const DEFAULT_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const DEFAULT_CIRCUIT_BREAKER_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Calls the official Google Gemini REST endpoint to list all models available to the API key.
 */
export async function fetchModelsFromGeminiApi(
  apiKey: string
): Promise<RawGeminiModelInfo[]> {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('GEMINI_API_KEY is required to list available Gemini models.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
    apiKey
  )}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to list Gemini models from API (HTTP ${response.status})`
    );
  }

  const payload = (await response.json()) as { models?: RawGeminiModelInfo[] };
  return payload.models ?? [];
}

/**
 * Determines whether an error thrown during model inference warrants tripping the circuit breaker
 * and falling back to the next candidate model.
 */
function isRecoverableModelError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return true;
  const status = (error as { status?: number }).status;
  if (typeof status === 'number') {
    // 404 (model deprecated/not found), 429 (rate limit), 500/502/503/504 (transient server errors)
    return status === 404 || status === 429 || status >= 500;
  }
  const name = (error as { name?: string }).name ?? '';
  if (name === 'TimeoutError' || name === 'AbortError' || name === 'TypeError') {
    return true;
  }
  const msg = error instanceof Error ? error.message : String(error);
  return /(429|503|500|404|quota|rate limit|overloaded|unavailable|fetch failed|timeout|timed out|abort|network|socket|econnreset)/i.test(
    msg
  );
}

/**
 * Creates a stateful Dynamic Model Selector instance with TTL caching, stale-if-error resilience,
 * 15-minute Circuit Breaker cooldown for unhealthy models, and automatic runtime fallback execution.
 */
export function createDynamicModelSelector(
  options: DynamicModelSelectorOptions = {}
) {
  const ttlMs = options.ttlMs ?? DEFAULT_CACHE_TTL_MS;
  const cooldownMs = options.cooldownMs ?? DEFAULT_CIRCUIT_BREAKER_COOLDOWN_MS;
  const now = options.now ?? (() => Date.now());
  const fetcher =
    options.fetchAvailableModels ??
    (() => {
      const key = resolveGeminiApiKey(options.apiKey);
      return fetchModelsFromGeminiApi(key);
    });

  let cachedModels: RawGeminiModelInfo[] | null = null;
  let cacheExpiresAt = 0;
  const unhealthyUntilByModel = new Map<string, number>();

  function isModelHealthy(modelId: string, currentTs: number): boolean {
    const unhealthyUntil = unhealthyUntilByModel.get(modelId);
    if (unhealthyUntil === undefined) return true;
    if (currentTs >= unhealthyUntil) {
      unhealthyUntilByModel.delete(modelId);
      return true;
    }
    return false;
  }

  function markModelUnhealthy(modelId: string): void {
    unhealthyUntilByModel.set(modelId, now() + cooldownMs);
  }

  async function getModelCatalog(): Promise<{
    models: RawGeminiModelInfo[];
    fromCache: boolean;
    staleCacheFallback: boolean;
  }> {
    const currentTimestamp = now();

    if (cachedModels && currentTimestamp < cacheExpiresAt) {
      return {
        models: cachedModels,
        fromCache: true,
        staleCacheFallback: false,
      };
    }

    try {
      const freshModels = await fetcher();
      cachedModels = freshModels;
      cacheExpiresAt = currentTimestamp + ttlMs;
      return {
        models: freshModels,
        fromCache: false,
        staleCacheFallback: false,
      };
    } catch (error) {
      // Self-healing fallback: if network fails but we have a previously cached list, use it
      if (cachedModels && cachedModels.length > 0) {
        return {
          models: cachedModels,
          fromCache: true,
          staleCacheFallback: true,
        };
      }
      throw error;
    }
  }

  async function selectModel(
    profile: ModelSelectionProfile = 'fast'
  ): Promise<ModelSelectionResult> {
    const currentTs = now();
    const { models, fromCache, staleCacheFallback } = await getModelCatalog();
    const allRanked = rankGeminiModels(models, profile);
    const healthyRanked = allRanked.filter((m) =>
      isModelHealthy(m.modelId, currentTs)
    );
    const effectiveRanked =
      healthyRanked.length > 0 ? healthyRanked : allRanked;

    const selectedModel = effectiveRanked[0];
    const fallbackChain = effectiveRanked.slice(1, 5);

    // Ensure a proven generation-2.5 baseline model is included at the tail of fallbackChain if all top entries are 3.x
    const proven25 = effectiveRanked.find(
      (m) =>
        m.version >= 2.0 &&
        m.version < 3.0 &&
        m.modelId !== selectedModel.modelId &&
        !fallbackChain.some((f) => f.modelId === m.modelId)
    );
    if (proven25) {
      fallbackChain.push(proven25);
    }

    return {
      selectedModel,
      fallbackChain,
      fromCache,
      staleCacheFallback,
      evaluatedAt: new Date(currentTs).toISOString(),
    };
  }

  async function executeWithFallback<T>(
    profile: ModelSelectionProfile,
    operation: (modelId: string) => Promise<T>,
    maxAttempts = 4
  ): Promise<{ output: T; usedModelId: string; attempts: number }> {
    const selection = await selectModel(profile);
    const allCandidates = [selection.selectedModel, ...selection.fallbackChain];
    const candidates = allCandidates.slice(0, maxAttempts);

    // If a 2.x fallback exists beyond maxAttempts and all earlier candidates are 3.x, include it as final safety net
    const lastCandidate = allCandidates[allCandidates.length - 1];
    if (
      lastCandidate &&
      lastCandidate.version < 3.0 &&
      !candidates.some((c) => c.modelId === lastCandidate.modelId)
    ) {
      candidates.push(lastCandidate);
    }

    let lastError: unknown;

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      try {
        const output = await operation(candidate.modelId);
        return {
          output,
          usedModelId: candidate.modelId,
          attempts: i + 1,
        };
      } catch (err) {
        lastError = err;
        if (isRecoverableModelError(err)) {
          markModelUnhealthy(candidate.modelId);
        }
        if (!isRecoverableModelError(err) || i === candidates.length - 1) {
          throw err;
        }
      }
    }

    throw lastError ?? new Error('All candidate Gemini models failed.');
  }

  function clearCache(): void {
    cachedModels = null;
    cacheExpiresAt = 0;
    unhealthyUntilByModel.clear();
  }

  return {
    selectModel,
    executeWithFallback,
    clearCache,
  };
}

// Default singleton selector for application-wide use
export const geminiModelSelector = createDynamicModelSelector();
