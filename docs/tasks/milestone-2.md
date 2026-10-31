# MindMittel V2 — Milestone 2 Task Breakdown

## Goal
Transform the frontend workspace into a fully operational 2-Phase Governance Engine:
1. **Phase 1 (Inject Knowledge into Company Brain)**: Form + API (`/api/brain/documents`) to ingest corporate policies, slice into Parent (2,000c) and Child (400c) chunks, generate 768-dimensional embeddings via Google Gemini (`text-embedding-004` with deterministic semantic fallback), auto-provision the `mindmittel_vector_index` on MongoDB Atlas (`mindmittel_v2`), and list/delete stored documents.
2. **Phase 2 (Propose & Audit Management Decisions)**: Interactive Audit Dashboard + API (`/api/brain/audit`) that embeds the proposed management decision, retrieves matching Child vectors and their full Parent documents from the Company Brain, autonomously selects the optimal Gemini model (`fast` vs `reasoning`), and returns a structured Executive Audit Report (`CERTIFIED`, `CONDITIONAL`, or `POLICY CONFLICT`) with citations, pros/cons, and an actionable roadmap.
3. **Synchronized Landing Page & `/system` Documentation**: Keep the Landing Page and `/system` topology registry updated in tandem with all new Milestone 2 capabilities.
