# MindMittel V2 — Project Rules & Living Persian Architecture Documentation Mandate

## Mandatory Zero-Drift Living Documentation Rule

Whenever any code in `src/core/`, `src/infrastructure/`, or `src/app/api/` is modified, added, or removed in **MindMittel**, you **MUST** synchronously update BOTH the written living documentation AND the interactive 7-zone architecture blueprint rendered on `admin.mindmittel.de/admin/docs`:

1. **Registry Files to Update on Every Code Change**:
   - `src/system/persianLivingDocsRegistry.ts`
   - `src/system/interactiveBlueprintRegistry.ts` (zones, modules, Persian inspector mechanics, and directional connections rendered by `src/components/docs/InteractiveArchitectureBlueprint.tsx`)
   - `src/system/architectureRegistry.ts`

2. **Two Dynamic Persian Documents on `admin.mindmittel.de/admin/docs` (`src/app/admin/docs/page.tsx`)**:
   - **Document 1 — Technical Architecture Specification (`PERSIAN_TECHNICAL_ARCHITECTURE_DOC`)**:
     Covers layered DDD architecture, module-to-module interactions (`DOCUMENTED_CORE_MODULES`), every API route contract (`DOCUMENTED_API_ROUTES`), Parent-Child RAG, Dynamic Gemini Router & 15m Circuit Breaker, NDJSON 8s Heartbeat Streaming, and DACH statutory compliance (`BetrVG`, `DSGVO`, `EU AI Act`, `NIS-2`).
   - **Document 2 — Non-Technical System Blueprint (`PERSIAN_NON_TECHNICAL_BLUEPRINT_DOC`)**:
     Explains in plain, everyday Persian what happens under the hood, how components cooperate, visual step-by-step flowcharts, key system-architect decisions (`architectKeyDecisions`), and the Error-Prevention Shields (`errorShields`).

3. **Automated Test & Git Pre-Commit Enforcement**:
   - `tests/unit/system/loggerAndDocs.test.ts` automatically verifies that every `src/app/api/**/route.ts` file and every `ARCHITECTURE_NODES` entry is documented in `src/system/persianLivingDocsRegistry.ts`.
   - Always run `npm test`, `npm run typecheck`, and `npm run build` before committing.
