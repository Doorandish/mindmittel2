import { describe, it, expect, vi } from 'vitest';
import { createDynamicModelSelector } from '@/infrastructure/gemini/modelSelector';
import type { RawGeminiModelInfo } from '@/core/ai/modelRanking';

describe('Dynamic Gemini Model Selector (Imperative Shell: Cache & Fallback)', () => {
  const mockModelsResponse: RawGeminiModelInfo[] = [
    {
      name: 'models/gemini-2.5-flash',
      displayName: 'Gemini 2.5 Flash',
      supportedGenerationMethods: ['generateContent'],
    },
    {
      name: 'models/gemini-2.0-flash',
      displayName: 'Gemini 2.0 Flash',
      supportedGenerationMethods: ['generateContent'],
    },
    {
      name: 'models/gemini-2.5-pro',
      displayName: 'Gemini 2.5 Pro',
      supportedGenerationMethods: ['generateContent'],
    },
  ];

  it('fetches available models once and serves subsequent requests from TTL cache', async () => {
    const fetchModelsMock = vi.fn().mockResolvedValue(mockModelsResponse);
    let currentTime = 1_000_000;

    const selector = createDynamicModelSelector({
      fetchAvailableModels: fetchModelsMock,
      ttlMs: 60_000,
      now: () => currentTime,
    });

    const firstSelection = await selector.selectModel('fast');
    expect(firstSelection.selectedModel.modelId).toBe('gemini-2.5-flash');
    expect(firstSelection.fromCache).toBe(false);
    expect(fetchModelsMock).toHaveBeenCalledTimes(1);

    // Advance 30 seconds (still within 60s TTL)
    currentTime += 30_000;
    const secondSelection = await selector.selectModel('reasoning');
    expect(secondSelection.selectedModel.modelId).toBe('gemini-2.5-pro');
    expect(secondSelection.fromCache).toBe(true);
    expect(fetchModelsMock).toHaveBeenCalledTimes(1);

    // Advance past TTL (another 40 seconds)
    currentTime += 40_000;
    const thirdSelection = await selector.selectModel('fast');
    expect(thirdSelection.fromCache).toBe(false);
    expect(fetchModelsMock).toHaveBeenCalledTimes(2);
  });

  it('executes operation with fallback to the next ranked model on 429 or 503 failure', async () => {
    const fetchModelsMock = vi.fn().mockResolvedValue(mockModelsResponse);
    const selector = createDynamicModelSelector({
      fetchAvailableModels: fetchModelsMock,
    });

    const attemptedModels: string[] = [];
    const result = await selector.executeWithFallback('fast', async (modelId) => {
      attemptedModels.push(modelId);
      if (modelId === 'gemini-2.5-flash') {
        const rateLimitError = new Error('429 Too Many Requests');
        (rateLimitError as Error & { status?: number }).status = 429;
        throw rateLimitError;
      }
      return `Success from ${modelId}`;
    });

    expect(result.output).toBe('Success from gemini-2.0-flash');
    expect(result.usedModelId).toBe('gemini-2.0-flash');
    expect(attemptedModels).toEqual(['gemini-2.5-flash', 'gemini-2.0-flash']);
  });

  it('uses last known good model list if refreshing the cache fails due to network outage', async () => {
    let shouldFail = false;
    let currentTime = 1_000_000;

    const fetchModelsMock = vi.fn().mockImplementation(async () => {
      if (shouldFail) {
        throw new Error('Network timeout reaching generativelanguage.googleapis.com');
      }
      return mockModelsResponse;
    });

    const selector = createDynamicModelSelector({
      fetchAvailableModels: fetchModelsMock,
      ttlMs: 10_000,
      now: () => currentTime,
    });

    await selector.selectModel('fast');
    expect(fetchModelsMock).toHaveBeenCalledTimes(1);

    // Expire cache and simulate network outage
    currentTime += 20_000;
    shouldFail = true;

    const fallbackSelection = await selector.selectModel('fast');
    expect(fallbackSelection.selectedModel.modelId).toBe('gemini-2.5-flash');
    expect(fallbackSelection.staleCacheFallback).toBe(true);
  });

  it('recovers from fetch failed / timeout errors and temporarily quarantines unhealthy models via 15-minute circuit breaker cooldown', async () => {
    const modelsWithUnstableTop: RawGeminiModelInfo[] = [
      {
        name: 'models/gemini-3.8-flash',
        displayName: 'Gemini 3.8 Flash',
        supportedGenerationMethods: ['generateContent'],
      },
      ...mockModelsResponse,
    ];

    let currentTime = 2_000_000;
    const selector = createDynamicModelSelector({
      fetchAvailableModels: vi.fn().mockResolvedValue(modelsWithUnstableTop),
      now: () => currentTime,
    });

    const firstAttempted: string[] = [];
    const firstResult = await selector.executeWithFallback(
      'fast',
      async (modelId) => {
        firstAttempted.push(modelId);
        if (modelId === 'gemini-3.8-flash') {
          throw new TypeError('fetch failed');
        }
        return `Recovered via ${modelId}`;
      }
    );

    expect(firstResult.output).toBe('Recovered via gemini-2.5-flash');
    expect(firstResult.usedModelId).toBe('gemini-2.5-flash');
    expect(firstAttempted).toEqual(['gemini-3.8-flash', 'gemini-2.5-flash']);

    // 10 seconds later (inside 15-min cooldown): gemini-3.8-flash must be skipped immediately!
    currentTime += 10_000;
    const secondAttempted: string[] = [];
    const secondResult = await selector.executeWithFallback(
      'fast',
      async (modelId) => {
        secondAttempted.push(modelId);
        return `Fast path via ${modelId}`;
      }
    );
    expect(secondResult.usedModelId).toBe('gemini-2.5-flash');
    expect(secondAttempted).toEqual(['gemini-2.5-flash']);

    // 16 minutes later (past 15-min cooldown): gemini-3.8-flash is eligible again
    currentTime += 16 * 60 * 1000;
    const afterCooldown = await selector.selectModel('fast');
    expect(afterCooldown.selectedModel.modelId).toBe('gemini-3.8-flash');
  });
});
