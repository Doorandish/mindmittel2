# MindMittel V2 — AI-Driven Governance & Leadership Audit Engine

MindMittel V2 is a scalable, mobile-first enterprise governance platform built with **Next.js 15 (App Router)**, **Tailwind CSS (Apple Liquid Glass design system)**, **MongoDB Atlas Vector Search (`mindmittel_v2`)**, and **Dynamic Google Gemini Model Routing**.

## Key Architecture Highlights

1. **Liquid Glass Mobile-First UI (`en` & `de` Bilingual)**:
   - Frosted glass surfaces (`backdrop-blur-2xl`, subtle specular highlights) and a native iOS-style floating bottom navigation dock.
   - Instant runtime switching between English (default) and German (`src/i18n/dictionaries.ts`).
2. **Dynamic Gemini Model Selector (`src/core/ai/modelRanking.ts` & `src/infrastructure/gemini/modelSelector.ts`)**:
   - Zero hardcoded model strings. Queries `/v1beta/models` at runtime, filters for `generateContent` support, parses semantic version numbers, ranks candidates by profile (`fast` vs `reasoning`) and stability (`stable > preview > experimental`), caches for 6 hours, and automatically fails over across top candidates on HTTP 429/5xx.
3. **Parent-Child RAG on MongoDB Atlas (`src/core/rag/chunker.ts` & `src/infrastructure/db/schemas.ts`)**:
   - Slices documents into 2,000-character Parent chunks (`raw_documents`) and 400-character overlapping Child chunks (`vector_store`) locked to 768-dimensional embeddings (`mindmittel_vector_index`) with pre-filtering on `orgId`, `department`, `sourceType` (Upload, Slack, etc.), `tags`, `language`, and `accessLevel`.
4. **Interactive System Topology & Live SSE Logs (`/system`)**:
   - Clickable technical architecture topology with English Technical Deep-Dive specifications and a real-time Server-Sent Events (SSE) log stream backed by a 250-entry Ring Buffer with automatic secret redaction.

## Local Development

```bash
cp .env.example .env.local
npm install
npm test
npm run dev
```

## Deployment on Render.com

This repository includes a `render.yaml` Blueprint configured for seamless deployment as a Render Web Service.
