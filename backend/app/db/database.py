from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Database path from environment, defaulting to local
# Production: mount volume at /data and set DATABASE_PATH=/data/sql_app.db
DATABASE_PATH = os.getenv("DATABASE_PATH", "./data/sql_app.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
