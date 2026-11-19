export interface TechnicalNodeSpec {
  id: string;
  title: string;
  category: 'frontend' | 'api' | 'ai' | 'rag' | 'database' | 'observability';
  status: 'healthy' | 'standby';
  technical: {
    architecturePattern: string;
    stack: string[];
    sourceFiles: string[];
    apiContracts: string[];
    dataPipeline: string;
    errorHandlingAndFallbacks: string;
    envVars: string[];
  };
}

export interface TopologyEdge {
  from: string;
  to: string;
  protocol: string;
}

export const ARCHITECTURE_NODES: readonly TechnicalNodeSpec[] = [
  {
    id: 'enterprise-light-ui',
    title: 'Crisp Enterprise UI, Left Sidebar Workspace & Stacked Audit Ledger',
    category: 'frontend',
    status: 'healthy',
    technical: {
      architecturePattern:
        'Overflow-Safe Top Header + Sectioned Left Sidebar (Governance Engine, Knowledge Vault, Bottom User Profile Card) + Stacked Audit History Below Evaluate Decision',
      stack: [
        'Next.js 15 (App Router)',
        'React 19 + Browser MediaRecorder API (Live Voice)',
        'Tailwind CSS (Crisp Light Grid + Inter & JetBrains Mono)',
        'Lucide Icons',
      ],
      sourceFiles: [
        'src/app/page.tsx',
        'src/components/layout/AppShell.tsx',
        'src/components/glass/GlassCard.tsx',
        'src/i18n/dictionaries.ts',
        'src/app/globals.css',
      ],
      apiContracts: [
        'POST /api/auth/session (Email Identity & Attribution)',
        'POST /api/brain/extract (Multimodal File & Live Audio Transcription)',
        'GET / POST / DELETE /api/brain/documents',
        'GET / POST / DELETE /api/brain/audit (Audit & History Ledger)',
        'GET / POST /api/connectors (iOS-Style Enterprise Connectors)',
      ],
      dataPipeline:
        'User authenticates via corporate email -> Left Sidebar displays sectioned navigation (Evaluate Decision, Company Brain, Connectors Hub) and bottom User Profile Card -> Previous Audit Reports stack directly beneath the Evaluate Decision input box.',
      errorHandlingAndFallbacks:
        'Clean top header prevents horizontal overflow of EN | DE language toggle; hides Launch Live App CTA when already inside workspace.',
      envVars: ['NEXT_PUBLIC_APP_URL'],
    },
  },
  {
    id: 'enterprise-connectors-auth-ledger',
    title: 'Email Auth Attribution, Audit History Ledger & iOS-Toggle Connectors Hub',
    category: 'api',
    status: 'healthy',
    technical: {
      architecturePattern:
        'Email Identity Attribution + Deletable Audit History Ledger + Credential-Gated iOS-Switch Connectors',
      stack: [
        'Zod Email Identity Validator (src/core/auth/userSession.ts)',
        'Enterprise Connector Registry (Slack, MS Teams, Confluence, Notion, Google Drive, Zoom, Google Meet)',
        'Next.js Route Handlers (/api/auth/session, /api/connectors, /api/brain/audit)',
      ],
      sourceFiles: [
        'src/core/auth/userSession.ts',
        'src/core/connectors/connectorRegistry.ts',
        'src/app/api/auth/session/route.ts',
        'src/app/api/connectors/route.ts',
        'tests/unit/core/connectors/authHistoryAndConnectors.test.ts',
      ],
      apiContracts: [
        'POST /api/auth/session -> AuthenticatedUserIdentity',
        'GET / POST /api/connectors (action: "configure" | "toggle" | "sync")',
        'GET / DELETE /api/brain/audit?auditId=...',
      ],
      dataPipeline:
        '1) User signs in via email -> 2) Configures API token/secret on any Chat, Knowledge, or Online Meeting connector -> 3) Toggles iOS switch ON/OFF -> 4) Syncs records into Company Brain with email attribution.',
      errorHandlingAndFallbacks:
        'Raw API secrets are masked immediately via maskSecretToken(); attempting to toggle ON an unconfigured connector prompts the user to enter credentials first.',
      envVars: ['MONGODB_URI'],
    },
  },
  {
    id: 'multimodal-ingestion-engine',
    title: 'Multimodal File Parser & Live Voice Transcription Engine',
    category: 'rag',
    status: 'healthy',
    technical: {
      architecturePattern:
        'MIME/Extension Classifier + Gemini Multimodal inlineData Extraction + Plain Buffer Fallback',
      stack: [
        'Next.js FormData Stream Handler (/api/brain/extract)',
        'Google Gemini Multimodal API (PDF, Image OCR, PPTX, Audio Transcription)',
        'UTF-8 & Printable Run Buffer Extractor',
      ],
      sourceFiles: [
        'src/core/rag/multimodalExtractor.ts',
        'src/app/api/brain/extract/route.ts',
        'src/infrastructure/http/streamingResponse.ts',
        'tests/unit/core/rag/multimodalExtractor.test.ts',
      ],
      apiContracts: [
        'POST /api/brain/extract (multipart/form-data: file, x-mindmittel-stream: 1)',
        'classifyMultimodalInput(fileName: string, mimeType: string)',
        'extractTextFromPlainBuffer(buffer: Buffer, fileName: string)',
        'runWithHeartbeatStream(request, work)',
      ],
      dataPipeline:
        'File or Live WebM Voice Stream -> NDJSON Heartbeat Stream flushes initial byte in < 5ms (every 8s keep-alive) -> classifyMultimodalInput() -> Base64 inlineData sent to dynamically selected Gemini model (18s per-model timeout) -> returns clean structured text into Company Brain editor.',
      errorHandlingAndFallbacks:
        'NDJSON 8s heartbeat prevents Heroku H12 30s timeout on large PDFs/audio; if GEMINI_API_KEY is unconfigured or offline, falls back to local buffer extraction and deterministic transcription preview so uploads never fail.',
      envVars: ['GEMINI_API_KEY'],
    },
  },
  {
    id: 'dynamic-gemini-router',
    title: 'Autonomous Gemini Model Selector, 15m Circuit Breaker & Embedding Engine',
    category: 'ai',
    status: 'healthy',
    technical: {
      architecturePattern:
        'Functional Core / Imperative Shell with Autonomous Query Intent Classification, 15-Minute Model Circuit Breaker & 768-d Embeddings',
      stack: [
        '@google/genai',
        'Google Gemini REST API (/v1beta/models & text-embedding-004)',
        'TypeScript Pure Scoring, Circuit Breaker Cooldown & Intent Classifier',
      ],
      sourceFiles: [
        'src/core/ai/modelRanking.ts',
        'src/infrastructure/gemini/modelSelector.ts',
        'src/infrastructure/gemini/embeddingService.ts',
        'src/app/api/ai/models/route.ts',
      ],
      apiContracts: [
        'inferProfileFromQuery(query: string): "fast" | "reasoning"',
        'geminiModelSelector.selectModel(profile)',
        'geminiModelSelector.executeWithModelFallback(profile, fn)',
        'generateGeminiEmbedding768(text: string): Promise<{ vector: number[]; modelUsed: string }>',
      ],
      dataPipeline:
        '1) inferProfileFromQuery() analyzes decision complexity -> 2) selectModel() filters out unhealthy models and ranks live Gemini models (ensuring a 2.x fallback) -> 3) executeWithModelFallback() quarantines failing models for 15 minutes -> 4) generateGeminiEmbedding768() produces 768-dimensional vectors.',
      errorHandlingAndFallbacks:
        '15-minute Circuit Breaker cooldown immediately skips models failing with HTTP 404/429/5xx, TypeError: fetch failed, or 18s AbortSignal.timeout; if GEMINI_API_KEY is absent or offline, generateGeminiEmbedding768 seamlessly falls back to the deterministic 768-d semantic vector engine.',
      envVars: ['GEMINI_API_KEY'],
    },
  },
  {
    id: 'parent-child-rag',
    title: 'Parent-Child RAG Chunker, Vector Math & Brain Repository',
    category: 'rag',
    status: 'healthy',
    technical: {
      architecturePattern:
        'Hierarchical Parent (2,000c) / Child (400c) Slicing + 768-d Cosine Similarity Retrieval',
      stack: [
        'Node.js Crypto (SHA-256 Content Checksums)',
        '768-d Cosine Similarity Engine',
        'Dual-Mode Brain Repository (MongoDB Atlas + In-Memory Mirror)',
      ],
      sourceFiles: [
        'src/core/rag/chunker.ts',
        'src/core/rag/vectorMath.ts',
        'src/infrastructure/rag/brainRepository.ts',
        'src/app/api/brain/documents/route.ts',
      ],
      apiContracts: [
        'ingestDocumentIntoBrain(params)',
        'searchBrainByVectorSimilarity({ query, departmentFilter, topK })',
        'computeCosineSimilarity(vecA, vecB)',
      ],
      dataPipeline:
        'Extracted Text -> slices 2,000-char Parent chunks & 400-char overlapping Child chunks -> embeds each Child in 768-d -> stores in raw_documents & vector_store -> deduplicates Parent context on query.',
      errorHandlingAndFallbacks:
        'Pre-seeded with 3 baseline corporate policies on boot; zero-downtime in-memory mirror guarantees instant vector search even while Atlas index builds in background.',
      envVars: [],
    },
  },
  {
    id: 'executive-audit-engine',
    title: 'Executive Decision Audit & Contradiction Synthesis Engine',
    category: 'api',
    status: 'healthy',
    technical: {
      architecturePattern:
        'Hybrid LLM JSON Synthesis + Deterministic Policy Contradiction Evaluator',
      stack: [
        'Next.js Route Handler (/api/brain/audit)',
        'Structured JSON Schema Output',
        'Deterministic Heuristic Baseline',
      ],
      sourceFiles: [
        'src/core/audit/decisionEvaluator.ts',
        'src/core/audit/germanRegulatoryAdvisor.ts',
        'src/app/api/brain/audit/route.ts',
        'tests/unit/core/audit/vectorAndAuditEngine.test.ts',
        'tests/unit/core/audit/germanRegulatoryAdvisor.test.ts',
      ],
      apiContracts: [
        'POST /api/brain/audit -> ExecutiveAuditReport (incl. germanAdvisory)',
        'evaluateDecisionAgainstPoliciesHeuristic(params)',
        'evaluateGermanRegulatoryAdvisory({ decisionProposal, matchedParents })',
        'applyGermanAdvisoryToReport(report, advisory, locale)',
      ],
      dataPipeline:
        'Decision Proposal -> 768-d vector retrieval of top Parent policies -> autonomous Gemini Pro/Flash synthesis -> German statutory screening (BetrVG §87/§111, DSGVO, EU AI Act, NIS-2) + Company Brain knowledge-coverage check -> outputs Verdict (CERTIFIED / CONDITIONAL / POLICY_CONFLICT), Alignment %, Pros/Cons, Citations, Roadmap and DACH Advisory.',
      errorHandlingAndFallbacks:
        'If live Gemini API call times out or is unconfigured, evaluateDecisionAgainstPoliciesHeuristic() deterministically evaluates policy conflicts. The German advisory is fully deterministic, applied after LLM synthesis so it cannot be overridden, and only ever downgrades a CERTIFIED verdict to CONDITIONAL when a statute is triggered.',
      envVars: ['GEMINI_API_KEY'],
    },
  },
  {
    id: 'mongodb-atlas-vector',
    title: 'MongoDB Atlas Cluster (mindmittel_v2 & Auto-Index Provisioner)',
    category: 'database',
    status: 'healthy',
    technical: {
      architecturePattern:
        'Global Singleton Connection Pool + Automated createSearchIndex (768-d Cosine) + Cascade Delete',
      stack: [
        'MongoDB Node.js Driver v6',
        'MongoDB Atlas Vector Search (mindmittel_vector_index)',
        'Zod Schema Validation',
      ],
      sourceFiles: [
        'src/infrastructure/db/mongo.ts',
        'src/infrastructure/db/schemas.ts',
        'src/infrastructure/rag/brainRepository.ts',
      ],
      apiContracts: [
        'getMindMittelDb(): Promise<Db>',
        'ensureAtlasVectorIndexProvisioned()',
        'Collections: users, raw_documents, vector_store, system_logs',
      ],
      dataPipeline:
        'On document ingestion, automatically checks and provisions mindmittel_vector_index via collection.createSearchIndex() with 768 dimensions and metadata filters.',
      errorHandlingAndFallbacks:
        '5,000ms serverSelectionTimeoutMS prevents hung requests; cascading delete removes both Parent document and all linked Child vectors.',
      envVars: ['MONGODB_URI', 'MONGODB_DB_NAME'],
    },
  },
  {
    id: 'sse-observability-engine',
    title: 'Live SSE Log Streamer & Ring-Buffer Telemetry',
    category: 'observability',
    status: 'healthy',
    technical: {
      architecturePattern:
        'Bounded In-Memory Ring Buffer (250 entries) + Recursive Secret Redaction + Server-Sent Events (SSE)',
      stack: [
        'Web Streams API (ReadableStream SSE)',
        'Custom Pub/Sub Ring Buffer',
      ],
      sourceFiles: [
        'src/infrastructure/logging/logger.ts',
        'src/app/api/system/logs/stream/route.ts',
        'src/app/api/health/route.ts',
      ],
      dataPipeline:
        'Every multimodal extraction, ingestion, vector search, and decision audit emits structured telemetry -> redactSensitiveMetadata() scrubs secrets -> streams live to /system console.',
      apiContracts: [
        'GET /api/system/logs/stream (text/event-stream)',
        'POST /api/system/logs/stream (emit diagnostic log entry)',
        'GET /api/health (system component status)',
      ],
      errorHandlingAndFallbacks:
        'Automatic stream cleanup on client disconnect (AbortSignal); ring buffer evicts oldest item at capacity O(1).',
      envVars: ['SYSTEM_DASHBOARD_TOKEN'],
    },
  },
  {
    id: 'multi-tenant-control-plane',
    title: 'Multi-Tenant Subdomain Router, Control Plane & 6-Digit OTP Gate',
    category: 'api',
    status: 'healthy',
    technical: {
      architecturePattern:
        'Edge Subdomain Zone Router (mindmittel.de / admin.mindmittel.de / demo.mindmittel.de / <company>.mindmittel.de) + AES-256-GCM Secret Box + AsyncLocalStorage Tenant Isolation + Corporate Domain 6-Digit OTP Verification',
      stack: [
        'Next.js Edge Middleware (src/middleware.ts)',
        'Node AsyncLocalStorage Tenant Context (src/infrastructure/tenancy/tenantContext.ts)',
        'AES-256-GCM & HMAC-SHA256 Session Signer (src/core/security/secretBox.ts, sessionToken.ts)',
      ],
      sourceFiles: [
        'src/middleware.ts',
        'src/core/tenancy/hostResolver.ts',
        'src/core/tenancy/tenantModel.ts',
        'src/infrastructure/tenancy/tenantRepository.ts',
        'src/infrastructure/http/tenantRequestGuard.ts',
        'src/app/admin/page.tsx',
        'src/app/marketing/page.tsx',
      ],
      apiContracts: [
        'GET /api/tenant/context (Active Subdomain & Session Resolution)',
        'POST /api/auth/otp/request & POST /api/auth/otp/verify (Corporate Email 6-Digit OTP)',
        'POST /api/admin/session & GET/POST/PUT/DELETE /api/admin/tenants (Product Owner Console)',
      ],
      dataPipeline:
        'Incoming request host is classified into marketing, admin, or tenant (<slug>) -> withTenantApi verifies signed HttpOnly cookie locked to <slug> -> runWithTenantContext binds MongoDB database (mindmittel_<slug> or custom URI) and tenant Gemini API key.',
      errorHandlingAndFallbacks:
        'Shared MongoClient connection pool for default-cluster tenants prevents Heroku 512MB RAM exhaustion; bounded LRU pool for custom URIs; sandbox OTP fallback when RESEND_API_KEY is not set.',
      envVars: [
        'NEXT_PUBLIC_ROOT_DOMAIN',
        'SUPER_ADMIN_EMAIL',
        'SUPER_ADMIN_PASSWORD',
        'MASTER_ENCRYPTION_KEY',
        'RESEND_API_KEY',
      ],
    },
  },
];

export const ARCHITECTURE_EDGES: readonly TopologyEdge[] = [
  {
    from: 'multi-tenant-control-plane',
    to: 'enterprise-light-ui',
    protocol: 'Subdomain Routing & Signed Tenant Session',
  },
  {
    from: 'multi-tenant-control-plane',
    to: 'mongodb-atlas-vector',
    protocol: 'Per-Tenant Database Isolation (mindmittel_<slug>)',
  },
  {
    from: 'enterprise-light-ui',
    to: 'multimodal-ingestion-engine',
    protocol: 'POST /api/brain/extract (PDF/PPTX/Img/Audio)',
  },
  {
    from: 'multimodal-ingestion-engine',
    to: 'parent-child-rag',
    protocol: 'Normalized Text -> 768-d Chunks',
  },
  {
    from: 'enterprise-light-ui',
    to: 'executive-audit-engine',
    protocol: 'POST /api/brain/audit (Evaluate Tab)',
  },
  {
    from: 'executive-audit-engine',
    to: 'dynamic-gemini-router',
    protocol: 'Autonomous Flash/Pro Selection',
  },
  {
    from: 'parent-child-rag',
    to: 'mongodb-atlas-vector',
    protocol: '768-d Vector Store & Auto-Index (mindmittel_v2)',
  },
  {
    from: 'enterprise-light-ui',
    to: 'sse-observability-engine',
    protocol: 'SSE text/event-stream',
  },
];

export function getArchitectureNodeById(
  id: string
): TechnicalNodeSpec | undefined {
  return ARCHITECTURE_NODES.find((node) => node.id === id);
}
