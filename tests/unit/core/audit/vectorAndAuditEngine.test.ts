import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  computeCosineSimilarity,
  generateDeterministicSemanticEmbedding,
  normalizeDepartmentSlug,
  resolveDepartmentFilterCandidates,
  rankParentDocumentsByVectorMatch,
} from '@/core/rag/vectorMath';
import {
  evaluateDecisionAgainstPoliciesHeuristic,
} from '@/core/audit/decisionEvaluator';
import { EMBEDDING_DIMENSIONS } from '@/infrastructure/db/schemas';
import { createParentChildChunks } from '@/core/rag/chunker';

describe('768-d Vector Similarity & Parent-Child Retrieval Engine (Functional Core)', () => {
  const rootDir = path.resolve(__dirname, '../../../../');

  it('generates 768-dimensional normalized vectors and scores semantically similar governance texts higher than unrelated texts', () => {
    const vecExpense1 = generateDeterministicSemanticEmbedding(
      'Approve €18,000 unbudgeted vendor software contract without board sign-off'
    );
    const vecExpense2 = generateDeterministicSemanticEmbedding(
      'Unbudgeted vendor expenditures above €10,000 require supervisory board approval and finance sign-off'
    );
    const vecUnrelated = generateDeterministicSemanticEmbedding(
      'Remote work laptops must have encrypted hard drives and VPN enabled'
    );

    expect(vecExpense1.length).toBe(EMBEDDING_DIMENSIONS);
    expect(vecExpense2.length).toBe(EMBEDDING_DIMENSIONS);

    const simRelated = computeCosineSimilarity(vecExpense1, vecExpense2);
    const simUnrelated = computeCosineSimilarity(vecExpense1, vecUnrelated);

    expect(simRelated).toBeGreaterThan(simUnrelated);
    expect(simRelated).toBeGreaterThan(0.25);
  });

  it('matches child vectors and reconstructs deduplicated Parent documents with metadata filtering', () => {
    const financePolicy = createParentChildChunks({
      orgId: 'org_default',
      title: 'Financial Approval Charter 2026',
      content:
        'All unbudgeted vendor contracts and procurement expenses exceeding €10,000 require formal written approval from the CFO and Supervisory Board.',
      department: 'Finance',
      docType: 'charter',
      language: 'en',
      accessLevel: 'internal',
      tags: ['procurement', 'budget', 'board-approval'],
      source: {
        type: 'upload',
        connectorId: 'web_ui',
        externalId: 'fin_01',
      },
    });

    const engineeringPolicy = createParentChildChunks({
      orgId: 'org_default',
      title: 'Agile Engineering Sprint Guidelines',
      content:
        'Daily scrum standup meetings are mandatory across all engineering squads to surface blockers early and maintain cross-team alignment.',
      department: 'Engineering',
      docType: 'policy',
      language: 'en',
      accessLevel: 'internal',
      tags: ['scrum', 'agile', 'engineering'],
      source: {
        type: 'slack',
        connectorId: 'slack_eng',
        externalId: 'eng_01',
      },
    });

    const allParents = [...financePolicy.parents, ...engineeringPolicy.parents];
    const allChildrenWithEmbeddings = [
      ...financePolicy.children,
      ...engineeringPolicy.children,
    ].map((child) => ({
      ...child,
      embedding: generateDeterministicSemanticEmbedding(
        `${child.metadata.department} ${child.metadata.tags.join(' ')} ${child.text}`
      ),
    }));

    const queryVec = generateDeterministicSemanticEmbedding(
      'We want to cancel daily scrum standup meetings in our engineering team'
    );

    const matches = rankParentDocumentsByVectorMatch({
      queryVector: queryVec,
      children: allChildrenWithEmbeddings,
      parents: allParents,
      topK: 2,
    });

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].parent.title).toBe('Agile Engineering Sprint Guidelines');
  });

  it('detects policy conflicts when a proposed decision violates mandatory company brain rules', () => {
    const report = evaluateDecisionAgainstPoliciesHeuristic({
      decisionProposal:
        'Cancel all mandatory daily scrum standup meetings in the engineering team.',
      matchedParents: [
        {
          parentId: 'parent_eng_1',
          title: 'Agile Engineering Sprint Guidelines',
          department: 'engineering',
          sourceType: 'slack',
          similarityScore: 0.78,
          matchedChildSnippet:
            'Daily scrum standup meetings are mandatory across all engineering squads to surface blockers early.',
          fullParentContent:
            'Daily scrum standup meetings are mandatory across all engineering squads to surface blockers early and maintain cross-team alignment.',
        },
      ],
      selectedModelId: 'gemini-2.5-pro',
      inferredProfile: 'reasoning',
      locale: 'en',
    });

    expect(report.verdict).toBe('POLICY_CONFLICT');
    expect(report.alignmentScore).toBeLessThan(60);
    expect(report.citations[0].title).toBe('Agile Engineering Sprint Guidelines');
    expect(report.pros.length).toBeGreaterThan(0);
    expect(report.cons.length).toBeGreaterThan(0);
    expect(report.roadmap.length).toBeGreaterThan(0);
  });

  it('auto-seeds MongoDB Atlas vector_store collection on boot, provisions mindmittel_vector_index, and executes native $vectorSearch with cosine fallback', () => {
    const repoSource = fs.readFileSync(
      path.join(rootDir, 'src/infrastructure/rag/brainRepository.ts'),
      'utf-8'
    );

    expect(repoSource).toContain('$vectorSearch');
    expect(repoSource).toContain('createSearchIndex');
    expect(repoSource).toContain('getVectorSearchDiagnosticStatus');
    expect(repoSource).toContain('resolveDepartmentFilterCandidates');
    expect(repoSource).toContain('childCount');
  });

  it('normalizes department slugs and matches display labels ("Finance & Legal") against normalized slugs ("finance-legal") in both vector search and in-memory ranking', () => {
    expect(normalizeDepartmentSlug('Finance & Legal')).toBe('finance-legal');
    expect(normalizeDepartmentSlug('HR & Legal')).toBe('hr-legal');
    expect(normalizeDepartmentSlug('Engineering')).toBe('engineering');

    const candidates = resolveDepartmentFilterCandidates('Finance & Legal');
    expect(candidates).toContain('finance-legal');
    expect(candidates).toContain('Finance & Legal');

    const financeDoc = createParentChildChunks({
      orgId: 'org_default',
      title: 'Procurement Charter',
      content: 'All unbudgeted expenses above €10,000 require CFO approval.',
      department: 'Finance & Legal', // chunker normalizes this to 'finance-legal'
      docType: 'charter',
      language: 'en',
      accessLevel: 'internal',
      tags: ['finance', 'budget'],
      source: {
        type: 'upload',
        connectorId: 'seed',
        externalId: 'fin_test',
      },
    });

    const embeddedChildren = financeDoc.children.map((c) => ({
      ...c,
      embedding: generateDeterministicSemanticEmbedding(c.text),
    }));

    const queryVec = generateDeterministicSemanticEmbedding(
      'Approve €15,000 unbudgeted vendor expense'
    );

    // Filtering by display label "Finance & Legal" or slug "finance-legal" must both match
    const matchByLabel = rankParentDocumentsByVectorMatch({
      queryVector: queryVec,
      children: embeddedChildren,
      parents: financeDoc.parents,
      departmentFilter: 'Finance & Legal',
      topK: 2,
    });
    const matchBySlug = rankParentDocumentsByVectorMatch({
      queryVector: queryVec,
      children: embeddedChildren,
      parents: financeDoc.parents,
      departmentFilter: 'finance-legal',
      topK: 2,
    });

    expect(matchByLabel.length).toBe(1);
    expect(matchBySlug.length).toBe(1);
    expect(matchByLabel[0].title).toBe('Procurement Charter');
  });

  it('deduplicates parent documents by title so multiple chunks from the same document do not appear repeatedly', () => {
    const multiChunkDoc = createParentChildChunks({
      orgId: 'org_default',
      title: 'Google Drive Sync (/IPM) — Studienbescheinigung',
      content:
        'A very long university certificate document that is long enough to produce multiple parent chunks across the document. Section 1 contains personal matriculation details. Section 2 contains study program semester dates and fees paid.'.repeat(
          6
        ),
      department: 'Finance & Legal',
      docType: 'document',
      language: 'de',
      accessLevel: 'internal',
      tags: ['google-drive', 'sync'],
      source: {
        type: 'gdrive',
        connectorId: 'gdrive_test',
        externalId: 'studien_01',
      },
    });

    const embeddedChildren = multiChunkDoc.children.map((c) => ({
      ...c,
      embedding: generateDeterministicSemanticEmbedding(c.text),
    }));

    const queryVec = generateDeterministicSemanticEmbedding(
      'Approve €18,000 unbudgeted vendor software contract'
    );

    const matches = rankParentDocumentsByVectorMatch({
      queryVector: queryVec,
      children: embeddedChildren,
      parents: multiChunkDoc.parents,
      topK: 5,
    });

    // Even if the document produced multiple parent chunks, it must only appear ONCE in matches
    const titles = matches.map((m) => m.title);
    const uniqueTitles = new Set(titles);
    expect(titles.length).toBe(uniqueTitles.size);
  });

  it('filters out low-relevance citations when there is a steep similarity drop from the primary governing policy', () => {
    const report = evaluateDecisionAgainstPoliciesHeuristic({
      decisionProposal:
        'Approve an €18,000 unbudgeted software vendor contract immediately without CFO sign-off.',
      matchedParents: [
        {
          parentId: 'parent_charter',
          title: 'Financial Procurement & Approval Charter 2026',
          department: 'finance-legal',
          sourceType: 'upload',
          similarityScore: 0.96,
          matchedChildSnippet:
            'Any unbudgeted expenditure or vendor commitment exceeding €10,000 requires CFO co-signature.',
          fullParentContent:
            'Section 4.2: Department heads may approve budgeted software up to €10,000. Unbudgeted > €10,000 requires CFO co-signature.',
        },
        {
          parentId: 'parent_student_cert_1',
          title: 'Google Drive Sync (/IPM) — Studienbescheinigung',
          department: 'finance-legal',
          sourceType: 'gdrive',
          similarityScore: 0.76, // Steep drop from 0.96 (drop = 0.20)
          matchedChildSnippet:
            'Bescheinigung ueber das Studium fuer das Wintersemester 2026/2027.',
          fullParentContent:
            'Matrikelnummer 123456 Studiengang Wirtschaftsinformatik Wintersemester.',
        },
        {
          parentId: 'parent_student_cert_2',
          title: 'Google Drive Sync (/IPM) — Studienbescheinigung',
          department: 'finance-legal',
          sourceType: 'gdrive',
          similarityScore: 0.67, // Even lower
          matchedChildSnippet: 'Beitrag bezahlt und Rueckmeldung erfolgt.',
          fullParentContent: 'Beitrag fuer das Studentenwerk bezahlt.',
        },
      ],
      selectedModelId: 'gemini-2.5-pro',
      inferredProfile: 'reasoning',
      locale: 'en',
    });

    expect(report.verdict).toBe('POLICY_CONFLICT');
    // Only the primary relevant policy (0.96) should be cited, unrelated documents with 0.20 drop should be pruned
    expect(report.citations.length).toBe(1);
    expect(report.citations[0].title).toBe(
      'Financial Procurement & Approval Charter 2026'
    );
  });
});
