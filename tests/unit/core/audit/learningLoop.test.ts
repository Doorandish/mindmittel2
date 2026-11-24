import { describe, it, expect } from 'vitest';
import {
  aggregatePlatformTelemetry,
  buildDeterministicClarificationReply,
  isPrecedentCurrentlyActive,
  isPrecedentExpired,
  sanitizeTelemetryRecord,
  selectRelevantActivePrecedents,
  type CompanyPrecedentRecord,
  type PlatformFeedbackTelemetryRecord,
} from '@/core/audit/learningLoop';
import { buildExecutiveAuditPrompt } from '@/core/audit/auditPromptBuilder';

describe('Safe Learning Loop & Zero-Leak Telemetry (Functional Core)', () => {
  const now = new Date('2026-11-24T12:00:00.000Z');

  const basePrecedent: CompanyPrecedentRecord = {
    id: 'prec-1',
    tenantSlug: 'acme',
    auditId: 'audit-1',
    title: 'M365 Betriebsvereinbarung aktiv',
    ruleSummary:
      'Rahmen-Betriebsvereinbarung für Microsoft 365 (ohne Copilot-Tracking) gilt bis 2027-12-31.',
    department: 'Operations & IT',
    affectedLayer: 'BetrVG',
    diagnosticCode: 'PRIOR_APPROVAL_EXISTS',
    validUntil: '2027-12-31',
    status: 'approved',
    submittedByEmail: 'manager@acme.de',
    submittedAt: '2026-11-20T10:00:00.000Z',
    reviewedByEmail: 'admin@acme.de',
    reviewedAt: '2026-11-21T09:00:00.000Z',
    embedding: [0.9, 0.1, 0.0],
  };

  it('activates only approved, non-expired precedents and flags expired ones accurately', () => {
    expect(isPrecedentCurrentlyActive(basePrecedent, now)).toBe(true);
    expect(isPrecedentExpired(basePrecedent, now)).toBe(false);

    const pending: CompanyPrecedentRecord = { ...basePrecedent, status: 'pending' };
    expect(isPrecedentCurrentlyActive(pending, now)).toBe(false);

    const revoked: CompanyPrecedentRecord = { ...basePrecedent, status: 'revoked' };
    expect(isPrecedentCurrentlyActive(revoked, now)).toBe(false);

    const expired: CompanyPrecedentRecord = {
      ...basePrecedent,
      validUntil: '2026-01-01',
    };
    expect(isPrecedentCurrentlyActive(expired, now)).toBe(false);
    expect(isPrecedentExpired(expired, now)).toBe(true);

    const indefinite: CompanyPrecedentRecord = {
      ...basePrecedent,
      validUntil: null,
    };
    expect(isPrecedentCurrentlyActive(indefinite, now)).toBe(true);
    expect(isPrecedentExpired(indefinite, now)).toBe(false);
  });

  it('filters out pending, revoked, expired, and out-of-department precedents during RAG selection', () => {
    const precedents: CompanyPrecedentRecord[] = [
      basePrecedent,
      { ...basePrecedent, id: 'prec-pending', status: 'pending' },
      { ...basePrecedent, id: 'prec-expired', validUntil: '2025-12-31' },
      { ...basePrecedent, id: 'prec-hr', department: 'HR & People' },
      {
        ...basePrecedent,
        id: 'prec-global',
        department: '*',
        title: 'Globale CRM Regel',
        ruleSummary: 'EU-hosted CRM tools with AVV are pre-cleared.',
        embedding: [0.85, 0.2, 0.0],
      },
    ];

    const selected = selectRelevantActivePrecedents(
      precedents,
      [0.9, 0.1, 0.0],
      'Einführung Microsoft 365 Update',
      ['Operations & IT'],
      3,
      now
    );

    const ids = selected.map((p) => p.id);
    expect(ids).toContain('prec-1');
    expect(ids).toContain('prec-global');
    expect(ids).not.toContain('prec-pending');
    expect(ids).not.toContain('prec-expired');
    expect(ids).not.toContain('prec-hr');
  });

  it('architecturally strips ALL free-text or sensitive fields from platform telemetry records', () => {
    const raw = {
      id: 'tel-1',
      tenantSlug: 'bosch',
      companyName: 'Bosch GmbH',
      feedbackType: 'correction' as const,
      affectedLayer: 'BetrVG' as const,
      diagnosticCode: 'PRIOR_APPROVAL_EXISTS' as const,
      modelUsed: 'gemini-2.5-pro',
      initialVerdict: 'CONDITIONAL' as const,
      initialScore: 54,
      precedentStatus: 'pending' as const,
      createdAt: '2026-11-24T12:00:00.000Z',
      // Attempted sensitive leaks that MUST be stripped:
      ruleSummary: 'SECRET LAYOFF PLAN MUNICH',
      userMessage: 'Confidential board note',
      proposalText: 'Fire 50 employees',
    };

    const sanitized = sanitizeTelemetryRecord(raw);
    const serialized = JSON.stringify(sanitized);

    expect(serialized).not.toContain('SECRET LAYOFF PLAN');
    expect(serialized).not.toContain('Confidential board note');
    expect(serialized).not.toContain('Fire 50 employees');
    expect(sanitized.tenantSlug).toBe('bosch');
    expect(sanitized.diagnosticCode).toBe('PRIOR_APPROVAL_EXISTS');
  });

  it('aggregates platform telemetry accurately with and without tenant filter', () => {
    const records: PlatformFeedbackTelemetryRecord[] = [
      {
        id: '1',
        tenantSlug: 'acme',
        companyName: 'Acme GmbH',
        feedbackType: 'helpful',
        affectedLayer: 'Internal_Policy',
        diagnosticCode: 'COMPANY_EXCEPTION',
        modelUsed: 'gemini-2.5-flash',
        initialVerdict: 'CERTIFIED',
        initialScore: 91,
        precedentStatus: null,
        createdAt: '2026-11-24T10:00:00.000Z',
      },
      {
        id: '2',
        tenantSlug: 'acme',
        companyName: 'Acme GmbH',
        feedbackType: 'correction',
        affectedLayer: 'BetrVG',
        diagnosticCode: 'WRONG_STATUTE_TRIGGERED',
        modelUsed: 'gemini-2.5-pro',
        initialVerdict: 'CONDITIONAL',
        initialScore: 55,
        precedentStatus: 'approved',
        createdAt: '2026-11-24T11:00:00.000Z',
      },
      {
        id: '3',
        tenantSlug: 'beta',
        companyName: 'Beta AG',
        feedbackType: 'helpful',
        affectedLayer: 'DSGVO',
        diagnosticCode: 'COMPANY_EXCEPTION',
        modelUsed: 'gemini-2.5-pro',
        initialVerdict: 'CERTIFIED',
        initialScore: 88,
        precedentStatus: null,
        createdAt: '2026-11-24T12:00:00.000Z',
      },
    ];

    const allStats = aggregatePlatformTelemetry(records);
    expect(allStats.totalCount).toBe(3);
    expect(allStats.helpfulCount).toBe(2);
    expect(allStats.correctionCount).toBe(1);
    expect(allStats.helpfulRatePct).toBe(67);
    expect(allStats.tenants.length).toBe(2);

    const acmeStats = aggregatePlatformTelemetry(records, 'acme');
    expect(acmeStats.totalCount).toBe(2);
    expect(acmeStats.helpfulRatePct).toBe(50);
    expect(acmeStats.byDiagnosticCode.WRONG_STATUTE_TRIGGERED).toBe(1);
  });

  it('asks targeted expiration/scope follow-up on turn 1 when missing, and builds draft precedent on turn 2', () => {
    const turn1 = buildDeterministicClarificationReply({
      messages: [
        { role: 'user', text: 'Wir haben bereits eine M365 Genehmigung vom Betriebsrat.' },
      ],
      locale: 'de',
      defaultDepartment: 'Operations & IT',
    });

    expect(turn1.readyToSubmit).toBe(false);
    expect(turn1.quickChips.length).toBeGreaterThanOrEqual(3);
    expect(turn1.assistantReply.toLowerCase()).toMatch(/gültig|frist|zeitraum|unbefristet/);

    const turn2 = buildDeterministicClarificationReply({
      messages: [
        { role: 'user', text: 'Wir haben bereits eine M365 Genehmigung vom Betriebsrat.' },
        { role: 'assistant', text: turn1.assistantReply },
        { role: 'user', text: 'Gültig bis 2027-12-31, gilt nur für Basis-M365 ohne Copilot.' },
      ],
      locale: 'de',
      defaultDepartment: 'Operations & IT',
    });

    expect(turn2.readyToSubmit).toBe(true);
    expect(turn2.draftPrecedent).toBeTruthy();
    expect(turn2.draftPrecedent?.validUntil).toBe('2027-12-31');
    expect(turn2.draftPrecedent?.affectedLayer).toBe('BetrVG');
    expect(turn2.draftPrecedent?.diagnosticCode).toBe('PRIOR_APPROVAL_EXISTS');
  });

  it('injects approved company precedents into <company_precedents> without allowing statutory override', () => {
    const prompt = buildExecutiveAuditPrompt({
      decisionProposal: 'Rollout Microsoft 365 Teams update for all staff',
      matchedParents: [],
      locale: 'de',
      matchedPrecedents: [
        {
          title: basePrecedent.title,
          ruleSummary: basePrecedent.ruleSummary,
          department: basePrecedent.department,
          approvedByEmail: basePrecedent.reviewedByEmail ?? 'admin@acme.de',
          validUntil: basePrecedent.validUntil,
        },
      ],
    });

    expect(prompt).toContain('<company_precedents count="1">');
    expect(prompt).toContain('M365 Betriebsvereinbarung aktiv');
    expect(prompt).toContain('admin@acme.de');
    expect(prompt).toContain('2027-12-31');
    expect(prompt).toContain('NEVER suppress or erase mandatory German statutory');
  });
});
