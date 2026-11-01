import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  validateEmailIdentity,
   formatAttributionBadge,
} from '@/core/auth/userSession';
import {
  createInitialConnectorsState,
  configureConnectorCredentials,
  toggleConnectorState,
  buildConnectorSyncDocument,
} from '@/core/connectors/connectorRegistry';

describe('Milestone 3: Email Auth Attribution, Audit History Ledger & Enterprise Connectors', () => {
  const rootDir = path.resolve(__dirname, '../../../../');

  it('validates and normalizes user email identity for document and audit attribution', () => {
    const identity = validateEmailIdentity({
      email: '  Amir.Doorandish@MindMittel.de ',
      fullName: 'Amir Doorandish',
      department: 'Executive Board',
    });

    expect(identity.email).toBe('amir.doorandish@mindmittel.de');
    expect(identity.fullName).toBe('Amir Doorandish');
    expect(identity.department).toBe('Executive Board');
    expect(formatAttributionBadge(identity.email, identity.fullName)).toContain(
      'amir.doorandish@mindmittel.de'
    );
  });

  it('enforces credential configuration before allowing iOS-style connector toggle ON, and allows toggling ON/OFF afterward', () => {
    const initial = createInitialConnectorsState();
    expect(initial.length).toBeGreaterThanOrEqual(6);

    const slack = initial.find((c) => c.id === 'slack');
    expect(slack).toBeDefined();
    expect(slack?.configured).toBe(false);
    expect(slack?.enabled).toBe(false);

    // Attempting to toggle ON an unconfigured connector should throw or reject
    expect(() =>
      toggleConnectorState(initial, 'slack', true, 'amir@mindmittel.de')
    ).toThrow(/credentials/i);

    // Configure credentials for Slack
    const afterConfig = configureConnectorCredentials(initial, {
      connectorId: 'slack',
      apiSecret: 'xoxb-secret-token-123456',
      targetScope: '#gov-council',
      userEmail: 'amir@mindmittel.de',
    });

    const configuredSlack = afterConfig.find((c) => c.id === 'slack')!;
    expect(configuredSlack.configured).toBe(true);
    expect(configuredSlack.enabled).toBe(true);
    expect(configuredSlack.maskedCredential).toContain('***');
    expect(configuredSlack.maskedCredential).not.toContain('123456');

    // Toggle OFF like an iOS switch
    const afterToggleOff = toggleConnectorState(
      afterConfig,
      'slack',
      false,
      'amir@mindmittel.de'
    );
    expect(afterToggleOff.find((c) => c.id === 'slack')!.enabled).toBe(false);

    // Toggle back ON
    const afterToggleOn = toggleConnectorState(
      afterToggleOff,
      'slack',
      true,
      'amir@mindmittel.de'
    );
    expect(afterToggleOn.find((c) => c.id === 'slack')!.enabled).toBe(true);
  });

  it('builds structured governance knowledge documents when syncing an active connector (Chat, Knowledge, or Online Meeting)', () => {
    const initial = createInitialConnectorsState();
    const configured = configureConnectorCredentials(initial, {
      connectorId: 'zoom-meetings',
      apiSecret: 'zoom-oauth-secret-9999',
      targetScope: 'Board Weekly Sync',
      userEmail: 'amir@mindmittel.de',
    });
    const zoom = configured.find((c) => c.id === 'zoom-meetings')!;

    const syncedDoc = buildConnectorSyncDocument(zoom, 'amir@mindmittel.de');
    expect(syncedDoc.title).toContain('Zoom');
    expect(syncedDoc.content.length).toBeGreaterThan(40);
    expect(syncedDoc.createdByEmail).toBe('amir@mindmittel.de');
  });

  it('renders a sectioned Left Sidebar with bottom User Profile and stacks Audit History directly below Evaluate Decision', () => {
    const pageSource = fs.readFileSync(
      path.join(rootDir, 'src/app/page.tsx'),
      'utf-8'
    );
    const shellSource = fs.readFileSync(
      path.join(rootDir, 'src/components/layout/AppShell.tsx'),
      'utf-8'
    );

    // Left Sidebar sections & bottom user profile in AppShell
    expect(shellSource).toContain('WORKSPACE_SIDEBAR_SECTIONS');
    expect(shellSource).toContain('GOVERNANCE ENGINE');
    expect(shellSource).toContain('KNOWLEDGE VAULT');
    expect(shellSource).toContain('Workspace Sidebar Navigation');
    expect(shellSource).toContain('Switch Profile');

    // Audit History is stacked directly inside Evaluate Decision (no separate 'history' tab)
    expect(pageSource).not.toContain("workspaceSubTab === 'history'");
    expect(pageSource).toContain('Previous Executive Audit Reports');
    expect(pageSource).toContain('handleDeleteAuditHistory');
    expect(pageSource).toContain('handleToggleConnector');
    expect(pageSource).toContain('createdByEmail');
    expect(pageSource).toContain('auditedByEmail');
  });
});
