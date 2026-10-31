export type ModelSelectionProfile = 'fast' | 'reasoning';

export type ModelFamily = 'pro' | 'flash' | 'flash-lite' | 'other';
export type ModelStability = 'stable' | 'preview' | 'experimental';

export interface RawGeminiModelInfo {
  name: string;
  displayName?: string;
  description?: string;
  supportedGenerationMethods?: string[];
  inputTokenLimit?: number;
  outputTokenLimit?: number;
}

export interface RankedGeminiModel {
  modelId: string;
  displayName: string;
  version: number;
  family: ModelFamily;
  stability: ModelStability;
  score: number;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
}

const EXCLUDED_MODEL_PATTERNS = [
  /embedding/i,
  /\btts\b/i,
  /imagen/i,
  /image-generation/i,
  /vision-only/i,
  /\baqa\b/i,
  /veo/i,
  /audio/i,
  /robotics/i,
  /learnlm/i,
  /gemma/i,
];

/**
 * Pure function that inspects a raw Gemini model descriptor and extracts
 * normalized version, family, and stability metadata without hardcoding model versions.
 */
export function parseModelMetadata(
  raw: RawGeminiModelInfo
): Omit<RankedGeminiModel, 'score'> {
  const modelId = raw.name.replace(/^models\//, '');
  const lower = modelId.toLowerCase();

  // Extract major.minor version dynamically (e.g., gemini-2.5-flash -> 2.5, gemini-3.0-pro -> 3.0)
  const versionMatch = lower.match(/gemini-(\d+(?:\.\d+)?)/);
  const version = versionMatch ? parseFloat(versionMatch[1]) : 1.0;

  let family: ModelFamily = 'other';
  if (lower.includes('flash-lite') || lower.includes('flash-8b')) {
    family = 'flash-lite';
  } else if (lower.includes('flash')) {
    family = 'flash';
  } else if (lower.includes('pro')) {
    family = 'pro';
  }

  let stability: ModelStability = 'stable';
  if (lower.includes('exp') || lower.includes('thinking-exp')) {
    stability = 'experimental';
  } else if (lower.includes('preview')) {
    stability = 'preview';
  }

  return {
    modelId,
    displayName: raw.displayName ?? modelId,
    version,
    family,
    stability,
    inputTokenLimit: raw.inputTokenLimit,
    outputTokenLimit: raw.outputTokenLimit,
  };
}

/**
 * Determines whether a model from the Gemini API list is suitable for general text/governance generation.
 */
export function isTextGenerationCandidate(raw: RawGeminiModelInfo): boolean {
  const methods = raw.supportedGenerationMethods ?? [];
  if (!methods.includes('generateContent')) {
    return false;
  }

  const modelId = raw.name.replace(/^models\//, '');
  if (!modelId.toLowerCase().startsWith('gemini-')) {
    return false;
  }

  for (const pattern of EXCLUDED_MODEL_PATTERNS) {
    if (pattern.test(modelId)) {
      return false;
    }
  }

  return true;
}

/**
 * Computes a deterministic numerical score for a candidate model given a target profile.
 * - 'fast': Prioritizes cost-efficiency & low latency (Flash > Pro > Flash-Lite)
 * - 'reasoning': Prioritizes deep governance audit reasoning (Pro > Flash > Flash-Lite)
 */
export function scoreModelForProfile(
  meta: Omit<RankedGeminiModel, 'score'>,
  profile: ModelSelectionProfile
): number {
  let familyWeight = 0;

  if (profile === 'fast') {
    if (meta.family === 'flash') familyWeight = 300;
    else if (meta.family === 'pro') familyWeight = 200;
    else if (meta.family === 'flash-lite') familyWeight = 150;
    else familyWeight = 50;
  } else {
    // 'reasoning' profile
    if (meta.family === 'pro') familyWeight = 300;
    else if (meta.family === 'flash') familyWeight = 200;
    else if (meta.family === 'flash-lite') familyWeight = 100;
    else familyWeight = 50;
  }

  let stabilityWeight = 0;
  if (meta.stability === 'stable') stabilityWeight = 40;
  else if (meta.stability === 'preview') stabilityWeight = 15;
  else stabilityWeight = 5;

  // Version multiplier ensures newer generations within the preferred family win automatically
  const versionWeight = meta.version * 50;

  // Prefer canonical base aliases (e.g., gemini-2.5-flash over dated snapshots) when tied
  const isCanonicalBase = /^gemini-\d+(\.\d+)?-(flash|pro|flash-lite)$/.test(
    meta.modelId
  );
  const canonicalBonus = isCanonicalBase ? 5 : 0;

  return familyWeight + versionWeight + stabilityWeight + canonicalBonus;
}

/**
 * Filters and ranks available Gemini models dynamically for the requested profile.
 */
export function rankGeminiModels(
  models: RawGeminiModelInfo[],
  profile: ModelSelectionProfile
): RankedGeminiModel[] {
  const candidates = models.filter(isTextGenerationCandidate);

  if (candidates.length === 0) {
    throw new Error(
      'No compatible Gemini models supporting generateContent were found in the API response.'
    );
  }

  const ranked: RankedGeminiModel[] = candidates.map((raw) => {
    const meta = parseModelMetadata(raw);
    const score = scoreModelForProfile(meta, profile);
    return {
      ...meta,
      score,
    };
  });

  return ranked.sort((a, b) => b.score - a.score);
}
