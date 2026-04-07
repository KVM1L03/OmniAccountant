"""FastAPI gateway — triggers Temporal batch reconciliation workflows."""

import asyncio
import logging
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from temporalio.client import Client, WorkflowExecutionStatus
from temporalio.service import RPCError

logger = logging.getLogger(__name__)

INVOICES_DIR = Path(__file__).resolve().parent.parent / "mock_data" / "invoices"
TASK_QUEUE = "invoice-reconciliation-queue"


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Connect to Temporal once at startup, close on shutdown."""
    client = await Client.connect("localhost:7233")
    app.state.temporal_client = client
    logger.info("Temporal client connected (localhost:7233)")
    yield


app = FastAPI(title="Enterprise Invoice Reconciler", lifespan=lifespan)


@app.post("/reconcile-batch", status_code=202)
async def reconcile_batch(request: Request) -> dict:
    """Fire-and-forget: start a batch reconciliation workflow."""
    invoice_texts: list[str] = []
    invoice_files = sorted(INVOICES_DIR.glob("*.txt"))

    if not invoice_files:
        raise HTTPException(
            status_code=404,
            detail="No invoice files found in mock_data/invoices/",
        )

    for path in invoice_files:
        content = await asyncio.to_thread(path.read_text)
        invoice_texts.append(content)

    workflow_id = f"batch-{uuid.uuid4()}"
    client: Client = request.app.state.temporal_client

    await client.start_workflow(
        "BatchReconciliationWorkflow",
        args=[invoice_texts],
        id=workflow_id,
        task_queue=TASK_QUEUE,
    )

    logger.info(
        "Started workflow %s with %d invoices", workflow_id, len(invoice_texts)
    )
    return {"message": "Batch processing started", "workflow_id": workflow_id}


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
