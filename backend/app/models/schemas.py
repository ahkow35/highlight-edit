"""Pydantic schemas for API requests and responses."""

from pydantic import BaseModel
from typing import List, Dict, Optional, Any


class HighlightedField(BaseModel):
    """A highlighted field extracted from a document."""

    id: str
    original_text: str
    page: Optional[int] = None  # For PDFs
    paragraph: Optional[int] = None  # For DOCX
    run_index: Optional[int] = None  # For DOCX
    rect: Optional[Dict[str, float]] = None  # For PDFs (bounding box)
    new_value: Optional[str] = None  # User-provided replacement value


class DocumentUploadResponse(BaseModel):
    """Response after uploading a document."""

    document_id: str
    filename: str
    highlights: List[HighlightedField]


class FieldUpdate(BaseModel):
    """A single field value update."""

    field_id: str
    new_value: str


class DocumentGenerateRequest(BaseModel):
    """Request to generate a document with replaced values."""

    document_id: str
    field_updates: List[FieldUpdate]


from datetime import datetime

# --- Auth Schemas ---

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str
    invite_code: str  # Required for beta signup

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_paid: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


# --- Template Schemas ---

class TemplateSaveRequest(BaseModel):
    name: str
    file_path: str
    fields_data: List[Dict[str, Any]]

class TemplateResponse(BaseModel):
    id: int
    name: str
    file_path: str
    fields_data: Any  # JSON data - can be a list or string depending on SQLite handling
    created_at: datetime
    
    class Config:
        from_attributes = True
