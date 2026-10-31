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
    id: 'liquid-glass-ui',
    title: 'Liquid Glass Mobile-First UI & Bilingual Shell',
    category: 'frontend',
    status: 'healthy',
    technical: {
      architecturePattern:
        'Mobile-First App Shell with Atomic Liquid Glass Surfaces & Deterministic Dictionary i18n (EN/DE)',
      stack: [
        'Next.js 15 (App Router)',
        'React 19',
        'Tailwind CSS (backdrop-blur-2xl, specular inset shadows)',
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
        'GET /api/health',
        'GET /api/ai/models?profile=fast|reasoning',
        'GET /api/system/logs/stream (SSE)',
      ],
      dataPipeline:
        'Client state selects locale (en default, de secondary) -> synchronous dictionary resolution -> renders responsive CSS grid and floating iOS bottom dock.',
      errorHandlingAndFallbacks:
        'getDictionary() falls back to English (en) if an unsupported locale key is passed; unit tests enforce 1:1 key parity between en and de.',
      envVars: ['NEXT_PUBLIC_APP_URL'],
    },
  },
  {
    id: 'dynamic-gemini-router',
    title: 'Dynamic Gemini API Model Selector',
    category: 'ai',
    status: 'healthy',
    technical: {
      architecturePattern:
        'Functional Core / Imperative Shell with TTL Caching & Multi-Tier Failover',
      stack: [
        '@google/genai',
        'Google Gemini REST API (/v1beta/models)',
        'TypeScript Pure Scoring Engine',
      ],
      sourceFiles: [
        'src/core/ai/modelRanking.ts',
        'src/infrastructure/gemini/modelSelector.ts',
        'src/app/api/ai/models/route.ts',
      ],
      apiContracts: [
        'GET https://generativelanguage.googleapis.com/v1beta/models',
        'Internal: geminiModelSelector.selectModel(profile: "fast" | "reasoning")',
        'Internal: geminiModelSelector.executeWithFallback(profile, operation)',
      ],
      dataPipeline:
        'Fetches live model catalog from Gemini API -> filters for generateContent support -> excludes embedding/TTS/image models -> regex parses version numbers -> scores by profile (Flash vs Pro) & stability (stable > preview > exp) -> caches for 6h.',
      errorHandlingAndFallbacks:
        '1) If HTTP 429/503/404 occurs during inference, executeWithFallback automatically retries the next highest-ranked model. 2) If /v1beta/models network refresh fails, serves stale cached model catalog.',
      envVars: ['GEMINI_API_KEY'],
    },
  },
  {
    id: 'parent-child-rag',
    title: 'Parent-Child RAG Chunker & Metadata Normalizer',
    category: 'rag',
    status: 'healthy',
    technical: {
      architecturePattern:
        'Hierarchical Parent-Child Document Slicing with Denormalized Metadata Pre-Filtering',
      stack: [
        'Node.js Crypto (SHA-256 Content Checksums)',
        'Deterministic Sliding Window Slicer',
      ],
      sourceFiles: [
        'src/core/rag/chunker.ts',
        'tests/unit/core/rag/chunker.test.ts',
      ],
      apiContracts: [
        'createParentChildChunks(input: RawGovernanceDocumentInput, options?: ChunkingOptions)',
        'normalizeMetadataTags(tags: string[]): string[]',
      ],
      dataPipeline:
        'Raw Document -> normalizes department & tags to lowercase kebab-case -> slices 2,000-char Parent chunks (with SHA-256 IDs for external connector dedup e.g. Slack) -> slices 400-char Child chunks (50-char overlap) -> copies filter metadata onto each child.',
      errorHandlingAndFallbacks:
        'Empty or whitespace-only tags are stripped; duplicate tags are deduplicated; deterministic SHA-256 parentId prevents duplicate ingestion on connector retries.',
      envVars: [],
    },
  },
  {
    id: 'mongodb-atlas-vector',
    title: 'MongoDB Atlas Cluster (mindmittel_v2 & Vector Search)',
    category: 'database',
    status: 'healthy',
    technical: {
      architecturePattern:
        'Global Singleton Connection Pool + 768-d Cosine Vector Search Index + Cascade Deletion',
      stack: [
        'MongoDB Node.js Driver v6',
        'MongoDB Atlas Vector Search (mindmittel_vector_index)',
        'Zod Schema Validation',
      ],
      sourceFiles: [
        'src/infrastructure/db/mongo.ts',
        'src/infrastructure/db/schemas.ts',
      ],
      apiContracts: [
        'getMindMittelDb(): Promise<Db>',
        'deleteParentDocumentCascade(parentId: string, orgId: string)',
        'Collections: users, raw_documents, vector_store, system_logs',
      ],
      dataPipeline:
        'Child vector query ($vectorSearch on 768-d embedding with pre-filters on metadata.orgId, department, sourceType, tags, language, accessLevel) -> $lookup parentId in raw_documents -> returns full 2,000-char Parent context to Gemini.',
      errorHandlingAndFallbacks:
        '5,000ms serverSelectionTimeoutMS prevents hung requests; deleteParentDocumentCascade guarantees zero orphaned child vectors when a parent document is removed.',
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
      apiContracts: [
        'GET /api/system/logs/stream (text/event-stream)',
        'POST /api/system/logs/stream (emit diagnostic log entry)',
        'GET /api/health (system component status)',
      ],
      dataPipeline:
        'Module calls systemLogger.info/warn/error -> redactSensitiveMetadata() scrubs apiKey/password/token -> appends to 250-slot ring buffer -> pushes JSON frame over active SSE HTTP streams.',
      errorHandlingAndFallbacks:
        'Automatic stream cleanup on client disconnect (AbortSignal); ring buffer evicts oldest item at capacity O(1) to prevent memory leaks on Render free tier.',
      envVars: ['SYSTEM_DASHBOARD_TOKEN'],
    },
  },
];

export const ARCHITECTURE_EDGES: readonly TopologyEdge[] = [
  {
    from: 'liquid-glass-ui',
    to: 'dynamic-gemini-router',
    protocol: 'REST /api/ai/models',
  },
  {
    from: 'liquid-glass-ui',
    to: 'sse-observability-engine',
    protocol: 'SSE text/event-stream',
  },
  {
    from: 'parent-child-rag',
    to: 'mongodb-atlas-vector',
    protocol: 'MongoDB Wire Protocol (mindmittel_v2)',
  },
  {
    from: 'dynamic-gemini-router',
    to: 'parent-child-rag',
    protocol: 'Context Synthesis & Auto-Tagging',
  },
];

export function getArchitectureNodeById(
  id: string
): TechnicalNodeSpec | undefined {
  return ARCHITECTURE_NODES.find((node) => node.id === id);
}
