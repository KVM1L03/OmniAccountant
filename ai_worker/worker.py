"""Temporal Worker — connects to the cluster and processes invoice reconciliation tasks."""

import asyncio
import logging
import os

from dotenv import load_dotenv
from temporalio.client import Client
from temporalio.worker import Worker

from ai_worker.activities import (
    process_invoice_activity,
    route_invoice_file_activity,
)
from ai_worker.llm_router import get_configured_lm
from ai_worker.workflows import BatchReconciliationWorkflow

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

TASK_QUEUE = "invoice-reconciliation-queue"
TEMPORAL_ADDRESS = os.environ.get("TEMPORAL_ADDRESS", "localhost:7233")


async def main() -> None:
    """Start the Temporal worker for invoice reconciliation."""
    load_dotenv()
    get_configured_lm()

    client = await Client.connect(TEMPORAL_ADDRESS)
    logger.info("Connected to Temporal at %s", TEMPORAL_ADDRESS)

    worker = Worker(
        client,
        task_queue=TASK_QUEUE,
        workflows=[BatchReconciliationWorkflow],
        activities=[process_invoice_activity, route_invoice_file_activity],
    )

    logger.info("Worker listening on task queue '%s'", TASK_QUEUE)
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
