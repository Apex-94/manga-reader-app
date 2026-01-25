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
        title_node = doc.select_one("h1") or doc.select_one(".title")
        title = title_node.get_text(strip=True) if title_node else ""
        desc_node = doc.select_one(".summary") or doc.select_one(".description")
        description = desc_node.get_text(strip=True) if desc_node else ""

        def text_for(label: str) -> Optional[str]:
            node = doc.find(string=re.compile(rf"^{label}\s*:", flags=re.I))
            if node and node.parent:
                next_text = node.parent.get_text(" ", strip=True)
                parts = next_text.split(":", 1)
                return parts[1].strip() if len(parts) > 1 else None
            return None

        author = text_for("Author")
        artist = text_for("Artist")
        status_raw = text_for("Status") or ""
        genres = [a.get_text(strip=True) for a in doc.select(".genres a, [class*=genre] a")] or []
        status_map = {
            "ongoing": "ongoing",
            "complete": "completed",
            "completed": "completed",
            "hiatus": "hiatus",
            "canceled": "cancelled",
            "cancelled": "cancelled",
        }
        status = status_map.get(status_raw.lower(), "unknown")
        thumb = None
        img = doc.select_one(".cover img, .manga-cover img, img[src*='/cover']")
        if img:
            src = img.get("data-src") or img.get("src")
            if src:
                thumb = src if not src.startswith("/") else urljoin(self.base_urls[1], src)
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
        candidates = doc.select(".detail-list li a, .chapter-list li a, ul li a")
        for a in candidates:
            href = a.get("href")
            name = a.get_text(" ", strip=True)
            if not href or not name:
                continue
            ch_no = self._chapter_num(name)
            chapters.append(
                Chapter(
                    title=name,
                    url=self.abs(self.base_urls[1], href),
                    chapter_number=ch_no,
                )
            )
        chapters.sort(key=lambda c: (c.chapter_number if c.chapter_number is not None else 1e9))
        return chapters

    def _extract_image(self, doc: BeautifulSoup) -> Optional[str]:
        """Helper to find the main manga image in a page."""
        # Mobile/Desktop common selectors for the main image
        img = doc.select_one("img#image, .page img, .reader img, .reader-images img")
        if img:
            src = img.get("data-src") or img.get("src")
            if src:
                return src if not src.startswith("/") else urljoin(self.base_urls[1], src)
        return None

    async def pages(self, chapter_url: str) -> List[str]:
        # Enforce mobile site for consistent parsing
        url = chapter_url.replace(self.base_urls[0], self.base_urls[1])
        doc = await self._get(url)

        # 1. Check for mobile dropdown pagination (common on m.mangahere.cc)
        options = doc.select("select.mangaread-page option")
        if options:
            page_urls = []
            for i, opt in enumerate(options):
                val = opt.get("value")
                if val:
                    full_url = self.abs(self.base_urls[1], val)
                    # Deduplicate: if i=0 and it matches current, that defines the start
                    # Actually, usually option 0 is Page 1.
                    
                # Lazy Loading Implementation:
                # For the FIRST page, resolve it now to give the user something to see.
                # For others, return the HTML URL.
                
                if i == 0:
                    # Resolve immediately
                    # Reuse 'doc' since we have it
                    img = self._extract_image(doc)
                    if img:
                        page_urls.append(img)
                    else:
                        # Fallback: if we can't find img on p1, just push the URL 
                        # and hope resolve_image picks it up later (though infinite loop risk if we're not careful)
                        page_urls.append(full_url)
                else:
                    page_urls.append(full_url)
            
            # Deduplicate while preserving order? Actually list(dict.fromkeys) handles it but 
            # we might have resolved 1st url -> image_url vs 2nd url -> html_url.
            # They won't collide.
            
            if page_urls:
                return page_urls

        # 2. Fallback: Parse images directly (Long Strip or Desktop mode)
        imgs = doc.select(
            "img#image, .page img, .reader img, .reader-images img, img[data-src]"
        )
        
        # If we find multiple images, it's likely a strip mode -> return all
        if len(imgs) > 1:
            urls: List[str] = []
            for im in imgs:
                src = im.get("data-src") or im.get("src")
                if src:
                    url_full = src if not src.startswith("/") else urljoin(self.base_urls[1], src)
                    urls.append(url_full)
            return urls

        # 3. Last attempt -> single image found
        if imgs:
            src = imgs[0].get("data-src") or imgs[0].get("src")
            if src:
                return [src if not src.startswith("/") else urljoin(self.base_urls[1], src)]
        
        return []

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
