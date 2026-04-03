# Component: Claude Code Enterprise Review Skill
# File: .claude/skills/code-review/SKILL.md

# Description
Performs an Enterprise-grade Architectural and Security Code Review on Python 3.12+, FastAPI, Temporal.io, and MCP code before finalizing it.

# Trigger
Run this skill when the user explicitly asks to "review code", "run code review", "check enterprise standards", or whenever you are about to save critical business logic (Workflows, APIs, Activities).

# Execution Context (April 2026 Standards)
Before outputting or saving any Python code, internally run the following checklist against your proposed code. If ANY check fails, you MUST rewrite the code to fix it before presenting the final version.

## 📋 The CTO's Checklist:

### 1. Temporal.io & Determinism (Crucial for Resiliency)
- [ ] **No System Time/Randomness in Workflows:** Workflows MUST NOT use `time.time()`, `datetime.now()`, or `random()`. Use `workflow.now()`, `workflow.time()`, or `workflow.random()` instead.
- [ ] **No Native Sleeps:** Never use `time.sleep()` or `asyncio.sleep()` inside a `@workflow.defn`. Use `await workflow.sleep()`.
- [ ] **No I/O in Workflows:** Workflows cannot make direct HTTP requests (`requests`, `httpx`), database calls, or disk I/O. All side effects MUST be pushed into `@activity.defn`.
- [ ] **Data Classes:** Input and output parameters for Activities and Workflows must be strict `Pydantic` models (dataclasses), not loose dictionaries.

### 2. FastAPI & Pydantic v2 (Security & Validation)
- [ ] **Strict Mode:** All Pydantic models MUST have `model_config = ConfigDict(strict=True)` to prevent type coercion (e.g., preventing string "100" from passing as integer 100).
- [ ] **Async Blocking:** Ensure no synchronous blocking operations (e.g., CPU heavy tasks, synchronous DB calls) exist directly inside `async def` API routes. Delegate them to Temporal Workflows or use `run_in_threadpool`.
- [ ] **Dependency Injection:** Use FastAPI's `Depends()` for database sessions, MCP clients, and authentication. Never instantiate them globally in the route file.
- [ ] **Environment Variables:** Secrets must be loaded via `pydantic-settings`, never hardcoded.

### 3. Agentic AI & MCP (Zero-Trust)
- [ ] **No Prompt Engineering:** Never use raw LLM string prompts or LangChain templates for extraction. Rely ONLY on DSPy `dspy.Signature` and structured outputs.
- [ ] **MCP Isolation:** LLM/Agent logic MUST NOT access databases directly. All data fetching must happen through MCP Server Tools with strict `@mcp.tool()` decorators.
- [ ] **LLM Graceful Degradation:** Any code calling LLMs (via DSPy/Activities) must account for `429 RateLimit` and `500 ServerError`. Ensure Temporal Retry Policies are explicitly configured for these Activities.

### 4. Python Clean Code
- [ ] **Type Hinting:** 100% strict type hints are required for all function arguments and return types.
- [ ] **Error Handling:** Never use a bare `except Exception:`. Catch specific exceptions. Log errors with contextual data using the `logging` module before raising or returning.

### 5. Advanced Asynchrony & Event Loop Safety (Python 3.12+)
- [ ] **No Synchronous I/O in Async Contexts:** ABSOLUTELY NO `requests`, `urllib`, or synchronous database drivers (like standard `psycopg2` or `sqlite3` direct calls) inside `async def` functions. Use `httpx`, `asyncpg`, or `aiosqlite`.
- [ ] **Event Loop Starvation:** Ensure no CPU-bound operations (heavy JSON parsing, massive list comprehensions, matrix math) run directly on the event loop. Offload them using `asyncio.to_thread()` or a dedicated process pool.
- [ ] **Modern Concurrency:** Use Python 3.11+ `asyncio.TaskGroup` for concurrent tasks instead of the legacy `asyncio.gather`. It provides superior cancellation semantics and error propagation.
- [ ] **Temporal Async Safety:** Remember that Temporal Activities can be written as `async def` or standard `def`. If an Activity uses external asynchronous clients (like an async MCP client), the Activity MUST be `async def`.

# Output Format
When executing this review, provide a brief Markdown report containing:
1. **Status:** PASS or REFACTOR REQUIRED.
2. **Findings:** Bullet points of what was analyzed and corrected based on the checklist.
3. **Final Code:** The revised, production-ready code blocks.