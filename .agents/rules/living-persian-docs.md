---
description: Mandatory Project Rule - Keep the dual Persian living architecture documents (Technical & Non-Technical on admin.mindmittel.de/admin/docs) synchronized with every code change.
trigger: always_on
---

# MindMittel V2 Living Persian Architecture Documentation Policy (Zero-Drift Mandate)

**CRITICAL PROJECT RULE:**
Whenever you add, modify, refactor, or fix any feature, module, API route, database schema, AI routing logic, or error-handling mechanism in this project, you **MUST** update the dual Persian living documentation registry in the same commit:

1. **Primary Persian Living Documentation Registry**:
   - File: `src/system/persianLivingDocsRegistry.ts`
   - UI Page: `src/app/admin/docs/page.tsx` (accessible on `admin.mindmittel.de/admin/docs` and linked from `admin.mindmittel.de`)
   - Contains **Two Comprehensive Dynamic Persian Documents**:
     - **Document 1 (`PERSIAN_TECHNICAL_ARCHITECTURE_DOC`)**: Full technical & engineering architecture specification, layered diagrams, data-flow pipelines, module interactions (`DOCUMENTED_CORE_MODULES`), API contracts (`DOCUMENTED_API_ROUTES`), and node translations (`nodeTranslations`).
     - **Document 2 (`PERSIAN_NON_TECHNICAL_BLUEPRINT_DOC`)**: Plain-language, non-technical system blueprint ("زیر کاپوت چه خبر است؟") with visual flowcharts, everyday metaphors, key architectural decisions (`architectKeyDecisions`), and the Error-Prevention Shields (`errorShields`) explaining how failures are prevented.

2. **English Topology Registry**:
   - File: `src/system/architectureRegistry.ts` (`ARCHITECTURE_NODES` & `ARCHITECTURE_EDGES`)

3. **Automated Pre-Commit & Vitest Drift Guard**:
   - Test File: `tests/unit/system/loggerAndDocs.test.ts`
   - Automatically scans `src/app/api/**/route.ts` and `ARCHITECTURE_NODES`.
   - If any API route or architecture node is added or changed without updating `src/system/persianLivingDocsRegistry.ts`, `npm test` and the `.husky/pre-commit` hook will **FAIL** and block the commit.
   - Never bypass or weaken this test. Always update both the Technical and Non-Technical Persian documents whenever code changes affect system behavior.
