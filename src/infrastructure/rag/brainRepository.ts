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

export interface VectorSearchDiagnosticStatus {
  state:
    | 'ACTIVE_ON_ATLAS'
    | 'BUILDING_ON_ATLAS'
    | 'ATLAS_UI_REQUIRED'
    | 'MEMORY_FALLBACK';
  indexName: string;
  databaseName: string;
  collectionName: string;
  message: string;
}

interface InMemoryBrainVault {
  parents: ParentDocumentChunk[];
  children: EmbeddedChildChunk[];
  seeded: boolean;
  atlasSeeded: boolean;
  vectorDiagnostic: VectorSearchDiagnosticStatus;
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

function isMongoConfigured(): boolean {
  const uri = process.env.MONGODB_URI;
  return Boolean(
    uri && (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'))
  );
}

function getMemoryVault(): InMemoryBrainVault {
  if (!globalThis.__mindmittelBrainVault) {
    globalThis.__mindmittelBrainVault = {
      parents: [],
      children: [],
      seeded: false,
      atlasSeeded: false,
      vectorDiagnostic: {
        state: 'MEMORY_FALLBACK',
        indexName: VECTOR_INDEX_DEFINITION.name,
        databaseName: 'mindmittel_v2',
        collectionName: COLLECTIONS.VECTOR_STORE,
        message: 'Awaiting MongoDB Atlas connection...',
      },
    };
  }
  return globalThis.__mindmittelBrainVault;
}

export function getVectorSearchDiagnosticStatus(): VectorSearchDiagnosticStatus {
  return getMemoryVault().vectorDiagnostic;
}

/**
 * Automatically checks and provisions the `mindmittel_vector_index` on MongoDB Atlas (`mindmittel_v2.vector_store`).
 * Ensures the `vector_store` collection physically exists in MongoDB Atlas BEFORE calling `createSearchIndex`.
 */
export async function ensureAtlasVectorIndexProvisioned(): Promise<VectorSearchDiagnosticStatus> {
  const vault = getMemoryVault();
  if (!isMongoConfigured()) {
    return vault.vectorDiagnostic;
  }

  try {
    const db = await getMindMittelDb();
    const vectorCollection = db.collection(COLLECTIONS.VECTOR_STORE);

    // 1. Check if the index already exists on Atlas
    try {
      const existingIndexes = await vectorCollection
        .listSearchIndexes(VECTOR_INDEX_DEFINITION.name)
        .toArray();
      if (existingIndexes.length > 0) {
        const idx = existingIndexes[0] as Record<string, unknown>;
        const statusStr = String(idx.status ?? 'READY').toUpperCase();
        vault.vectorDiagnostic = {
          state:
            statusStr === 'READY' ? 'ACTIVE_ON_ATLAS' : 'BUILDING_ON_ATLAS',
          indexName: VECTOR_INDEX_DEFINITION.name,
          databaseName: db.databaseName,
          collectionName: COLLECTIONS.VECTOR_STORE,
          message: `Atlas Vector Index [${VECTOR_INDEX_DEFINITION.name}] status: ${statusStr}`,
        };
        return vault.vectorDiagnostic;
      }
    } catch {
      // Ignore if listSearchIndexes is not supported on older tier
    }

    // 2. Create the index programmatically on mindmittel_v2.vector_store
    await vectorCollection.createSearchIndex({
      name: VECTOR_INDEX_DEFINITION.name,
      type: VECTOR_INDEX_DEFINITION.type,
      definition: VECTOR_INDEX_DEFINITION.definition,
    });

    vault.vectorDiagnostic = {
      state: 'BUILDING_ON_ATLAS',
      indexName: VECTOR_INDEX_DEFINITION.name,
      databaseName: db.databaseName,
      collectionName: COLLECTIONS.VECTOR_STORE,
      message: `Auto-created [${VECTOR_INDEX_DEFINITION.name}] on ${db.databaseName}.${COLLECTIONS.VECTOR_STORE}`,
    };

    systemLogger.info(
      'db.mongo',
      `Auto-provisioned Atlas Vector Search index [${VECTOR_INDEX_DEFINITION.name}] (768-d cosine)`,
      { indexName: VECTOR_INDEX_DEFINITION.name }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    vault.vectorDiagnostic = {
      state: 'ATLAS_UI_REQUIRED',
      indexName: VECTOR_INDEX_DEFINITION.name,
      databaseName: 'mindmittel_v2',
      collectionName: COLLECTIONS.VECTOR_STORE,
      message: `Atlas driver index creation note: ${msg.slice(0, 120)}`,
    };
    systemLogger.info(
      'db.mongo',
      `Atlas Vector Search index check (${msg.slice(0, 110)})`
    );
  }

  return vault.vectorDiagnostic;
}

/**
 * Ensures the Company Brain has the 3 baseline corporate policies loaded on first boot,
 * AND persists them into `mindmittel_v2.raw_documents` & `mindmittel_v2.vector_store` in MongoDB Atlas
 * so the `vector_store` collection physically exists in Atlas immediately!
 */
async function ensureDefaultPoliciesSeeded(): Promise<void> {
  const vault = getMemoryVault();

  if (!vault.seeded) {
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

  // Also ensure MongoDB Atlas `mindmittel_v2.raw_documents` and `mindmittel_v2.vector_store` are seeded on first boot
  if (!vault.atlasSeeded && isMongoConfigured()) {
    vault.atlasSeeded = true;
    try {
      const db = await getMindMittelDb();
      const rawCol = db.collection<RawDocumentRecord>(COLLECTIONS.RAW_DOCUMENTS);
      const vecCol = db.collection<VectorStoreRecord>(COLLECTIONS.VECTOR_STORE);

      const existingCount = await vecCol.countDocuments({});
      if (existingCount === 0 && vault.parents.length > 0) {
        const now = new Date();
        await rawCol.insertMany(
          vault.parents.map((p) => ({
            ...p,
            createdAt: now,
            updatedAt: now,
          }))
        );
        await vecCol.insertMany(
          vault.children.map((c) => ({
            ...c,
            embeddingModel: 'gemini-embedding-768d',
            createdAt: now,
          }))
        );
        systemLogger.info(
          'db.mongo',
          `Seeded ${vault.parents.length} Parent documents and ${vault.children.length} 768-d vectors into MongoDB Atlas (mindmittel_v2.vector_store)`
        );
      }

      // Now that `mindmittel_v2.vector_store` exists in Atlas, provision the Vector Search index
      await ensureAtlasVectorIndexProvisioned();
    } catch (err) {
      vault.atlasSeeded = false;
      systemLogger.warn(
        'db.mongo',
        'Initial MongoDB Atlas seed deferred',
        { error: err instanceof Error ? err.message : String(err) }
      );
    }
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
  await ensureDefaultPoliciesSeeded();
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
  if (isMongoConfigured()) {
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

  // Also sync any remote documents from MongoDB Atlas if configured
  if (isMongoConfigured()) {
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

  if (isMongoConfigured()) {
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
 * Searches the Company Brain by meaning (768-d vector similarity):
 * 1. First attempts native MongoDB Atlas `$vectorSearch` on `mindmittel_v2.vector_store` using `mindmittel_vector_index`.
 * 2. Automatically falls back to deterministic 768-d cosine similarity if the Atlas index is still building or offline.
 */
export async function searchBrainByVectorSimilarity(params: {
  query: string;
  departmentFilter?: string;
  topK?: number;
}): Promise<MatchedParentDocumentResult[]> {
  await ensureDefaultPoliciesSeeded();
  const vault = getMemoryVault();
  const topK = params.topK ?? 3;

  const { vector: queryVector } = await generateGeminiEmbedding768(params.query);

  if (isMongoConfigured()) {
    try {
      const db = await getMindMittelDb();
      const vecCol = db.collection(COLLECTIONS.VECTOR_STORE);
      const rawCol = db.collection<RawDocumentRecord>(COLLECTIONS.RAW_DOCUMENTS);

      const vectorSearchStage: Record<string, unknown> = {
        index: VECTOR_INDEX_DEFINITION.name,
        path: 'embedding',
        queryVector,
        numCandidates: 50,
        limit: topK * 3,
      };

      if (
        params.departmentFilter &&
        params.departmentFilter !== 'all' &&
        params.departmentFilter.trim() !== ''
      ) {
        vectorSearchStage.filter = {
          'metadata.department': params.departmentFilter
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-'),
        };
      }

      const atlasHits = await vecCol
        .aggregate([
          { $vectorSearch: vectorSearchStage },
          {
            $project: {
              chunkId: 1,
              parentId: 1,
              text: 1,
              metadata: 1,
              score: { $meta: 'vectorSearchScore' },
            },
          },
        ])
        .toArray();

      if (atlasHits.length > 0) {
        const parentIds = Array.from(
          new Set(atlasHits.map((h) => String(h.parentId)))
        ).slice(0, topK);

        const parentDocs = await rawCol
          .find({ parentId: { $in: parentIds } })
          .toArray();
        const parentMap = new Map(parentDocs.map((p) => [p.parentId, p]));

        const results: MatchedParentDocumentResult[] = [];
        for (const pid of parentIds) {
          const parent =
            parentMap.get(pid) ??
            vault.parents.find((p) => p.parentId === pid);
          const bestChild = atlasHits.find((h) => String(h.parentId) === pid);
          if (parent && bestChild) {
            results.push({
              parentId: parent.parentId,
              title: parent.title,
              department: parent.metadata.department,
              sourceType: parent.metadata.sourceType,
              similarityScore: Number(Number(bestChild.score ?? 0.8).toFixed(4)),
              matchedChildSnippet: String(bestChild.text),
              fullParentContent: parent.content,
              parent,
            });
          }
        }

        if (results.length > 0) {
          vault.vectorDiagnostic.state = 'ACTIVE_ON_ATLAS';
          return results;
        }
      }
    } catch {
      // Seamless fallback to in-memory cosine similarity while Atlas index builds
    }
  }

  return rankParentDocumentsByVectorMatch({
    queryVector,
    children: vault.children,
    parents: vault.parents,
    departmentFilter: params.departmentFilter,
    topK,
  });
}
