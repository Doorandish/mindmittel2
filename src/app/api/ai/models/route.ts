import { NextRequest, NextResponse } from 'next/server';
import { geminiModelSelector } from '@/infrastructure/gemini/modelSelector';
import {
  rankGeminiModels,
  type ModelSelectionProfile,
  type RawGeminiModelInfo,
} from '@/core/ai/modelRanking';
import { systemLogger } from '@/infrastructure/logging/logger';

export const dynamic = 'force-dynamic';

const FALLBACK_CATALOG_PREVIEW: RawGeminiModelInfo[] = [
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
    name: 'models/gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash',
    supportedGenerationMethods: ['generateContent', 'countTokens'],
  },
];

export async function GET(request: NextRequest) {
  const profileParam = request.nextUrl.searchParams.get('profile');
  const profile: ModelSelectionProfile =
    profileParam === 'reasoning' ? 'reasoning' : 'fast';

  try {
    const selection = await geminiModelSelector.selectModel(profile);
    systemLogger.info(
      'ai.selector',
      `Dynamically selected Gemini model: ${selection.selectedModel.modelId} for profile "${profile}"`,
      {
        profile,
        selectedModel: selection.selectedModel.modelId,
        score: selection.selectedModel.score,
        fromCache: selection.fromCache,
      }
    );

    return NextResponse.json({
      mode: 'live_api',
      profile,
      ...selection,
    });
  } catch (error) {
    // If GEMINI_API_KEY is not yet set locally, demonstrate the exact ranking engine output
    const simulatedRanked = rankGeminiModels(FALLBACK_CATALOG_PREVIEW, profile);
    const message = error instanceof Error ? error.message : String(error);

    systemLogger.warn(
      'ai.selector',
      `Live Gemini catalog fetch unavailable (${message}); returning deterministic ranking simulation for profile "${profile}"`,
      {
        profile,
        selectedModel: simulatedRanked[0].modelId,
      }
    );

    return NextResponse.json({
      mode: 'simulated_catalog_preview',
      notice:
        'Set GEMINI_API_KEY in .env.local to query live /v1beta/models endpoint.',
      profile,
      selectedModel: simulatedRanked[0],
      fallbackChain: simulatedRanked.slice(1),
      fromCache: false,
      staleCacheFallback: false,
      evaluatedAt: new Date().toISOString(),
    });
  }
}
