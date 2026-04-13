"""Initialise and seed the mock ERP SQLite database."""

import logging
import sqlite3
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).resolve().parent / "erp_mock.db"

SCHEMA = """\
CREATE TABLE IF NOT EXISTS purchase_orders (
    id              TEXT PRIMARY KEY,
    vendor_name     TEXT NOT NULL,
    expected_amount REAL NOT NULL
);
"""

# 001-003 match the invoices exactly.
# 004: invoice states $16,867.50 but correct calc is $15,500 * 1.085 = $16,817.50
# 005: invoice states $7,540.74 but correct calc is $6,950 * 1.085 = $7,540.75
# 006-007: uploaded PDFs (CloudData Networks); totals from mock_data/invoices PDFs
SEED_DATA = [
    ("INV-2026-001", "CloudFront Hosting LLC", 5425.00),
    ("INV-2026-002", "DataPipe Analytics", 43942.50),
    ("INV-2026-003", "CyberShield Enterprise", 17902.50),
    ("INV-2026-004", "SyncCloud Solutions", 16817.50),
    ("INV-2026-005", "Stripe Inc", 7540.75),
    ("INV-2026-006", "CloudData Networks", 2170.00),
    ("INV-2026-007", "CloudData Networks", 759.50),
]


def init_db() -> None:
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        cur.executescript(SCHEMA)
        cur.executemany(
            "INSERT OR REPLACE INTO purchase_orders (id, vendor_name, expected_amount) VALUES (?, ?, ?)",
            SEED_DATA,
        )
        conn.commit()
    logger.info("Database seeded at %s with %d records.", DB_PATH, len(SEED_DATA))


if __name__ == "__main__":
    init_db()
