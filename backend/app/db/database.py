from sqlmodel import create_engine, Session, SQLModel
from pathlib import Path
import os

# Database file path - use data directory for desktop app
DATA_DIR = os.getenv("DATA_DIR", "./data")
DB_PATH = Path(DATA_DIR) / "pyyomi.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

# Create engine
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})


def get_session() -> Session:
    """Dependency to get database session."""
    return Session(engine)


def init_db():
    """Initialize the database and create all tables."""
    SQLModel.metadata.create_all(bind=engine)
