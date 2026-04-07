"""Temporal Worker — connects to the cluster and processes invoice reconciliation tasks."""

import asyncio
import logging

from dotenv import load_dotenv
from temporalio.client import Client
from temporalio.worker import Worker

from ai_worker.activities import process_invoice_activity
from ai_worker.workflows import BatchReconciliationWorkflow

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

TASK_QUEUE = "invoice-reconciliation-queue"


async def main() -> None:
    """Start the Temporal worker for invoice reconciliation."""
    load_dotenv()

    client = await Client.connect("localhost:7233")
    logger.info("Connected to Temporal at localhost:7233")

    worker = Worker(
        client,
        task_queue=TASK_QUEUE,
        workflows=[BatchReconciliationWorkflow],
        activities=[process_invoice_activity],
    )

    logger.info("Worker listening on task queue '%s'", TASK_QUEUE)
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
