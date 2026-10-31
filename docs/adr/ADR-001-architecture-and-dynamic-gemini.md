# ADR-001: Modular Monolith with Next.js App Router & Dynamic Gemini Routing

## Status
Accepted

## Context
MindMittel V2 requires a mobile-first Liquid Glass UI, serverless-ready API endpoints, Parent-Child RAG with MongoDB Atlas Vector Search, dynamic Gemini model selection without hardcoded model versions, and seamless deployment to Render's free/starter tier.

## Decision
1. **Modular Monolith in Next.js (App Router)**: Keep UI and API routes in a single deployable repository while strictly separating `src/core/` (pure domain logic, zero I/O dependencies) from `src/infrastructure/` (MongoDB, Gemini HTTP adapters, logging).
2. **Functional Core / Imperative Shell for Gemini Model Selection**:
   - `src/core/ai/modelRanking.ts` evaluates raw model metadata from the Gemini `/v1beta/models` endpoint, filters for `generateContent` support, excludes specialized non-text models (embedding, vision-only, TTS, AQA), parses semantic version numbers dynamically, and scores candidates for `'fast'` (Flash preference) or `'reasoning'` (Pro preference) profiles.
   - `src/infrastructure/gemini/modelSelector.ts` handles network fetching, in-memory TTL caching (default 6 hours), and automatic runtime fallback across ranked candidates if the primary model returns 429/5xx.
3. **Bilingual Architecture (`en` default, `de` secondary)**: All UI copy and `/system` living documentation are stored in structured English and German dictionaries.

## Consequences
- **Positive**: Single Render web service deployment, zero CORS overhead, 100% deterministic unit testing for model ranking and RAG chunking without network calls, automatic adaptation to newly released Gemini models.
- **Negative**: In-memory cache resets on serverless cold starts (mitigated by fast `/v1beta/models` metadata lookup).
