# app/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.extensions.loader import initialize_extensions

from app.api import manga, sources
app = FastAPI()



def create_app() -> FastAPI:
    """
    Construct the FastAPI application and register API routes.

    The extension system is initialized at startup to load all available
    scrapers from the `app.extensions` package. Routers for manga and
    source endpoints are included under the `/api/v1` prefix.
    """
    app = FastAPI(
        title="Manga Reader API",
        description=(
            "A lightweight API that exposes manga scraping endpoints "
            "through a pluggable extension system."
        ),
        version="1.0.0",
    )

    # Configure CORS
    allowed = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in allowed if o.strip()],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # load all extensions at application startup
    initialize_extensions()
    # register routers
    app.include_router(manga.router, prefix="/api/v1/manga", tags=["manga"])
    app.include_router(sources.router, prefix="/api/v1/sources", tags=["sources"])
    
    from app.api import library
    app.include_router(library.router, prefix="/api/v1/library", tags=["library"])

    @app.get("/")
    async def root():
        return {"message": "Welcome to the Manga Reader API"}

    return app


# instantiate the app for ASGI servers
app = create_app()
