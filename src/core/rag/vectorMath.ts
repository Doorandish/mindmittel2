import { EMBEDDING_DIMENSIONS } from '@/infrastructure/db/schemas';
import type {
  ChildVectorChunk,
  ParentDocumentChunk,
} from '@/core/rag/chunker';

export interface EmbeddedChildChunk extends ChildVectorChunk {
  embedding: number[];
}

export interface MatchedParentDocumentResult {
  parentId: string;
  title: string;
  department: string;
  sourceType: string;
  similarityScore: number;
  matchedChildSnippet: string;
  fullParentContent: string;
  parent: ParentDocumentChunk;
}

const SYNONYM_CONCEPT_CLUSTERS: ReadonlyArray<{
  clusterId: number;
  pattern: RegExp;
}> = [
  {
    clusterId: 0,
    pattern:
      /\b(expense|spend|budget|unbudgeted|petty|cash|vendor|contract|procurement|euro|cost|financial|finance|cfo|ausgaben|budget|vertrag|kosten|finanzen|portokasse|freigabe)\b/i,
  },
  {
    clusterId: 1,
    pattern:
      /\b(board|supervisory|charter|approval|sign-off|escalat|threshold|governance|executive|vorstand|aufsichtsrat|genehmigung|unterschrift)\b/i,
  },
  {
    clusterId: 2,
    pattern:
      /\b(scrum|standup|daily|sprint|agile|retrospective|engineering|developer|meeting|blocker|team|täglich|entwickler|besprechung)\b/i,
  },
  {
    clusterId: 3,
    pattern:
      /\b(cancel|abolish|remove|skip|bypass|without|eliminate|violation|abschaffen|streichen|ohne|umgehen)\b/i,
  },
  {
    clusterId: 4,
    pattern:
      /\b(security|privacy|gdpr|dsgvo|encryption|data|confidential|access|sicherheit|datenschutz|vertraulich)\b/i,
  },
  {
    clusterId: 5,
    pattern:
      /\b(hr|hiring|remote|work|leave|vacation|employee|personal|urlaub|mitarbeiter|homeoffice)\b/i,
  },
];

/**
 * Computes cosine similarity between two equal-length numerical vectors in [-1, 1].
 */
export function computeCosineSimilarity(
  vecA: readonly number[],
  vecB: readonly number[]
): number {
  const len = Math.min(vecA.length, vecB.length);
  if (len === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Generates a deterministic 768-dimensional normalized vector embedding.
 * Combines concept-cluster activation with token & character trigram feature hashing
 * so semantic similarity works reliably even in offline/unit-test environments.
 */
export function generateDeterministicSemanticEmbedding(text: string): number[] {
  const vector = new Float64Array(EMBEDDING_DIMENSIONS);
  const cleaned = text.toLowerCase().trim();

  // 1. Activate semantic concept dimensions (dims 0..63)
  for (const cluster of SYNONYM_CONCEPT_CLUSTERS) {
    const matches = cleaned.match(new RegExp(cluster.pattern.source, 'gi'));
    if (matches && matches.length > 0) {
      const baseIdx = (cluster.clusterId * 8) % 64;
      for (let offset = 0; offset < 8; offset++) {
        vector[baseIdx + offset] += 2.5 * Math.min(matches.length, 4);
      }
    }
  }

  // 2. Word token hashing (dims 64..511)
  const tokens = cleaned
    .replace(/[^a-z0-9\u00c0-\u017f\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  for (const token of tokens) {
    let hash = 2166136261;
    for (let i = 0; i < token.length; i++) {
      hash ^= token.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const idx = 64 + (Math.abs(hash) % 448);
    vector[idx] += 1.5;
  }

  // 3. Character 3-gram hashing for cross-lingual stem resilience (dims 512..767)
  for (let i = 0; i <= cleaned.length - 3; i++) {
    const trigram = cleaned.slice(i, i + 3);
    const code =
      trigram.charCodeAt(0) * 31 * 31 +
      trigram.charCodeAt(1) * 31 +
      trigram.charCodeAt(2);
    const idx = 512 + (Math.abs(code) % 256);
    vector[idx] += 0.35;
  }

  // L2 Normalization
  let sumSq = 0;
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq) || 1;

  const normalized = new Array<number>(EMBEDDING_DIMENSIONS);
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    normalized[i] = Number((vector[i] / norm).toFixed(6));
  }

  return normalized;
}

/**
 * Matches a query vector against Child chunks (with optional department filter),
 * then deduplicates and returns the highest-scoring Parent documents.
 */
export function rankParentDocumentsByVectorMatch(params: {
  queryVector: readonly number[];
  children: readonly EmbeddedChildChunk[];
  parents: readonly ParentDocumentChunk[];
  departmentFilter?: string;
  topK?: number;
}): MatchedParentDocumentResult[] {
  const {
    queryVector,
    children,
    parents,
    departmentFilter,
    topK = 3,
  } = params;

  const parentMap = new Map<string, ParentDocumentChunk>();
  for (const p of parents) {
    parentMap.set(p.parentId, p);
  }

  const filteredChildren =
    departmentFilter && departmentFilter !== 'all'
      ? children.filter(
          (c) =>
            c.metadata.department.toLowerCase() ===
            departmentFilter.toLowerCase()
        )
      : children;

  const bestByParent = new Map<string, MatchedParentDocumentResult>();

  for (const child of filteredChildren) {
    const parent = parentMap.get(child.parentId);
    if (!parent) continue;

    const score = computeCosineSimilarity(queryVector, child.embedding);
    const existing = bestByParent.get(child.parentId);

    if (!existing || score > existing.similarityScore) {
      bestByParent.set(child.parentId, {
        parentId: parent.parentId,
        title: parent.title,
        department: parent.metadata.department,
        sourceType: parent.metadata.sourceType,
        similarityScore: Number(score.toFixed(4)),
        matchedChildSnippet: child.text,
        fullParentContent: parent.content,
        parent,
      });
    }
  }

  return Array.from(bestByParent.values())
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, topK);
}
