# app/main.py
import os
import sys
import argparse
import logging
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.extensions.loader import initialize_extensions
# from app.scheduler import scheduler_service

from app.api import manga_router, sources_router, proxy_router, reader_router, categories_router, history_router

# Global data directory that can be set via command line or environment
DATA_DIR = os.environ.get("PYYOMI_DATA_DIR", "./data")

def setup_logging(data_dir: str = "./data"):
    """Setup file logging for the backend."""
    # Create data directory if it doesn't exist
    os.makedirs(data_dir, exist_ok=True)
    
    log_file = os.path.join(data_dir, "backend.log")
    
    # Create logger
    logger = logging.getLogger("backend")
    logger.setLevel(logging.INFO)
    
    # File handler
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_handler.setLevel(logging.INFO)
    
    # Console handler (to also show in terminal)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    
    # Formatter
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # Add handlers (avoid duplicates)
    if not logger.handlers:
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
    
    # Log startup message
    logger.info(f"{'='*50}")
    logger.info(f"Backend started")
    logger.info(f"Data directory: {data_dir}")
    logger.info(f"Log file: {log_file}")
    logger.info(f"{'='*50}")
    
    return logger

# Only parse arguments when running directly (not when imported by uvicorn)
if __name__ != "__main__":
    # When imported by uvicorn, use environment variable or default
    args = type('Args', (), {'data_dir': DATA_DIR, 'port': 8000})()
else:
    # Parse command line arguments when running directly
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--data-dir", type=str, default="./data")
    args = parser.parse_args()

# Setup logging with data directory
logger = setup_logging(args.data_dir)

app = FastAPI()


def create_app() -> FastAPI:
    """
    Construct the FastAPI application and register API routes.

    The extension system is initialized at startup to load all available
    scrapers from the `app.extensions` package. Routers for manga and
    source endpoints are included under the `/api/v1` prefix.
    """
    app = FastAPI(
        title="PyYomi API",
        description=(
            "A lightweight API that exposes manga scraping endpoints "
            "through a pluggable extension system."
        ),
        version="1.0.0",
    )

    # Configure CORS
    allowed = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://tauri.localhost,https://tauri.localhost").split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in allowed if o.strip()],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Initialize database
    from app.db.database import init_db
    from app.db.migrations import migrate_from_json
    init_db()
    migrate_from_json()

    # load all extensions at application startup
    initialize_extensions()
    # register routers
    app.include_router(manga_router, prefix="/api/v1/manga", tags=["manga"])
    app.include_router(sources_router, prefix="/api/v1/sources", tags=["sources"])
    app.include_router(proxy_router, prefix="/api/v1", tags=["proxy"])
    app.include_router(categories_router, prefix="/api/v1/categories", tags=["categories"])
    app.include_router(history_router, prefix="/api/v1/history", tags=["history"])
    
    from app.api import library_router
    from app.api.scheduler import router as scheduler_router
    app.include_router(library_router, prefix="/api/v1/library", tags=["library"])
    app.include_router(reader_router, prefix="/api/v1/reader", tags=["reader"])
    app.include_router(scheduler_router, prefix="/api/v1/scheduler", tags=["scheduler"])

    # # Scheduler startup and shutdown events
    # @app.on_event("startup")
    # async def startup_event():
    #     scheduler_service.start()
    #     logger.info("Scheduler service started")
    
    # @app.on_event("shutdown")
    # async def shutdown_event():
    #     scheduler_service.shutdown()
    #     logger.info("Scheduler service stopped")
    
    @app.get("/")
    async def root():
        return {"message": "Welcome to the PyYomi API"}
    
    @app.get("/health")
    async def health():
        return {"status": "healthy"}

    return app


# instantiate the app for ASGI servers
app = create_app()
