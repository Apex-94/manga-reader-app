
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
import httpx
from app.api.manga import _pick_source
import asyncio

router = APIRouter()

@router.get("/proxy")
async def proxy_image(
    url: str = Query(..., description="Absolute URL of the image to proxy"),
    source: str | None = Query(
        None, description="Identifier of the source (name:lang) to get headers from"
    ),
):
    """
    Proxy an image request through the backend to attach correct headers (Referer, User-Agent).
    """
    try:
        # Build headers - use source-specific headers if available, otherwise use defaults
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
            ),
            "Accept-Encoding": "gzip, deflate"
        }
        
        # Try to get source-specific headers if source is provided
        if source:
            try:
                scraper = _pick_source(source)
                headers["User-Agent"] = scraper.client.headers.get("User-Agent") or headers["User-Agent"]
                headers["Referer"] = scraper.base_urls[0]
            except HTTPException:
                # Source not found, use default headers and try to infer referer from URL
                headers["Referer"] = url.rsplit('/', 1)[0] + "/"
        else:
            # No source provided, infer referer from URL
            headers["Referer"] = url.rsplit('/', 1)[0] + "/"

        # Retry logic for reliability
        max_retries = 3
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                    response = await client.get(url, headers=headers)
                    response.raise_for_status()
                    
                    return StreamingResponse(
                        iter([response.content]),
                        media_type=response.headers.get("content-type", "image/jpeg"),
                        headers={
                            "Cache-Control": "public, max-age=86400",
                            "Content-Disposition": "inline"
                        }
                    )
            except (httpx.TimeoutException, httpx.ConnectError) as e:
                if attempt < max_retries - 1:
                    await asyncio.sleep(1)  # Wait before retry
                    continue
                raise HTTPException(status_code=504, detail=f"Image request timeout after {max_retries} retries")
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 403:
                    # Try with different headers
                    headers["Referer"] = url.rsplit('/', 1)[0] + "/"
                    if attempt < max_retries - 1:
                        await asyncio.sleep(1)
                        continue
                raise HTTPException(status_code=e.response.status_code, detail="Failed to fetch image from source")
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Proxy error: {str(e)}")

