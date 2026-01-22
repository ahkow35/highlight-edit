"""Document upload and processing endpoints."""

from fastapi import APIRouter, File, UploadFile, HTTPException
from typing import List

from app.models.schemas import (
    DocumentUploadResponse,
    HighlightedField,
    DocumentGenerateRequest,
)
from app.services.pdf_parser import extract_pdf_highlights
from app.services.docx_parser import extract_docx_highlights

router = APIRouter()


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a PDF or DOCX file and extract highlighted sections.
    Returns a list of editable fields for each highlighted section.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    filename_lower = file.filename.lower()
    content = await file.read()

    try:
        if filename_lower.endswith(".pdf"):
            highlights = await extract_pdf_highlights(content)
        elif filename_lower.endswith(".docx"):
            highlights = await extract_docx_highlights(content)
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type. Only PDF and DOCX are supported.",
            )

        return DocumentUploadResponse(
            document_id="temp-id",  # TODO: Generate unique ID
            filename=file.filename,
            highlights=highlights,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {e}")


@router.post("/generate")
async def generate_document(request: DocumentGenerateRequest):
    """
    Generate a clean document with user-provided values replacing highlights.
    """
    # TODO: Implement document generation
    return {"message": "Document generation not yet implemented"}
