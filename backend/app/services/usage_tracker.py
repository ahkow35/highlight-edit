"""
Usage Tracker Service

Fire-and-forget event logging. Never raises — tracking failures
must not break the main request flow.
"""

import logging
from sqlalchemy.orm import Session
from typing import Optional

from app.models.sql import UsageEvent

logger = logging.getLogger(__name__)


def track_event(
    db: Session,
    event_type: str,
    user_id: Optional[int] = None,
    metadata: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """
    Log a usage event. Fire-and-forget.

    Args:
        db: SQLAlchemy session
        event_type: One of: signup, login, upload, template_create,
                    template_save, template_load, export_docx, export_pdf,
                    upgrade, limit_hit
        user_id: User ID (None for anonymous actions)
        metadata: Flexible JSON payload with event-specific details
        ip_address: Client IP address
        user_agent: Client User-Agent header
    """
    try:
        event = UsageEvent(
            user_id=user_id,
            event_type=event_type,
            metadata_json=metadata or {},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(event)
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to track event '{event_type}': {e}")
        try:
            db.rollback()
        except Exception:
            pass
