"""
API routes for inspecting and reloading available manga sources.

These endpoints expose information about loaded extension modules and
provide a mechanism to reload them without restarting the application.
"""

from fastapi import APIRouter

from app.extensions.loader import registry, initialize_extensions

router = APIRouter()


@router.get("")
async def list_sources():
    """
    List all loaded sources and any errors encountered during loading.

    The returned list contains objects with an identifier, human-readable
    name, language and version. Load errors are keyed by module name.
    """
    return {"sources": registry.list_sources(), "load_errors": registry.list_errors()}


@router.post("/reload")
async def reload_sources():
    """
    Reload all source extensions from disk.

    Calling this endpoint re-runs the discovery logic in `initialize_extensions`
    which scans the `app.extensions` package for scrapers. Any newly added
    modules become available immediately.
    """
    initialize_extensions()
    return {
        "ok": True,
        "sources": registry.list_sources(),
        "load_errors": registry.list_errors(),
    }
