/**
 * Comprehensive Bilingual (EN / DE) Enterprise Connector Setup Guides.
 * Every connector registered in `createInitialConnectorsState()` MUST have a matching entry here
 * (enforced automatically by `tests/unit/core/connectors/authHistoryAndConnectors.test.ts`).
 */

export interface ConnectorSetupGuide {
  connectorId: string;
  estimatedMinutes: number;
  portalLabelEn: string;
  portalLabelDe: string;
  portalUrl: string;
  requiredScopes: string[];
  tokenFormatLabelEn: string;
  tokenFormatLabelDe: string;
  tokenExample: string;
  scopeExample: string;
  stepsEn: string[];
  stepsDe: string[];
  securityNoteEn: string;
  securityNoteDe: string;
}

export const CONNECTOR_SETUP_GUIDES: Record<string, ConnectorSetupGuide> = {
  'google-drive': {
    connectorId: 'google-drive',
    estimatedMinutes: 5,
    portalLabelEn: 'Open Google Cloud Console',
    portalLabelDe: 'Google Cloud Console öffnen',
    portalUrl: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
    requiredScopes: ['https://www.googleapis.com/auth/drive.readonly (Read-Only)'],
    tokenFormatLabelEn: 'Service Account JSON Key (Recommended) or OAuth Token',
    tokenFormatLabelDe: 'Service-Account-JSON-Schlüssel (Empfohlen) oder OAuth-Token',
    tokenExample: '{"type":"service_account","client_email":"mindmittel@...iam.gserviceaccount.com","private_key":"-----BEGIN PRIVATE KEY-----..."}',
    scopeExample: 'Board-Charters-2026 (or Google Drive Folder ID)',
    stepsEn: [
      'Open Google Cloud Console, select or create a project, and enable the "Google Drive API".',
      'Go to IAM & Admin → Service Accounts → Create Service Account (e.g. "mindmittel-readonly").',
      'Open the created Service Account → Keys tab → Add Key → Create new key → choose JSON and download the file.',
      'In Google Drive, right-click your target policy folder → Share → add the Service Account\'s "client_email" with "Viewer" (read-only) access.',
      'Copy the entire JSON file content into MindMittel\'s credentials field, enter the exact folder name (or folder ID from the URL), and click "Save & Switch ON".',
    ],
    stepsDe: [
      'Öffnen Sie die Google Cloud Console, wählen oder erstellen Sie ein Projekt und aktivieren Sie die „Google Drive API“.',
      'Navigieren Sie zu IAM & Verwaltung → Dienstkonten → Dienstkonto erstellen (z. B. „mindmittel-readonly“).',
      'Öffnen Sie das Dienstkonto → Tab „Schlüssel“ → Schlüssel hinzufügen → Neuen Schlüssel erstellen → JSON auswählen und herunterladen.',
      'Klicken Sie in Google Drive mit Rechtsklick auf Ihren Richtlinien-Ordner → Teilen → fügen Sie die „client_email“ des Dienstkontos ausschließlich als „Betrachter“ (Nur Lesen) hinzu.',
      'Fügen Sie den gesamten Inhalt der JSON-Datei in MindMittel ein, tragen Sie den exakten Ordnernamen (oder die Ordner-ID aus der URL) ein und klicken Sie auf „Speichern & aktivieren“.',
    ],
    securityNoteEn:
      'MindMittel requests strictly read-only Drive access (drive.readonly), supports PDF, DOCX, PPTX, Google Docs & Sheets, and uses Smart Delta Sync so unchanged files consume 0 tokens.',
    securityNoteDe:
      'MindMittel nutzt ausschließlich Lesezugriff (drive.readonly), unterstützt PDF, DOCX, PPTX, Google Docs & Sheets und überspringt unveränderte Dateien per Smart Delta Sync (0 Token-Verbrauch).',
  },

  slack: {
    connectorId: 'slack',
    estimatedMinutes: 3,
    portalLabelEn: 'Open Slack API Portal',
    portalLabelDe: 'Slack API-Portal öffnen',
    portalUrl: 'https://api.slack.com/apps',
    requiredScopes: ['channels:read', 'channels:history', 'groups:read (optional for private channels)'],
    tokenFormatLabelEn: 'Bot User OAuth Token',
    tokenFormatLabelDe: 'Bot-User-OAuth-Token',
    tokenExample: 'xoxb-<workspace-id>-<bot-id>-<your-token>',
    scopeExample: '#gov-council, #executive-board',
    stepsEn: [
      'Open api.slack.com/apps and click "Create New App" → "From scratch", then select your company Slack Workspace.',
      'In the left menu open "OAuth & Permissions" → scroll to "Bot Token Scopes" and add read-only scopes: channels:read and channels:history.',
      'Scroll up and click "Install to Workspace" → Allow access to generate your Bot User OAuth Token (starts with xoxb-).',
      'In Slack, open the target governance channel (e.g. #gov-council) and invite the bot by typing /invite @YourBotName.',
      'Paste the xoxb-... token and target channel name into MindMittel and click "Save & Switch ON".',
    ],
    stepsDe: [
      'Öffnen Sie api.slack.com/apps, klicken Sie auf „Create New App“ → „From scratch“ und wählen Sie Ihren Slack-Workspace.',
      'Öffnen Sie links „OAuth & Permissions“ → fügen Sie unter „Bot Token Scopes“ ausschließlich Lese-Berechtigungen hinzu: channels:read und channels:history.',
      'Klicken Sie oben auf „Install to Workspace“ → bestätigen Sie die Installation und kopieren Sie das erzeugte Bot-Token (beginnt mit xoxb-).',
      'Öffnen Sie in Slack den gewünschten Kanal (z. B. #gov-council) und laden Sie den Bot mit /invite @BotName in den Kanal ein.',
      'Fügen Sie das xoxb-Token und den Kanalnamen in MindMittel ein und klicken Sie auf „Speichern & aktivieren“.',
    ],
    securityNoteEn:
      'Only read-only channel scopes are needed. MindMittel never posts messages, never modifies channels, and stores your token masked on the server.',
    securityNoteDe:
      'Es werden ausschließlich Lese-Scopes benötigt. MindMittel sendet niemals Nachrichten, verändert keine Kanäle und speichert das Token geschützt auf dem Server.',
  },

  notion: {
    connectorId: 'notion',
    estimatedMinutes: 2,
    portalLabelEn: 'Open Notion Integrations',
    portalLabelDe: 'Notion-Integrationen öffnen',
    portalUrl: 'https://www.notion.so/my-integrations',
    requiredScopes: ['Read content (Read-Only)', 'No insert / No update permissions'],
    tokenFormatLabelEn: 'Internal Integration Secret',
    tokenFormatLabelDe: 'Internes Integrations-Secret',
    tokenExample: 'ntn_1234567890abcdef... (or secret_...)',
    scopeExample: 'Corporate Policy Vault',
    stepsEn: [
      'Open notion.so/my-integrations and click "+ New integration".',
      'Name the integration (e.g. "MindMittel Governance Sync") and select your company workspace.',
      'Under Capabilities, keep ONLY "Read content" enabled and uncheck "Update content" and "Insert content".',
      'Save the integration and copy the "Internal Integration Secret" (starts with ntn_ or secret_).',
      'Open your policy root page in Notion → click the "..." menu (top-right) → Connections → Connect to "MindMittel Governance Sync", then paste the secret into MindMittel.',
    ],
    stepsDe: [
      'Öffnen Sie notion.so/my-integrations und klicken Sie auf „+ New integration“.',
      'Vergeben Sie einen Namen (z. B. „MindMittel Governance Sync“) und wählen Sie Ihren Firmen-Workspace.',
      'Aktivieren Sie unter „Capabilities“ ausschließlich „Read content“ und deaktivieren Sie alle Schreibrechte („Update“ / „Insert“).',
      'Speichern Sie die Integration und kopieren Sie das „Internal Integration Secret“ (beginnt mit ntn_ oder secret_).',
      'Öffnen Sie Ihre Richtlinien-Seite in Notion → Menü „...“ (oben rechts) → Verbindungen (Connections) → mit „MindMittel Governance Sync“ verbinden und Secret in MindMittel einfügen.',
    ],
    securityNoteEn:
      'Notion strictly isolates access to pages you explicitly share via "Connections". Unshared private HR or executive pages remain completely invisible.',
    securityNoteDe:
      'Notion beschränkt den Zugriff strikt auf Seiten, die Sie explizit über „Connections“ freigeben. Nicht freigegebene Seiten bleiben vollständig unsichtbar.',
  },

  confluence: {
    connectorId: 'confluence',
    estimatedMinutes: 4,
    portalLabelEn: 'Open Atlassian API Tokens',
    portalLabelDe: 'Atlassian API-Tokens öffnen',
    portalUrl: 'https://id.atlassian.com/manage-profile/security/api-tokens',
    requiredScopes: ['read:confluence-content.all (Read-Only)', 'Space-level read permission'],
    tokenFormatLabelEn: 'Atlassian API Token (or Email:Token)',
    tokenFormatLabelDe: 'Atlassian API-Token (oder E-Mail:Token)',
    tokenExample: 'ATATT3xFfGF0... (Atlassian API Token)',
    scopeExample: 'SPACE: GOV2026 / ENG-HANDBOOK',
    stepsEn: [
      'Sign in to id.atlassian.com/manage-profile/security/api-tokens using a dedicated read-only Atlassian service user.',
      'Click "Create API token", enter label "MindMittel ReadOnly", and copy the generated token immediately.',
      'Verify in Confluence Space Settings → Permissions that this user only has "View" permission for the desired governance spaces (e.g. GOV2026).',
      'Paste the API token and the target Space Key (e.g. SPACE: GOV2026) into MindMittel and click "Save & Switch ON".',
    ],
    stepsDe: [
      'Melden Sie sich unter id.atlassian.com/manage-profile/security/api-tokens mit einem dedizierten Read-Only-Servicekonto an.',
      'Klicken Sie auf „API-Token erstellen“, vergeben Sie den Namen „MindMittel ReadOnly“ und kopieren Sie das Token sofort.',
      'Stellen Sie in Confluence unter Bereichseinstellungen → Berechtigungen sicher, dass dieses Konto nur Leserechte („Anzeigen“) für die gewünschten Bereiche (z. B. GOV2026) besitzt.',
      'Fügen Sie das Token sowie den Bereichsschlüssel (z. B. SPACE: GOV2026) in MindMittel ein und klicken Sie auf „Speichern & aktivieren“.',
    ],
    securityNoteEn:
      'Using a dedicated read-only Atlassian service account ensures strict Space-level isolation and clean audit trails.',
    securityNoteDe:
      'Ein eigenes Read-Only-Servicekonto garantiert strikte Bereichstrennung (Space-Isolation) und saubere Audit-Protokolle.',
  },

  'ms-teams': {
    connectorId: 'ms-teams',
    estimatedMinutes: 7,
    portalLabelEn: 'Open Microsoft Entra / Azure Portal',
    portalLabelDe: 'Microsoft Entra / Azure-Portal öffnen',
    portalUrl: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade',
    requiredScopes: ['ChannelMessage.Read.All (Graph API)', 'Team.ReadBasic.All'],
    tokenFormatLabelEn: 'Azure AD App Client Secret / Graph Token',
    tokenFormatLabelDe: 'Azure AD App Client Secret / Graph-Token',
    tokenExample: '8Q~aBcDeFgHiJkLmNoPqRsTuVwXyZ...',
    scopeExample: 'Leadership-Sync / Finance-Governance',
    stepsEn: [
      'Open Microsoft Entra ID (Azure Portal) → App registrations → "New registration" (e.g. "MindMittel Teams Reader").',
      'Open "API permissions" → Add a permission → Microsoft Graph → Application permissions → select Team.ReadBasic.All and ChannelMessage.Read.All.',
      'Click "Grant admin consent" for your Microsoft 365 organization.',
      'Open "Certificates & secrets" → "New client secret" → copy the generated Secret Value.',
      'Paste the secret value and your target Teams channel name into MindMittel and click "Save & Switch ON".',
    ],
    stepsDe: [
      'Öffnen Sie Microsoft Entra ID (Azure-Portal) → App-Registrierungen → „Neue Registrierung“ (z. B. „MindMittel Teams Reader“).',
      'Öffnen Sie „API-Berechtigungen“ → Berechtigung hinzufügen → Microsoft Graph → Anwendungsberechtigungen → Team.ReadBasic.All und ChannelMessage.Read.All auswählen.',
      'Klicken Sie auf „Administratorzustimmung erteilen“ für Ihren Microsoft-365-Mandanten.',
      'Öffnen Sie „Zertifikate & Geheimnisse“ → „Neuer geheimer Clientschlüssel“ → kopieren Sie den generierten Wert.',
      'Fügen Sie den Schlüssel und den Ziel-Teams-Kanal in MindMittel ein und klicken Sie auf „Speichern & aktivieren“.',
    ],
    securityNoteEn:
      'Only read permissions for selected leadership channels are requested. Private 1:1 employee chats are never accessed (BetrVG & DSGVO compliant).',
    securityNoteDe:
      'Es werden nur Leserechte für ausgewählte Führungskanäle angefordert. Private 1:1-Mitarbeiterchats werden niemals ausgelesen (BetrVG- & DSGVO-konform).',
  },

  'zoom-meetings': {
    connectorId: 'zoom-meetings',
    estimatedMinutes: 5,
    portalLabelEn: 'Open Zoom App Marketplace',
    portalLabelDe: 'Zoom App Marketplace öffnen',
    portalUrl: 'https://marketplace.zoom.us/develop/create',
    requiredScopes: ['cloud_recording:read:list_user_recordings', 'cloud_recording:read:recording'],
    tokenFormatLabelEn: 'Server-to-Server OAuth Secret',
    tokenFormatLabelDe: 'Server-to-Server-OAuth-Secret',
    tokenExample: 'zoom_s2s_secret_...',
    scopeExample: 'Executive Weekly Audit',
    stepsEn: [
      'Open marketplace.zoom.us/develop/create and create a "Server-to-Server OAuth" app.',
      'In the Scopes tab, add read-only Cloud Recording / Transcript scopes (cloud_recording:read:recording).',
      'Activate the app and copy the Client Secret from the App Credentials tab.',
      'Ensure "Audio transcript" is enabled under Zoom Settings → Recording → Cloud Recording for board meetings.',
      'Paste the secret and the target meeting series name into MindMittel and click "Save & Switch ON".',
    ],
    stepsDe: [
      'Öffnen Sie marketplace.zoom.us/develop/create und erstellen Sie eine „Server-to-Server OAuth“-App.',
      'Fügen Sie im Tab „Scopes“ ausschließlich Lese-Berechtigungen für Cloud-Aufzeichnungen/Transkripte hinzu (cloud_recording:read:recording).',
      'Aktivieren Sie die App und kopieren Sie das Client Secret aus dem Tab „App Credentials“.',
      'Aktivieren Sie in Zoom unter Einstellungen → Aufzeichnung → Cloud-Aufzeichnung die Option „Audiotranskript“ für Vorstandssitzungen.',
      'Fügen Sie das Secret sowie den Namen der Meeting-Reihe in MindMittel ein und klicken Sie auf „Speichern & aktivieren“.',
    ],
    securityNoteEn:
      'Only text transcripts of designated governance meetings are indexed; raw video recordings are never stored in MindMittel.',
    securityNoteDe:
      'Nur Text-Transkripte ausgewählter Governance-Meetings werden indexiert; Videodateien werden niemals in MindMittel gespeichert.',
  },

  'google-meet': {
    connectorId: 'google-meet',
    estimatedMinutes: 5,
    portalLabelEn: 'Open Google Cloud Console (Meet API)',
    portalLabelDe: 'Google Cloud Console (Meet API) öffnen',
    portalUrl: 'https://console.cloud.google.com/apis/library/meet.googleapis.com',
    requiredScopes: ['https://www.googleapis.com/auth/meetings.space.readonly (Read-Only)'],
    tokenFormatLabelEn: 'Google Cloud Meet OAuth Credential',
    tokenFormatLabelDe: 'Google Cloud Meet OAuth-Schlüssel',
    tokenExample: 'ya29.a0AfH6SM... (or Service Account JSON)',
    scopeExample: 'Management Sync',
    stepsEn: [
      'Open Google Cloud Console and enable the "Google Meet REST API" for your workspace project.',
      'Create an OAuth 2.0 Client ID (or Service Account with Domain-Wide Delegation) limited to meetings.space.readonly.',
      'Enable automatic meeting transcripts in Google Workspace Admin → Apps → Google Meet → Meet video settings.',
      'Paste the generated OAuth credential and target calendar group name into MindMittel and click "Save & Switch ON".',
    ],
    stepsDe: [
      'Öffnen Sie die Google Cloud Console und aktivieren Sie die „Google Meet REST API“ in Ihrem Projekt.',
      'Erstellen Sie eine OAuth-2.0-Client-ID (oder ein Dienstkonto mit Domain-weiter Delegierung), beschränkt auf meetings.space.readonly.',
      'Aktivieren Sie automatische Transkripte in der Google Workspace Admin-Konsole → Apps → Google Meet → Videoeinstellungen.',
      'Fügen Sie die OAuth-Zugangsdaten sowie die Ziel-Kalendergruppe in MindMittel ein und klicken Sie auf „Speichern & aktivieren“.',
    ],
    securityNoteEn:
      'Read-only access strictly imports finalized meeting transcripts from authorized management calendar groups.',
    securityNoteDe:
      'Der reine Lesezugriff importiert ausschließlich freigegebene Sitzungsprotokolle aus autorisierten Management-Kalendergruppen.',
  },
};

export function getConnectorSetupGuide(
  connectorId: string
): ConnectorSetupGuide | undefined {
  return CONNECTOR_SETUP_GUIDES[connectorId];
}
