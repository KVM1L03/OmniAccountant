"""FastAPI gateway — triggers Temporal batch reconciliation workflows."""

import asyncio
import logging
import os
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from temporalio.client import Client, WorkflowExecutionStatus
from temporalio.service import RPCError

logger = logging.getLogger(__name__)

INVOICES_DIR = Path(__file__).resolve().parent.parent / "mock_data" / "invoices"
TASK_QUEUE = "invoice-reconciliation-queue"
TEMPORAL_ADDRESS = os.environ.get("TEMPORAL_ADDRESS", "localhost:7233")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Connect to Temporal once at startup, close on shutdown."""
    client = await Client.connect(TEMPORAL_ADDRESS)
    app.state.temporal_client = client
    logger.info("Temporal client connected (%s)", TEMPORAL_ADDRESS)
    yield


app = FastAPI(title="Enterprise Invoice Reconciler", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/reconcile-batch", status_code=202)
async def reconcile_batch(request: Request) -> dict:
    """Fire-and-forget: start a batch reconciliation workflow."""
    invoice_files = sorted(INVOICES_DIR.glob("*.pdf"))

    if not invoice_files:
        raise HTTPException(
            status_code=404,
            detail="No PDF invoice files found in mock_data/invoices/",
        )

    # Pass ABSOLUTE PATHS (strings), not file contents — keeps Temporal
    # Event History small and lets the Activity do the I/O.
    file_paths: list[str] = [str(p) for p in invoice_files]

    workflow_id = f"batch-{uuid.uuid4()}"
    client: Client = request.app.state.temporal_client

    await client.start_workflow(
        "BatchReconciliationWorkflow",
        args=[file_paths],
        id=workflow_id,
        task_queue=TASK_QUEUE,
    )

    logger.info(
        "Started workflow %s with %d PDF invoices", workflow_id, len(file_paths)
    )
    return {"message": "Batch processing started", "workflow_id": workflow_id}


@app.post("/upload-invoices", status_code=201)
async def upload_invoices(files: list[UploadFile] = File(...)) -> dict:
    """Save one or more uploaded PDF invoices to mock_data/invoices/."""
    INVOICES_DIR.mkdir(parents=True, exist_ok=True)

    saved: list[str] = []
    for file in files:
        filename = Path(file.filename or "unnamed.pdf").name

        if not filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail=f"Only PDF files allowed, got: {filename}",
            )

        content = await file.read()
        target = INVOICES_DIR / filename
        await asyncio.to_thread(target.write_bytes, content)
        saved.append(filename)
        logger.info("Saved uploaded file: %s (%d bytes)", filename, len(content))

    return {
        "message": f"Uploaded {len(saved)} file(s)",
        "count": len(saved),
        "files": saved,
    }


@app.get("/status/{workflow_id}")
async def get_workflow_status(workflow_id: str, request: Request) -> dict:
    """Poll the status of a batch reconciliation workflow."""
    client: Client = request.app.state.temporal_client
    handle = client.get_workflow_handle(workflow_id)

    try:
        desc = await handle.describe()
    except RPCError as exc:
        logger.error("Workflow %s not found: %s", workflow_id, exc)
        raise HTTPException(
            status_code=404,
            detail=f"Workflow '{workflow_id}' not found",
        ) from exc

    if desc.status == WorkflowExecutionStatus.COMPLETED:
        result = await handle.result()
        return {"status": "COMPLETED", "result": result}

    if desc.status == WorkflowExecutionStatus.FAILED:
        return {
            "status": "FAILED",
            "message": "The workflow encountered a critical non-recoverable error.",
        }

    return {"status": desc.status.name}
