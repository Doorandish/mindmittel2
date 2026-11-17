import { MongoClient, type Db } from 'mongodb';
import { COLLECTIONS, type RawDocumentRecord, type VectorStoreRecord } from './schemas';
import { getActiveTenant } from '@/infrastructure/tenancy/tenantContext';
import {
  DEFAULT_CONTROL_PLANE_DB,
  resolveDatabaseTarget,
} from './databaseTarget';

const MAX_ISOLATED_CLIENTS = 5;

interface GlobalMongoCache {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
  uri: string | null;
  isolated: Map<string, Promise<MongoClient>>;
}

declare global {
  // eslint-disable-next-line no-var
  var __mindmittelMongoCache: GlobalMongoCache | undefined;
}

const globalCache: GlobalMongoCache = globalThis.__mindmittelMongoCache ?? {
  client: null,
  promise: null,
  uri: null,
  isolated: new Map(),
};

if (!globalCache.isolated) {
  globalCache.isolated = new Map();
}

globalThis.__mindmittelMongoCache = globalCache;

/**
 * Establishes or reuses a singleton MongoClient connection to the primary MongoDB Atlas cluster.
 */
export async function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not configured. Set it in .env.local or Heroku Config Vars.'
    );
  }

  if (globalCache.client && globalCache.uri === uri) {
    return globalCache.client;
  }

  if (!globalCache.promise || globalCache.uri !== uri) {
    globalCache.uri = uri;
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    globalCache.promise = client.connect();
  }

  globalCache.client = await globalCache.promise;
  return globalCache.client;
}

async function getIsolatedClient(customUri: string): Promise<MongoClient> {
  const existing = globalCache.isolated.get(customUri);
  if (existing) return existing;

  if (globalCache.isolated.size >= MAX_ISOLATED_CLIENTS) {
    const oldestKey = globalCache.isolated.keys().next().value;
    if (oldestKey) {
      const evicted = globalCache.isolated.get(oldestKey);
      globalCache.isolated.delete(oldestKey);
      evicted?.then((c) => c.close().catch(() => undefined)).catch(() => undefined);
    }
  }

  const client = new MongoClient(customUri, {
    maxPoolSize: 3,
    serverSelectionTimeoutMS: 5000,
  });
  const promise = client.connect().catch((err) => {
    globalCache.isolated.delete(customUri);
    throw err;
  });
  globalCache.isolated.set(customUri, promise);
  return promise;
}

/**
 * Returns a handle to the central Control-Plane database (`mindmittel_v2` / `MONGODB_DB_NAME`)
 * where tenant definitions and OTP challenges live.
 */
export async function getControlPlaneDb(): Promise<Db> {
  const client = await getMongoClient();
  const dbName = process.env.MONGODB_DB_NAME || DEFAULT_CONTROL_PLANE_DB;
  return client.db(dbName);
}

/**
 * Returns a handle to the active tenant's database (`mindmittel_<slug>` or custom URI),
 * or falls back to the default database when called outside a tenant request context.
 */
export async function getMindMittelDb(): Promise<Db> {
  const tenant = getActiveTenant();
  const target = resolveDatabaseTarget(tenant, process.env);

  if (target.mode === 'isolated') {
    const isolatedClient = await getIsolatedClient(target.uri);
    return isolatedClient.db(target.dbName);
  }

  const client = await getMongoClient();
  return client.db(target.dbName);
}

/**
 * Cascading delete helper: removes a Parent document from `raw_documents`
 * and atomically deletes all associated Child chunks from `vector_store`.
 */
export async function deleteParentDocumentCascade(
  parentId: string,
  orgId: string
): Promise<{ deletedParents: number; deletedChildren: number }> {
  const db = await getMindMittelDb();
  const rawDocs = db.collection<RawDocumentRecord>(COLLECTIONS.RAW_DOCUMENTS);
  const vectorStore = db.collection<VectorStoreRecord>(COLLECTIONS.VECTOR_STORE);

  const [parentResult, childResult] = await Promise.all([
    rawDocs.deleteOne({ parentId, 'metadata.orgId': orgId }),
    vectorStore.deleteMany({ parentId, 'metadata.orgId': orgId }),
  ]);

  return {
    deletedParents: parentResult.deletedCount,
    deletedChildren: childResult.deletedCount,
  };
}
