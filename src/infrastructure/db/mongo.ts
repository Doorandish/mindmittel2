import { MongoClient, type Db } from 'mongodb';
import { COLLECTIONS, type RawDocumentRecord, type VectorStoreRecord } from './schemas';

const DEFAULT_DB_NAME = 'mindmittel_v2';

interface GlobalMongoCache {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __mindmittelMongoCache: GlobalMongoCache | undefined;
}

const globalCache: GlobalMongoCache = globalThis.__mindmittelMongoCache ?? {
  client: null,
  promise: null,
};

globalThis.__mindmittelMongoCache = globalCache;

/**
 * Establishes or reuses a singleton MongoClient connection to MongoDB Atlas.
 * Safe across Next.js hot reloads and serverless invocations.
 */
export async function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not configured. Set it in .env.local or Render environment settings.'
    );
  }

  if (globalCache.client) {
    return globalCache.client;
  }

  if (!globalCache.promise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    globalCache.promise = client.connect();
  }

  globalCache.client = await globalCache.promise;
  return globalCache.client;
}

/**
 * Returns a handle to the `mindmittel_v2` database on MongoDB Atlas.
 */
export async function getMindMittelDb(): Promise<Db> {
  const client = await getMongoClient();
  const dbName = process.env.MONGODB_DB_NAME || DEFAULT_DB_NAME;
  return client.db(dbName);
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
