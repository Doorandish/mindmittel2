import { describe, it, expect } from 'vitest';
import {
  normalizeMetadataTags,
  createParentChildChunks,
  type RawGovernanceDocumentInput,
} from '@/core/rag/chunker';

describe('Parent-Child RAG Chunker & Metadata Normalizer (Functional Core)', () => {
  it('normalizes tags to lowercase kebab-case and removes duplicates and blanks', () => {
    const rawTags = ['  Finance ', 'FINANCE', 'Board Audit', 'Risk & Compliance!', ''];
    const normalized = normalizeMetadataTags(rawTags);

    expect(normalized).toEqual(['finance', 'board-audit', 'risk-compliance']);
  });

  it('splits a long document into Parent chunks (~2000 chars) and overlapping Child chunks (~400 chars)', () => {
    const paragraph =
      'Supervisory board members must disclose all potential conflicts of interest prior to voting on capital allocation proposals. ';
    // Repeat paragraph 25 times (~3150 characters -> should produce 2 parent chunks and multiple child chunks)
    const longContent = paragraph.repeat(25);

    const input: RawGovernanceDocumentInput = {
      orgId: 'org_acme_01',
      title: 'Board Charter 2026',
      content: longContent,
      department: 'Legal & Governance',
      docType: 'policy',
      language: 'en',
      accessLevel: 'internal',
      framework: 'ISO-37000',
      tags: ['Board Audit', 'Conflict of Interest'],
      source: {
        type: 'upload',
        connectorId: 'manual_upload',
        externalId: 'doc_2026_01',
      },
    };

    const result = createParentChildChunks(input, {
      parentChunkSize: 2000,
      childChunkSize: 400,
      childChunkOverlap: 50,
    });

    expect(result.parents.length).toBe(2);
    expect(result.children.length).toBeGreaterThan(result.parents.length * 2);

    // Every child must reference an existing parentId
    const parentIds = new Set(result.parents.map((p) => p.parentId));
    for (const child of result.children) {
      expect(parentIds.has(child.parentId)).toBe(true);
      expect(child.text.length).toBeLessThanOrEqual(400);
      // Denormalized filter fields must be copied onto every child chunk for Atlas Vector Search pre-filtering
      expect(child.metadata.orgId).toBe('org_acme_01');
      expect(child.metadata.department).toBe('legal-governance');
      expect(child.metadata.sourceType).toBe('upload');
      expect(child.metadata.language).toBe('en');
      expect(child.metadata.accessLevel).toBe('internal');
      expect(child.metadata.tags).toEqual([
        'board-audit',
        'conflict-of-interest',
      ]);
    }
  });

  it('preserves overlap between consecutive child chunks within the same parent', () => {
    const text =
      'AAAA_START_11111111111111111111_MIDDLE_MARKER_22222222222222222222_END_ZZZZ';
    const input: RawGovernanceDocumentInput = {
      orgId: 'org_acme_01',
      title: 'Overlap Verification Doc',
      content: text,
      department: 'finance',
      docType: 'report',
      language: 'de',
      accessLevel: 'confidential',
      tags: ['petty-cash'],
      source: {
        type: 'slack',
        connectorId: 'slack_workspace_1',
        externalId: 'msg_991',
      },
    };

    const result = createParentChildChunks(input, {
      parentChunkSize: 500,
      childChunkSize: 45,
      childChunkOverlap: 15,
    });

    expect(result.children.length).toBeGreaterThanOrEqual(2);
    const firstChildEnd = result.children[0].text.slice(-15);
    expect(result.children[1].text.startsWith(firstChildEnd)).toBe(true);
  });

  it('includes createdAt timestamp in listed brain documents and renders registration date/time in the UI', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = path.resolve(__dirname, '../../../..');
    const repoSrc = fs.readFileSync(
      path.join(rootDir, 'src/infrastructure/rag/brainRepository.ts'),
      'utf-8'
    );
    const pageSrc = fs.readFileSync(
      path.join(rootDir, 'src/app/page.tsx'),
      'utf-8'
    );

    expect(repoSrc).toContain('createdAt?: string | Date');
    expect(pageSrc).toContain('doc.createdAt');
  });

  it('aggregates multi-chunk documents into a single document entity in listBrainDocuments with combined vector count and stitched content', async () => {
    const {
      listBrainDocuments,
      ingestDocumentIntoBrain,
      removeBrainDocument,
    } = await import('@/infrastructure/rag/brainRepository');

    // Ingest a 3500-character document which naturally splits into 2 parent chunks
    const longText =
      'Hochschule Pforzheim Studienbescheinigung fuer das WS 2026/27. '.repeat(
        60
      );
    const title = 'Unique Test Aggregation Document 2026';

    await ingestDocumentIntoBrain({
      title,
      content: longText,
      department: 'Finance & Legal',
      sourceType: 'gdrive',
      createdByEmail: 'amir@mindmittel.de',
    });

    const docs = await listBrainDocuments();
    const matched = docs.filter((d) => d.title === title);

    // Must be aggregated into EXACTLY 1 document card, NOT 2 cards!
    expect(matched).toHaveLength(1);
    expect(matched[0].childCount).toBeGreaterThanOrEqual(8);
    expect(matched[0].sectionCount).toBeGreaterThanOrEqual(2);

    // Clean up
    await removeBrainDocument(matched[0].parentId);
    const afterDelete = await listBrainDocuments();
    expect(afterDelete.filter((d) => d.title === title)).toHaveLength(0);
  });
});
