import {
  rankGeminiModels,
  type ModelSelectionProfile,
  type RankedGeminiModel,
  type RawGeminiModelInfo,
} from '@/core/ai/modelRanking';

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
  now?: () => number;
  fetchAvailableModels?: () => Promise<RawGeminiModelInfo[]>;
}

const DEFAULT_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

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
 * Determines whether an error thrown during model inference warrants falling back to the next model.
 */
function isRecoverableModelError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return true;
  const status = (error as { status?: number }).status;
  if (typeof status === 'number') {
    // 404 (model deprecated/not found), 429 (rate limit), 500/502/503/504 (transient server errors)
    return status === 404 || status === 429 || status >= 500;
  }
  const msg = error instanceof Error ? error.message : String(error);
  return /(429|503|500|404|quota|rate limit|overloaded|unavailable)/i.test(msg);
}

/**
 * Creates a stateful Dynamic Model Selector instance with TTL caching, stale-if-error resilience,
 * and automatic runtime fallback execution.
 */
export function createDynamicModelSelector(
  options: DynamicModelSelectorOptions = {}
) {
  const ttlMs = options.ttlMs ?? DEFAULT_CACHE_TTL_MS;
  const now = options.now ?? (() => Date.now());
  const fetcher =
    options.fetchAvailableModels ??
    (() => {
      const key = options.apiKey ?? process.env.GEMINI_API_KEY ?? '';
      return fetchModelsFromGeminiApi(key);
    });

  let cachedModels: RawGeminiModelInfo[] | null = null;
  let cacheExpiresAt = 0;

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
    const { models, fromCache, staleCacheFallback } = await getModelCatalog();
    const ranked = rankGeminiModels(models, profile);

    return {
      selectedModel: ranked[0],
      fallbackChain: ranked.slice(1, 4),
      fromCache,
      staleCacheFallback,
      evaluatedAt: new Date(now()).toISOString(),
    };
  }

  async function executeWithFallback<T>(
    profile: ModelSelectionProfile,
    operation: (modelId: string) => Promise<T>,
    maxAttempts = 3
  ): Promise<{ output: T; usedModelId: string; attempts: number }> {
    const selection = await selectModel(profile);
    const candidates = [
      selection.selectedModel,
      ...selection.fallbackChain,
    ].slice(0, maxAttempts);

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
  }

  return {
    selectModel,
    executeWithFallback,
    clearCache,
  };
}

// Default singleton selector for application-wide use
export const geminiModelSelector = createDynamicModelSelector();
