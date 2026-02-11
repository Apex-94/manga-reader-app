from urllib.parse import urlsplit

import asyncio
import json

import httpx
from fastapi import APIRouter, HTTPException, Query, Response
from sqlmodel import Session, select

from app.api.manga import _pick_source
from app.db.database import engine
from app.db.models import Setting
from app.services.image_cache import DiskImageCache, build_default_cache_dir

router = APIRouter()

image_cache = DiskImageCache(build_default_cache_dir())


def _get_cache_settings() -> tuple[bool, int, int]:
    enabled = True
    max_bytes = 536870912
    ttl_hours = 720
    keys = {
        "images.cache.enabled",
        "images.cache.max_bytes",
        "images.cache.ttl_hours",
    }

    with Session(engine) as db:
        rows = db.exec(select(Setting).where(Setting.key.in_(list(keys)))).all()

    for row in rows:
        try:
            parsed = json.loads(row.value)
        except Exception:
            parsed = row.value

        if row.key == "images.cache.enabled":
            enabled = bool(parsed)
        elif row.key == "images.cache.max_bytes":
            max_bytes = int(parsed)
        elif row.key == "images.cache.ttl_hours":
            ttl_hours = int(parsed)

    return enabled, max_bytes, ttl_hours


def _build_referer_candidates(url: str, source_referer: str | None) -> list[str]:
    candidates: list[str] = []

    if source_referer:
        candidates.append(source_referer)

    parent = url.rsplit("/", 1)[0] + "/"
    candidates.append(parent)

    parsed = urlsplit(url)
    if parsed.scheme and parsed.netloc:
        candidates.append(f"{parsed.scheme}://{parsed.netloc}/")

    deduped: list[str] = []
    seen = set()
    for item in candidates:
        if item and item not in seen:
            deduped.append(item)
            seen.add(item)
    return deduped


@router.get("/proxy")
async def proxy_image(
    url: str = Query(..., description="Absolute URL of the image to proxy"),
    source: str | None = Query(
        None, description="Identifier of the source (name:lang) to get headers from"
    ),
    cache: bool = Query(False, description="Enable backend disk cache for this image"),
):
    """
    Proxy an image request through the backend to attach correct headers (Referer, User-Agent).
    """
    enabled, max_bytes, ttl_hours = _get_cache_settings()
    use_cache = cache and enabled and max_bytes > 0 and ttl_hours > 0

    if use_cache:
        cached = image_cache.get(url=url, source=source, ttl_hours=ttl_hours)
        if cached:
            return Response(
                content=cached.content,
                media_type=cached.content_type,
                headers={
                    "Cache-Control": "public, max-age=86400",
                    "Content-Disposition": "inline",
                    "X-Image-Cache": "HIT",
                },
            )

    try:
        user_agent = (
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
        )
        source_referer = None

        if source:
            try:
                scraper = _pick_source(source)
                user_agent = scraper.client.headers.get("User-Agent") or user_agent
                if getattr(scraper, "base_urls", None):
                    source_referer = scraper.base_urls[0]
            except HTTPException:
                source_referer = None

        referer_candidates = _build_referer_candidates(url, source_referer)

        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            last_error: Exception | None = None

            for referer in referer_candidates:
                headers = {
                    "User-Agent": user_agent,
                    "Accept-Encoding": "gzip, deflate",
                    "Referer": referer,
                }

                for _ in range(2):
                    try:
                        response = await client.get(url, headers=headers)
                        if response.status_code == 403:
                            last_error = HTTPException(status_code=403, detail="Forbidden by source")
                            await asyncio.sleep(0.2)
                            break

                        response.raise_for_status()
                        content = response.content
                        media_type = response.headers.get("content-type", "image/jpeg")

                        if use_cache:
                            image_cache.put(
                                url=url,
                                source=source,
                                content=content,
                                content_type=media_type,
                                max_bytes=max_bytes,
                                ttl_hours=ttl_hours,
                            )

                        return Response(
                            content=content,
                            media_type=media_type,
                            headers={
                                "Cache-Control": "public, max-age=86400",
                                "Content-Disposition": "inline",
                                "X-Image-Cache": "MISS",
                            },
                        )
                    except (httpx.TimeoutException, httpx.ConnectError) as exc:
                        last_error = exc
                        await asyncio.sleep(0.2)
                        continue
                    except httpx.HTTPStatusError as exc:
                        last_error = exc
                        if exc.response.status_code == 403:
                            await asyncio.sleep(0.2)
                            break
                        raise HTTPException(status_code=exc.response.status_code, detail="Failed to fetch image from source")

            if isinstance(last_error, HTTPException):
                raise HTTPException(status_code=last_error.status_code, detail=last_error.detail)
            if isinstance(last_error, (httpx.TimeoutException, httpx.ConnectError)):
                raise HTTPException(status_code=504, detail="Image request timeout after retries")
            if last_error:
                raise HTTPException(status_code=502, detail=f"Failed to fetch image: {str(last_error)}")

            raise HTTPException(status_code=502, detail="Failed to fetch image from source")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Proxy error: {str(e)}")
