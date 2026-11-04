import {
  createParentChildChunks,
  type DocumentSourceType,
  type ParentDocumentChunk,
  type RawGovernanceDocumentInput,
} from '@/core/rag/chunker';
import {
  rankParentDocumentsByVectorMatch,
  resolveDepartmentFilterCandidates,
  type EmbeddedChildChunk,
  type MatchedParentDocumentResult,
} from '@/core/rag/vectorMath';
import {
  detectBrainDocumentConflicts,
  type BrainKnowledgeConflictWarning,
} from '@/core/rag/conflictDetector';
import {
  COLLECTIONS,
  VECTOR_INDEX_DEFINITION,
  type RawDocumentRecord,
  type VectorStoreRecord,
} from '@/infrastructure/db/schemas';
import { getMindMittelDb } from '@/infrastructure/db/mongo';
import { generateGeminiEmbedding768 } from '@/infrastructure/gemini/embeddingService';
import { systemLogger } from '@/infrastructure/logging/logger';
import type { ExecutiveAuditReport } from '@/core/audit/decisionEvaluator';
import {
  buildConnectorSyncDocument,
  configureConnectorCredentials,
  createInitialConnectorsState,
  fetchLiveConnectorPayloadOrFallback,
  toggleConnectorState,
  type EnterpriseConnectorItem,
} from '@/core/connectors/connectorRegistry';
import {
  validateEmailIdentity,
  type AuthenticatedUserIdentity,
} from '@/core/auth/userSession';

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

export interface StoredAuditHistoryEntry {
  auditId: string;
  decisionProposal: string;
  departmentFilter: string;
  auditedByEmail: string;
  auditedByName: string;
  createdAt: string;
  report: ExecutiveAuditReport;
}

interface AttributedParentChunk extends ParentDocumentChunk {
  childCount?: number;
  createdByEmail?: string;
  createdByName?: string;
  createdAt?: string | Date;
}

interface InMemoryBrainVault {
  parents: AttributedParentChunk[];
  children: EmbeddedChildChunk[];
  auditHistory: StoredAuditHistoryEntry[];
  connectors: EnterpriseConnectorItem[];
  connectorSecrets: Record<string, string>;
  users: AuthenticatedUserIdentity[];
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
      auditHistory: [],
      connectors: createInitialConnectorsState(),
      connectorSecrets: {},
      users: [],
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
 * Registers or updates a user's email identity in `mindmittel_v2.users` and returns the normalized profile.
 */
export async function upsertAuthenticatedUser(input: {
  email: string;
  fullName?: string;
  department?: string;
  role?: 'admin' | 'auditor' | 'executive' | 'viewer';
}): Promise<AuthenticatedUserIdentity> {
  const identity = validateEmailIdentity(input);
  const vault = getMemoryVault();

  vault.users = [
    identity,
    ...vault.users.filter((u) => u.email !== identity.email),
  ];

  if (isMongoConfigured()) {
    try {
      const db = await getMindMittelDb();
      await db.collection(COLLECTIONS.USERS).updateOne(
        { email: identity.email },
        {
          $set: {
            email: identity.email,
            fullName: identity.fullName,
            department: identity.department,
            role: identity.role,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            orgId: 'org_default',
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    } catch {
      // Fallback to in-memory user registry if offline
    }
  }

  systemLogger.info(
    'auth.session',
    `User authenticated via email [${identity.email}] (${identity.department})`
  );

  return identity;
}

/**
 * Automatically checks and provisions the `mindmittel_vector_index` on MongoDB Atlas (`mindmittel_v2.vector_store`).
 */
export async function ensureAtlasVectorIndexProvisioned(): Promise<VectorSearchDiagnosticStatus> {
  const vault = getMemoryVault();
  if (!isMongoConfigured()) {
    return vault.vectorDiagnostic;
  }

  try {
    const db = await getMindMittelDb();
    const vectorCollection = db.collection(COLLECTIONS.VECTOR_STORE);

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
 * AND persists them into `mindmittel_v2.raw_documents` & `mindmittel_v2.vector_store` in MongoDB Atlas.
 */
async function ensureDefaultPoliciesSeeded(): Promise<void> {
  const vault = getMemoryVault();

  if (!vault.seeded) {
    vault.seeded = true;
    for (const policy of DEFAULT_SAMPLE_POLICIES) {
      const { parents, children } = createParentChildChunks(policy);
      for (const p of parents) {
        const pChildCount = children.filter(
          (c) => c.parentId === p.parentId
        ).length;
        vault.parents.push({
          ...p,
          childCount: Math.max(1, pChildCount),
          createdByEmail: 'governance-board@mindmittel.de',
          createdByName: 'Governance Board',
          createdAt: new Date().toISOString(),
        });
      }
      for (const c of children) {
        const { vector } = await generateGeminiEmbedding768(
          `${c.metadata.department} ${c.metadata.tags.join(' ')} ${c.text}`
        );
        vault.children.push({ ...c, embedding: vector });
      }
    }
  }

  if (!vault.atlasSeeded && isMongoConfigured()) {
    vault.atlasSeeded = true;
    try {
      const db = await getMindMittelDb();
      const rawCol = db.collection<RawDocumentRecord>(COLLECTIONS.RAW_DOCUMENTS);
      const vecCol = db.collection<VectorStoreRecord>(COLLECTIONS.VECTOR_STORE);

      const [existingRawCount, existingVecCount] = await Promise.all([
        rawCol.countDocuments({}),
        vecCol.countDocuments({}),
      ]);
      if (existingRawCount === 0 && existingVecCount === 0 && vault.parents.length > 0) {
        const now = new Date();
        await rawCol.insertMany(
          vault.parents.map((p) => {
            const { createdAt: _c, ...rest } = p;
            return {
              ...rest,
              createdAt: now,
              updatedAt: now,
            };
          })
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
 * Ingests a document into the Company Brain with user attribution (`createdByEmail` & `createdByName`).
 */
export async function ingestDocumentIntoBrain(params: {
  title: string;
  content: string;
  department: string;
  sourceType?: DocumentSourceType;
  tags?: string[];
  language?: 'en' | 'de';
  createdByEmail?: string;
  createdByName?: string;
}): Promise<{
  parentCount: number;
  childVectorCount: number;
  embeddingModel: string;
  storageMode: 'mongodb_atlas' | 'memory_fallback';
  firstParentId: string;
  createdByEmail: string;
}> {
  await ensureDefaultPoliciesSeeded();
  const vault = getMemoryVault();

  const authorEmail =
    params.createdByEmail?.trim().toLowerCase() || 'executive@mindmittel.de';
  const authorName = params.createdByName?.trim() || 'Executive User';

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
  const nowIso = new Date().toISOString();
  const attributedParents: AttributedParentChunk[] = parents.map((p) => ({
    ...p,
    childCount: Math.max(
      1,
      children.filter((c) => c.parentId === p.parentId).length
    ),
    createdByEmail: authorEmail,
    createdByName: authorName,
    createdAt: nowIso,
  }));

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

  for (const parent of attributedParents) {
    vault.parents = [
      parent,
      ...vault.parents.filter((p) => p.parentId !== parent.parentId),
    ];
  }
  const newParentIds = new Set(attributedParents.map((p) => p.parentId));
  vault.children = [
    ...embeddedChildren,
    ...vault.children.filter((c) => !newParentIds.has(c.parentId)),
  ];

  let storageMode: 'mongodb_atlas' | 'memory_fallback' = 'memory_fallback';
  if (isMongoConfigured()) {
    try {
      const db = await getMindMittelDb();
      const now = new Date();

      const parentRecords: RawDocumentRecord[] = attributedParents.map((p) => {
        const { createdAt: _c, ...rest } = p;
        return {
          ...rest,
          createdAt:
            typeof p.createdAt === 'string'
              ? new Date(p.createdAt)
              : p.createdAt ?? now,
          updatedAt: now,
        };
      });

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
    `Ingested "${params.title}" by [${authorEmail}] (${attributedParents.length} Parent, ${embeddedChildren.length} Child 768-d vectors)`,
    {
      department: params.department,
      storageMode,
      embeddingModel: embeddingModelUsed,
    }
  );

  return {
    parentCount: attributedParents.length,
    childVectorCount: embeddedChildren.length,
    embeddingModel: embeddingModelUsed,
    storageMode,
    firstParentId: attributedParents[0]?.parentId ?? '',
    createdByEmail: authorEmail,
  };
}

/**
 * Lists all Parent documents currently stored in the Company Brain along with author email attribution.
 */
export async function listBrainDocuments(): Promise<
  Array<{
    parentId: string;
    allParentIds?: string[];
    title: string;
    department: string;
    sourceType: string;
    tags: string[];
    contentPreview: string;
    childCount: number;
    sectionCount?: number;
    createdByEmail: string;
    createdByName: string;
    createdAt?: string;
  }>
> {
  await ensureDefaultPoliciesSeeded();
  const vault = getMemoryVault();

  if (isMongoConfigured()) {
    try {
      const db = await getMindMittelDb();
      const remoteDocs = await db
        .collection<RawDocumentRecord>(COLLECTIONS.RAW_DOCUMENTS)
        .find({})
        .sort({ createdAt: -1 })
        .limit(30)
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

  // Aggregate multi-chunk parents belonging to the same logical document entity
  interface GroupedDocEntity {
    primaryParentId: string;
    allParentIds: string[];
    title: string;
    department: string;
    sourceType: string;
    tags: Set<string>;
    chunks: Array<{ index: number; content: string; childCount: number }>;
    totalChildCount: number;
    createdByEmail: string;
    createdByName: string;
    createdAtStr: string;
  }

  const groupedMap = new Map<string, GroupedDocEntity>();

  for (const parent of vault.parents) {
    const memoryChildCount = vault.children.filter(
      (c) => c.parentId === parent.parentId
    ).length;
    const chunkChildCount = Math.max(1, parent.childCount ?? memoryChildCount);

    const rawCreatedAt =
      parent.createdAt ??
      (parent as unknown as { createdAt?: Date | string }).createdAt;
    const createdAtStr =
      rawCreatedAt instanceof Date
        ? rawCreatedAt.toISOString()
        : typeof rawCreatedAt === 'string'
        ? rawCreatedAt
        : new Date().toISOString();

    const groupKey = `${parent.title.trim().toLowerCase()}:::${parent.metadata.department}:::${parent.metadata.sourceType}`;
    const existing = groupedMap.get(groupKey);

    if (!existing) {
      groupedMap.set(groupKey, {
        primaryParentId: parent.parentId,
        allParentIds: [parent.parentId],
        title: parent.title,
        department: parent.metadata.department,
        sourceType: parent.metadata.sourceType,
        tags: new Set(parent.metadata.tags ?? []),
        chunks: [
          {
            index: parent.parentIndex ?? 0,
            content: parent.content,
            childCount: chunkChildCount,
          },
        ],
        totalChildCount: chunkChildCount,
        createdByEmail: parent.createdByEmail ?? 'governance-board@mindmittel.de',
        createdByName: parent.createdByName ?? 'Governance Board',
        createdAtStr,
      });
    } else {
      existing.allParentIds.push(parent.parentId);
      for (const t of parent.metadata.tags ?? []) {
        existing.tags.add(t);
      }
      existing.chunks.push({
        index: parent.parentIndex ?? existing.chunks.length,
        content: parent.content,
        childCount: chunkChildCount,
      });
      existing.totalChildCount += chunkChildCount;
      if ((parent.parentIndex ?? 999) === 0) {
        existing.primaryParentId = parent.parentId;
      }
    }
  }

  return Array.from(groupedMap.values()).map((g) => {
    g.chunks.sort((a, b) => a.index - b.index);
    const stitchedContent = g.chunks.map((c) => c.content).join('\n\n');

    return {
      parentId: g.primaryParentId,
      allParentIds: g.allParentIds,
      title: g.title,
      department: g.department,
      sourceType: g.sourceType,
      tags: Array.from(g.tags),
      contentPreview: stitchedContent,
      childCount: g.totalChildCount,
      sectionCount: g.chunks.length,
      createdByEmail: g.createdByEmail,
      createdByName: g.createdByName,
      createdAt: g.createdAtStr,
    };
  });
}

/**
 * Removes a Parent document and cascades deletion to all of its sibling chunks and Child vectors.
 */
export async function removeBrainDocument(targetId: string): Promise<void> {
  const vault = getMemoryVault();
  const target = vault.parents.find((p) => p.parentId === targetId);

  // Find all sibling chunks of the same document entity so deletion cascades to the whole document
  const idsToRemove = new Set<string>([targetId]);
  if (target) {
    const groupKey = `${target.title.trim().toLowerCase()}:::${target.metadata.department}:::${target.metadata.sourceType}`;
    for (const p of vault.parents) {
      const pKey = `${p.title.trim().toLowerCase()}:::${p.metadata.department}:::${p.metadata.sourceType}`;
      if (pKey === groupKey) {
        idsToRemove.add(p.parentId);
      }
    }
  }

  vault.parents = vault.parents.filter((p) => !idsToRemove.has(p.parentId));
  vault.children = vault.children.filter((c) => !idsToRemove.has(c.parentId));

  if (isMongoConfigured()) {
    try {
      const db = await getMindMittelDb();
      const parentIdArray = Array.from(idsToRemove);
      await Promise.all([
        db
          .collection(COLLECTIONS.RAW_DOCUMENTS)
          .deleteMany({ parentId: { $in: parentIdArray } }),
        db
          .collection(COLLECTIONS.VECTOR_STORE)
          .deleteMany({ parentId: { $in: parentIdArray } }),
      ]);
    } catch {
      // Ignore if offline
    }
  }

  systemLogger.info(
    'rag.delete',
    `Cascaded deletion for ${idsToRemove.size} chunk(s) (${Array.from(idsToRemove).join(', ')}) and associated vectors`
  );
}

/**
 * Updates an existing Parent document in-place (Online Database Editor) and regenerates all of its 768-d Child vectors.
 */
export async function updateBrainDocument(params: {
  parentId: string;
  title: string;
  content: string;
  department: string;
  tags?: string[];
  updatedByEmail?: string;
  updatedByName?: string;
}): Promise<{
  parentId: string;
  childVectorCount: number;
  updatedByEmail: string;
}> {
  await ensureDefaultPoliciesSeeded();
  const vault = getMemoryVault();

  const existing = vault.parents.find((p) => p.parentId === params.parentId);
  const editorEmail =
    params.updatedByEmail?.trim().toLowerCase() ||
    existing?.createdByEmail ||
    'executive@mindmittel.de';
  const editorName =
    params.updatedByName?.trim() ||
    existing?.createdByName ||
    'Executive User';

  const rawInput: RawGovernanceDocumentInput = {
    orgId: existing?.metadata.orgId ?? 'org_default',
    title: params.title.trim(),
    content: params.content.trim(),
    department: params.department.trim() || existing?.metadata.department || 'General',
    docType: existing?.metadata.docType ?? 'policy',
    language: existing?.metadata.language ?? 'en',
    accessLevel: existing?.metadata.accessLevel ?? 'internal',
    tags:
      params.tags && params.tags.length > 0
        ? params.tags
        : existing?.metadata.tags ?? ['governance'],
    source: {
      type: existing?.metadata.sourceType ?? 'upload',
      connectorId: existing?.metadata.connectorId ?? 'workspace_ui',
      externalId: existing?.metadata.externalId ?? `doc_${Date.now()}`,
    },
  };

  const { parents, children } = createParentChildChunks(rawInput);
  const primaryTemplate = parents[0];

  // Preserve the original parentId so references and UI keys remain stable
  const updatedParent: AttributedParentChunk = {
    ...primaryTemplate,
    parentId: params.parentId,
    title: params.title.trim(),
    content: params.content.trim(),
    childCount: Math.max(1, children.length),
    createdByEmail: editorEmail,
    createdByName: editorName,
  };

  const embeddedChildren: EmbeddedChildChunk[] = [];
  let embeddingModelUsed = 'deterministic-semantic-768d';

  for (let idx = 0; idx < children.length; idx++) {
    const child = children[idx];
    const { vector, modelUsed } = await generateGeminiEmbedding768(
      `${child.metadata.department} ${child.metadata.tags.join(' ')} ${child.text}`
    );
    embeddingModelUsed = modelUsed;
    embeddedChildren.push({
      ...child,
      parentId: params.parentId,
      childId: `child_${params.parentId}_${idx}`,
      embedding: vector,
    });
  }

  vault.parents = vault.parents.map((p) =>
    p.parentId === params.parentId ? updatedParent : p
  );
  if (!vault.parents.some((p) => p.parentId === params.parentId)) {
    vault.parents.unshift(updatedParent);
  }

  vault.children = [
    ...embeddedChildren,
    ...vault.children.filter((c) => c.parentId !== params.parentId),
  ];

  if (isMongoConfigured()) {
    try {
      const db = await getMindMittelDb();
      const now = new Date();

      const { createdAt: _ignoredCreated, ...fieldsToSet } = updatedParent;
      await db
        .collection<RawDocumentRecord>(COLLECTIONS.RAW_DOCUMENTS)
        .updateOne(
          { parentId: params.parentId },
          {
            $set: {
              ...fieldsToSet,
              updatedAt: now,
            },
            $setOnInsert: {
              createdAt: now,
            },
          },
          { upsert: true }
        );

      await db
        .collection<VectorStoreRecord>(COLLECTIONS.VECTOR_STORE)
        .deleteMany({ parentId: params.parentId });

      if (embeddedChildren.length > 0) {
        await db
          .collection<VectorStoreRecord>(COLLECTIONS.VECTOR_STORE)
          .insertMany(
            embeddedChildren.map((c) => ({
              ...c,
              embeddingModel: embeddingModelUsed,
              createdAt: now,
            }))
          );
      }
    } catch (err) {
      systemLogger.warn(
        'db.mongo',
        `MongoDB Atlas update fallback for [${params.parentId}]`,
        { error: err instanceof Error ? err.message : String(err) }
      );
    }
  }

  systemLogger.info(
    'rag.update',
    `Updated & re-indexed document [${params.title}] (${params.parentId}) by [${editorEmail}] (${embeddedChildren.length} Child 768-d vectors)`
  );

  return {
    parentId: params.parentId,
    childVectorCount: embeddedChildren.length,
    updatedByEmail: editorEmail,
  };
}

/**
 * Evaluates all currently indexed Parent documents in the Company Brain and returns any active policy/threshold conflicts.
 */
export async function listBrainDocumentConflicts(): Promise<
  BrainKnowledgeConflictWarning[]
> {
  const docs = await listBrainDocuments();
  return detectBrainDocumentConflicts(
    docs.map((d) => ({
      parentId: d.parentId,
      title: d.title,
      department: d.department,
      content: d.contentPreview,
      tags: d.tags,
      createdByEmail: d.createdByEmail,
      createdByName: d.createdByName,
    }))
  );
}

/**
 * Saves an Executive Audit Report into the Audit History Ledger (`mindmittel_v2.audit_history` + memory vault).
 */
export async function saveAuditReportToHistory(params: {
  decisionProposal: string;
  departmentFilter: string;
  auditedByEmail?: string;
  auditedByName?: string;
  report: ExecutiveAuditReport;
}): Promise<StoredAuditHistoryEntry> {
  const vault = getMemoryVault();
  const entry: StoredAuditHistoryEntry = {
    auditId: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    decisionProposal: params.decisionProposal.trim(),
    departmentFilter: params.departmentFilter || 'all',
    auditedByEmail:
      params.auditedByEmail?.trim().toLowerCase() || 'executive@mindmittel.de',
    auditedByName: params.auditedByName?.trim() || 'Executive Auditor',
    createdAt: new Date().toISOString(),
    report: params.report,
  };

  vault.auditHistory = [entry, ...vault.auditHistory];

  if (isMongoConfigured()) {
    try {
      const db = await getMindMittelDb();
      await db.collection(COLLECTIONS.AUDIT_HISTORY).insertOne({
        ...entry,
        createdAtDate: new Date(),
      });
    } catch {
      // Fallback to in-memory ledger
    }
  }

  return entry;
}

/**
 * Lists all saved Executive Audit Reports in reverse chronological order.
 */
export async function listAuditHistory(): Promise<StoredAuditHistoryEntry[]> {
  const vault = getMemoryVault();

  if (isMongoConfigured()) {
    try {
      const db = await getMindMittelDb();
      const remoteEntries = await db
        .collection<StoredAuditHistoryEntry>(COLLECTIONS.AUDIT_HISTORY)
        .find({})
        .sort({ createdAt: -1 })
        .limit(40)
        .toArray();

      if (remoteEntries.length > 0) {
        const existingIds = new Set(vault.auditHistory.map((a) => a.auditId));
        for (const item of remoteEntries) {
          if (!existingIds.has(item.auditId)) {
            vault.auditHistory.push(item);
          }
        }
      }
    } catch {
      // Fallback to in-memory ledger
    }
  }

  vault.auditHistory.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return vault.auditHistory;
}

/**
 * Deletes an Executive Audit Report from the Audit History Ledger by `auditId`.
 */
export async function removeAuditHistoryEntry(auditId: string): Promise<void> {
  const vault = getMemoryVault();
  vault.auditHistory = vault.auditHistory.filter((a) => a.auditId !== auditId);

  if (isMongoConfigured()) {
    try {
      const db = await getMindMittelDb();
      await db.collection(COLLECTIONS.AUDIT_HISTORY).deleteOne({ auditId });
    } catch {
      // Ignore if offline
    }
  }

  systemLogger.info(
    'audit.delete',
    `Deleted Executive Audit Report [${auditId}] from Audit History Ledger`
  );
}

/**
 * Persists a single EnterpriseConnectorItem state into `mindmittel_v2.connectors` in MongoDB Atlas.
 */
async function persistConnectorItemToAtlas(
  connector: EnterpriseConnectorItem,
  rawSecret?: string
): Promise<void> {
  if (!isMongoConfigured()) return;
  try {
    const db = await getMindMittelDb();
    const updateSet: Record<string, unknown> = {
      ...connector,
      updatedAt: new Date(),
    };
    if (rawSecret && rawSecret.trim().length > 0) {
      updateSet.serverSecret = rawSecret.trim();
    }
    await db.collection(COLLECTIONS.CONNECTORS).updateOne(
      { id: connector.id },
      {
        $set: updateSet,
      },
      { upsert: true }
    );
  } catch {
    // Fallback silently to in-memory connector state if offline
  }
}

/**
 * Returns the current list of Enterprise Connectors (Chat, Knowledge Management, Online Meetings),
 * hydrating persisted configurations from `mindmittel_v2.connectors` in MongoDB Atlas when available.
 */
export async function getConnectorsList(): Promise<EnterpriseConnectorItem[]> {
  const vault = getMemoryVault();

  if (isMongoConfigured()) {
    try {
      const db = await getMindMittelDb();
      const remoteConnectors = await db
        .collection<EnterpriseConnectorItem & { serverSecret?: string }>(
          COLLECTIONS.CONNECTORS
        )
        .find({})
        .toArray();

      if (remoteConnectors.length > 0) {
        const remoteMap = new Map(remoteConnectors.map((c) => [c.id, c]));
        vault.connectors = vault.connectors.map((local) => {
          const persisted = remoteMap.get(local.id);
          if (!persisted) return local;
          if (persisted.serverSecret) {
            vault.connectorSecrets[local.id] = persisted.serverSecret;
          }
          return {
            ...local,
            configured: Boolean(persisted.configured),
            enabled: Boolean(persisted.enabled),
            maskedCredential:
              persisted.maskedCredential ?? local.maskedCredential,
            targetScope: persisted.targetScope || local.targetScope,
            lastSyncedAt: persisted.lastSyncedAt ?? local.lastSyncedAt,
            updatedByEmail: persisted.updatedByEmail ?? local.updatedByEmail,
          };
        });
      }
    } catch {
      // Fallback to in-memory connectors state
    }
  }

  return vault.connectors;
}

/**
 * Configures authentication credentials for an Enterprise Connector, enables it,
 * and persists the updated state to `mindmittel_v2.connectors` in MongoDB Atlas.
 */
export async function saveConnectorConfig(params: {
  connectorId: string;
  apiSecret: string;
  targetScope?: string;
  userEmail: string;
}): Promise<EnterpriseConnectorItem[]> {
  const vault = getMemoryVault();
  vault.connectors = configureConnectorCredentials(vault.connectors, params);
  vault.connectorSecrets[params.connectorId] = params.apiSecret.trim();

  const updated = vault.connectors.find((c) => c.id === params.connectorId);
  if (updated) {
    await persistConnectorItemToAtlas(updated, params.apiSecret.trim());
  }

  systemLogger.info(
    'connectors.auth',
    `Configured credentials & enabled connector [${params.connectorId}] by [${params.userEmail}]`
  );

  return vault.connectors;
}

/**
 * Toggles an Enterprise Connector ON or OFF (iOS Switch) and persists to MongoDB Atlas.
 */
export async function toggleConnectorById(params: {
  connectorId: string;
  enabled: boolean;
  userEmail: string;
}): Promise<EnterpriseConnectorItem[]> {
  const vault = getMemoryVault();
  vault.connectors = toggleConnectorState(
    vault.connectors,
    params.connectorId,
    params.enabled,
    params.userEmail
  );

  const updated = vault.connectors.find((c) => c.id === params.connectorId);
  if (updated) {
    await persistConnectorItemToAtlas(updated);
  }

  systemLogger.info(
    'connectors.toggle',
    `Switched connector [${params.connectorId}] ${params.enabled ? 'ON' : 'OFF'} by [${params.userEmail}]`
  );

  return vault.connectors;
}

/**
 * Pulls data from an enabled Enterprise Connector (using live HTTP API handshake or resilient fallback)
 * and indexes it directly into the Company Brain.
 */
export async function syncConnectorDataIntoBrain(params: {
  connectorId: string;
  userEmail: string;
  userName?: string;
}): Promise<{
  connectors: EnterpriseConnectorItem[];
  syncedTitle: string;
  childVectorCount: number;
}> {
  const vault = getMemoryVault();
  const target = vault.connectors.find((c) => c.id === params.connectorId);
  if (!target) {
    throw new Error(`Connector not found: ${params.connectorId}`);
  }

  const syncPayload = await fetchLiveConnectorPayloadOrFallback({
    connector: target,
    rawSecret: vault.connectorSecrets[params.connectorId],
    userEmail: params.userEmail,
  });

  // Clean up any stale or previous sync artifacts from the same connector/scope to avoid duplicate cards
  const staleParentIds = vault.parents
    .filter(
      (p) =>
        p.metadata.sourceType === syncPayload.sourceType &&
        (p.title === syncPayload.title ||
          p.title.startsWith(`Google Drive Sync (${target.targetScope})`))
    )
    .map((p) => p.parentId);

  for (const pid of staleParentIds) {
    await removeBrainDocument(pid);
  }

  const ingestion = await ingestDocumentIntoBrain({
    title: syncPayload.title,
    content: syncPayload.content,
    department: syncPayload.department,
    sourceType: syncPayload.sourceType,
    tags: syncPayload.tags,
    createdByEmail: params.userEmail,
    createdByName: params.userName,
  });

  const nowIso = new Date().toISOString();
  vault.connectors = vault.connectors.map((c) =>
    c.id === params.connectorId
      ? {
          ...c,
          lastSyncedAt: nowIso,
          updatedByEmail: params.userEmail.trim().toLowerCase(),
        }
      : c
  );

  const updated = vault.connectors.find((c) => c.id === params.connectorId);
  if (updated) {
    await persistConnectorItemToAtlas(updated);
  }

  return {
    connectors: vault.connectors,
    syncedTitle: syncPayload.title,
    childVectorCount: ingestion.childVectorCount,
  };
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
        const deptCandidates = resolveDepartmentFilterCandidates(
          params.departmentFilter
        );
        vectorSearchStage.filter = {
          'metadata.department': { $in: deptCandidates },
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
