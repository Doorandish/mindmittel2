# MindMittel V2 — Milestone 1 Task Breakdown

## Specification Summary
- **Goal**: Build a production-ready AI-Driven Governance & Leadership Audit Engine with a mobile-first Apple Liquid Glass UI, Parent-Child RAG on MongoDB Atlas Vector Search, dynamic Gemini model selection, bilingual support (`en`/`de`), and a `/system` interactive observability & living documentation center.
- **Tech Stack**: Next.js 15 (App Router), TypeScript, Tailwind CSS, MongoDB Atlas, Google Gemini API, `zod`, `vitest`.

## Tasks

### [x] Step 1: Foundation, Env Validation & Dynamic Gemini Model Selector (TDD)
- [x] Create `package.json`, `tsconfig.json`, `vitest.config.ts`, `.env.example`
- [x] Write unit tests for `env.ts`, `modelRanking.ts`, and `modelSelector.ts`
- [x] Implement `src/config/env.ts` with Zod validation
- [x] Implement `src/core/ai/modelRanking.ts` (Pure functional core)
- [x] Implement `src/infrastructure/gemini/modelSelector.ts` (Fetch, TTL cache, fallback chain)

### [x] Step 2: Liquid Glass Mobile-First UI & Bilingual Routing (`en` / `de`)
- [x] Configure Tailwind CSS with Liquid Glass tokens (`backdrop-filter`, subtle borders, specular highlights)
- [x] Set up bilingual dictionary (`src/i18n/dictionaries.ts`) with 1:1 parity unit tests
- [x] Build `GlassCard` and iOS-inspired `AppShell` (TopBar + BottomTabBar)
- [x] Build responsive mobile-first Governance Audit Dashboard (`src/app/page.tsx`)

### [x] Step 3: MongoDB Atlas & Parent-Child RAG Architecture (TDD)
- [x] Write unit tests for Parent-Child chunker & metadata normalization
- [x] Implement `src/core/rag/chunker.ts` (Parent ~2000 chars, Child ~400 chars with overlap & metadata propagation)
- [x] Implement `src/infrastructure/db/mongo.ts` connection singleton (`mindmittel_v2`)
- [x] Define schemas & repository interfaces for `users`, `raw_documents`, `vector_store`, and Atlas Vector Search index definition (`768` dimensions)

### [x] Step 4: Interactive `/system` Living Docs, Health Telemetry & Live SSE Logs
- [x] Implement structured logger with in-memory Ring Buffer and sensitive field redaction
- [x] Create `/api/health`, `/api/ai/models`, and `/api/system/logs/stream` (Server-Sent Events)
- [x] Create English Technical Deep-Dive architecture node registry (`src/system/architectureRegistry.ts`)
- [x] Build interactive `/system` dashboard with clickable topology graph and live log viewer

### [x] Step 5: CI/CD, Render Blueprint, Git Hooks & Reality Audit
- [x] Create `render.yaml` for Render.com deployment
- [x] Create `.github/workflows/ci.yml`
- [x] Configure Husky pre-commit hook running automated tests
- [x] Run full test suite & output exact Git/GitHub initialization commands
