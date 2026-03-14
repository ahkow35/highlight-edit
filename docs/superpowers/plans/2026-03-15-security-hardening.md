# Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical and high-priority security and infrastructure issues identified in the code review.

**Architecture:** Seven discrete tasks addressing credentials exposure, CORS misconfiguration, password reset security, database migrations, structured logging, role-based admin access, and httpOnly JWT cookies. Tasks 1–6 are backend-only. Task 7 touches both backend and frontend.

**Tech Stack:** FastAPI, SQLAlchemy 2.0, Alembic, Python `logging`, python-jose, aiosmtplib (new), React 18 + TypeScript, Axios

---

## Chunk 1: Credentials, CORS, and Logging

---

### Task 1: Scrub Exposed Credentials from `.env.example`

**Files:**
- Modify: `.env.example`

**Why:** Real-looking Adobe credentials are committed in `.env.example`. Rotate them externally, then replace with safe placeholder text.

- [ ] **Step 1: Replace real-looking credentials with placeholders**

Open `.env.example` and replace the real-looking credential values with:
```
ADOBE_CLIENT_ID=your-adobe-client-id-here
ADOBE_CLIENT_SECRET=your-adobe-client-secret-here
```

> ⚠️ **External action required first:** Rotate the actual credentials in your Adobe Developer Console before committing this change.

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "security: replace exposed Adobe credentials with placeholders in .env.example"
```

---

### Task 2: Fix CORS Wildcard

**Files:**
- Modify: `backend/app/main.py`
- Modify: `backend/app/config.py`

**Why:** `allow_origins=["*"]` allows any domain to make credentialed requests to the API.

- [ ] **Step 1: Add ALLOWED_ORIGINS to config**

In `backend/app/config.py`, add inside the `Settings` class:
```python
# CORS
allowed_origins: str = "http://localhost:5173"
```

- [ ] **Step 2: Update CORS middleware in main.py**

Replace:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
With:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.allowed_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

- [ ] **Step 3: Update `.env.example` with production guidance**

Add to `.env.example`:
```
# Comma-separated list of allowed frontend origins
ALLOWED_ORIGINS=http://localhost:5173
# Production example: ALLOWED_ORIGINS=https://app.yourdomain.com
```

- [ ] **Step 4: Verify the app starts and rejects requests from unlisted origins**

```bash
cd backend && uvicorn app.main:app --reload
# In another terminal:
curl -H "Origin: http://evil.com" -I http://localhost:8000/health
# Expected: No Access-Control-Allow-Origin header for evil.com
```

- [ ] **Step 5: Commit**

```bash
git add backend/app/main.py backend/app/config.py .env.example
git commit -m "security: restrict CORS to configured allowed origins"
```

---

### Task 3: Replace print() with Structured Logging

**Files:**
- Create: `backend/app/logging_config.py`
- Modify: `backend/app/main.py`
- Modify: `backend/app/services/template_creator.py`
- Modify: `backend/app/services/pdf_converter.py`

**Why:** `print()` has no log levels, no timestamps, no structured output. The Python `logging` module gives you all of this for free and integrates with log aggregators later.

- [ ] **Step 1: Create logging_config.py**

```python
# backend/app/logging_config.py
"""Centralized logging configuration."""

import logging
import sys


def configure_logging(debug: bool = False) -> None:
    """Configure application-wide logging."""
    level = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(
        stream=sys.stdout,
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    # Silence noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
```

- [ ] **Step 2: Initialize logging in main.py**

Add at the top of `backend/app/main.py` (after imports):
```python
from app.logging_config import configure_logging
configure_logging(debug=settings.debug)
```

Also add the settings import if not already present:
```python
from app.config import settings
```

- [ ] **Step 3: Replace print() in template_creator.py**

At the top of the file, add:
```python
import logging
logger = logging.getLogger(__name__)
```

Find every `print(...)` call and replace with the appropriate log level:
- Debug/trace info → `logger.debug(...)`
- Normal operational info → `logger.info(...)`
- Warnings → `logger.warning(...)`
- Errors → `logger.error(...)`

Example replacement:
```python
# Before
print(f"[DEBUG] Processing document: {filename}", flush=True)

# After
logger.debug("Processing document: %s", filename)
```

- [ ] **Step 4: Replace print() in pdf_converter.py**

Same pattern as Step 3:
```python
import logging
logger = logging.getLogger(__name__)
```
Replace all `print()` calls with appropriate `logger.*()` calls.

- [ ] **Step 5: Verify logging output on app start**

```bash
cd backend && uvicorn app.main:app --reload
# Expected: structured log lines like:
# 2026-03-15T10:00:00 [INFO] app.main: Application startup complete
```

- [ ] **Step 6: Commit**

```bash
git add backend/app/logging_config.py backend/app/main.py \
        backend/app/services/template_creator.py \
        backend/app/services/pdf_converter.py
git commit -m "infra: replace print() with structured logging module"
```

---

## Chunk 2: Database Migrations and Admin Role

---

### Task 4: Set Up Alembic for Database Migrations

**Files:**
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/versions/` (directory, Alembic populates this)

**Why:** `Base.metadata.create_all()` cannot handle column additions, renames, or removals on an existing database. Every future schema change needs Alembic.

- [ ] **Step 1: Install Alembic**

```bash
cd backend
pip install alembic
# Add to requirements.txt:
echo "alembic>=1.13.0" >> requirements.txt
```

- [ ] **Step 2: Initialize Alembic**

```bash
cd backend
alembic init alembic
```

This creates `alembic.ini` and the `alembic/` directory.

- [ ] **Step 3: Configure alembic/env.py to use the app's models**

Replace the `run_migrations_online` section in `backend/alembic/env.py`:

```python
# alembic/env.py
import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Make sure the app is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.db.database import Base
from app.models import sql  # noqa: F401 — import models so metadata is populated
from app.config import settings

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url():
    db_path = os.environ.get("DATABASE_PATH", "./data/sql_app.db")
    return f"sqlite:///{db_path}"


def run_migrations_offline() -> None:
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,  # required for SQLite column alterations
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,  # required for SQLite column alterations
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 4: Create the initial migration (baseline of existing schema)**

```bash
cd backend
alembic revision --autogenerate -m "initial_schema"
# Expected: alembic/versions/xxxx_initial_schema.py created
```

Review the generated file to make sure it captures all existing tables (users, templates, ip_usage, usage_events, template_drafts).

- [ ] **Step 5: Apply the baseline migration against a fresh DB to verify**

```bash
cd backend
DATABASE_PATH=./data/test_migrate.db alembic upgrade head
# Expected: "Running upgrade -> xxxx, initial_schema"
rm ./data/test_migrate.db
```

- [ ] **Step 6: Remove create_all from main.py**

In `backend/app/main.py`, remove:
```python
# Create tables
Base.metadata.create_all(bind=engine)
```

Add instead (so dev startup still works):
```python
# Run migrations on startup
from alembic.config import Config as AlembicConfig
from alembic import command as alembic_command

alembic_cfg = AlembicConfig(os.path.join(os.path.dirname(__file__), "..", "..", "alembic.ini"))
alembic_command.upgrade(alembic_cfg, "head")
```

- [ ] **Step 7: Commit**

```bash
git add backend/alembic.ini backend/alembic/ backend/requirements.txt backend/app/main.py
git commit -m "infra: add Alembic for database schema migrations"
```

---

### Task 5: Replace Hardcoded Admin Email with is_admin DB Column

**Files:**
- Modify: `backend/app/models/sql.py`
- Create: `backend/alembic/versions/xxxx_add_is_admin_to_users.py` (via autogenerate)
- Modify: `backend/app/api/deps.py`
- Modify: `backend/app/config.py`

**Why:** `if current_user.email == ADMIN_EMAIL` is fragile and hardcodes a personal email address. Admin status should be stored in the database and managed through a migration.

- [ ] **Step 1: Add is_admin column to User model**

In `backend/app/models/sql.py`, add to the `User` class:
```python
is_admin = Column(Boolean, default=False)
```

Full updated `User` class fields (in order):
```python
id = Column(Integer, primary_key=True, index=True)
email = Column(String, unique=True, index=True)
hashed_password = Column(String)
is_paid = Column(Boolean, default=False)
is_admin = Column(Boolean, default=False)   # <-- new
usage_count = Column(Integer, default=0)
template_count = Column(Integer, default=0)
last_reset_date = Column(Date, default=date.today)
created_at = Column(DateTime, default=datetime.utcnow)
```

- [ ] **Step 2: Generate and review the migration**

```bash
cd backend
alembic revision --autogenerate -m "add_is_admin_to_users"
# Expected: alembic/versions/xxxx_add_is_admin_to_users.py
```

Open the generated file. It should contain:
```python
op.add_column('users', sa.Column('is_admin', sa.Boolean(), nullable=True))
```

- [ ] **Step 3: Apply the migration**

```bash
cd backend
alembic upgrade head
# Expected: "Running upgrade xxxx -> yyyy, add_is_admin_to_users"
```

- [ ] **Step 4: Add ADMIN_EMAIL to config for the seeding script**

In `backend/app/config.py`, add to `Settings`:
```python
admin_email: str = ""  # Email of the initial admin user (used for seeding only)
```

- [ ] **Step 5: Create a seed script to grant admin to the first admin user**

Create `backend/scripts/seed_admin.py`:
```python
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
```

Run it once:
```bash
cd backend
ADMIN_EMAIL=nyanyk@gmail.com python scripts/seed_admin.py
# Expected: OK: nyanyk@gmail.com is now an admin
```

- [ ] **Step 6: Update deps.py to use is_admin column**

In `backend/app/api/deps.py`, replace:
```python
# Admin email for dashboard access
ADMIN_EMAIL = "nyanyk@gmail.com"

async def get_current_admin_user(current_user: Annotated[User, Depends(get_current_user)]):
    if current_user.email != ADMIN_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
```

With:
```python
async def get_current_admin_user(current_user: Annotated[User, Depends(get_current_user)]):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
```

- [ ] **Step 7: Update UserResponse schema to include is_admin**

In `backend/app/models/schemas.py`, find `UserResponse` and add:
```python
is_admin: bool = False
```

- [ ] **Step 8: Update frontend User type**

In `frontend/src/services/api.ts`, add `is_admin` to the `User` interface:
```typescript
export interface User {
    id: number;
    email: string;
    is_paid: boolean;
    is_admin: boolean;   // <-- add this
    created_at: string;
    usage_count: number;
}
```

- [ ] **Step 9: Test admin access**

```bash
# Start server
cd backend && uvicorn app.main:app --reload

# Login as admin user (replace with actual token)
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -d "username=nyanyk@gmail.com&password=YOUR_PASSWORD" | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Should succeed (200)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/admin/users

# Login as non-admin user and test
# Should return 403
```

- [ ] **Step 10: Commit**

```bash
git add backend/app/models/sql.py backend/app/api/deps.py \
        backend/app/models/schemas.py backend/app/config.py \
        backend/scripts/seed_admin.py \
        backend/alembic/versions/ \
        frontend/src/services/api.ts
git commit -m "security: replace hardcoded admin email with is_admin database column"
```

---

## Chunk 3: Password Reset and httpOnly Cookies

---

### Task 6: Fix Password Reset — Persist Tokens and Send Email

**Files:**
- Modify: `backend/app/models/sql.py` — add `PasswordResetToken` model
- Create: `backend/alembic/versions/xxxx_add_password_reset_tokens.py` (via autogenerate)
- Create: `backend/app/services/email_service.py`
- Modify: `backend/app/api/routes/auth.py`
- Modify: `backend/app/config.py`
- Modify: `.env.example`

**Why:** Current implementation generates a JWT reset token but never stores it — meaning the same token can be used multiple times, and tokens are never truly invalidated. Also, the token is returned directly in the API response instead of being emailed.

- [ ] **Step 1: Add PasswordResetToken model**

In `backend/app/models/sql.py`, add after the `TemplateDraft` class:
```python
class PasswordResetToken(Base):
    """One-time password reset tokens."""
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    token_hash = Column(String, unique=True, index=True)  # SHA-256 of the raw token
    expires_at = Column(DateTime)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

- [ ] **Step 2: Generate and apply the migration**

```bash
cd backend
alembic revision --autogenerate -m "add_password_reset_tokens"
alembic upgrade head
# Expected: table password_reset_tokens created
```

- [ ] **Step 3: Add email settings to config**

In `backend/app/config.py`, add to `Settings`:
```python
# Email (SMTP)
smtp_host: str = "smtp.gmail.com"
smtp_port: int = 587
smtp_username: str = ""
smtp_password: str = ""
smtp_from_email: str = ""
app_base_url: str = "http://localhost:5173"  # Used in reset link
```

Update `.env.example`:
```
# Email (SMTP) — required for password reset
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
APP_BASE_URL=https://app.yourdomain.com
```

- [ ] **Step 4: Add aiosmtplib to requirements**

```bash
echo "aiosmtplib>=3.0.0" >> backend/requirements.txt
pip install aiosmtplib
```

- [ ] **Step 5: Create email_service.py**

```python
# backend/app/services/email_service.py
"""Email sending service."""

import logging
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

logger = logging.getLogger(__name__)


async def send_password_reset_email(to_email: str, reset_token: str) -> None:
    """Send a password reset email with the reset link."""
    if not settings.smtp_username:
        logger.warning(
            "SMTP not configured — password reset token for %s: %s",
            to_email,
            reset_token,
        )
        return

    reset_url = f"{settings.app_base_url}/reset-password?token={reset_token}"

    message = MIMEMultipart("alternative")
    message["Subject"] = "Reset your HighlightEdit password"
    message["From"] = settings.smtp_from_email
    message["To"] = to_email

    text_body = f"Click the link to reset your password: {reset_url}\n\nThis link expires in 15 minutes."
    html_body = f"""
    <p>Click the button below to reset your password:</p>
    <p><a href="{reset_url}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;">Reset Password</a></p>
    <p>This link expires in 15 minutes. If you didn't request this, ignore this email.</p>
    """

    message.attach(MIMEText(text_body, "plain"))
    message.attach(MIMEText(html_body, "html"))

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_username,
            password=settings.smtp_password,
            start_tls=True,
        )
        logger.info("Password reset email sent to %s", to_email)
    except Exception as exc:
        logger.error("Failed to send password reset email to %s: %s", to_email, exc)
        raise
```

- [ ] **Step 6: Update auth.py — forgot_password endpoint**

Replace the entire `forgot_password` function:
```python
import hashlib
import secrets
from datetime import datetime, timedelta
from app.models.sql import PasswordResetToken
from app.services.email_service import send_password_reset_email

@router.post("/forgot-password")
async def forgot_password(request: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    # Always return 200 to prevent email enumeration
    if not user:
        return {"message": "If that email exists, a reset link has been sent."}

    # Generate a secure random token (not a JWT — just a random string)
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at = datetime.utcnow() + timedelta(minutes=15)

    # Invalidate any existing unused tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False,
    ).update({"used": True})

    # Store the hashed token
    reset_token_record = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(reset_token_record)
    db.commit()

    # Send email (async)
    await send_password_reset_email(user.email, raw_token)

    return {"message": "If that email exists, a reset link has been sent."}
```

- [ ] **Step 7: Update auth.py — reset_password endpoint**

Replace the entire `reset_password` function:
```python
@router.post("/reset-password")
def reset_password(request: PasswordResetConfirm, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(request.token.encode()).hexdigest()

    record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used == False,
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if record.expires_at < datetime.utcnow():
        record.used = True
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user.hashed_password = get_password_hash(request.new_password)
    record.used = True
    db.commit()

    return {"message": "Password updated successfully"}
```

- [ ] **Step 8: Update PasswordResetConfirm schema**

In `backend/app/models/schemas.py`, make sure `PasswordResetConfirm` uses `token` as a plain string (not a JWT):
```python
class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
```

- [ ] **Step 9: Test the full flow**

```bash
# 1. Request reset
curl -s -X POST http://localhost:8000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
# Expected: {"message": "If that email exists, a reset link has been sent."}
# If SMTP not configured, token appears in server logs

# 2. Copy token from logs, reset password
curl -s -X POST http://localhost:8000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "<token-from-logs>", "new_password": "NewPass123!"}'
# Expected: {"message": "Password updated successfully"}

# 3. Try reusing the same token
curl -s -X POST http://localhost:8000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "<same-token>", "new_password": "AnotherPass!"}'
# Expected: 400 "Invalid or expired reset token"
```

- [ ] **Step 10: Commit**

```bash
git add backend/app/models/sql.py backend/app/api/routes/auth.py \
        backend/app/services/email_service.py backend/app/config.py \
        backend/requirements.txt .env.example \
        backend/alembic/versions/
git commit -m "security: persist and invalidate password reset tokens, add email sending"
```

---

### Task 7: Move JWT from localStorage to httpOnly Cookie

**Files:**
- Modify: `backend/app/api/routes/auth.py` — set/clear cookie on login/logout
- Modify: `backend/app/api/deps.py` — read token from cookie instead of Bearer header
- Modify: `backend/app/main.py` — ensure CORS allows credentials
- Modify: `frontend/src/services/api.ts` — remove localStorage token, enable `withCredentials`
- Modify: `frontend/src/context/AuthContext.tsx` — remove localStorage reads/writes

**Why:** JWT in `localStorage` is accessible to any JavaScript on the page (XSS risk). `httpOnly` cookies are invisible to JavaScript and sent automatically by the browser.

> **Note:** This changes the auth transport from Bearer header to cookie. The `OAuth2PasswordBearer` dependency can still handle login form submission, but `get_current_user` will read from the cookie instead of the Authorization header.

- [ ] **Step 1: Update login endpoint to set httpOnly cookie**

In `backend/app/api/routes/auth.py`, update the login endpoint:

```python
from fastapi import Response

@router.post("/login")
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    response: Response,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    # Set httpOnly cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=not settings.debug,  # HTTPS only in production
        samesite="lax",
        max_age=settings.access_token_expire_minutes * 60,
    )

    track_event(db, "login", user_id=user.id)
    # Still return token for any existing Bearer-based clients (backward compat during migration)
    return {"access_token": access_token, "token_type": "bearer"}
```

- [ ] **Step 2: Add logout endpoint**

In `backend/app/api/routes/auth.py`, add:
```python
@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Logged out"}
```

- [ ] **Step 3: Update get_current_user in deps.py to read cookie**

Replace the `get_current_user` dependency:
```python
from fastapi import Cookie

async def get_current_user(
    db: Session = Depends(get_db),
    access_token: str | None = Cookie(default=None),
    authorization: str | None = None,  # fallback for Bearer header
):
    # Try cookie first, then Authorization header as fallback
    token = access_token
    if token is None and authorization and authorization.startswith("Bearer "):
        token = authorization[7:]

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if token is None:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
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
```

- [ ] **Step 4: Update frontend api.ts — enable withCredentials, remove Bearer header injection**

In `frontend/src/services/api.ts`:

Update the axios instance:
```typescript
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,  // <-- send cookies automatically
});
```

Remove the token injection from the request interceptor:
```typescript
// Remove this block entirely:
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, ...);

// Replace with (only log errors, no token injection):
api.interceptors.request.use(
    (config) => config,
    (error) => {
        console.error("Request Error:", error);
        return Promise.reject(error);
    }
);
```

Update `authApi.login` to no longer return the token to be stored (it will be in the cookie):
```typescript
async login(email: string, password: string): Promise<void> {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    await api.post('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    // Token is now in httpOnly cookie — nothing to store
},
```

Add a logout method:
```typescript
async logout(): Promise<void> {
    await api.post('/auth/logout');
},
```

- [ ] **Step 5: Update AuthContext.tsx — remove localStorage**

Replace the entire `AuthProvider`:
```typescript
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user on startup — cookie is sent automatically, just call /me
    useEffect(() => {
        const loadUser = async () => {
            try {
                const profile = await authApi.getMe();
                setUser(profile);
            } catch {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = async (email: string, pass: string) => {
        await authApi.login(email, pass);
        const profile = await authApi.getMe();
        setUser(profile);
    };

    const signup = async (email: string, pass: string, inviteCode: string) => {
        await authApi.signup(email, pass, inviteCode);
        await login(email, pass);
    };

    const logout = async () => {
        await authApi.logout();
        setUser(null);
    };

    const upgrade = async () => {
        if (!user) return;
        const updatedUser = await authApi.upgrade();
        setUser(updatedUser);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            signup,
            logout,
            upgrade,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
```

Note: `logout` is now `async` — update the `AuthContextType` interface accordingly:
```typescript
interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    signup: (email: string, pass: string, inviteCode: string) => Promise<void>;
    logout: () => Promise<void>;
    upgrade: () => Promise<void>;
}
```

- [ ] **Step 6: Update any components that call logout() to await it**

Search for `logout()` calls in the frontend:
```bash
grep -r "logout()" frontend/src --include="*.tsx" --include="*.ts" -n
```

Update each call site to `await logout()` or handle it as a Promise.

- [ ] **Step 7: Verify end-to-end auth flow**

```bash
# Start backend
cd backend && uvicorn app.main:app --reload

# Start frontend
cd frontend && npm run dev

# Manual test:
# 1. Open browser DevTools → Application → Cookies
# 2. Log in at http://localhost:5173
# 3. Verify: access_token cookie exists, HttpOnly=true, not visible in JS console
# 4. Verify: localStorage has NO 'token' key
# 5. Refresh page — verify user is still logged in (cookie persists)
# 6. Log out — verify cookie is cleared
# 7. Try accessing /api/auth/me directly — verify 401
```

- [ ] **Step 8: Commit**

```bash
git add backend/app/api/routes/auth.py backend/app/api/deps.py \
        frontend/src/services/api.ts frontend/src/context/AuthContext.tsx
git commit -m "security: move JWT auth from localStorage to httpOnly cookie"
```

---

## Summary of Changes

| Task | Files Touched | Risk |
|------|--------------|------|
| 1. Scrub credentials | `.env.example` | None |
| 2. Fix CORS | `main.py`, `config.py`, `.env.example` | Low |
| 3. Logging | `logging_config.py`, `main.py`, 2 service files | Low |
| 4. Alembic setup | `alembic/`, `requirements.txt`, `main.py` | Medium |
| 5. Admin role | `sql.py`, `deps.py`, `schemas.py`, migration | Medium |
| 6. Password reset | `sql.py`, `auth.py`, `email_service.py`, migration | Medium |
| 7. httpOnly cookie | `auth.py`, `deps.py`, `api.ts`, `AuthContext.tsx` | High |

**Recommended order:** 1 → 2 → 3 → 4 → 5 → 6 → 7

Complete Task 4 (Alembic) before Tasks 5 and 6, as those depend on migrations being in place.
