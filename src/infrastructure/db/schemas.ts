import { z } from 'zod';
import type {
  ChildVectorChunk,
  ParentDocumentChunk,
} from '@/core/rag/chunker';

/**
 * MongoDB Atlas Collection Names inside database `mindmittel_v2`.
 */
export const COLLECTIONS = {
  USERS: 'users',
  RAW_DOCUMENTS: 'raw_documents',
  VECTOR_STORE: 'vector_store',
  SYSTEM_LOGS: 'system_logs',
  AUDIT_HISTORY: 'audit_history',
  CONNECTORS: 'connectors',
} as const;

/**
 * Locked vector dimensionality for MongoDB Atlas Vector Search index compatibility.
 */
export const EMBEDDING_DIMENSIONS = 768;

/**
 * User Document Validation Schema (`users` collection).
 */
export const userDocumentSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  orgId: z.string().min(1),
  department: z.string().min(1),
  role: z.enum(['admin', 'auditor', 'executive', 'viewer']).default('auditor'),
  preferredLocale: z.enum(['en', 'de']).default('en'),
  createdAt: z.date().default(() => new Date()),
});

export type UserDocument = z.infer<typeof userDocumentSchema>;

export function validateUserDocument(
  input: z.input<typeof userDocumentSchema>
): UserDocument {
  return userDocumentSchema.parse(input);
}

/**
 * Parent Document Record stored in `raw_documents`.
 */
export interface RawDocumentRecord extends ParentDocumentChunk {
  createdByEmail?: string;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Child Vector Record stored in `vector_store` with 768-dimensional embedding vector.
 */
export interface VectorStoreRecord extends ChildVectorChunk {
  embedding: number[]; // Length must equal EMBEDDING_DIMENSIONS (768)
  embeddingModel: string;
  createdAt: Date;
}

/**
 * Official MongoDB Atlas Vector Search Index Definition (`mindmittel_vector_index`)
 * to be applied on `mindmittel_v2.vector_store`.
 */
export const VECTOR_INDEX_DEFINITION = {
  name: 'mindmittel_vector_index',
  type: 'vectorSearch',
  definition: {
    fields: [
      {
        type: 'vector' as const,
        path: 'embedding',
        numDimensions: EMBEDDING_DIMENSIONS,
        similarity: 'cosine' as const,
      },
      {
        type: 'filter' as const,
        path: 'metadata.orgId',
      },
      {
        type: 'filter' as const,
        path: 'metadata.department',
      },
      {
        type: 'filter' as const,
        path: 'metadata.sourceType',
      },
      {
        type: 'filter' as const,
        path: 'metadata.tags',
      },
      {
        type: 'filter' as const,
        path: 'metadata.language',
      },
      {
        type: 'filter' as const,
        path: 'metadata.accessLevel',
      },
      {
        type: 'filter' as const,
        path: 'metadata.framework',
      },
    ],
  },
} as const;
