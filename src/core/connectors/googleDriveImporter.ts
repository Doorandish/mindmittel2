import crypto from 'crypto';
import type { DocumentSourceType } from '@/core/rag/chunker';

/**
 * Normalizes folder path inputs like "/IPM", "Folder: /Board-Charters-2026", or direct IDs.
 */
export function parseGoogleDriveFolderScope(rawScope: string): string {
  return rawScope
    .trim()
    .replace(/^(\s*Folder:\s*|\/|\\)+/gi, '')
    .replace(/(\/|\\)+$/g, '')
    .trim();
}

export interface GoogleDriveSyncedPayload {
  title: string;
  content: string;
  department: string;
  sourceType: DocumentSourceType;
  tags: string[];
  createdByEmail: string;
}

interface GoogleDriveFileEntry {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  description?: string;
}

export interface GoogleServiceAccountKey {
  type?: string;
  project_id?: string;
  private_key_id?: string;
  private_key?: string;
  client_email?: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
}

interface CachedToken {
  accessToken: string;
  expiresAtMs: number;
}

const serviceAccountTokenCache = new Map<string, CachedToken>();

/**
 * Detects whether the user provided a Google Cloud Service Account JSON key string.
 */
export function isServiceAccountJson(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    return false;
  }
  return trimmed.includes('private_key') && trimmed.includes('client_email');
}

/**
 * Parses a Google Service Account JSON key, creates a cryptographically signed RS256 JWT,
 * and exchanges it with Google's OAuth2 token endpoint (https://oauth2.googleapis.com/token)
 * to receive a fresh 1-hour OAuth Access Token using Node.js built-in crypto (no external SDK required).
 */
export async function mintGoogleServiceAccountToken(
  serviceAccountJson: string
): Promise<string> {
  let parsed: GoogleServiceAccountKey;
  try {
    parsed = JSON.parse(serviceAccountJson) as GoogleServiceAccountKey;
  } catch {
    throw new Error(
      'Invalid Google Service Account JSON: Unable to parse credentials.'
    );
  }

  const { client_email, private_key, token_uri = 'https://oauth2.googleapis.com/token' } =
    parsed;

  if (!client_email || !private_key) {
    throw new Error(
      'Invalid Google Service Account JSON: Both "client_email" and "private_key" are required.'
    );
  }

  // Check in-memory cache for an active token (with 2-minute safety buffer)
  const cached = serviceAccountTokenCache.get(client_email);
  if (cached && Date.now() < cached.expiresAtMs - 120_000) {
    return cached.accessToken;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', typ: 'JWT' })
  ).toString('base64url');

  const claims = Buffer.from(
    JSON.stringify({
      iss: client_email,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      aud: token_uri,
      exp: nowSec + 3600,
      iat: nowSec - 30, // 30-second clock skew tolerance
    })
  ).toString('base64url');

  const unsignedToken = `${header}.${claims}`;

  let signature: string;
  try {
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(unsignedToken);
    signature = signer.sign(private_key, 'base64url');
  } catch (err) {
    throw new Error(
      `Failed to sign Google Service Account JWT: ${
        err instanceof Error ? err.message : String(err)
      }. Ensure the private_key is an uncorrupted RSA key in PEM format.`
    );
  }

  const assertion = `${unsignedToken}.${signature}`;

  const postBody = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  }).toString();

  const tokenRes = await fetch(token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: postBody,
    signal: AbortSignal.timeout(6000),
  });

  if (!tokenRes.ok) {
    const errPayload = (await tokenRes.json().catch(() => null)) as {
      error?: string;
      error_description?: string;
    } | null;
    throw new Error(
      `Google Service Account authentication failed (HTTP ${tokenRes.status}): ${
        errPayload?.error_description || errPayload?.error || tokenRes.statusText
      }. Ensure Google Drive API is enabled in your Google Cloud Project.`
    );
  }

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!tokenData.access_token) {
    throw new Error(
      'Google OAuth token exchange succeeded but no access_token was returned.'
    );
  }

  const expiresInSec = tokenData.expires_in ?? 3600;
  serviceAccountTokenCache.set(client_email, {
    accessToken: tokenData.access_token,
    expiresAtMs: Date.now() + expiresInSec * 1000,
  });

  return tokenData.access_token;
}

/**
 * Connects to Google Drive API v3 (https://www.googleapis.com/drive/v3/files),
 * searches the target folder or files, exports and downloads their actual content,
 * and compiles them into a structured Company Brain governance document.
 *
 * Supports both direct OAuth Access Tokens (ya29...) and Google Cloud Service Account JSON keys.
 */
export async function fetchLiveGoogleDrivePayload(params: {
  rawToken: string;
  targetScope: string;
  userEmail: string;
  defaultDepartment?: string;
}): Promise<GoogleDriveSyncedPayload> {
  const { rawToken, targetScope, userEmail, defaultDepartment = 'Finance & Legal' } =
    params;
  const inputString = rawToken.trim();
  const folderScope = parseGoogleDriveFolderScope(targetScope);

  if (!inputString) {
    throw new Error(
      'Google Drive OAuth Access Token or Service Account JSON key is required.'
    );
  }

  // Transparently mint an OAuth Access Token if a Service Account JSON was provided
  const cleanToken = isServiceAccountJson(inputString)
    ? await mintGoogleServiceAccountToken(inputString)
    : inputString;

  const authHeaders = {
    Authorization: `Bearer ${cleanToken}`,
    Accept: 'application/json',
  };

  // 1. Determine query to locate files in folder or by name
  let fileQuery: string;

  // Check if folderScope is a direct Google Drive folder ID (alphanumeric ID >= 20 chars without spaces)
  const isDirectId = /^[a-zA-Z0-9_-]{20,}$/.test(folderScope);

  if (isDirectId) {
    fileQuery = `'${folderScope}' in parents and trashed = false`;
  } else if (folderScope) {
    // Try to find the folder ID by its name first
    try {
      const folderSearchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        `mimeType = 'application/vnd.google-apps.folder' and name = '${folderScope.replace(
          /'/g,
          "\\'"
        )}' and trashed = false`
      )}&fields=files(id,name)&pageSize=1`;

      const folderRes = await fetch(folderSearchUrl, {
        method: 'GET',
        headers: authHeaders,
        signal: AbortSignal.timeout(4500),
      });

      if (folderRes.status === 401) {
        throw new Error(
          'Google Drive API authorization failed (HTTP 401: Invalid Credentials). Please check your Google OAuth Access Token or Service Account key.'
        );
      }
      if (folderRes.status === 403) {
        throw new Error(
          "Google Drive API permission denied (HTTP 403). Ensure the folder is shared with your Service Account email, or your OAuth token includes 'https://www.googleapis.com/auth/drive.readonly' permission."
        );
      }

      if (folderRes.ok) {
        const folderData = (await folderRes.json()) as {
          files?: Array<{ id: string; name: string }>;
        };
        const matchedFolder = folderData.files?.[0];
        if (matchedFolder?.id) {
          fileQuery = `'${matchedFolder.id}' in parents and trashed = false`;
        } else {
          // If folder not found by exact folder type, search files containing the name
          fileQuery = `trashed = false and name contains '${folderScope.replace(
            /'/g,
            "\\'"
          )}'`;
        }
      } else {
        fileQuery = `trashed = false and name contains '${folderScope.replace(
          /'/g,
          "\\'"
        )}'`;
      }
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes('HTTP 401') || err.message.includes('HTTP 403'))
      ) {
        throw err;
      }
      fileQuery = `trashed = false and name contains '${folderScope.replace(
        /'/g,
        "\\'"
      )}'`;
    }
  } else {
    // Empty scope: fetch top documents in the root drive
    fileQuery = `trashed = false and mimeType != 'application/vnd.google-apps.folder'`;
  }

  // 2. Query file list from Google Drive API
  const listFilesUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    fileQuery
  )}&fields=files(id,name,mimeType,size,description)&pageSize=8`;

  const filesRes = await fetch(listFilesUrl, {
    method: 'GET',
    headers: authHeaders,
    signal: AbortSignal.timeout(5000),
  });

  if (filesRes.status === 401) {
    throw new Error(
      'Google Drive API authorization failed (HTTP 401: Invalid Credentials). Please check your Google OAuth Access Token or Service Account key.'
    );
  }
  if (filesRes.status === 403) {
    throw new Error(
      "Google Drive API permission denied (HTTP 403). Ensure the folder is shared with your Service Account email as Viewer, and Google Drive API is enabled in your Google Cloud Console."
    );
  }
  if (!filesRes.ok) {
    const errorBody = await filesRes.text().catch(() => '');
    throw new Error(
      `Google Drive API error (HTTP ${filesRes.status}): ${
        errorBody.slice(0, 140) || filesRes.statusText
      }`
    );
  }

  const filesPayload = (await filesRes.json()) as {
    files?: GoogleDriveFileEntry[];
  };
  const files = filesPayload.files ?? [];

  if (files.length === 0) {
    throw new Error(
      `No readable files found in Google Drive for folder "${
        folderScope || targetScope
      }". Please verify the folder name or upload files to that folder.`
    );
  }

  // 3. Download / export text from each matched file
  const extractedSections: string[] = [];

  for (const file of files.slice(0, 6)) {
    try {
      let fileText = '';

      if (file.mimeType === 'application/vnd.google-apps.document') {
        // Export native Google Docs to plain text
        const exportUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
        const exportRes = await fetch(exportUrl, {
          method: 'GET',
          headers: authHeaders,
          signal: AbortSignal.timeout(4000),
        });
        if (exportRes.ok) {
          fileText = await exportRes.text();
        }
      } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
        // Export native Google Sheets to CSV
        const exportUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv`;
        const exportRes = await fetch(exportUrl, {
          method: 'GET',
          headers: authHeaders,
          signal: AbortSignal.timeout(4000),
        });
        if (exportRes.ok) {
          fileText = await exportRes.text();
        }
      } else {
        // Direct media download for plain text, markdown, CSV, or PDF
        const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
        const dlRes = await fetch(downloadUrl, {
          method: 'GET',
          headers: authHeaders,
          signal: AbortSignal.timeout(4500),
        });
        if (dlRes.ok) {
          fileText = await dlRes.text();
        }
      }

      const cleanText = fileText.trim();
      if (cleanText.length > 0) {
        extractedSections.push(
          `=== File: ${file.name} ===\n${cleanText.slice(0, 12000)}`
        );
      }
    } catch {
      // Continue importing remaining files if a single file export is restricted
    }
  }

  if (extractedSections.length === 0) {
    throw new Error(
      `Found ${files.length} file(s) in Google Drive (${files
        .map((f) => f.name)
        .join(', ')}) but could not extract readable text. Ensure files have readable text format.`
    );
  }

  const primaryTitle = files[0]?.name ? ` — ${files[0].name.replace(/\.[^.]+$/, '')}` : '';
  const fullContent = [
    `[Live Google Drive Sync — Scope: "${targetScope}"]`,
    `Synchronized ${extractedSections.length} document(s) from corporate Google Drive into Company Brain.`,
    '',
    ...extractedSections,
  ].join('\n\n');

  return {
    title: `Google Drive Sync (${targetScope})${primaryTitle}`,
    content: fullContent,
    department: defaultDepartment,
    sourceType: 'gdrive',
    tags: ['google-drive', 'live-sync', 'cloud-storage', folderScope.toLowerCase() || 'docs'],
    createdByEmail: userEmail.trim().toLowerCase(),
  };
}
