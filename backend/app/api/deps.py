from typing import Annotated
from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.config import settings
from app.db.database import get_db
from app.models.sql import User
from app.models.schemas import TokenData
from app.services.usage_tracker import track_event

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

def get_settings():
    return settings

async def get_current_user(
    db: Session = Depends(get_db),
    access_token: str | None = Cookie(default=None),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if access_token is None:
        raise credentials_exception

    try:
        payload = jwt.decode(access_token, settings.secret_key, algorithms=[settings.algorithm])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_paid_user(current_user: Annotated[User, Depends(get_current_user)]):
    if not current_user.is_paid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium subscription required"
        )
    return current_user


async def get_current_admin_user(current_user: Annotated[User, Depends(get_current_user)]):
    """Only users with is_admin=True can access admin endpoints."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# Constants for usage limits
ANONYMOUS_DAILY_LIMIT = 5  # Unauthenticated users
FREE_TIER_DAILY_LIMIT = 10  # Logged-in free users
FREE_TIER_TEMPLATE_LIMIT = 1  # Max templates free users can save


async def check_usage_limit(
    token: Annotated[str | None, Depends(oauth2_scheme_optional)],
    db: Session = Depends(get_db),
    request: "Request" = None  # Will be injected from the route
):
    """
    Check and enforce usage limits for document generation.
    - Unauthenticated users: ANONYMOUS_DAILY_LIMIT per day (tracked by IP)
    - Pro users: unlimited
    - Free users: FREE_TIER_DAILY_LIMIT per day
    """
    from datetime import date
    from fastapi import Request
    from app.models.sql import IPUsage
    
    today = date.today()
    
    # If no token provided, track by IP address
    if token is None:
        return None  # For now, allow unauthenticated - IP tracking needs Request object
    
    # Try to get user from token
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        email: str = payload.get("sub")
        if email is None:
            return None  # Invalid token, allow as unauthenticated
        current_user = db.query(User).filter(User.email == email).first()
        if current_user is None:
            return None  # User not found, allow as unauthenticated
    except JWTError:
        return None  # Invalid token, allow as unauthenticated
    
    # Pro users have unlimited access
    if current_user.is_paid:
        return current_user
    
    # Reset counter if last reset was not today
    if current_user.last_reset_date is None or current_user.last_reset_date < today:
        current_user.usage_count = 0
        current_user.last_reset_date = today
        db.commit()
    
    # Check if limit exceeded for free logged-in users
    if current_user.usage_count >= FREE_TIER_DAILY_LIMIT:
        track_event(db, "limit_hit", user_id=current_user.id, metadata={
            "limit_type": "monthly_docs",
        })
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Daily limit of {FREE_TIER_DAILY_LIMIT} document generations reached. Upgrade to Pro for unlimited access."
        )
    
    # Increment usage count
    current_user.usage_count += 1
    db.commit()
    
    return current_user


async def check_template_save_limit(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Check if user can save more templates.
    - Free users: max FREE_TIER_TEMPLATE_LIMIT templates
    - Pro users: unlimited
    """
    # Pro users have unlimited access
    if current_user.is_paid:
        return current_user
    
    # Count user's templates
    template_count = len(current_user.templates) if current_user.templates else 0
    
    if template_count >= FREE_TIER_TEMPLATE_LIMIT:
        track_event(db, "limit_hit", user_id=current_user.id, metadata={
            "limit_type": "template_save",
        })
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Free tier allows only {FREE_TIER_TEMPLATE_LIMIT} saved template(s). Upgrade to Pro for unlimited templates."
        )
    
    return current_user
