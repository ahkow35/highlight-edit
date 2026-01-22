"""DOCX highlight extraction using python-docx."""

from typing import List
from io import BytesIO
from docx import Document
from docx.shared import RGBColor

from app.models.schemas import HighlightedField

# Word highlight color indices for yellow
YELLOW_HIGHLIGHT_INDICES = [7, 11]  # yellow and bright yellow


async def extract_docx_highlights(content: bytes) -> List[HighlightedField]:
    """
    Extract yellow highlighted text from a DOCX document.

    Args:
        content: DOCX file content as bytes

    Returns:
        List of highlighted fields with their text and location
    """
    highlights: List[HighlightedField] = []

    try:
        # Open DOCX from bytes
        doc = Document(BytesIO(content))

        for para_idx, paragraph in enumerate(doc.paragraphs):
            for run_idx, run in enumerate(paragraph.runs):
                # Check for highlight
                if run.font.highlight_color is not None:
                    # Check if it's a yellow highlight
                    highlight_color = run.font.highlight_color

                    if _is_yellow_highlight(highlight_color):
                        text = run.text.strip()

                        if text:
                            highlights.append(
                                HighlightedField(
                                    id=f"field_{para_idx}_{run_idx}",
                                    original_text=text,
                                    paragraph=para_idx + 1,
                                    run_index=run_idx,
                                )
                            )

    except Exception as e:
        raise Exception(f"Failed to parse DOCX: {e}")

    return highlights


def _is_yellow_highlight(color) -> bool:
    """Check if the highlight color is yellow."""
    if color is None:
        return False

    # Handle WD_COLOR_INDEX values
    if hasattr(color, "value"):
        return color.value in YELLOW_HIGHLIGHT_INDICES

    # Handle numeric values
    if isinstance(color, int):
        return color in YELLOW_HIGHLIGHT_INDICES

    return False
