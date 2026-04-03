# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Enterprise Invoice Reconciler — an AI-powered system that extracts data from invoices, reconciles them against an ERP database, and routes decisions (APPROVED / DISCREPANCY / HUMAN_REVIEW_NEEDED). Early-stage scaffold; most module files are stubs.

## Commands

```bash
# Install dependencies (uses uv)
uv sync

# Run the placeholder entrypoint
uv run python main.py

# Run the API gateway (FastAPI)
uv run uvicorn api_gateway.main:app --reload

# Run the MCP bridge server
uv run python -m mcp_bridge.server
```

No test suite exists yet. When adding tests, use `uv run pytest`.

## Architecture

The system has four packages that communicate at runtime:

- **api_gateway/** — FastAPI HTTP layer. Receives invoice submissions and returns reconciliation results.
- **ai_worker/** — Temporal-based worker that orchestrates the AI pipeline:
  - `workflows.py` / `activities.py` — Temporal workflow and activity definitions for durable execution.
  - `dspy_engine.py` — DSPy module for structured LLM extraction of invoice fields.
  - `agent_graph.py` — LangGraph agent that checks extracted data against the ERP and makes the reconciliation decision.
- **mcp_bridge/** — FastMCP server exposing ERP database lookups as MCP tools (so the LangGraph agent can call them).
  - `init_db.py` — Seeds/initializes the mock ERP database.
- **shared/** — Pydantic models shared across packages (`InvoiceData`, `ReconciliationDecision`).

### Data flow

```
Invoice → api_gateway → Temporal workflow (ai_worker)
  → DSPy extraction (dspy_engine) → InvoiceData
  → LangGraph agent (agent_graph) calls MCP tools (mcp_bridge) to query ERP
  → ReconciliationDecision → api_gateway response
```

### Key dependencies

- **Temporal** for workflow orchestration and durability
- **DSPy** for structured LLM output (invoice field extraction)
- **LangGraph** for the reconciliation agent graph
- **FastMCP** for exposing ERP lookups as MCP tool calls
- **Langfuse** for LLM observability
- Python >=3.12, managed with **uv**

## Architecture Rules

1. **Microservices Only**: This is a distributed system. Never combine `api_gateway`, `mcp_bridge`, and `ai_worker` into a single file.
2. **Durable Execution**: All business logic must be written as Temporal Workflows (`workflows.py`) and Activities (`activities.py`). Workflows MUST be 100% deterministic (no HTTP calls, no raw `datetime.now()`).
3. **No Prompt Engineering**: We use DSPy (`dspy-ai`) for extraction. Do NOT use LangChain or raw prompt templates.
4. **Strict Typing**: Use Pydantic v2 with `model_config = ConfigDict(strict=True)` for all data contracts.
5. **Zero Trust**: Database connections happen ONLY via the `fastmcp` bridge.

## Conventions

- Shared data models live in `shared/schemas.py` and are imported by other packages — keep them as the single source of truth.
- `mock_data/invoices/` holds sample invoice files for development/testing.
