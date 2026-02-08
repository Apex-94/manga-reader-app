# app/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.extensions.loader import initialize_extensions
# from app.scheduler import scheduler_service

from app.api import manga_router, sources_router, proxy_router, reader_router, categories_router, history_router
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
    allowed = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:5175").split(",")
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
    #     print("Scheduler service started")
    
    # @app.on_event("shutdown")
    # async def shutdown_event():
    #     scheduler_service.shutdown()
    #     print("Scheduler service stopped")
    
    @app.get("/")
    async def root():
        return {"message": "Welcome to the PyYomi API"}
    
    @app.get("/health")
    async def health():
        return {"status": "healthy"}

    return app


# instantiate the app for ASGI servers
app = create_app()
