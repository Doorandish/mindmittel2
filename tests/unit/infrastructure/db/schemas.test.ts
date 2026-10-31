import { describe, it, expect } from 'vitest';
import {
  COLLECTIONS,
  VECTOR_INDEX_DEFINITION,
  EMBEDDING_DIMENSIONS,
  validateUserDocument,
} from '@/infrastructure/db/schemas';

describe('MongoDB Atlas Collections & Vector Search Schema Definitions', () => {
  it('defines exact collection names for users, raw_documents, vector_store, and system_logs', () => {
    expect(COLLECTIONS.USERS).toBe('users');
    expect(COLLECTIONS.RAW_DOCUMENTS).toBe('raw_documents');
    expect(COLLECTIONS.VECTOR_STORE).toBe('vector_store');
    expect(COLLECTIONS.SYSTEM_LOGS).toBe('system_logs');
  });

  it('locks Atlas Vector Search index to 768 dimensions with cosine similarity and metadata pre-filters', () => {
    expect(EMBEDDING_DIMENSIONS).toBe(768);
    expect(VECTOR_INDEX_DEFINITION.name).toBe('mindmittel_vector_index');

    const vectorField = VECTOR_INDEX_DEFINITION.definition.fields.find(
      (f) => f.type === 'vector'
    );
    expect(vectorField).toBeDefined();
    expect(vectorField?.numDimensions).toBe(768);
    expect(vectorField?.similarity).toBe('cosine');

    const filterPaths = VECTOR_INDEX_DEFINITION.definition.fields
      .filter((f) => f.type === 'filter')
      .map((f) => f.path);

    expect(filterPaths).toContain('metadata.orgId');
    expect(filterPaths).toContain('metadata.department');
    expect(filterPaths).toContain('metadata.sourceType');
    expect(filterPaths).toContain('metadata.tags');
    expect(filterPaths).toContain('metadata.language');
    expect(filterPaths).toContain('metadata.accessLevel');
  });

  it('validates user schema with role and preferred locale (en/de)', () => {
    const validUser = validateUserDocument({
      email: 'auditor@mindmittel.de',
      fullName: 'Dr. Hannah Weber',
      orgId: 'org_mittelstand_01',
      department: 'Executive Board',
      role: 'auditor',
      preferredLocale: 'de',
    });

    expect(validUser.email).toBe('auditor@mindmittel.de');
    expect(validUser.preferredLocale).toBe('de');
  });
});
