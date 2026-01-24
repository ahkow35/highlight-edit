# =============================================================================
# Highlight Edit - Unified Docker Image
# =============================================================================
# Multi-stage build: Builds frontend, then combines with backend
# Usage:
#   docker build -t highlight-edit .
#   docker run -p 8000:8000 -v highlight-data:/data highlight-edit
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build Frontend
# -----------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# Copy package files first for better caching
COPY frontend/package*.json ./
RUN npm ci

# Copy source and build
COPY frontend/ ./

# Build arg for API URL (empty = same origin, i.e., /api)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Production Image with Backend + Frontend
# -----------------------------------------------------------------------------
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for document processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libreoffice-writer \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/ .

# Copy built frontend from Stage 1 into static folder
COPY --from=frontend-builder /frontend/dist /app/static

# Create data directory for SQLite persistence
RUN mkdir -p /data

# Environment variables with sensible defaults
ENV DATABASE_PATH=/data/sql_app.db
ENV SECRET_KEY=change-me-in-production
ENV BETA_INVITE_CODE=I-LOVE-NYAN-CAT
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Run with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
