import type { ModelSelectionProfile } from '@/core/ai/modelRanking';

export type AuditVerdict = 'CERTIFIED' | 'CONDITIONAL' | 'POLICY_CONFLICT';

export interface MatchedParentContextInput {
  parentId: string;
  title: string;
  department: string;
  sourceType: string;
  similarityScore: number;
  matchedChildSnippet: string;
  fullParentContent: string;
}

export interface ExecutiveAuditReport {
  verdict: AuditVerdict;
  alignmentScore: number;
  selectedModelId: string;
  inferredProfile: ModelSelectionProfile;
  executiveSummary: string;
  strategicEvaluation: string;
  pros: string[];
  cons: string[];
  roadmap: string[];
  citations: Array<{
    parentId: string;
    title: string;
    department: string;
    sourceType: string;
    similarityScore: number;
    matchedChildSnippet: string;
  }>;
  evaluatedAt: string;
}

const CONFLICT_TRIGGER_PATTERN =
  /\b(cancel|abolish|without|bypass|skip|ignore|override|unbudgeted|exceed|abschaffen|ohne|umgehen|ignorieren)\b/i;

const MANDATORY_POLICY_PATTERN =
  /\b(mandatory|require|must|prohibit|capped|sign-off|approval|pflicht|erforderlich|muss|verboten)\b/i;

/**
 * Pure deterministic evaluator that synthesizes a structured Executive Audit Report
 * by comparing a proposed management decision against retrieved Parent documents.
 * Used both as a fast baseline and as a resilient fallback when live LLM calls are unavailable.
 */
export function evaluateDecisionAgainstPoliciesHeuristic(params: {
  decisionProposal: string;
  matchedParents: readonly MatchedParentContextInput[];
  selectedModelId: string;
  inferredProfile: ModelSelectionProfile;
  locale?: 'en' | 'de';
}): ExecutiveAuditReport {
  const {
    decisionProposal,
    matchedParents,
    selectedModelId,
    inferredProfile,
    locale = 'en',
  } = params;

  const topMatch = matchedParents[0];
  const combinedPolicyText = matchedParents
    .map((m) => m.fullParentContent)
    .join(' ');

  const hasConflictSignal =
    CONFLICT_TRIGGER_PATTERN.test(decisionProposal) &&
    MANDATORY_POLICY_PATTERN.test(combinedPolicyText);

  let verdict: AuditVerdict = 'CERTIFIED';
  let alignmentScore = 92;

  if (!topMatch || topMatch.similarityScore < 0.15) {
    verdict = 'CONDITIONAL';
    alignmentScore = 68;
  } else if (hasConflictSignal) {
    verdict = 'POLICY_CONFLICT';
    alignmentScore = 34;
  } else if (CONFLICT_TRIGGER_PATTERN.test(decisionProposal)) {
    verdict = 'CONDITIONAL';
    alignmentScore = 62;
  }

  const primaryPolicyTitle =
    topMatch?.title ??
    (locale === 'de'
      ? 'Allgemeine Unternehmensrichtlinie'
      : 'General Corporate Governance Baseline');

  if (locale === 'de') {
    const executiveSummary =
      verdict === 'POLICY_CONFLICT'
        ? `Richtlinienkonflikt erkannt: Die vorgeschlagene Entscheidung widerspricht verbindlichen Vorgaben in „${primaryPolicyTitle}“.`
        : verdict === 'CONDITIONAL'
        ? `Bedingte Freigabe: Die Entscheidung erfordert zusätzliche Abstimmung gemäß „${primaryPolicyTitle}“.`
        : `Zertifiziert: Die Entscheidung steht im Einklang mit den im Company Brain hinterlegten Richtlinien („${primaryPolicyTitle}“).`;

    return {
      verdict,
      alignmentScore,
      selectedModelId,
      inferredProfile,
      executiveSummary,
      strategicEvaluation: topMatch
        ? `Abgleich mit Hauptdokument „${topMatch.title}“ (Abteilung: ${topMatch.department}): ${topMatch.matchedChildSnippet}`
        : 'Keine direkt widersprechende Klausel gefunden; formale Dokumentation wird empfohlen.',
      pros: [
        'Klare operative Zielsetzung in der Entscheidungsvorlage formuliert',
        'Schnelle Umsetzbarkeit auf Team- oder Abteilungsebene',
      ],
      cons:
        verdict === 'POLICY_CONFLICT'
          ? [
              `Direkter Verstoß gegen Pflichtvorgaben in „${primaryPolicyTitle}“`,
              'Erhöhtes Governance- und Compliance-Risiko bei sofortiger Umsetzung',
            ]
          : [
              'Erfordert transparente Kommunikation der Kennzahlen an Stakeholder',
            ],
      roadmap: [
        `1. Klausel in „${primaryPolicyTitle}“ prüfen und Freigabeschwellen beachten.`,
        '2. Entscheidungsvorlage mit messbaren Erfolgskriterien (KPIs) für 30 Tage versehen.',
        '3. Nach Freigabe durch die zuständige Abteilung im Company Brain protokollieren.',
      ],
      citations: matchedParents.map((m) => ({
        parentId: m.parentId,
        title: m.title,
        department: m.department,
        sourceType: m.sourceType,
        similarityScore: m.similarityScore,
        matchedChildSnippet: m.matchedChildSnippet,
      })),
      evaluatedAt: new Date().toISOString(),
    };
  }

  const executiveSummary =
    verdict === 'POLICY_CONFLICT'
      ? `Policy Conflict Detected: The proposed decision directly contradicts mandatory governance controls in "${primaryPolicyTitle}".`
      : verdict === 'CONDITIONAL'
      ? `Conditional Alignment: The proposal requires secondary sign-off or scope adjustment under "${primaryPolicyTitle}".`
      : `Certified & Aligned: The proposed decision complies with institutional rules recorded in "${primaryPolicyTitle}".`;

  return {
    verdict,
    alignmentScore,
    selectedModelId,
    inferredProfile,
    executiveSummary,
    strategicEvaluation: topMatch
      ? `Cross-examined against Parent Document "${topMatch.title}" (Department: ${topMatch.department}): "${topMatch.matchedChildSnippet}"`
      : 'No conflicting clauses found in the current Company Brain vault; standard executive documentation applies.',
    pros: [
      'Addresses immediate operational efficiency and decision velocity',
      'Clear ownership and scope defined in the manager proposal',
    ],
    cons:
      verdict === 'POLICY_CONFLICT'
        ? [
            `Bypasses mandatory governance controls specified in "${primaryPolicyTitle}"`,
            'Creates audit exposure and cross-departmental misalignment if executed unilaterally',
          ]
        : [
            'Requires documented KPI tracking to verify post-implementation impact',
          ],
    roadmap: [
      `1. Review the cited parent clause in "${primaryPolicyTitle}" and obtain required departmental sign-off.`,
      '2. Run a time-boxed 30-day pilot rather than a permanent policy override.',
      '3. Record the final signed resolution back into the MindMittel Company Brain.',
    ],
    citations: matchedParents.map((m) => ({
      parentId: m.parentId,
      title: m.title,
      department: m.department,
      sourceType: m.sourceType,
      similarityScore: m.similarityScore,
      matchedChildSnippet: m.matchedChildSnippet,
    })),
    evaluatedAt: new Date().toISOString(),
  };
}
