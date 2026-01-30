from __future__ import annotations

import re
import time
from typing import List, Optional
from urllib.parse import urljoin, quote_plus
import asyncio

import httpx
from bs4 import BeautifulSoup

from app.extensions.base import BaseScraper, MangaCard, MangaDetails, Chapter


# User agent string used for HTTP requests. Many sites deliver different
# HTML depending on the client so using a modern browser UA improves the
# chance of getting the full layout.
UA = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)


def ts_now() -> int:
    """Return the current UNIX timestamp."""
    return int(time.time())


class MangaHere(BaseScraper):
    """
    Scraper implementation for MangaHere.

    This class supports both the desktop and mobile versions of the site.
    It uses multiple strategies to extract lists, metadata and pages to
    provide robust behaviour even when the site's markup changes.
    """

    name = "MangaHere"
    language = "en"
    version = "1.0.0"
    base_urls = ["https://www.mangahere.cc", "https://m.mangahere.cc"]

    def __init__(self) -> None:
        # Create a reusable asynchronous HTTP client for all requests. By
        # sharing the client across calls we enable connection pooling and
        # more efficient DNS resolution.
        self.client = httpx.AsyncClient(
            headers={"User-Agent": UA, "Referer": self.base_urls[0]},
            timeout=httpx.Timeout(30.0),
        )

    def soup(self, html: str | bytes) -> BeautifulSoup:
        """Parse HTML into a BeautifulSoup object using the lxml parser."""
        return BeautifulSoup(html, "lxml")

    def abs(self, base: str, href: str) -> str:
        """Resolve a possibly relative URL to an absolute one."""
        return urljoin(base, href)

    async def _get(self, url: str) -> BeautifulSoup:
        """Perform an HTTP GET and return the parsed HTML."""
        r = await self.client.get(url, follow_redirects=True)
        r.raise_for_status()
        return self.soup(r.text)

    def _parse_cards_list(self, doc: BeautifulSoup, base_url: str) -> List[MangaCard]:
        """
        Extract a list of manga cards from a listing page.

        The method attempts to parse both desktop and mobile list layouts by iterating
        over common card containers.
        """
        cards: List[MangaCard] = []
        
        # Selectors for card containers:
        # - Mobile: ul.manga-list li .post
        # - Desktop: .manga-list-1 li, .directory_list li
        items = doc.select("ul.manga-list li .post, .manga-list-1 li, .directory_list li")
        
        # If no containers found, fall back to broad link search (legacy/fallback)
        if not items:
            # Fallback for simpler lists or unexpected layouts
            for a in doc.select("ul.manga-list a, .manga-list-1 li a, .directory_list li a"):
                if a.get_text(strip=True) in ["All", "PC Version", "Home", "Hot", "Genres"]: # heuristic exclusion
                    continue
                # ... (rest of simple fallback if needed, but let's trust the container logic first)
                pass

        if not items and doc.select("ul li a"):
             # Mobile listing fallback (directory/simple)
             items = [li for li in doc.select("ul li") if li.select_one("a")]

        for item in items:
            # Find the main anchor (usually contains the cover image or title)
            # Mobile: <div class="post"><a ...>...</a><a class="ch-button">...</a></div>
            # We explicitly exclude .ch-button
            a = item.select_one("a:not(.class-button):not(.ch-button)")
            # If item is the <a> itself (fallback case), use it
            if item.name == "a":
                a = item
            elif not a and item.name == "li":
                 a = item.select_one("a")

            if not a:
                continue

            href = a.get("href")
            if not href or href.startswith("javascript"):
                continue

            # Title Extraction
            title = None
            # 1. Look for explicit title class
            title_node = item.select_one(".title, .manga-list-1-list-title-a")
            if title_node:
                title = title_node.get_text(strip=True)
            
            # 2. Look for title attribute on anchor
            if not title:
                title = a.get("title")
            
            # 3. Fallback: text content, but be careful of large blocks
            if not title:
                # If the anchor contains structural divs/paragraphs (like .cover-info), 
                # taking all text is dangerous.
                if a.select(".cover-info, .manga-list-1-list-info"):
                    # We failed to find .title inside, possibly structure changed. 
                    # Try finding any text node that isn't genre/author?
                    pass
                else:
                    title = a.get_text(strip=True)

            if not title:
                continue
                
            # Image Extraction
            img = item.select_one("img")
            thumb_url = None
            if img:
                thumb = img.get("data-src") or img.get("src")
                if thumb:
                    thumb_url = thumb if not thumb.startswith("/") else urljoin(base_url, thumb)
            
            # Require thumbnail for valid card (filters out text links)
            if not thumb_url:
                continue

            cards.append(
                MangaCard(
                    title=title.strip(),
                    url=self.abs(base_url, href),
                    thumbnail_url=thumb_url,
                    source=self.name,
                )
            )
            
        return cards

    async def search(self, query: str, page: int = 1) -> List[MangaCard]:
        base = self.base_urls[0]
        q = quote_plus(query)
        urls = [
            f"{base}/search?title={q}&page={page}&t=1&stype=1",
            f"{base}/search?name={q}&page={page}",
            f"{self.base_urls[1]}/search?query={q}&page={page}",
        ]
        for url in urls:
            try:
                doc = await self._get(url)
                base_url = base if url.startswith(base) else self.base_urls[1]
                cards = self._parse_cards_list(doc, base_url)
                if cards:
                    return cards
            except Exception:
                continue
        return []

    async def popular(self, page: int = 1) -> List[MangaCard]:
        urls = [
            f"{self.base_urls[1]}/hot",
            f"{self.base_urls[0]}/ranking/{page}/",
            f"{self.base_urls[0]}/directory/{page}.htm",
        ]
        for url in urls:
            try:
                doc = await self._get(url)
                base_url = self.base_urls[0] if url.startswith(self.base_urls[0]) else self.base_urls[1]
                cards = self._parse_cards_list(doc, base_url)
                if cards:
                    return cards
            except Exception:
                continue
        return []

    async def latest(self, page: int = 1) -> List[MangaCard]:
        url = f"{self.base_urls[0]}/latest/{page}/"
        try:
            doc = await self._get(url)
            cards = self._parse_cards_list(doc, self.base_urls[0])
            return cards
        except Exception:
            doc = await self._get(self.base_urls[1])
            return self._parse_cards_list(doc, self.base_urls[1])

    async def details(self, manga_url: str) -> MangaDetails:
        url = manga_url.replace(self.base_urls[0], self.base_urls[1])
        doc = await self._get(url)
        
        # Title - from .manga-detail div (first text node)
        title = ""
        detail_div = doc.select_one(".manga-detail")
        if detail_div:
            # Get the title which is typically the first part before "Author"
            text = detail_div.get_text(" ", strip=True)
            # Title is before "Author(s):"
            if "Author" in text:
                title = text.split("Author")[0].strip()
            else:
                title = text.split("\n")[0].strip()
        
        # Description/Synopsis - look for manga-summary div
        description = ""
        summary_div = doc.select_one("div.manga-summary")
        if summary_div:
            description = summary_div.get_text(strip=True)

        def text_for(label: str) -> Optional[str]:
            # Look for <p>Author(s): NAME</p> pattern
            for p in doc.select(".detail-info p"):
                text = p.get_text(strip=True)
                if text.lower().startswith(label.lower()):
                    # Extract after colon
                    if ":" in text:
                        result = text.split(":", 1)[1].strip()
                        # If there's a link, get just the text
                        if "<a" in str(p):
                            result = p.select_one("a")
                            if result:
                                return result.get_text(strip=True)
                        return result
            return None

        author = text_for("Author")
        artist = text_for("Artist")
        
        # Status from detail-info <p> tags
        status_raw = ""
        for p in doc.select(".detail-info p"):
            text = p.get_text(strip=True)
            if text.lower().startswith("status"):
                # Extract status value (after "Status: ")
                match = re.search(r"Status:\s*(\w+)", text, re.I)
                if match:
                    status_raw = match.group(1)
                    break
        
        # Genres from links
        genres = []
        for a in doc.select("a[href*='/genre/'], [class*=genre] a"):
            text = a.get_text(strip=True)
            if text and len(text) > 1 and "genre" not in text.lower():
                genres.append(text)
        
        status_map = {
            "ongoing": "ongoing",
            "complete": "completed",
            "completed": "completed",
            "hiatus": "hiatus",
            "canceled": "cancelled",
            "cancelled": "cancelled",
        }
        status = status_map.get(status_raw.lower(), "ongoing" if status_raw else "unknown")
        
        # Image - look for detail-cover class which is the manga cover
        thumb = None
        cover_img = doc.select_one("img.detail-cover")
        if cover_img:
            src = cover_img.get("data-src") or cover_img.get("src")
            if src and "avatar" not in src:
                # Handle protocol-relative URLs
                if src.startswith("//"):
                    thumb = "https:" + src
                elif not src.startswith("http"):
                    thumb = urljoin(self.base_urls[1], src)
                else:
                    thumb = src
        
        return MangaDetails(
            title=title,
            description=description,
            author=author,
            artist=artist,
            status=status,
            genres=genres,
            thumbnail_url=thumb,
            source_url=url,
        )

    async def chapters(self, manga_url: str) -> List[Chapter]:
        url = manga_url.replace(self.base_urls[0], self.base_urls[1])
        doc = await self._get(url)
        chapters: List[Chapter] = []
        
        # Get all potential chapter links
        candidates = doc.select("a[href*='/manga/'][href*='/']")
        
        # If no candidates, try broader selectors
        if not candidates:
            candidates = doc.select(".detail-list a, .chapter-list a, ul li a")
        
        # List of UI noise to filter out
        noise_patterns = {
            "comments", "start reading", "read now", "bookmark", "share", "history",
            "home", "browse", "search", "settings", "login", "register", "my library"
        }
        
        for a in candidates:
            href = a.get("href")
            name = a.get_text(" ", strip=True)
            
            # Skip if no href or name
            if not href or not name:
                continue
            
            # Skip very short titles
            if len(name.strip()) < 2:
                continue
            
            # Skip obvious UI noise
            if name.lower().strip() in noise_patterns:
                continue
            
            # Skip if URL doesn't look like a manga/chapter page
            if "/manga/" not in href.lower():
                continue
            
            # Extract chapter number
            ch_no = self._chapter_num(name)
            
            chapters.append(
                Chapter(
                    title=name,
                    url=self.abs(self.base_urls[1], href),
                    chapter_number=ch_no,
                )
            )
        
        # Remove duplicates by URL
        seen = set()
        unique_chapters = []
        for ch in chapters:
            if ch.url not in seen:
                seen.add(ch.url)
                unique_chapters.append(ch)
        
        unique_chapters.sort(key=lambda c: (c.chapter_number if c.chapter_number is not None else 1e9))
        return unique_chapters

    def _extract_image(self, doc: BeautifulSoup) -> Optional[str]:
        """Helper to find the main manga image in a page."""
        # Look for manga images in content area specifically
        for selector in [
            '[class*="content"] img[src*="zjcdn"]',
            '[class*="content"] img[src*="/store/manga/"]',
            '[class*="reader"] img',
            'main img[src*="mangahere"]',
            'article img[src*="mangahere"]',
            'img[src*="zjcdn"]',
            'img[src*="/store/manga/"]',
            "img#image",
            ".page img",
            ".reader img",
        ]:
            for img in doc.select(selector):
                src = img.get("data-src") or img.get("src")
                if src and "avatar" not in src.lower() and "static.mangahere" not in src:
                    # Make absolute URL
                    if src.startswith("//"):
                        return "https:" + src
                    elif not src.startswith("http"):
                        return urljoin(self.base_urls[1], src)
                    else:
                        return src
        return None

    async def pages(self, chapter_url: str) -> List[str]:
        # Enforce mobile site for consistent parsing
        url = chapter_url.replace(self.base_urls[0], self.base_urls[1])
        doc = await self._get(url)

        # Get the image from the first page
        first_page_img = self._extract_image(doc)
        page_urls = []
        
        if first_page_img:
            page_urls.append(first_page_img)
        
        # MangaHere page pattern:
        # Page 1: /c001/
        # Page 2: /c001/2.html
        # Page 3: /c001/3.html
        # etc.
        
        base_url = url.rstrip('/') + '/'
        
        # Try to discover pages by fetching them until we get a 404 or no image
        # Limit to reasonable number to avoid timeouts
        for page_num in range(2, 51):  # Check up to 50 pages
            try:
                # Construct page URL
                page_url = f"{base_url}{page_num}.html"
                
                # Try fetching this page with shorter timeout
                try:
                    page_doc = await asyncio.wait_for(
                        self._get(page_url),
                        timeout=5.0  # 5 second timeout per page
                    )
                except asyncio.TimeoutError:
                    break
                
                page_img = self._extract_image(page_doc)
                
                # If we found an image, add it
                if page_img:
                    page_urls.append(page_img)
                else:
                    # No manga image found on this page, stop
                    break
            except Exception:
                # Error fetching (likely 404), stop
                break
        
        return page_urls if page_urls else []

    async def resolve_image(self, url: str) -> str:
        """
        Fetch the HTML page at `url` and extract the main image source.
        If `url` already looks like an image, returns it.
        """
        # Basic check if it's already an image (optimization)
        if any(url.lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".gif", ".webp"]):
            return url
            
        try:
            doc = await self._get(url)
            img = self._extract_image(doc)
            return img or url # Return original if failed, though likely broken
        except Exception:
            return url

    def _chapter_num(self, text: str) -> Optional[float]:
        m = re.search(r'(?:ch(?:apter)?\s*)?(\d+(?:\.\d+)?)', text, flags=re.I)
        return float(m.group(1)) if m else None


# export instance for loader
source = MangaHere()
