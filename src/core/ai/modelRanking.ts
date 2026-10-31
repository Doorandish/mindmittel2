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

const REASONING_INTENT_KEYWORDS =
  /\b(audit|contradiction|compare|compliance|iso[- ]?37000|coso|dcgk|risk|escalation|charter|board|conflict|violat|prüf|widerspruch|vorstand|risiko)\b/i;

/**
 * Autonomously determines whether a user request requires deep multi-document
 * governance reasoning ('reasoning' -> Pro priority) or rapid retrieval ('fast' -> Flash priority).
 * Eliminates the need for manual user model selection.
 */
export function inferProfileFromQuery(query: string): ModelSelectionProfile {
  const trimmed = query.trim();
  if (trimmed.length > 110 || REASONING_INTENT_KEYWORDS.test(trimmed)) {
    return 'reasoning';
  }
  return 'fast';
}

/**
 * Pure function that inspects a raw Gemini model descriptor and extracts
 * normalized version, family, and stability metadata without hardcoding model versions.
 */
export function parseModelMetadata(
  raw: RawGeminiModelInfo
): Omit<RankedGeminiModel, 'score'> {
  const modelId = raw.name.replace(/^models\//, '');
  const lower = modelId.toLowerCase();

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
    if (meta.family === 'pro') familyWeight = 300;
    else if (meta.family === 'flash') familyWeight = 200;
    else if (meta.family === 'flash-lite') familyWeight = 100;
    else familyWeight = 50;
  }

  let stabilityWeight = 0;
  if (meta.stability === 'stable') stabilityWeight = 40;
  else if (meta.stability === 'preview') stabilityWeight = 15;
  else stabilityWeight = 5;

  const versionWeight = meta.version * 50;

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
