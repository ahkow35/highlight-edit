from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, date
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_paid = Column(Boolean, default=False)
    usage_count = Column(Integer, default=0)  # Daily generation count
    template_count = Column(Integer, default=0)  # Number of templates saved (free tier limit: 1)
    last_reset_date = Column(Date, default=date.today)  # Date of last counter reset
    created_at = Column(DateTime, default=datetime.utcnow)

    templates = relationship("Template", back_populates="owner")

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
