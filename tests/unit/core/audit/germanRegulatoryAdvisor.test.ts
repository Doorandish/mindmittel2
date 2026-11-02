import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  evaluateGermanRegulatoryAdvisory,
  applyGermanAdvisoryToReport,
} from '@/core/audit/germanRegulatoryAdvisor';
import { evaluateDecisionAgainstPoliciesHeuristic } from '@/core/audit/decisionEvaluator';

const statusOf = (
  advisory: ReturnType<typeof evaluateGermanRegulatoryAdvisory>,
  framework: string
) => advisory.checks.find((c) => c.framework === framework)?.status;

describe('German Regulatory & Betriebsrat Advisory (DACH Pre-Decision Check)', () => {
  const rootDir = path.resolve(__dirname, '../../../../');

  it('flags BetrVG §87 co-determination when a decision introduces employee monitoring or changes working hours', () => {
    const advisory = evaluateGermanRegulatoryAdvisory({
      decisionProposal:
        'Introduce productivity tracking software that monitors employee screen activity and change shift working hours.',
      matchedParents: [],
    });

    expect(statusOf(advisory, 'BETRVG')).toBe('TRIGGERED');
    expect(advisory.betriebsratInvolvementRequired).toBe(true);
    expect(statusOf(advisory, 'DSGVO')).not.toBe('NOT_TRIGGERED');
  });

  it('recognizes German-language decisions (Überwachung / Arbeitszeit / Homeoffice)', () => {
    const advisory = evaluateGermanRegulatoryAdvisory({
      decisionProposal:
        'Wir möchten die Arbeitszeit im Homeoffice per Software zur Überwachung erfassen.',
      matchedParents: [],
    });
    expect(statusOf(advisory, 'BETRVG')).toBe('TRIGGERED');
  });

  it('classifies AI-based candidate screening as EU AI Act high-risk (Annex III) and a DSGVO trigger', () => {
    const advisory = evaluateGermanRegulatoryAdvisory({
      decisionProposal:
        'Use an AI tool to automatically screen job applicants and rank candidates for hiring.',
      matchedParents: [],
    });
    expect(statusOf(advisory, 'EU_AI_ACT')).toBe('TRIGGERED');
    expect(statusOf(advisory, 'DSGVO')).toBe('TRIGGERED');
  });

  it('flags NIS-2 when a decision weakens security controls for suppliers', () => {
    const advisory = evaluateGermanRegulatoryAdvisory({
      decisionProposal:
        'Disable MFA for our external IT vendor so they can access the production network faster.',
      matchedParents: [],
    });
    expect(statusOf(advisory, 'NIS2')).toBe('TRIGGERED');
  });

  it('keeps all frameworks NOT_TRIGGERED for neutral decisions', () => {
    const advisory = evaluateGermanRegulatoryAdvisory({
      decisionProposal: 'Approve the purchase of new plants for the office lobby.',
      matchedParents: [],
    });
    expect(advisory.checks.every((c) => c.status === 'NOT_TRIGGERED')).toBe(true);
    expect(advisory.betriebsratInvolvementRequired).toBe(false);
  });

  it('does not treat a bare mention of employees as personal data processing (false-positive guard)', () => {
    const advisory = evaluateGermanRegulatoryAdvisory({
      decisionProposal: 'Allow employees to choose their own laptop model.',
      matchedParents: [],
    });
    expect(statusOf(advisory, 'DSGVO')).toBe('NOT_TRIGGERED');
  });

  it('detects a Company Brain knowledge gap when no related internal policy exists, and coverage when one does', () => {
    const gap = evaluateGermanRegulatoryAdvisory({
      decisionProposal: 'Introduce a hybrid remote work policy with two office days per week.',
      matchedParents: [],
    });
    expect(gap.knowledgeCoverage.status).toBe('KNOWLEDGE_GAP_DETECTED');
    expect(gap.knowledgeCoverage.suggestedTitle.length).toBeGreaterThan(5);

    const covered = evaluateGermanRegulatoryAdvisory({
      decisionProposal:
        'Cancel daily scrum standup meetings in the engineering squads.',
      matchedParents: [
        {
          parentId: 'p1',
          title: 'Engineering Agile Policy',
          department: 'engineering',
          sourceType: 'upload',
          similarityScore: 0.71,
          matchedChildSnippet: 'Daily scrum standup meetings are mandatory.',
          fullParentContent:
            'Daily 15-minute scrum standup meetings are mandatory across all engineering squads.',
        },
      ],
    });
    expect(covered.knowledgeCoverage.status).toBe('COVERED_BY_BRAIN');
  });

  it('downgrades a CERTIFIED verdict to CONDITIONAL when a statutory check is triggered', () => {
    const report = evaluateDecisionAgainstPoliciesHeuristic({
      decisionProposal: 'Introduce employee monitoring software.',
      matchedParents: [
        {
          parentId: 'p1',
          title: 'IT Policy',
          department: 'engineering',
          sourceType: 'upload',
          similarityScore: 0.6,
          matchedChildSnippet: 'Software purchases are allowed.',
          fullParentContent: 'Software purchases are allowed for teams.',
        },
      ],
      selectedModelId: 'gemini-2.5-flash',
      inferredProfile: 'fast',
      locale: 'en',
    });
    expect(report.verdict).toBe('CERTIFIED');

    const advisory = evaluateGermanRegulatoryAdvisory({
      decisionProposal: 'Introduce employee monitoring software.',
      matchedParents: [],
    });
    const adjusted = applyGermanAdvisoryToReport(report, advisory, 'en');

    expect(adjusted.verdict).toBe('CONDITIONAL');
    expect(adjusted.alignmentScore).toBeLessThanOrEqual(74);
    expect(adjusted.germanAdvisory).toBeDefined();
    expect(adjusted.cons.join(' ')).toMatch(/Betriebsrat|BetrVG/);
  });

  it('wires the advisory into the audit API and renders it in the Evaluate Decision report with a knowledge-gap shortcut', () => {
    const routeSource = fs.readFileSync(
      path.join(rootDir, 'src/app/api/brain/audit/route.ts'),
      'utf-8'
    );
    const pageSource = fs.readFileSync(
      path.join(rootDir, 'src/app/page.tsx'),
      'utf-8'
    );

    expect(routeSource).toContain('evaluateGermanRegulatoryAdvisory');
    expect(routeSource).toContain('applyGermanAdvisoryToReport');
    expect(pageSource).toContain('germanAdvisory');
    expect(pageSource).toContain('handleFillKnowledgeGap');
  });
});
