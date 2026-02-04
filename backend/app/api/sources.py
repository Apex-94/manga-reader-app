from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.extensions.loader import registry, initialize_extensions

router = APIRouter()


class ActiveSourceUpdate(BaseModel):
    id: str


@router.get("")
async def list_sources():
    """
    List all loaded sources and any errors encountered during loading.

    The returned list contains objects with an identifier, human-readable
    name, language and version. Load errors are keyed by module name.
    """
    return {"sources": registry.list_sources(), "load_errors": registry.list_errors()}


@router.get("/active")
async def get_active_source():
    """Return metadata about the currently active source."""
    try:
        source = registry.get_active_source()
        return {
            "id": registry.get_active_source_key(),
            "name": source.name,
            "language": source.language,
            "version": getattr(source, "version", "1.0.0"),
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/active")
async def set_active_source(update: ActiveSourceUpdate):
    """Set the globally active source."""
    try:
        registry.set_active_source(update.id)
        return {"ok": True, "active_source": update.id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


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
