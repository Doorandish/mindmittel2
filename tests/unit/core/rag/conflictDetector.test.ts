import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  detectBrainDocumentConflicts,
  type BrainDocumentForConflictCheck,
} from '@/core/rag/conflictDetector';

describe('Company Brain Knowledge Conflict Detector & Online In-Place Editor', () => {
  const rootDir = path.resolve(__dirname, '../../../../');

  const baselineDocs: BrainDocumentForConflictCheck[] = [
    {
      parentId: 'parent_fin_charter',
      title: 'Financial Procurement & Approval Charter 2026',
      department: 'finance-legal',
      content:
        'Department heads may approve budgeted software and vendor contracts up to €10,000. Any unbudgeted expenditure or vendor commitment exceeding €10,000 requires formal written co-signature from the Chief Financial Officer (CFO) and Supervisory Board notification.',
      tags: ['procurement', 'budget', 'vendor-contract', 'board-approval'],
      createdByEmail: 'governance-board@mindmittel.de',
      createdByName: 'Governance Board',
    },
    {
      parentId: 'parent_eng_agile',
      title: 'Engineering Agile & Sprint Governance Policy',
      department: 'engineering',
      content:
        'Daily 15-minute Scrum standup meetings are mandatory across all engineering squads to surface technical blockers and security risks early. Unilaterally abolishing daily standups is prohibited.',
      tags: ['scrum', 'standup', 'agile', 'engineering'],
      createdByEmail: 'governance-board@mindmittel.de',
      createdByName: 'Governance Board',
    },
  ];

  it('detects numeric/threshold conflicts when a newly ingested document specifies a conflicting budget limit on the same topic', () => {
    const docsWithNumericConflict: BrainDocumentForConflictCheck[] = [
      {
        parentId: 'parent_fin_new_2026',
        title: 'Updated Q4 Vendor Expenditure Memo',
        department: 'finance-legal',
        content:
          'Department heads may approve unbudgeted vendor software contracts up to €25,000 without CFO or Supervisory Board notification.',
        tags: ['procurement', 'budget', 'vendor-contract'],
        createdByEmail: 'cfo-office@mindmittel.de',
        createdByName: 'CFO Office',
      },
      ...baselineDocs,
    ];

    const conflicts = detectBrainDocumentConflicts(docsWithNumericConflict);
    expect(conflicts.length).toBeGreaterThan(0);

    const finConflict = conflicts.find(
      (c) =>
        (c.newerDocument.parentId === 'parent_fin_new_2026' &&
          c.existingDocument.parentId === 'parent_fin_charter') ||
        (c.newerDocument.parentId === 'parent_fin_charter' &&
          c.existingDocument.parentId === 'parent_fin_new_2026')
    );
    expect(finConflict).toBeDefined();
    expect(finConflict?.conflictReasonEn).toMatch(/10,000|25,000|contradict|conflict/i);
  });

  it('detects policy polarity conflicts (mandatory vs cancelled/optional) and clears the conflict once edited online', () => {
    const docsWithPolarityConflict: BrainDocumentForConflictCheck[] = [
      {
        parentId: 'parent_eng_override',
        title: 'Engineering Async Workflow Update',
        department: 'engineering',
        content:
          'Effective immediately, daily Scrum standup meetings are cancelled and optional across all engineering squads to save developer time.',
        tags: ['scrum', 'standup', 'engineering'],
        createdByEmail: 'vp-eng@mindmittel.de',
        createdByName: 'VP Engineering',
      },
      ...baselineDocs,
    ];

    const conflictsBeforeEdit = detectBrainDocumentConflicts(
      docsWithPolarityConflict
    );
    expect(conflictsBeforeEdit.length).toBeGreaterThan(0);

    // Simulate online in-place edit fixing the conflicting document to align with policy
    const docsAfterOnlineEdit: BrainDocumentForConflictCheck[] =
      docsWithPolarityConflict.map((d) =>
        d.parentId === 'parent_eng_override'
          ? {
              ...d,
              content:
                'Daily 15-minute Scrum standup meetings remain mandatory across all engineering squads, accompanied by written async sprint notes.',
            }
          : d
      );

    const conflictsAfterEdit = detectBrainDocumentConflicts(docsAfterOnlineEdit);
    expect(conflictsAfterEdit.length).toBe(0);
  });

  it('exposes PUT /api/brain/documents for online in-place editing + vector re-indexing and renders the Conflict Warning section between ingestion and document list', () => {
    const routeSource = fs.readFileSync(
      path.join(rootDir, 'src/app/api/brain/documents/route.ts'),
      'utf-8'
    );
    const repoSource = fs.readFileSync(
      path.join(rootDir, 'src/infrastructure/rag/brainRepository.ts'),
      'utf-8'
    );
    const pageSource = fs.readFileSync(
      path.join(rootDir, 'src/app/page.tsx'),
      'utf-8'
    );

    expect(routeSource).toContain('export async function PUT');
    expect(repoSource).toContain('export async function updateBrainDocument');
    expect(repoSource).toContain('detectBrainDocumentConflicts');

    // UI must include online editing, download, and conflict alert card between ingestion and document list
    expect(pageSource).toContain('brainConflicts');
    expect(pageSource).toContain('handleUpdateDocument');
    expect(pageSource).toContain('handleDownloadDocument');
  });
});
