import {
  createParentChildChunks,
  type DocumentSourceType,
  type ParentDocumentChunk,
  type RawGovernanceDocumentInput,
} from '@/core/rag/chunker';
import {
  rankParentDocumentsByVectorMatch,
  type EmbeddedChildChunk,
  type MatchedParentDocumentResult,
} from '@/core/rag/vectorMath';
import {
  COLLECTIONS,
  VECTOR_INDEX_DEFINITION,
  type RawDocumentRecord,
  type VectorStoreRecord,
} from '@/infrastructure/db/schemas';
import { getMindMittelDb } from '@/infrastructure/db/mongo';
import { generateGeminiEmbedding768 } from '@/infrastructure/gemini/embeddingService';
import { systemLogger } from '@/infrastructure/logging/logger';

interface InMemoryBrainVault {
  parents: ParentDocumentChunk[];
  children: EmbeddedChildChunk[];
  seeded: boolean;
  atlasIndexProvisionAttempted: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __mindmittelBrainVault: InMemoryBrainVault | undefined;
}

const DEFAULT_SAMPLE_POLICIES: RawGovernanceDocumentInput[] = [
  {
    orgId: 'org_default',
    title: 'Financial Procurement & Approval Charter 2026',
    content:
      'Section 4.2 — Expenditure Escalation Thresholds: Department heads may approve budgeted software and vendor contracts up to €10,000. Any unbudgeted expenditure or vendor commitment exceeding €10,000 requires formal written co-signature from the Chief Financial Officer (CFO) and Supervisory Board notification prior to contract execution.',
    department: 'Finance & Legal',
    docType: 'charter',
    language: 'en',
    accessLevel: 'internal',
    tags: ['procurement', 'budget', 'vendor-contract', 'board-approval'],
    source: {
      type: 'upload',
      connectorId: 'seed_charter',
      externalId: 'policy_fin_2026',
    },
  },
  {
    orgId: 'org_default',
    title: 'Engineering Agile & Sprint Governance Policy',
    content:
      'Section 2.1 — Mandatory Team Syncs: Daily 15-minute Scrum standup meetings are mandatory across all engineering squads to surface technical blockers, security risks, and cross-team dependencies early. Unilaterally abolishing daily standups is prohibited; teams wishing to test asynchronous status updates must first run a documented 30-day pilot approved by the VP of Engineering.',
    department: 'Engineering',
    docType: 'policy',
    language: 'en',
    accessLevel: 'internal',
    tags: ['scrum', 'standup', 'agile', 'engineering'],
    source: {
      type: 'slack',
      connectorId: 'slack_gov_council',
      externalId: 'policy_eng_2026',
    },
  },
  {
    orgId: 'org_default',
    title: 'Data Privacy & AI Vendor Security Guideline (DSGVO / GDPR)',
    content:
      'Section 1.4 — External AI & Cloud Tools: No customer or employee personal data (PII) may be uploaded to third-party AI tools without a signed Data Processing Agreement (DPA / Auftragsverarbeitungsvertrag) and EU data residency verification by the Data Protection Officer.',
    department: 'HR & Legal',
    docType: 'policy',
    language: 'de',
    accessLevel: 'internal',
    tags: ['gdpr', 'dsgvo', 'ai-security', 'privacy'],
    source: {
      type: 'upload',
      connectorId: 'seed_privacy',
      externalId: 'policy_sec_2026',
    },
  },
];

function getMemoryVault(): InMemoryBrainVault {
  if (!globalThis.__mindmittelBrainVault) {
    globalThis.__mindmittelBrainVault = {
      parents: [],
      children: [],
      seeded: false,
      atlasIndexProvisionAttempted: false,
    };
  }
  return globalThis.__mindmittelBrainVault;
}

/**
 * Automatically attempts to create the `mindmittel_vector_index` on MongoDB Atlas (`mindmittel_v2.vector_store`)
 * so the user never has to configure vector indexes manually in the Atlas UI.
 */
async function ensureAtlasVectorIndexProvisioned(): Promise<void> {
  const vault = getMemoryVault();
  if (vault.atlasIndexProvisionAttempted) return;
  vault.atlasIndexProvisionAttempted = true;

  try {
    const db = await getMindMittelDb();
    const vectorCollection = db.collection(COLLECTIONS.VECTOR_STORE);

    await vectorCollection.createSearchIndex({
      name: VECTOR_INDEX_DEFINITION.name,
      type: VECTOR_INDEX_DEFINITION.type,
      definition: VECTOR_INDEX_DEFINITION.definition,
    });

    systemLogger.info(
      'db.mongo',
      `Auto-provisioned Atlas Vector Search index [${VECTOR_INDEX_DEFINITION.name}] (768-d cosine)`,
      { indexName: VECTOR_INDEX_DEFINITION.name }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    systemLogger.info(
      'db.mongo',
      `Atlas Vector Search index check completed (${msg.slice(0, 90)})`
    );
  }
}

/**
 * Ingests a document into the Company Brain:
 * 1. Slices into Parent (2,000c) and Child (400c) chunks.
 * 2. Generates 768-d embeddings for each Child chunk.
 * 3. Persists to MongoDB Atlas (`mindmittel_v2`) if configured, and mirrors in the zero-downtime memory vault.
 */
export async function ingestDocumentIntoBrain(params: {
  title: string;
  content: string;
  department: string;
  sourceType?: DocumentSourceType;
  tags?: string[];
  language?: 'en' | 'de';
}): Promise<{
  parentCount: number;
  childVectorCount: number;
  embeddingModel: string;
  storageMode: 'mongodb_atlas' | 'memory_fallback';
  firstParentId: string;
}> {
  const vault = getMemoryVault();

  const rawInput: RawGovernanceDocumentInput = {
    orgId: 'org_default',
    title: params.title.trim(),
    content: params.content.trim(),
    department: params.department.trim() || 'General',
    docType: 'policy',
    language: params.language ?? 'en',
    accessLevel: 'internal',
    tags:
      params.tags && params.tags.length > 0
        ? params.tags
        : [params.department.toLowerCase(), 'governance'],
    source: {
      type: params.sourceType ?? 'upload',
      connectorId: 'workspace_ui',
      externalId: `doc_${Date.now()}`,
    },
  };

  const { parents, children } = createParentChildChunks(rawInput);
  const embeddedChildren: EmbeddedChildChunk[] = [];
  let embeddingModelUsed = 'deterministic-semantic-768d';

  for (const child of children) {
    const { vector, modelUsed } = await generateGeminiEmbedding768(
      `${child.metadata.department} ${child.metadata.tags.join(' ')} ${child.text}`
    );
    embeddingModelUsed = modelUsed;
    embeddedChildren.push({
      ...child,
      embedding: vector,
    });
  }

  // Always update in-memory mirror for instant zero-downtime availability
  for (const parent of parents) {
    vault.parents = [
      parent,
      ...vault.parents.filter((p) => p.parentId !== parent.parentId),
    ];
  }
  const newParentIds = new Set(parents.map((p) => p.parentId));
  vault.children = [
    ...embeddedChildren,
    ...vault.children.filter((c) => !newParentIds.has(c.parentId)),
  ];

  // Persist to MongoDB Atlas (`mindmittel_v2`) if MONGODB_URI is configured
  let storageMode: 'mongodb_atlas' | 'memory_fallback' = 'memory_fallback';
  if (
    process.env.MONGODB_URI &&
    (process.env.MONGODB_URI.startsWith('mongodb://') ||
      process.env.MONGODB_URI.startsWith('mongodb+srv://'))
  ) {
    try {
      const db = await getMindMittelDb();
      const now = new Date();

      const parentRecords: RawDocumentRecord[] = parents.map((p) => ({
        ...p,
        createdAt: now,
        updatedAt: now,
      }));

      const vectorRecords: VectorStoreRecord[] = embeddedChildren.map((c) => ({
        ...c,
        embeddingModel: embeddingModelUsed,
        createdAt: now,
      }));

      await db
        .collection<RawDocumentRecord>(COLLECTIONS.RAW_DOCUMENTS)
        .insertMany(parentRecords);
      await db
        .collection<VectorStoreRecord>(COLLECTIONS.VECTOR_STORE)
        .insertMany(vectorRecords);

      await ensureAtlasVectorIndexProvisioned();
      storageMode = 'mongodb_atlas';
    } catch (err) {
      systemLogger.warn(
        'db.mongo',
        'MongoDB Atlas write fallback to in-memory vault',
        { error: err instanceof Error ? err.message : String(err) }
      );
    }
  }

  systemLogger.info(
    'rag.ingest',
    `Ingested "${params.title}" (${parents.length} Parent, ${embeddedChildren.length} Child 768-d vectors)`,
    {
      department: params.department,
      storageMode,
      embeddingModel: embeddingModelUsed,
    }
  );

  return {
    parentCount: parents.length,
    childVectorCount: embeddedChildren.length,
    embeddingModel: embeddingModelUsed,
    storageMode,
    firstParentId: parents[0]?.parentId ?? '',
  };
}

/**
 * Ensures the Company Brain has the 3 baseline corporate policies loaded on first boot.
 */
async function ensureDefaultPoliciesSeeded(): Promise<void> {
  const vault = getMemoryVault();
  if (vault.seeded) return;
  vault.seeded = true;

  for (const policy of DEFAULT_SAMPLE_POLICIES) {
    const { parents, children } = createParentChildChunks(policy);
    for (const p of parents) {
      vault.parents.push(p);
    }
    for (const c of children) {
      const { vector } = await generateGeminiEmbedding768(
        `${c.metadata.department} ${c.metadata.tags.join(' ')} ${c.text}`
      );
      vault.children.push({ ...c, embedding: vector });
    }
  }
}

/**
 * Lists all Parent documents currently stored in the Company Brain along with their child vector count.
 */
export async function listBrainDocuments(): Promise<
  Array<{
    parentId: string;
    title: string;
    department: string;
    sourceType: string;
    tags: string[];
    contentPreview: string;
    childCount: number;
  }>
> {
  await ensureDefaultPoliciesSeeded();
  const vault = getMemoryVault();

  // Also try reading from MongoDB Atlas if configured
  if (
    process.env.MONGODB_URI &&
    (process.env.MONGODB_URI.startsWith('mongodb://') ||
      process.env.MONGODB_URI.startsWith('mongodb+srv://'))
  ) {
    try {
      const db = await getMindMittelDb();
      const remoteDocs = await db
        .collection<RawDocumentRecord>(COLLECTIONS.RAW_DOCUMENTS)
        .find({})
        .sort({ createdAt: -1 })
        .limit(25)
        .toArray();

      if (remoteDocs.length > 0) {
        const existingIds = new Set(vault.parents.map((p) => p.parentId));
        for (const doc of remoteDocs) {
          if (!existingIds.has(doc.parentId)) {
            vault.parents.unshift(doc);
          }
        }
      }
    } catch {
      // Fallback silently to memory vault
    }
  }

  return vault.parents.map((parent) => {
    const childCount = vault.children.filter(
      (c) => c.parentId === parent.parentId
    ).length;

    return {
      parentId: parent.parentId,
      title: parent.title,
      department: parent.metadata.department,
      sourceType: parent.metadata.sourceType,
      tags: parent.metadata.tags,
      contentPreview: parent.content,
      childCount: Math.max(1, childCount),
    };
  });
}

/**
 * Removes a Parent document and cascades deletion to all of its Child vectors.
 */
export async function removeBrainDocument(parentId: string): Promise<void> {
  const vault = getMemoryVault();
  vault.parents = vault.parents.filter((p) => p.parentId !== parentId);
  vault.children = vault.children.filter((c) => c.parentId !== parentId);

  if (
    process.env.MONGODB_URI &&
    (process.env.MONGODB_URI.startsWith('mongodb://') ||
      process.env.MONGODB_URI.startsWith('mongodb+srv://'))
  ) {
    try {
      const db = await getMindMittelDb();
      await Promise.all([
        db.collection(COLLECTIONS.RAW_DOCUMENTS).deleteOne({ parentId }),
        db.collection(COLLECTIONS.VECTOR_STORE).deleteMany({ parentId }),
      ]);
    } catch {
      // Ignore if offline
    }
  }

  systemLogger.info(
    'rag.delete',
    `Cascaded deletion for parentId [${parentId}] and its child vectors`
  );
}

/**
 * Searches the Company Brain by meaning (768-d vector similarity) and returns the top Parent documents.
 */
export async function searchBrainByVectorSimilarity(params: {
  query: string;
  departmentFilter?: string;
  topK?: number;
}): Promise<MatchedParentDocumentResult[]> {
  await ensureDefaultPoliciesSeeded();
  const vault = getMemoryVault();

  const { vector: queryVector } = await generateGeminiEmbedding768(params.query);

  return rankParentDocumentsByVectorMatch({
    queryVector,
    children: vault.children,
    parents: vault.parents,
    departmentFilter: params.departmentFilter,
    topK: params.topK ?? 3,
  });
}
