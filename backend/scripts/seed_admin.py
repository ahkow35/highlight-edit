#!/usr/bin/env python
"""One-time script to grant admin status to the configured admin user."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.db.database import SessionLocal
from app.models.sql import User
from app.config import settings


def seed_admin():
    if not settings.admin_email:
        print("ERROR: ADMIN_EMAIL env var not set", file=sys.stderr)
        sys.exit(1)

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == settings.admin_email).first()
        if not user:
            print(f"ERROR: User {settings.admin_email} not found", file=sys.stderr)
            sys.exit(1)
        user.is_admin = True
        db.commit()
        print(f"OK: {settings.admin_email} is now an admin")
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
