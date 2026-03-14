#!/usr/bin/env python
"""One-time script to grant admin status to the configured admin user."""
import sys
import os
import logging
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.db.database import SessionLocal
from app.models.sql import User
from app.config import settings

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def seed_admin():
    if not settings.admin_email:
        logger.error("ADMIN_EMAIL env var not set")
        sys.exit(1)

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == settings.admin_email).first()
        if not user:
            logger.error("User %s not found", settings.admin_email)
            sys.exit(1)
        user.is_admin = True
        db.commit()
        logger.info("User %s is now an admin", settings.admin_email)
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
