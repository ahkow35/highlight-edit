"""Admin API endpoints for user management."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.db.database import get_db
from app.api.deps import get_current_admin_user
from app.models.sql import User

router = APIRouter()


class UserAdminResponse(BaseModel):
    id: int
    email: str
    is_paid: bool
    created_at: datetime
    usage_count: int
    
    class Config:
        from_attributes = True


@router.get("/users", response_model=List[UserAdminResponse])
async def list_all_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    List all users in the system (admin only).
    """
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users


@router.patch("/users/{user_id}/toggle-pro")
async def toggle_user_pro_status(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Toggle the is_paid (Pro) status for a user (admin only).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Toggle the is_paid status
    user.is_paid = not user.is_paid
    db.commit()
    db.refresh(user)
    
    return {
        "message": f"User {user.email} is now {'Pro' if user.is_paid else 'Free'}",
        "user_id": user.id,
        "is_paid": user.is_paid
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Delete a user from the system (admin only).
    Cannot delete self.
    """
    if user_id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    email = user.email
    db.delete(user)
    db.commit()
    
    return {"message": f"User {email} deleted successfully"}
