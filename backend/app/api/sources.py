from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os

from app.extensions.loader import registry, initialize_extensions

router = APIRouter()

# Use data directory based on environment or default
DATA_DIR = os.environ.get("PYYOMI_DATA_DIR", "./data")
LOG_FILE = os.path.join(DATA_DIR, "backend.log")


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


@router.get("/logs")
async def get_logs():
    """
    Get backend logs from the log file.

    Returns the contents of the backend log file for debugging.
    """
    try:
        if os.path.exists(LOG_FILE):
            with open(LOG_FILE, 'r') as f:
                content = f.read()
            return {"logs": content, "exists": True}
        else:
            return {"logs": "", "exists": False, "message": "Log file not found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
