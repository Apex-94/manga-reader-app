"""
API routes for interacting with manga sources via the extension system.

All operations are delegated to scraper implementations loaded at runtime
from the `app.extensions` package. A source is selected by its key
(`name:language`) or defaults to `mangahere:en` if unspecified.
"""

from fastapi import APIRouter, HTTPException, Query

from app.extensions.loader import registry

router = APIRouter()


def _pick_source(source_key: str | None):
    """
    Retrieve a loaded source by its key.

    If no key is provided, the globally active source is used. This function
    is resilient to missing language suffixes (e.g., "mangahere" will match
    "mangahere:en"). If the requested source is not available, a 404 error
    is raised.
    """
    # Use provided key or global active key or fallback
    query_key = (source_key or registry.get_active_source_key() or "mangahere:en").lower()
    
    # 1. Direct match (e.g., "mangakatana:en")
    if query_key in registry._sources:
        return registry.get(query_key)
        
    # 2. Try adding :en if no colon present (e.g., "mangakatana" -> "mangakatana:en")
    if ":" not in query_key:
        en_key = f"{query_key}:en"
        if en_key in registry._sources:
            return registry.get(en_key)
            
    # 3. Match by name only (take first available language, e.g., "mangakatana")
    prefix = f"{query_key}:"
    for k in registry._sources:
        if k.startswith(prefix):
            return registry.get(k)
            
    raise HTTPException(status_code=404, detail=f"Source {query_key} not found")


@router.get("/search")
async def search(
    q: str = Query(..., description="Search query string"),
    page: int = Query(1, ge=1, description="Result page number"),
    source: str | None = Query(
        None, description="Identifier of the source to query (name:lang)"
    ),
):
    """
    Search for manga titles across a specific source.

    Returns a list of manga cards containing the title, URL, thumbnail and
    source identifier. If the query yields no results an empty list is
    returned.
    """
    scraper = _pick_source(source)
    results = await scraper.search(q, page)
    return {"results": [c.__dict__ for c in results], "page": page}


@router.get("/popular")
async def popular(
    page: int = Query(1, ge=1, description="Result page number"),
    source: str | None = Query(
        None, description="Identifier of the source to query (name:lang)"
    ),
):
    """
    Return a list of popular manga from a specific source.

    Some sites might not support popularity rankings; in that case the list
    may be empty or fallback to an alternative list.
    """
    scraper = _pick_source(source)
    results = await scraper.popular(page)
    return {"results": [c.__dict__ for c in results], "page": page}


@router.get("/latest")
async def latest(
    page: int = Query(1, ge=1, description="Result page number"),
    source: str | None = Query(
        None, description="Identifier of the source to query (name:lang)"
    ),
):
    """
    Return the most recently updated manga from a source.

    Many sites expose a feed of latest updates which this endpoint
    surfaces via the extension system.
    """
    scraper = _pick_source(source)
    results = await scraper.latest(page)
    return {"results": [c.__dict__ for c in results], "page": page}


@router.get("/details")
async def details(
    url: str = Query(..., description="Absolute URL of the manga to fetch"),
    source: str | None = Query(
        None, description="Identifier of the source to query (name:lang)"
    ),
):
    """
    Fetch metadata for a single manga from the underlying source.

    The URL must point at a manga detail page on the source website.
    """
    scraper = _pick_source(source)
    detail = await scraper.details(url)
    return detail.__dict__


@router.get("/chapters")
async def chapters(
    url: str = Query(
        ..., description="Absolute URL of the manga to fetch chapters for"
    ),
    source: str | None = Query(
        None, description="Identifier of the source to query (name:lang)"
    ),
):
    """
    Retrieve the chapter list for a manga.

    Chapters are returned in ascending order. Each entry contains a title,
    absolute URL and optional chapter number.
    """
    scraper = _pick_source(source)
    chapters = await scraper.chapters(url)
    return {"chapters": [c.__dict__ for c in chapters]}


@router.get("/pages")
async def pages(
    chapter_url: str = Query(
        ..., description="Absolute URL of the chapter to fetch pages for"
    ),
    source: str | None = Query(
        None, description="Identifier of the source to query (name:lang)"
    ),
):
    """
    Retrieve the list of image URLs for a specific chapter.

    Pages are returned as a list of strings representing absolute image URLs.
    """
    scraper = _pick_source(source)
    pages = await scraper.pages(chapter_url)
    return {"pages": pages}
@router.get("/resolve")
async def resolve(
    url: str = Query(..., description="Absolute URL of the page/image to resolve"),
    source: str | None = Query(
        None, description="Identifier of the source to query (name:lang)"
    ),
):
    """
    Resolve a lazy-loaded page URL to its actual image source.

    If the URL is already an image, it is returned as-is. If it is an HTML page,
    the scraper will attempt to extract the main image.
    """
    scraper = _pick_source(source)
    image_url = await scraper.resolve_image(url)
    return {"url": image_url}
