import crypto from 'crypto';

export type DocumentSourceType =
  | 'upload'
  | 'slack'
  | 'confluence'
  | 'gdrive'
  | 'email';

export type AccessLevel = 'public' | 'internal' | 'confidential';

export interface DocumentSourceMetadata {
  type: DocumentSourceType;
  connectorId: string;
  externalId: string;
  url?: string;
}

export interface RawGovernanceDocumentInput {
  orgId: string;
  title: string;
  content: string;
  department: string;
  docType: 'policy' | 'minutes' | 'report' | 'chat' | 'charter';
  language: 'en' | 'de';
  accessLevel: AccessLevel;
  framework?: string;
  tags: string[];
  source: DocumentSourceMetadata;
}

export interface NormalizedFilterMetadata {
  orgId: string;
  department: string;
  sourceType: DocumentSourceType;
  connectorId: string;
  externalId: string;
  docType: 'policy' | 'minutes' | 'report' | 'chat' | 'charter';
  language: 'en' | 'de';
  accessLevel: AccessLevel;
  framework?: string;
  tags: string[];
}

export interface ParentDocumentChunk {
  parentId: string;
  title: string;
  parentIndex: number;
  content: string;
  checksum: string;
  source: DocumentSourceMetadata;
  metadata: NormalizedFilterMetadata;
}

export interface ChildVectorChunk {
  childId: string;
  parentId: string;
  childIndex: number;
  text: string;
  metadata: NormalizedFilterMetadata;
}

export interface ChunkingOptions {
  parentChunkSize?: number;
  childChunkSize?: number;
  childChunkOverlap?: number;
}

/**
 * Normalizes a single string token into lowercase kebab-case suitable for exact metadata pre-filtering.
 */
export function normalizeToken(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u017f]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Cleans, deduplicates, and normalizes an array of user or AI-generated tags.
 */
export function normalizeMetadataTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const tag of tags) {
    const cleaned = normalizeToken(tag);
    if (cleaned.length > 0 && !seen.has(cleaned)) {
      seen.add(cleaned);
      result.push(cleaned);
    }
  }

  return result;
}

/**
 * Slices text into fixed-window segments with optional character overlap.
 */
function sliceTextWithOverlap(
  text: string,
  maxLength: number,
  overlap: number
): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [];
  if (cleaned.length <= maxLength) return [cleaned];

  const chunks: string[] = [];
  const step = Math.max(1, maxLength - overlap);
  let start = 0;

  while (start < cleaned.length) {
    const end = Math.min(start + maxLength, cleaned.length);
    chunks.push(cleaned.slice(start, end));
    if (end >= cleaned.length) break;
    start += step;
  }

  return chunks;
}

/**
 * Pure Parent-Child RAG chunking pipeline:
 * 1. Normalizes metadata and tags for deterministic Atlas Vector Search filtering.
 * 2. Splits raw content into large Parent chunks (~2000 chars) stored in `raw_documents`.
 * 3. Splits each Parent into overlapping Child chunks (~400 chars, overlap 50) for `vector_store`.
 * 4. Denormalizes filterable metadata onto each Child chunk.
 */
export function createParentChildChunks(
  input: RawGovernanceDocumentInput,
  options: ChunkingOptions = {}
): {
  parents: ParentDocumentChunk[];
  children: ChildVectorChunk[];
} {
  const parentChunkSize = options.parentChunkSize ?? 2000;
  const childChunkSize = options.childChunkSize ?? 400;
  const childChunkOverlap = options.childChunkOverlap ?? 50;

  const normalizedMetadata: NormalizedFilterMetadata = {
    orgId: input.orgId.trim(),
    department: normalizeToken(input.department),
    sourceType: input.source.type,
    connectorId: input.source.connectorId.trim(),
    externalId: input.source.externalId.trim(),
    docType: input.docType,
    language: input.language,
    accessLevel: input.accessLevel,
    framework: input.framework ? normalizeToken(input.framework) : undefined,
    tags: normalizeMetadataTags(input.tags),
  };

  const parentTexts = sliceTextWithOverlap(input.content, parentChunkSize, 100);
  const parents: ParentDocumentChunk[] = [];
  const children: ChildVectorChunk[] = [];

  parentTexts.forEach((parentContent, pIdx) => {
    const checksum = crypto
      .createHash('sha256')
      .update(`${input.orgId}:${input.source.externalId}:${pIdx}:${parentContent}`)
      .digest('hex')
      .slice(0, 24);

    const parentId = `parent_${checksum}`;

    parents.push({
      parentId,
      title: input.title,
      parentIndex: pIdx,
      content: parentContent,
      checksum,
      source: input.source,
      metadata: normalizedMetadata,
    });

    const childTexts = sliceTextWithOverlap(
      parentContent,
      childChunkSize,
      childChunkOverlap
    );

    childTexts.forEach((childText, cIdx) => {
      children.push({
        childId: `${parentId}_c${cIdx}`,
        parentId,
        childIndex: cIdx,
        text: childText,
        metadata: normalizedMetadata,
      });
    });
  });

  return { parents, children };
}
