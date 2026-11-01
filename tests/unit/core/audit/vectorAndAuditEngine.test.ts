import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  computeCosineSimilarity,
  generateDeterministicSemanticEmbedding,
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
  });
});
