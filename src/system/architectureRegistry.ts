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
    title: 'Crisp Enterprise UI, Landing Page & 2-Phase Live Workspace',
    category: 'frontend',
    status: 'healthy',
    technical: {
      architecturePattern:
        'V1-Inspired High-Contrast Enterprise Shell + 2-Phase Interactive Governance Workspace (EN/DE)',
      stack: [
        'Next.js 15 (App Router)',
        'React 19',
        'Tailwind CSS (Crisp Light Grid + High-Legibility Inter & JetBrains Mono)',
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
        'GET / POST / DELETE /api/brain/documents',
        'POST /api/brain/audit',
        'GET /api/system/logs/stream (SSE)',
      ],
      dataPipeline:
        'User switches between Landing Overview and 2-Phase Live Workspace -> Phase 1 injects knowledge into Company Brain -> Phase 2 submits management decisions for real-time AI audit.',
      errorHandlingAndFallbacks:
        'getDictionary() falls back to English (en) if an unsupported locale is requested; strict unit tests enforce 1:1 EN/DE key parity and overflow-safe containers.',
      envVars: ['NEXT_PUBLIC_APP_URL'],
    },
  },
  {
    id: 'dynamic-gemini-router',
    title: 'Autonomous Gemini Model Selector & Embedding Engine',
    category: 'ai',
    status: 'healthy',
    technical: {
      architecturePattern:
        'Functional Core / Imperative Shell with Autonomous Query Intent Classification & 768-d Embeddings',
      stack: [
        '@google/genai',
        'Google Gemini REST API (/v1beta/models & text-embedding-004)',
        'TypeScript Pure Scoring & Intent Classifier',
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
        'generateGeminiEmbedding768(text: string): Promise<{ vector: number[]; modelUsed: string }>',
      ],
      dataPipeline:
        '1) inferProfileFromQuery() analyzes decision complexity -> 2) selectModel() ranks live Gemini models -> 3) generateGeminiEmbedding768() produces 768-dimensional vectors.',
      errorHandlingAndFallbacks:
        'Automatic multi-model failover on HTTP 429/503; if GEMINI_API_KEY is absent or offline, generateGeminiEmbedding768 seamlessly falls back to the deterministic 768-d semantic vector engine.',
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
        'Raw Policy -> slices 2,000-char Parent chunks & 400-char overlapping Child chunks -> embeds each Child in 768-d -> stores in raw_documents & vector_store -> deduplicates Parent context on query.',
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
        'src/app/api/brain/audit/route.ts',
        'tests/unit/core/audit/vectorAndAuditEngine.test.ts',
      ],
      apiContracts: [
        'POST /api/brain/audit -> ExecutiveAuditReport',
        'evaluateDecisionAgainstPoliciesHeuristic(params)',
      ],
      dataPipeline:
        'Decision Proposal -> 768-d vector retrieval of top Parent policies -> autonomous Gemini Pro/Flash synthesis -> outputs Verdict (CERTIFIED / CONDITIONAL / POLICY_CONFLICT), Alignment %, Pros/Cons, Citations, and 3-Step Roadmap.',
      errorHandlingAndFallbacks:
        'If live Gemini API call times out or is unconfigured, evaluateDecisionAgainstPoliciesHeuristic() deterministically evaluates policy conflicts and returns a complete certified audit report.',
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
      apiContracts: [
        'GET /api/system/logs/stream (text/event-stream)',
        'POST /api/system/logs/stream (emit diagnostic log entry)',
        'GET /api/health (system component status)',
      ],
      dataPipeline:
        'Every ingestion, vector search, and decision audit emits structured telemetry -> redactSensitiveMetadata() scrubs secrets -> streams live to /system console.',
      errorHandlingAndFallbacks:
        'Automatic stream cleanup on client disconnect (AbortSignal); ring buffer evicts oldest item at capacity O(1).',
      envVars: ['SYSTEM_DASHBOARD_TOKEN'],
    },
  },
];

export const ARCHITECTURE_EDGES: readonly TopologyEdge[] = [
  {
    from: 'enterprise-light-ui',
    to: 'parent-child-rag',
    protocol: 'POST /api/brain/documents (Phase 1 Inject)',
  },
  {
    from: 'enterprise-light-ui',
    to: 'executive-audit-engine',
    protocol: 'POST /api/brain/audit (Phase 2 Audit)',
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
