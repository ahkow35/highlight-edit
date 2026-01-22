"""Template creation and management API endpoints."""

import os
from typing import Dict, List, Optional
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, status
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.services.template_creator import create_template_async
from app.db.database import get_db
from app.api.deps import get_current_paid_user, check_usage_limit, check_template_save_limit, get_current_user
from app.models.sql import User, Template
from app.models.schemas import TemplateSaveRequest, TemplateResponse

router = APIRouter()

# Default output directory for templates
TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "templates")


class GenerateRequest(BaseModel):
    """Request body for document generation."""
    template_path: Optional[str] = None
    template_id: Optional[int] = None
    field_values: Dict[str, str]


@router.post("/create")
async def create_template_endpoint(file: UploadFile = File(...)):
    """
    Upload a DOCX or PDF file with yellow highlights to create a template.
    Public endpoint.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    filename_lower = file.filename.lower()
    
    # Validate file type
    if not (filename_lower.endswith(".docx") or filename_lower.endswith(".pdf")):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Only .docx and .pdf files are supported."
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Process the file and create template
        template_state = await create_template_async(
            file_content=content,
            filename=file.filename,
            output_dir=TEMPLATES_DIR,
        )
        
        # Return the template state as JSON
        return JSONResponse(content=template_state.to_dict())
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to process document: {str(e)}"
        )


@router.get("/", response_model=List[TemplateResponse])
def list_templates(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)  # Any authenticated user can view their templates
):
    """
    List templates saved by the current authenticated user.
    """
    return current_user.templates


@router.post("/save", response_model=TemplateResponse)
def save_template(
    template_data: TemplateSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_template_save_limit)  # Checks free tier limit (1 template)
):
    """
    Save a processed template to the user's library.
    Free users can save 1 template, Pro users get unlimited.
    """
    db_template = Template(
        name=template_data.name,
        file_path=template_data.file_path,
        fields_data=template_data.fields_data,
        user_id=current_user.id
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template


@router.delete("/{template_id}")
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Any authenticated user can delete their templates
):
    """
    Delete a template from the user's library.
    Only the owner can delete their templates.
    """
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.user_id == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db.delete(template)
    db.commit()
    return {"message": "Template deleted successfully"}


@router.post("/preview")
async def preview_document(request: GenerateRequest, db: Session = Depends(get_db)):
    """
    Generate a preview of the document with field values replaced.
    """
    return await _generate_document(request, db, is_preview=True)


@router.post("/generate")
async def generate_document(
    request: GenerateRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(check_usage_limit)  # Enforce usage limits
):
    """
    Generate the final document with field values replaced.
    Enforces daily usage limits for free tier users.
    """
    return await _generate_document(request, db, is_preview=False)


async def _generate_document(request: GenerateRequest, db: Session, is_preview: bool):
    """
    Internal function to generate a document with placeholders replaced.
    Resolves template_path from ID if provided.
    """
    from app.services.document_generator import generate_docx, get_output_filename
    
    template_path = request.template_path

    # If ID provided, look it up in DB
    if request.template_id:
        template = db.query(Template).filter(Template.id == request.template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        template_path = template.file_path

    if not template_path:
         raise HTTPException(status_code=400, detail="Either template_path or template_id must be provided")
    
    field_values = request.field_values
    
    # Validate template exists on disk
    if not os.path.exists(template_path):
        raise HTTPException(status_code=404, detail="Template file not found on server")
    
    try:
        if template_path.lower().endswith(".docx"):
            # Generate output path
            prefix = "preview_" if is_preview else "filled_"
            output_filename = get_output_filename(template_path, prefix)
            output_path = os.path.join(os.path.dirname(template_path), output_filename)
            
            # Generate document with the service
            generate_docx(template_path, field_values, output_path)
            
        elif template_path.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=501,
                detail="PDF generation not yet implemented. Please use DOCX files."
            )
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        # Return the generated file
        return FileResponse(
            path=output_path,
            filename=output_filename,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename={output_filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate document: {str(e)}"
        )
