import { describe, it, expect } from 'vitest';
import {
  rankGeminiModels,
  parseModelMetadata,
  inferProfileFromQuery,
  type RawGeminiModelInfo,
} from '@/core/ai/modelRanking';

describe('Dynamic Gemini Model Ranking & Autonomous Query Intent Classifier (Functional Core)', () => {
  const sampleModels: RawGeminiModelInfo[] = [
    {
      name: 'models/text-embedding-004',
      displayName: 'Text Embedding 004',
      supportedGenerationMethods: ['embedContent'],
    },
    {
      name: 'models/gemini-1.5-flash',
      displayName: 'Gemini 1.5 Flash',
      supportedGenerationMethods: ['generateContent', 'countTokens'],
    },
    {
      name: 'models/gemini-2.0-flash',
      displayName: 'Gemini 2.0 Flash',
      supportedGenerationMethods: ['generateContent', 'countTokens'],
    },
    {
      name: 'models/gemini-2.5-flash-preview-04-17',
      displayName: 'Gemini 2.5 Flash Preview',
      supportedGenerationMethods: ['generateContent'],
    },
    {
      name: 'models/gemini-2.5-flash',
      displayName: 'Gemini 2.5 Flash',
      supportedGenerationMethods: ['generateContent', 'countTokens'],
    },
    {
      name: 'models/gemini-2.5-pro',
      displayName: 'Gemini 2.5 Pro',
      supportedGenerationMethods: ['generateContent', 'countTokens'],
    },
    {
      name: 'models/gemini-2.0-flash-thinking-exp',
      displayName: 'Gemini 2.0 Flash Thinking Experimental',
      supportedGenerationMethods: ['generateContent'],
    },
    {
      name: 'models/gemini-2.0-flash-tts',
      displayName: 'Gemini 2.0 Flash TTS',
      supportedGenerationMethods: ['generateContent'],
    },
    {
      name: 'models/aqa',
      displayName: 'Attributed Question Answering',
      supportedGenerationMethods: ['generateAnswer'],
    },
  ];

  it('filters out embedding, TTS, image, and non-generateContent models', () => {
    const ranked = rankGeminiModels(sampleModels, 'fast');
    const names = ranked.map((m) => m.modelId);

    expect(names).not.toContain('text-embedding-004');
    expect(names).not.toContain('gemini-2.0-flash-tts');
    expect(names).not.toContain('aqa');
  });

  it('parses version numbers and stability tiers accurately without hardcoding specific versions', () => {
    const metaStable = parseModelMetadata({
      name: 'models/gemini-3.5-flash',
      supportedGenerationMethods: ['generateContent'],
    });
    expect(metaStable.modelId).toBe('gemini-3.5-flash');
    expect(metaStable.version).toBe(3.5);
    expect(metaStable.family).toBe('flash');
    expect(metaStable.stability).toBe('stable');

    const metaPreview = parseModelMetadata({
      name: 'models/gemini-2.5-pro-preview-05-06',
      supportedGenerationMethods: ['generateContent'],
    });
    expect(metaPreview.version).toBe(2.5);
    expect(metaPreview.family).toBe('pro');
    expect(metaPreview.stability).toBe('preview');
  });

  it('selects the highest version stable Flash model for the "fast" profile', () => {
    const ranked = rankGeminiModels(sampleModels, 'fast');
    expect(ranked[0].modelId).toBe('gemini-2.5-flash');
  });

  it('selects the highest version stable Pro model for the "reasoning" profile', () => {
    const ranked = rankGeminiModels(sampleModels, 'reasoning');
    expect(ranked[0].modelId).toBe('gemini-2.5-pro');
  });

  it('prefers stable releases over preview and experimental releases of the same version and family', () => {
    const ranked = rankGeminiModels(sampleModels, 'fast');
    const stableIdx = ranked.findIndex((m) => m.modelId === 'gemini-2.5-flash');
    const previewIdx = ranked.findIndex(
      (m) => m.modelId === 'gemini-2.5-flash-preview-04-17'
    );

    expect(stableIdx).toBeGreaterThanOrEqual(0);
    expect(previewIdx).toBeGreaterThan(stableIdx);
  });

  it('automatically adapts to future Gemini versions (e.g. 4.0) without code changes', () => {
    const futureModels: RawGeminiModelInfo[] = [
      ...sampleModels,
      {
        name: 'models/gemini-4.0-flash',
        supportedGenerationMethods: ['generateContent'],
      },
    ];
    const ranked = rankGeminiModels(futureModels, 'fast');
    expect(ranked[0].modelId).toBe('gemini-4.0-flash');
  });

  it('autonomously infers "fast" vs "reasoning" profile from user request complexity without manual user selection', () => {
    expect(inferProfileFromQuery('What is the petty cash limit?')).toBe('fast');
    expect(
      inferProfileFromQuery(
        'Conduct a comprehensive governance audit comparing our Q4 board minutes against ISO 37000 and identify policy contradictions.'
      )
    ).toBe('reasoning');
  });

  it('throws a clear error when no compatible text generation models are available', () => {
    const incompatibleOnly: RawGeminiModelInfo[] = [
      {
        name: 'models/text-embedding-004',
        supportedGenerationMethods: ['embedContent'],
      },
    ];
    expect(() => rankGeminiModels(incompatibleOnly, 'fast')).toThrow(
      /No compatible Gemini models/i
    );
  });
});
