import {
  computeCosineSimilarity,
  generateDeterministicSemanticEmbedding,
  normalizeDepartmentSlug,
} from '@/core/rag/vectorMath';

export interface BrainDocumentForConflictCheck {
  parentId: string;
  title: string;
  department: string;
  content: string;
  tags?: string[];
  createdByEmail?: string;
  createdByName?: string;
}

export interface BrainDocumentConflictSummary {
  parentId: string;
  title: string;
  department: string;
  content: string;
  tags: string[];
  createdByEmail: string;
  createdByName: string;
}

export interface BrainKnowledgeConflictWarning {
  conflictId: string;
  conflictType: 'NUMERIC_THRESHOLD_CONFLICT' | 'POLICY_POLARITY_CONFLICT';
  similarityScore: number;
  conflictReasonEn: string;
  conflictReasonDe: string;
  newerDocument: BrainDocumentForConflictCheck;
  existingDocument: BrainDocumentForConflictCheck;
}

const MANDATORY_RULE_REGEX =
  /\b(mandatory|required|requires|must|prohibited|forbidden|never|pflicht|erforderlich|muss|verboten)\b/i;

const PERMISSIVE_OVERRIDE_REGEX =
  /\b(cancel|cancelled|canceled|abolish|abolished|optional|voluntary|no longer required|without.*approval|without.*notification|without.*sign-off|exempt|waived|abschaffen|abgeschafft|freiwillig|optional|ohne.*genehmigung)\b/i;

/**
 * Extracts normalized numeric thresholds (currency amounts strictly with Euro/USD before or after,
 * durations like 15-minute, or percentages) from a governance text for discrepancy comparison.
 * Calendar dates (e.g. 10.2020, 2020/2021, 09.1989) are strictly excluded from monetary thresholds.
 */
function extractKeyNumbers(text: string): string[] {
  // Currency with indicator BEFORE the number: €10,000 | EUR 10000 | Euro 500 | USD 25,000 | $15,000
  const currencyPrefixRegex =
    /(?:€|\$|EUR|Euro|Euros|USD|Dollar|Dollars)\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+)/gi;

  // Currency with indicator AFTER the number: 10,000 € | 25000 EUR | 30.000 Euro | 25,000 USD | 5000 Dollars
  const currencySuffixRegex =
    /\b(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+)\s*(?:€|\$|EUR|Euro|Euros|USD|Dollar|Dollars)\b/gi;

  // Percentages and duration thresholds
  const percentageAndDurationRegex =
    /\b\d+(?:[.,]\d+)?\s*(?:%|percent|prozent)\b|\b\d+\s*(?:minutes|minute|days|day|hours|hour|months|month|tage|tagen|stunden|stunde)\b/gi;

  const rawMatches: string[] = [];

  let match: RegExpExecArray | null;
  while ((match = currencyPrefixRegex.exec(text)) !== null) {
    rawMatches.push(match[0]);
  }
  while ((match = currencySuffixRegex.exec(text)) !== null) {
    rawMatches.push(match[0]);
  }
  while ((match = percentageAndDurationRegex.exec(text)) !== null) {
    rawMatches.push(match[0]);
  }

  return Array.from(
    new Set(
      rawMatches.map((m) =>
        m
          .toLowerCase()
          .replace(/\s+/g, '')
          .replace(/\./g, ',')
      )
    )
  );
}

/**
 * Compares all documents inside the Company Brain to detect contradictions between
 * newly ingested documents and existing related documents on the same topic.
 */
export function detectBrainDocumentConflicts(
  documents: readonly BrainDocumentForConflictCheck[]
): BrainKnowledgeConflictWarning[] {
  if (documents.length < 2) {
    return [];
  }

  const embeddedDocs = documents.map((doc) => ({
    doc,
    deptSlug: normalizeDepartmentSlug(doc.department),
    vector: generateDeterministicSemanticEmbedding(
      `${doc.department} ${(doc.tags ?? []).join(' ')} ${doc.title} ${doc.content}`
    ),
    numbers: extractKeyNumbers(doc.content),
    hasMandatory: MANDATORY_RULE_REGEX.test(doc.content),
    hasPermissiveOverride: PERMISSIVE_OVERRIDE_REGEX.test(doc.content),
  }));

  const warnings: BrainKnowledgeConflictWarning[] = [];

  for (let i = 0; i < embeddedDocs.length; i++) {
    for (let j = i + 1; j < embeddedDocs.length; j++) {
      const newer = embeddedDocs[i];
      const older = embeddedDocs[j];

      if (newer.doc.parentId === older.doc.parentId) continue;

      // Do not compare chunks or sections belonging to the exact same document
      const normNewerTitle = newer.doc.title
        .trim()
        .toLowerCase()
        .replace(/\s*\(part\s+\d+\)$/i, '');
      const normOlderTitle = older.doc.title
        .trim()
        .toLowerCase()
        .replace(/\s*\(part\s+\d+\)$/i, '');
      if (normNewerTitle === normOlderTitle) continue;

      const similarity = computeCosineSimilarity(newer.vector, older.vector);
      const sameDept = newer.deptSlug === older.deptSlug;

      // Require semantic topical overlap before checking for contradiction
      const isTopicallyRelated =
        similarity >= 0.34 || (sameDept && similarity >= 0.24);
      if (!isTopicallyRelated) continue;

      // 1. Check for Policy Polarity Conflict (one mandates/prohibits, the other cancels/waives/makes optional)
      const polarityConflict =
        (newer.hasPermissiveOverride && older.hasMandatory && !older.hasPermissiveOverride) ||
        (older.hasPermissiveOverride && newer.hasMandatory && !newer.hasPermissiveOverride);

      // 2. Check for Numeric / Threshold Discrepancy on the same topic
      const newerNums = newer.numbers;
      const olderNums = older.numbers;
      const hasNumericDiscrepancy =
        newerNums.length > 0 &&
        olderNums.length > 0 &&
        (newerNums.some((n) => !olderNums.includes(n)) ||
          olderNums.some((n) => !newerNums.includes(n)));

      if (!polarityConflict && !hasNumericDiscrepancy) {
        continue;
      }

      const simFixed = Number(similarity.toFixed(2));

      if (hasNumericDiscrepancy && polarityConflict) {
        warnings.push({
          conflictId: `conflict_${newer.doc.parentId}_${older.doc.parentId}`,
          conflictType: 'NUMERIC_THRESHOLD_CONFLICT',
          similarityScore: simFixed,
          conflictReasonEn: `Threshold & Rule Contradiction: "${newer.doc.title}" specifies (${newerNums.join(', ')}) with permissive/override clauses, directly contradicting "${older.doc.title}" (${olderNums.join(', ')}).`,
          conflictReasonDe: `Schwellenwert- & Regelkonflikt: „${newer.doc.title}“ nennt (${newerNums.join(', ')}) und widerspricht damit den Vorgaben in „${older.doc.title}“ (${olderNums.join(', ')}).`,
          newerDocument: newer.doc,
          existingDocument: older.doc,
        });
      } else if (hasNumericDiscrepancy) {
        warnings.push({
          conflictId: `conflict_${newer.doc.parentId}_${older.doc.parentId}`,
          conflictType: 'NUMERIC_THRESHOLD_CONFLICT',
          similarityScore: simFixed,
          conflictReasonEn: `Conflicting Numeric Thresholds on Related Topic: "${newer.doc.title}" specifies [${newerNums.join(', ')}], whereas "${older.doc.title}" specifies [${olderNums.join(', ')}].`,
          conflictReasonDe: `Widersprüchliche Zahlen/Grenzwerte zum gleichen Thema: „${newer.doc.title}“ definiert [${newerNums.join(', ')}], während „${older.doc.title}“ [${olderNums.join(', ')}] festlegt.`,
          newerDocument: newer.doc,
          existingDocument: older.doc,
        });
      } else {
        warnings.push({
          conflictId: `conflict_${newer.doc.parentId}_${older.doc.parentId}`,
          conflictType: 'POLICY_POLARITY_CONFLICT',
          similarityScore: simFixed,
          conflictReasonEn: `Direct Governance Contradiction: "${newer.doc.title}" cancels, waives, or makes optional a mandatory requirement enforced in "${older.doc.title}".`,
          conflictReasonDe: `Direkter Richtlinienwiderspruch: „${newer.doc.title}“ hebt eine verbindliche Pflichtvorgabe aus „${older.doc.title}“ auf oder erklärt sie für optional.`,
          newerDocument: newer.doc,
          existingDocument: older.doc,
        });
      }
    }
  }

  return warnings;
}
