import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseGoogleDriveFolderScope,
  fetchLiveGoogleDrivePayload,
} from '@/core/connectors/googleDriveImporter';
import {
  createInitialConnectorsState,
  configureConnectorCredentials,
  fetchLiveConnectorPayloadOrFallback,
} from '@/core/connectors/connectorRegistry';

describe('Google Drive Live API Importer & Real Document Extraction', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses folder scopes cleanly from paths (/IPM), placeholders, or direct IDs', () => {
    expect(parseGoogleDriveFolderScope('/IPM')).toBe('IPM');
    expect(parseGoogleDriveFolderScope('Folder: /Board-Charters-2026')).toBe(
      'Board-Charters-2026'
    );
    expect(parseGoogleDriveFolderScope('1AbCdEfGhIjKlMnOpQrStUvWxYz')).toBe(
      '1AbCdEfGhIjKlMnOpQrStUvWxYz'
    );
    expect(parseGoogleDriveFolderScope('')).toBe('');
  });

  it('throws an informative error when Google Drive returns HTTP 401 unauthenticated (never falls back to a silent fake template)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          code: 401,
          message: 'Request is missing required authentication credential.',
          status: 'UNAUTHENTICATED',
        },
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const initial = createInitialConnectorsState();
    const configured = configureConnectorCredentials(initial, {
      connectorId: 'google-drive',
      apiSecret: 'ya29.expired-or-invalid-token-here',
      targetScope: '/IPM',
      userEmail: 'amir@mindmittel.de',
    });
    const driveConnector = configured.find((c) => c.id === 'google-drive')!;

    await expect(
      fetchLiveConnectorPayloadOrFallback({
        connector: driveConnector,
        rawSecret: 'ya29.expired-or-invalid-token-here',
        userEmail: 'amir@mindmittel.de',
      })
    ).rejects.toThrow(/Google Drive API authorization failed \(HTTP 401/i);
  });

  it('fetches real Google Docs and text files from Google Drive and aggregates their actual content into a multi-kilobyte document', async () => {
    const mockFilesResponse = {
      files: [
        {
          id: 'doc_123',
          name: 'IPM_Strategic_Charter_2026.gdoc',
          mimeType: 'application/vnd.google-apps.document',
          size: '4096',
        },
        {
          id: 'text_456',
          name: 'Governance_Guidelines.txt',
          mimeType: 'text/plain',
          size: '2048',
        },
      ],
    };

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      // 1. Files search / list request
      if (url.includes('/drive/v3/files?') && !url.includes('/export')) {
        return {
          ok: true,
          status: 200,
          json: async () => mockFilesResponse,
        };
      }
      // 2. Google Doc export request
      if (url.includes('/files/doc_123/export')) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            'Section 1: All IPM procurement and cross-border tech decisions exceeding €15,000 require executive co-signature and full architectural compliance audit in MindMittel.',
        };
      }
      // 3. Text file download request
      if (url.includes('/files/text_456?alt=media')) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            'Section 2: Security and data privacy controls must comply with DSGVO and NIS-2 directives across all suppliers.',
        };
      }
      return { ok: false, status: 404 };
    });

    vi.stubGlobal('fetch', mockFetch);

    const initial = createInitialConnectorsState();
    const configured = configureConnectorCredentials(initial, {
      connectorId: 'google-drive',
      apiSecret: 'ya29.valid-oauth-access-token-1234567890',
      targetScope: '/IPM',
      userEmail: 'amir@mindmittel.de',
    });
    const driveConnector = configured.find((c) => c.id === 'google-drive')!;

    const payload = await fetchLiveConnectorPayloadOrFallback({
      connector: driveConnector,
      rawSecret: 'ya29.valid-oauth-access-token-1234567890',
      userEmail: 'amir@mindmittel.de',
    });

    expect(payload.title).toContain('Google Drive');
    expect(payload.content).toContain('IPM_Strategic_Charter_2026');
    expect(payload.content).toContain('All IPM procurement');
    expect(payload.content).toContain('Governance_Guidelines.txt');
    expect(payload.content).toContain('DSGVO and NIS-2');
    expect(payload.content.length).toBeGreaterThan(250);
  });
});
