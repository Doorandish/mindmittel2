---
description: Mandatory Project Rule - Keep the dual Persian living architecture documents (Technical & Non-Technical on admin.mindmittel.de/admin/docs) synchronized with every code change.
trigger: always_on
---

# MindMittel V2 Living Persian Architecture Documentation Policy (Zero-Drift Mandate)

**CRITICAL PROJECT RULE:**
Whenever any code in `src/core/`, `src/infrastructure/`, or `src/app/api/` is modified, added, or removed (feature, module, API route, database schema, AI routing logic, or error-handling mechanism), you **MUST** automatically update BOTH the written living documentation AND the interactive architecture blueprint in the same commit:

1. **Primary Persian Living Documentation Registry**:
   - File: `src/system/persianLivingDocsRegistry.ts`
   - UI Page: `src/app/admin/docs/page.tsx` (accessible on `admin.mindmittel.de/admin/docs` and linked from `admin.mindmittel.de`)
   - Contains **Two Comprehensive Dynamic Persian Documents**:
     - **Document 1 (`PERSIAN_TECHNICAL_ARCHITECTURE_DOC`)**: Full technical & engineering architecture specification, layered diagrams, data-flow pipelines, module interactions (`DOCUMENTED_CORE_MODULES`), API contracts (`DOCUMENTED_API_ROUTES`), and node translations (`nodeTranslations`).
     - **Document 2 (`PERSIAN_NON_TECHNICAL_BLUEPRINT_DOC`)**: Plain-language, non-technical system blueprint ("زیر کاپوت چه خبر است؟") with visual flowcharts, everyday metaphors, key architectural decisions (`architectKeyDecisions`), and the Error-Prevention Shields (`errorShields`) explaining how failures are prevented.

2. **Interactive 7-Zone Architecture Blueprint Registry (MANDATORY AUTO-SYNC)**:
   - Data Registry: `src/system/interactiveBlueprintRegistry.ts` (`BLUEPRINT_ZONES`, `BLUEPRINT_MODULES`, `BLUEPRINT_CONNECTIONS`)
   - UI Component: `src/components/docs/InteractiveArchitectureBlueprint.tsx` (embedded in `src/app/admin/docs/page.tsx`)
   - Whenever any file under `src/core/`, `src/infrastructure/`, or `src/app/api/` is added, refactored, or removed, you **MUST** update the affected module's Persian inspector description (`whatItDoesFa`, `internalMechanicsFa`, `inputsFa`, `outputsFa`, `sourceFiles`) and directional connections (`BLUEPRINT_CONNECTIONS`) so the interactive blueprint stays 100% synchronized with the codebase.

3. **English Topology Registry**:
   - File: `src/system/architectureRegistry.ts` (`ARCHITECTURE_NODES` & `ARCHITECTURE_EDGES`)

4. **Automated Pre-Commit & Vitest Drift Guard**:
   - Test File: `tests/unit/system/loggerAndDocs.test.ts`
   - Automatically scans `src/app/api/**/route.ts`, `ARCHITECTURE_NODES`, and every `sourceFiles` path referenced in `BLUEPRINT_MODULES` & `BLUEPRINT_CONNECTIONS`.
   - If any API route, architecture node, or interactive blueprint reference drifts out of sync, `npm test` and the `.husky/pre-commit` hook will **FAIL** and block the commit.
   - Never bypass or weaken this test. Always update both the written documents and the interactive blueprint whenever code changes affect system behavior.
