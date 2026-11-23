import { describe, it, expect } from 'vitest';
import {
  GERMAN_LEGAL_CORPUS,
  retrieveRelevantGermanLegalArticles,
} from '@/core/audit/germanLegalCorpus';
import { evaluateGermanRegulatoryAdvisory } from '@/core/audit/germanRegulatoryAdvisor';
import { buildExecutiveAuditPrompt } from '@/core/audit/auditPromptBuilder';

describe('German Statutory Legal Corpus & Legal RAG Retrieval', () => {
  it('contains comprehensive structured German/EU statutory articles across BetrVG, DSGVO, EU AI Act, and NIS-2', () => {
    expect(GERMAN_LEGAL_CORPUS.length).toBeGreaterThanOrEqual(16);

    const frameworks = new Set(GERMAN_LEGAL_CORPUS.map((a) => a.framework));
    expect(frameworks.has('BETRVG')).toBe(true);
    expect(frameworks.has('DSGVO')).toBe(true);
    expect(frameworks.has('EU_AI_ACT')).toBe(true);
    expect(frameworks.has('NIS2')).toBe(true);

    for (const article of GERMAN_LEGAL_CORPUS) {
      expect(article.citation.length).toBeGreaterThan(5);
      expect(article.legalTextSummaryDe.length).toBeGreaterThan(30);
      expect(article.requiredArtifactDe.length).toBeGreaterThan(5);
      expect(article.sanctionRiskDe.length).toBeGreaterThan(10);
    }
  });

  it('catches prohibited workplace emotion-recognition AI under EU AI Act Art. 5 (35 Mio. € / 7% fine)', () => {
    const proposal =
      'Wir möchten ein KI-Tool zur Emotionserkennung und Stimmungsanalyse in den Verkaufsgesprächen unserer Mitarbeiter einführen.';
    const articles = retrieveRelevantGermanLegalArticles({
      decisionProposal: proposal,
    });

    expect(articles.length).toBeGreaterThan(0);
    expect(articles[0].id).toBe('eu-ai-act-art-5');
    expect(articles[0].severity).toBe('PROHIBITED');
    expect(articles[0].sanctionRiskDe).toContain('35 Mio.');
  });

  it('retrieves BetrVG §87 Abs. 1 Nr. 6 with BAG objektive Eignung and Betriebsvereinbarung for employee software tracking', () => {
    const proposal =
      'Einführung einer neuen Produktivitäts- und Bildschirmüberwachung für alle Remote-Entwickler.';
    const articles = retrieveRelevantGermanLegalArticles({
      decisionProposal: proposal,
    });

    const betrvg6 = articles.find((a) => a.id === 'betrvg-87-1-6');
    expect(betrvg6).toBeDefined();
    expect(betrvg6?.legalTextSummaryDe).toContain('BAG');
    expect(betrvg6?.requiredArtifactDe).toContain('Betriebsvereinbarung');
  });

  it('excludes BetrVG and NIS-2 articles when Company Profile disables them', () => {
    const proposal =
      'Einführung von Homeoffice-Regeln und Abschaltung von MFA für externe IT-Dienstleister.';
    const articles = retrieveRelevantGermanLegalArticles({
      decisionProposal: proposal,
      companyProfile: {
        hasBetriebsrat: false,
        nis2Applicable: false,
      },
    });

    expect(articles.some((a) => a.framework === 'BETRVG')).toBe(false);
    expect(articles.some((a) => a.framework === 'NIS2')).toBe(false);
  });

  it('injects retrieved German statutory articles into the executive audit prompt (<german_statutory_articles>)', () => {
    const proposal =
      'Wir übertragen Kundendaten an einen neuen US-Cloud-KI-Anbieter ohne AVV.';
    const advisory = evaluateGermanRegulatoryAdvisory({
      decisionProposal: proposal,
      matchedParents: [],
    });

    expect((advisory.matchedLegalArticles ?? []).length).toBeGreaterThan(0);

    const prompt = buildExecutiveAuditPrompt({
      decisionProposal: proposal,
      matchedParents: [],
      locale: 'de',
      germanAdvisory: advisory,
    });

    expect(prompt).toContain('<german_statutory_articles');
    expect(prompt).toContain('Art. 28');
    expect(prompt).toContain('AVV');
  });
});
