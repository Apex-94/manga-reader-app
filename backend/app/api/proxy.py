
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
import httpx
from app.api.manga import _pick_source

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
        # Get the scraper to access its client/headers configuration
        # If no source provided, default to mangahere (logic inside _pick_source)
        scraper = _pick_source(source)
        
        # We'll use the scraper's existing client configuration (User-Agent, etc.)
        # However, httpx.AsyncClient in the scraper might be bound to specific base URLs 
        # or we might want to just create a quick request with the right headers.
        
        # The scraper.client is optimized for the site, so let's try to reuse its configuration
        # BUT scraper.client is an instance attribute.
        
        # Actually, let's just construct the headers we need.
        # Mangahere needs Referer: base_url
        
        headers = {
            "User-Agent": scraper.client.headers.get("User-Agent"),
            "Referer": scraper.base_urls[0] 
        }

        # Create a transient client for streaming
        # We shouldn't use scraper.client because we want to stream the response
        # and not interfere with other operations.
        
        async def image_stream():
            async with httpx.AsyncClient() as client:
                async with client.stream("GET", url, headers=headers, follow_redirects=True) as response:
                    response.raise_for_status()
                    async for chunk in response.aiter_bytes():
                        yield chunk

        # We need to fetch the headers first to set Content-Type correctly
        # This is a bit tricky with StreamingResponse if we want to be fully async lazy
        # simple approach: just start the stream
        
        # Better approach for proper Content-Type:
        client = httpx.AsyncClient()
        req = client.build_request("GET", url, headers=headers)
        r = await client.send(req, stream=True)
        
        if r.status_code != 200:
             await r.aclose()
             raise HTTPException(status_code=r.status_code, detail="Failed to fetch image")

        return StreamingResponse(
            r.aiter_bytes(), 
            media_type=r.headers.get("content-type", "image/jpeg"),
            background=None # We rely on r.aclose() or similar? 
            # httpx stream context manager closes on exit. 
            # StreamingResponse runs in a separate context.
            # We need to make sure 'client' is closed.
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Simplified implementation avoiding complex stream context issues for now:
# Just read small images into memory? No, manga images can be large-ish and we want speed.
# Let's use a simpler pattern valid for FastAPI.

@router.get("/proxy_stream")
async def proxy_image_stream(
    url: str = Query(..., description="Absolute URL"),
    source: str | None = Query(None)
):
    scraper = _pick_source(source)
    headers = {
        "User-Agent": scraper.client.headers.get("User-Agent"),
        "Referer": scraper.base_urls[0]
    }
    
    # We return a generator that manages the client lifecycle
    async def iterfile():
        async with httpx.AsyncClient() as client:
            async with client.stream("GET", url, headers=headers, follow_redirects=True) as resp:
                 if resp.status_code != 200:
                     raise HTTPException(status_code=resp.status_code)
                 async for chunk in resp.aiter_bytes():
                     yield chunk

    # Note: we can't easily get Content-Type here without making a HEAD request first
    # or starting the stream. FastAPI StreamingResponse accepts a generator.
    # We'll default to image/jpeg or let browser sniff.
    
    return StreamingResponse(iterfile(), media_type="image/jpeg")
