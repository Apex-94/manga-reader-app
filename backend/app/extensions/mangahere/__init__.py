from __future__ import annotations

import re
import time
from typing import List, Optional
from urllib.parse import urljoin, quote_plus

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

        The method attempts to parse both desktop and mobile list layouts. If
        desktop selectors produce no results a fallback parsing routine is
        attempted on simpler mobile markup.
        """
        cards: List[MangaCard] = []
        # Desktop listing blocks
        for a in doc.select("ul.manga-list a, .manga-list-1 li a, .directory_list li a"):
            title = a.get("title") or a.get_text(strip=True)
            href = a.get("href")
            if not href or not title:
                continue
            img = a.select_one("img")
            thumb = None
            if img:
                thumb = img.get("data-src") or img.get("src")
            thumb_url = None
            if thumb:
                thumb_url = thumb if not thumb.startswith("/") else urljoin(base_url, thumb)
            cards.append(
                MangaCard(
                    title=title.strip(),
                    url=self.abs(base_url, href),
                    thumbnail_url=thumb_url,
                    source=self.name,
                )
            )
        # Mobile listing fallback
        if not cards:
            for li in doc.select("ul li"):
                a = li.select_one("a[href]")
                if not a:
                    continue
                title = (a.get("title") or a.get_text() or "").strip()
                if not title:
                    continue
                img = li.select_one("img")
                thumb = img.get("data-src") or img.get("src") if img else None
                thumb_url = None
                if thumb:
                    thumb_url = thumb if not thumb.startswith("/") else urljoin(base_url, thumb)
                cards.append(
                    MangaCard(
                        title=title,
                        url=self.abs(base_url, a["href"]),
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

    async def pages(self, chapter_url: str) -> List[str]:
        doc = await self._get(chapter_url.replace(self.base_urls[0], self.base_urls[1]))
        imgs = doc.select(
            "img#image, .page img, .reader img, .reader-images img, img[data-src]"
        )
        urls: List[str] = []
        for im in imgs:
            src = im.get("data-src") or im.get("src")
            if src:
                url_full = src if not src.startswith("/") else urljoin(self.base_urls[1], src)
                urls.append(url_full)
        if urls:
            return urls
        page_links = doc.select("a[href*='/c'][href*='/p']")
        uniq: List[str] = []
        seen = set()
        for a in page_links:
            href = a.get("href")
            if not href:
                continue
            full = self.abs(self.base_urls[1], href)
            if full not in seen:
                seen.add(full)
                uniq.append(full)
        if uniq:
            out: List[str] = []
            for u in uniq:
                d = await self._get(u)
                im = d.select_one("img#image, .page img, .reader img, img[data-src]")
                if im:
                    src = im.get("data-src") or im.get("src")
                    if src:
                        url_full = src if not src.startswith("/") else urljoin(self.base_urls[1], src)
                        out.append(url_full)
            if out:
                return out
        return []

    def _chapter_num(self, text: str) -> Optional[float]:
        m = re.search(r'(?:ch(?:apter)?\s*)?(\d+(?:\.\d+)?)', text, flags=re.I)
        return float(m.group(1)) if m else None


# export instance for loader
source = MangaHere()
