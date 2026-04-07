"""DSPy-based invoice extraction engine with Pydantic-validated output."""

import logging

import dspy

from ai_worker.llm_router import get_configured_lm
from shared.schemas import InvoiceData

logger = logging.getLogger(__name__)


class InvoiceExtractionSignature(dspy.Signature):
    """Extract structured invoice data from raw B2B invoice text."""

    invoice_text: str = dspy.InputField(
        desc="The raw text extracted from a B2B invoice document."
    )
    structured_invoice: InvoiceData = dspy.OutputField(
        desc="Structured invoice data following the InvoiceData schema."
    )


class InvoiceProcessor(dspy.Module):
    """DSPy module that uses TypedPredictor for Pydantic-validated extraction."""

    def __init__(self) -> None:
        super().__init__()
        self.predictor = dspy.Predict(InvoiceExtractionSignature)

    def forward(self, invoice_text: str) -> dspy.Prediction:
        """Run extraction on raw invoice text and return validated InvoiceData."""
        return self.predictor(invoice_text=invoice_text)


def create_invoice_processor() -> InvoiceProcessor:
    """Initialize the LLM router and return a configured InvoiceProcessor."""
    get_configured_lm()
    return InvoiceProcessor()
