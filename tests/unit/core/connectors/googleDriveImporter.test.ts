import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import {
  parseGoogleDriveFolderScope,
  fetchLiveGoogleDrivePayload,
  isServiceAccountJson,
  mintGoogleServiceAccountToken,
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

  it('detects and mints a 1-hour Google OAuth token from a Service Account JSON key using built-in crypto RS256 JWT exchange', async () => {
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const mockServiceAccount = {
      type: 'service_account',
      project_id: 'mindmittel',
      private_key_id: 'key123',
      private_key: privateKey,
      client_email: 'mindmittel@mindmittel.iam.gserviceaccount.com',
      token_uri: 'https://oauth2.googleapis.com/token',
    };
    const jsonString = JSON.stringify(mockServiceAccount);

    expect(isServiceAccountJson(jsonString)).toBe(true);
    expect(isServiceAccountJson('ya29.some-oauth-token')).toBe(false);

    let capturedPostUrl = '';
    let capturedBody = '';

    const mockFetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      if (url.includes('oauth2.googleapis.com/token')) {
        capturedPostUrl = url;
        capturedBody = String(opts?.body ?? '');
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'ya29.minted-from-service-account-jwt',
            expires_in: 3600,
            token_type: 'Bearer',
          }),
        };
      }
      return { ok: false, status: 404 };
    });
    vi.stubGlobal('fetch', mockFetch);

    const token = await mintGoogleServiceAccountToken(jsonString);
    expect(token).toBe('ya29.minted-from-service-account-jwt');
    expect(capturedPostUrl).toContain('oauth2.googleapis.com/token');
    expect(capturedBody).toContain('grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer');
    expect(capturedBody).toContain('assertion=');
  });

  it('seamlessly authenticates via pasted Service Account JSON and extracts files from the shared IPM folder', async () => {
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const mockServiceAccount = {
      type: 'service_account',
      project_id: 'mindmittel',
      private_key: privateKey,
      client_email: 'mindmittel@mindmittel.iam.gserviceaccount.com',
      token_uri: 'https://oauth2.googleapis.com/token',
    };
    const jsonString = JSON.stringify(mockServiceAccount);

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      // Token endpoint
      if (url.includes('oauth2.googleapis.com/token')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'ya29.minted-from-service-account-12345',
            expires_in: 3600,
          }),
        };
      }
      // Files list endpoint
      if (url.includes('/drive/v3/files?') && !url.includes('/export')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            files: [
              {
                id: 'shared_file_1',
                name: 'IPM_Board_Meeting_Minutes.gdoc',
                mimeType: 'application/vnd.google-apps.document',
              },
            ],
          }),
        };
      }
      // Export endpoint
      if (url.includes('/files/shared_file_1/export')) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            'Executive board consensus for IPM: All digital infrastructure must be hosted in compliance with DSGVO EU data protection standards.',
        };
      }
      return { ok: false, status: 404 };
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await fetchLiveGoogleDrivePayload({
      rawToken: jsonString,
      targetScope: 'IPM',
      userEmail: 'amir@mindmittel.de',
    });

    expect(result.title).toContain('Google Drive');
    expect(result.content).toContain('IPM_Board_Meeting_Minutes');
    expect(result.content).toContain('Executive board consensus for IPM');
  });

  it('downloads PDF files from Google Drive and extracts clean human text rather than raw /MediaBox binary operators', async () => {
    // A synthetic PDF containing raw PDF operator stream
    const rawPdfBytes = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 597.96850397008 844.979527559055] /Contents 4 0 R >>\nendobj\n' +
        '4 0 obj\n<< /Length 85 >>\nstream\n' +
        'BT /F1 12 Tf 72 712 Td (Studienbescheinigung fuer das WS 2026/27 IPM-M Master) Tj ET\n' +
        'endstream\nendobj\nxref\n0 5\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n400\n%%EOF'
    );

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/drive/v3/files?') && !url.includes('alt=media')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            files: [
              {
                id: 'pdf_file_789',
                name: 'Studienbescheinigung-fuer-das-WS-2026-27_IPM-M.pdf',
                mimeType: 'application/pdf',
                size: String(rawPdfBytes.length),
              },
            ],
          }),
        };
      }
      if (url.includes('/files/pdf_file_789') && url.includes('alt=media')) {
        return {
          ok: true,
          status: 200,
          arrayBuffer: async () => rawPdfBytes.buffer,
          text: async () => rawPdfBytes.toString('utf-8'),
        };
      }
      return { ok: false, status: 404 };
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await fetchLiveGoogleDrivePayload({
      rawToken: 'ya29.mock-drive-token',
      targetScope: '/IPM',
      userEmail: 'amir@mindmittel.de',
    });

    expect(result.title).toContain('Studienbescheinigung');
    // Content should extract actual human text and strip raw /MediaBox or binary operators
    expect(result.content).not.toContain('/MediaBox');
    expect(result.content).toContain('Studienbescheinigung fuer das WS 2026/27 IPM-M');
  });

  it('detects when files have not been modified since lastSyncedAt and skips redundant download (Smart Delta Sync)', async () => {
    const fileLastModified = '2026-11-04T09:00:00.000Z';
    const lastSyncedAt = '2026-11-04T09:30:00.000Z'; // Synced 30 minutes AFTER file was last modified

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/drive/v3/files?') && !url.includes('alt=media')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            files: [
              {
                id: 'pdf_file_789',
                name: 'Studienbescheinigung-fuer-das-WS-2026-27_IPM-M.pdf',
                mimeType: 'application/pdf',
                size: '5000',
                modifiedTime: fileLastModified,
              },
            ],
          }),
        };
      }
      if (url.includes('alt=media')) {
        throw new Error('Should NOT download media when file is unchanged!');
      }
      return { ok: false, status: 404 };
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await fetchLiveGoogleDrivePayload({
      rawToken: 'ya29.mock-drive-token',
      targetScope: '/IPM',
      userEmail: 'amir@mindmittel.de',
      lastSyncedAt,
    });

    expect(result.unchanged).toBe(true);
    expect(result.matchedFilesCount).toBe(1);
    expect(mockFetch).not.toHaveBeenCalledWith(
      expect.stringContaining('alt=media'),
      expect.anything()
    );
  });
});
