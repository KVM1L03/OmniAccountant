# Enterprise Invoice Reconciler - Second Brain & ADRs

> **Purpose:** This file is the project's persistent memory. It records architectural
> decisions, conquered bugs, anti-patterns, and the current state of the system so that
> any AI agent (or human) can bootstrap full context without reading the entire git history.
>
> Entries are appended chronologically by the `update_memory.py` skill script.

---

## 2026-04-08 15:41 UTC - Finished Phase 4

**Summary:** Finished Phase 4. Implemented Temporal Workflow with asyncio.gather for batch processing. Fixed a critical Race Condition in DSPy by replacing global dspy.configure with local dspy.context(lm=lm) to ensure thread-safe async isolation. System is now fully resilient.

### Architectural Decisions Made

- Implemented Temporal Workflow with asyncio.gather for batch processing.

### Critical Bugs Resolved (Anti-Patterns avoided)

- Fixed a critical Race Condition in DSPy by replacing global dspy.configure with local dspy.context(lm=lm) to ensure thread-safe async isolation.

### Current State & Next Steps

- Finished Phase 4.
- System is now fully resilient.

## 2026-04-13 11:44 UTC - Implemented file upload + hot folder routing via Temporal

**Summary:** Implemented file upload + hot folder routing via Temporal. Added POST /upload-invoices endpoint (FastAPI) saving PDFs with asyncio.to_thread + path-traversal protection. New route_invoice_file_activity moves processed PDFs to mock_data/approved/ or mock_data/discrepancy/ based on reconciliation status — uses shutil.move wrapped in asyncio.to_thread. BatchReconciliationWorkflow now two-phase: reconciliation parallel gather, then routing parallel gather with routing_indices stable mapping. Frontend: added upload UI (hidden file input + custom Select PDFs button + toast) with disable-during-polling race mitigation. Removed :ro from docker-compose mock_data mounts to enable writes. Redesigned dashboard (page.tsx) and sidebar (layout.tsx) to Editorial Enterprise palette from Stitch Corporate Dashboard Redesign: deep forest green primary #00502e, surface-layered whitespace, dramatic 3.25rem KPI display numerics, asymmetric 8/4 col grid with Pipeline Health gradient card + Audit History tonal recess + glass Support card, no-line borders (tonal shifts only), Editorial ledger table with primary-fixed chip badges, LedgerCore brand with Landmark icon and gradient New Invoice CTA in the sidebar.

### Architectural Decisions Made

- Implemented file upload + hot folder routing via Temporal.

### Critical Bugs Resolved (Anti-Patterns avoided)

- Frontend: added upload UI (hidden file input + custom Select PDFs button + toast) with disable-during-polling race mitigation.
- Redesigned dashboard (page.tsx) and sidebar (layout.tsx) to Editorial Enterprise palette from Stitch Corporate Dashboard Redesign: deep forest green primary #00502e, surface-layered whitespace, dramatic 3.25rem KPI display numerics, asymmetric 8/4 col grid with Pipeline Health gradient card + Audit History tonal recess + glass Support card, no-line borders (tonal shifts only), Editorial ledger table with primary-fixed chip badges, LedgerCore brand with Landmark icon and gradient New Invoice CTA in the sidebar.

### Current State & Next Steps

- Added POST /upload-invoices endpoint (FastAPI) saving PDFs with asyncio.to_thread + path-traversal protection.
- New route_invoice_file_activity moves processed PDFs to mock_data/approved/ or mock_data/discrepancy/ based on reconciliation status — uses shutil.move wrapped in asyncio.to_thread.
- BatchReconciliationWorkflow now two-phase: reconciliation parallel gather, then routing parallel gather with routing_indices stable mapping.
- Removed :ro from docker-compose mock_data mounts to enable writes.
