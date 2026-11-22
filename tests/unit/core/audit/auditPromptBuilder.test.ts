import { describe, it, expect } from 'vitest';
import { buildExecutiveAuditPrompt } from '@/core/audit/auditPromptBuilder';
import { evaluateGermanRegulatoryAdvisory } from '@/core/audit/germanRegulatoryAdvisor';

describe('Enterprise Executive Audit Prompt Builder', () => {
  it('uses MindMittel branding (without V2), XML injection delimiters, and explicit scoring rubric', () => {
    const prompt = buildExecutiveAuditPrompt({
      decisionProposal: 'Sign an unbudgeted €25,000 AI vendor contract without CFO sign-off.',
      matchedParents: [
        {
          parentId: 'parent_fin_1',
          title: 'Financial Procurement Charter 2026',
          department: 'finance-legal',
          sourceType: 'upload',
          similarityScore: 0.91,
          matchedChildSnippet: 'Unbudgeted spend above €10,000 requires CFO co-signature.',
          fullParentContent:
            'Section 4.2: Any unbudgeted expenditure exceeding €10,000 requires written CFO co-signature.',
        },
      ],
      locale: 'en',
    });

    expect(prompt).toContain('MindMittel');
    expect(prompt).not.toContain('MindMittel V2');
    expect(prompt).toContain('<proposed_decision>');
    expect(prompt).toContain('</proposed_decision>');
    expect(prompt).toContain('<company_brain_documents');
    expect(prompt).toContain('POLICY_CONFLICT');
    expect(prompt).toContain('10-44');
    expect(prompt).toContain('45-79');
    expect(prompt).toContain('80-99');
    expect(prompt).toContain('Financial Procurement Charter 2026');
  });

  it('injects strict anti-hallucination EMPTY context guard when no internal policies match', () => {
    const prompt = buildExecutiveAuditPrompt({
      decisionProposal: 'Introduce a company bicycle leasing program.',
      matchedParents: [],
      locale: 'de',
    });

    expect(prompt).toContain('status="EMPTY"');
    expect(prompt).toContain('NEVER invent');
    expect(prompt).toContain('Deutsch');
  });

  it('includes triggered German statutory signals so executive summary and roadmap stay coherent with legal cards', () => {
    const proposal =
      'Deploy screen activity tracking software for all remote employees in Germany.';
    const advisory = evaluateGermanRegulatoryAdvisory({
      decisionProposal: proposal,
      matchedParents: [],
    });

    const prompt = buildExecutiveAuditPrompt({
      decisionProposal: proposal,
      matchedParents: [],
      locale: 'de',
      germanAdvisory: advisory,
    });

    expect(prompt).toContain('<statutory_pre_screen>');
    expect(prompt).toContain('BETRVG');
    expect(prompt).toContain('TRIGGERED');
  });
});
