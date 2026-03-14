from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, date
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_paid = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    usage_count = Column(Integer, default=0)  # Daily generation count
    template_count = Column(Integer, default=0)  # Number of templates saved (free tier limit: 1)
    last_reset_date = Column(Date, default=date.today)  # Date of last counter reset
    created_at = Column(DateTime, default=datetime.utcnow)

    templates = relationship("Template", back_populates="owner")
    usage_events = relationship("UsageEvent", backref="user", lazy="dynamic")

class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    file_path = Column(String) # Path to the original file
    fields_data = Column(JSON) # Store fields configuration
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="templates")


class IPUsage(Base):
    """Track document generations by IP address for unauthenticated users."""
    __tablename__ = "ip_usage"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, index=True)
    usage_count = Column(Integer, default=0)
    last_reset_date = Column(Date, default=date.today)


class UsageEvent(Base):
    """Tracks every meaningful user action for analytics."""
    __tablename__ = "usage_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    event_type = Column(String, index=True)
    metadata_json = Column(JSON, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class TemplateDraft(Base):
    """Auto-saved form field drafts per user + template."""
    __tablename__ = "template_drafts"
    __table_args__ = (
        UniqueConstraint("user_id", "template_id", name="uq_user_template_draft"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    template_id = Column(String, index=True)  # template_file_path string
    field_data = Column(JSON)  # {"field_1": "John", "field_2": "2026-03-01"}
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
