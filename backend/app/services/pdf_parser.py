"""PDF highlight extraction using PyMuPDF."""

import fitz  # PyMuPDF
from typing import List
from io import BytesIO

from app.models.schemas import HighlightedField


async def extract_pdf_highlights(content: bytes) -> List[HighlightedField]:
    """
    Extract yellow highlighted text from a PDF document.

    Args:
        content: PDF file content as bytes

    Returns:
        List of highlighted fields with their text and location
    """
    highlights: List[HighlightedField] = []

    try:
        # Open PDF from bytes
        doc = fitz.open(stream=content, filetype="pdf")

        for page_num, page in enumerate(doc):
            # Get all annotations on the page
            annotations = page.annots()

            if annotations:
                for annot in annotations:
                    # Check if it's a highlight annotation
                    if annot.type[0] == 8:  # Highlight annotation type
                        # Get the highlight color
                        color = annot.colors.get("stroke", [1, 1, 0])

                        # Check for yellow highlight (RGB close to 1, 1, 0)
                        if _is_yellow(color):
                            # Get text within the highlight rectangle
                            rect = annot.rect
                            text = page.get_text("text", clip=rect).strip()

                            if text:
                                highlights.append(
                                    HighlightedField(
                                        id=f"field_{page_num}_{len(highlights)}",
                                        original_text=text,
                                        page=page_num + 1,
                                        rect={
                                            "x0": rect.x0,
                                            "y0": rect.y0,
                                            "x1": rect.x1,
                                            "y1": rect.y1,
                                        },
                                    )
                                )

        doc.close()

    except Exception as e:
        raise Exception(f"Failed to parse PDF: {e}")

    return highlights


def _is_yellow(color: List[float], tolerance: float = 0.3) -> bool:
    """Check if a color is approximately yellow."""
    if len(color) < 3:
        return False
    r, g, b = color[:3]
    # Yellow is high red, high green, low blue
    return r > 0.7 and g > 0.7 and b < tolerance
