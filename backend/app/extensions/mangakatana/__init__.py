from __future__ import annotations

import re
import time
from typing import List, Optional
from urllib.parse import urljoin, quote_plus
import asyncio

import httpx
from bs4 import BeautifulSoup

from app.extensions.base import BaseScraper, MangaCard, MangaDetails, Chapter, Filter, SelectFilter, MultiSelectFilter, SelectOption, SortFilter

# User agent string used for HTTP requests.
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

class MangaKatana(BaseScraper):
    """
    Scraper implementation for MangaKatana.com
    """

    name = "MangaKatana"
    language = "en"
    version = "1.0.0"
    base_urls = ["https://mangakatana.com"]

    def __init__(self) -> None:
        self.client = httpx.AsyncClient(
            headers={
                "User-Agent": UA, 
                "Referer": self.base_urls[0],
                "Accept-Language": "en-US,en;q=0.9",
            },
            timeout=httpx.Timeout(30.0),
            follow_redirects=True
        )

    def soup(self, html: str | bytes) -> BeautifulSoup:
        return BeautifulSoup(html, "html.parser")

    def abs(self, base: str, href: str) -> str:
        return urljoin(base, href)

    async def _get(self, url: str) -> BeautifulSoup:
        r = await self.client.get(url)
        r.raise_for_status()
        return self.soup(r.text)

    def _parse_cards_list(self, doc: BeautifulSoup, base_url: str) -> List[MangaCard]:
        cards: List[MangaCard] = []
        # Use a more specific selector to avoid empty items
        items = doc.select("div.item[data-id], div#book_list > div.item")
        
        for item in items:
            title_el = item.select_one("h3.title a")
            if not title_el:
                continue

            title = title_el.get_text(strip=True)
            href = title_el.get("href")
            if not href:
                continue

            img = item.select_one("div.wrap_img img")
            thumb_url = None
            if img:
                thumb = img.get("data-src") or img.get("src")
                if thumb:
                    thumb_url = self.abs(base_url, thumb)

            cards.append(
                MangaCard(
                    title=title,
                    url=self.abs(base_url, href),
                    thumbnail_url=thumb_url,
                    source=self.name,
                )
            )
        return cards

    async def get_filters(self) -> List[Filter]:
        return [
            MultiSelectFilter(
                id="genres",
                name="Genres",
                options=[
                    SelectOption(label="4 koma", value="4-koma"),
                    SelectOption(label="Action", value="action"),
                    SelectOption(label="Adult", value="adult"),
                    SelectOption(label="Adventure", value="adventure"),
                    SelectOption(label="Artbook", value="artbook"),
                    SelectOption(label="Award winning", value="award-winning"),
                    SelectOption(label="Comedy", value="comedy"),
                    SelectOption(label="Cooking", value="cooking"),
                    SelectOption(label="Doujinshi", value="doujinshi"),
                    SelectOption(label="Drama", value="drama"),
                    SelectOption(label="Ecchi", value="ecchi"),
                    SelectOption(label="Erotica", value="erotica"),
                    SelectOption(label="Fantasy", value="fantasy"),
                    SelectOption(label="Gender Bender", value="gender-bender"),
                    SelectOption(label="Harem", value="harem"),
                    SelectOption(label="Historical", value="historical"),
                    SelectOption(label="Horror", value="horror"),
                    SelectOption(label="Isekai", value="isekai"),
                    SelectOption(label="Josei", value="josei"),
                    SelectOption(label="Loli", value="loli"),
                    SelectOption(label="Magic", value="magic"),
                    SelectOption(label="Manhua", value="manhua"),
                    SelectOption(label="Manhwa", value="manhwa"),
                    SelectOption(label="Martial Arts", value="martial-arts"),
                    SelectOption(label="Mecha", value="mecha"),
                    SelectOption(label="Medical", value="medical"),
                    SelectOption(label="Music", value="music"),
                    SelectOption(label="Mystery", value="mystery"),
                    SelectOption(label="One shot", value="one-shot"),
                    SelectOption(label="Psychological", value="psychological"),
                    SelectOption(label="Romance", value="romance"),
                    SelectOption(label="School Life", value="school-life"),
                    SelectOption(label="Sci-fi", value="sci-fi"),
                    SelectOption(label="Seinen", value="seinen"),
                    SelectOption(label="Shoujo", value="shoujo"),
                    SelectOption(label="Shoujo Ai", value="shoujo-ai"),
                    SelectOption(label="Shounen", value="shounen"),
                    SelectOption(label="Shounen Ai", value="shounen-ai"),
                    SelectOption(label="Slice of Life", value="slice-of-life"),
                    SelectOption(label="Smut", value="smut"),
                    SelectOption(label="Sports", value="sports"),
                    SelectOption(label="Super Power", value="super-power"),
                    SelectOption(label="Supernatural", value="supernatural"),
                    SelectOption(label="Survival", value="survival"),
                    SelectOption(label="Time Travel", value="time-travel"),
                    SelectOption(label="Tragedy", value="tragedy"),
                    SelectOption(label="Video Games", value="video-games"),
                    SelectOption(label="Webtoon", value="webtoon"),
                    SelectOption(label="Yaoi", value="yaoi"),
                    SelectOption(label="Yuri", value="yuri"),
                ]
            ),
            SelectFilter(
                id="genre_mode",
                name="Genre Mode",
                options=[
                    SelectOption(label="And", value="and"),
                    SelectOption(label="Or", value="or"),
                ]
            ),
            SelectFilter(
                id="status",
                name="Status",
                options=[
                    SelectOption(label="All", value=""),
                    SelectOption(label="Ongoing", value="1"),
                    SelectOption(label="Completed", value="2"),
                    SelectOption(label="Cancelled", value="0"),
                ]
            ),
            SortFilter(
                id="order",
                name="Sort By",
                options=[
                    SelectOption(label="Latest Update", value="latest"),
                    SelectOption(label="New Manga", value="new"),
                    SelectOption(label="Alphabetical (A-Z)", value="az"),
                    SelectOption(label="Number of Chapters", value="numc"),
                ]
            )
        ]

    async def search(self, query: str, page: int = 1, filters: List[Filter] = None) -> List[MangaCard]:
        # If no filters and we have a query, use simple search
        if not filters and query:
            q = quote_plus(query)
            url = f"{self.base_urls[0]}/?search={q}&search_by=book_name"
            if page > 1:
                url += f"&page={page}"
            try:
                doc = await self._get(url)
                return self._parse_cards_list(doc, self.base_urls[0])
            except Exception:
                return []

        # Advanced search/filtered directory
        # https://mangakatana.com/manga/page/1?filter=1&order=...&status=...&include=action_adventure
        url = f"{self.base_urls[0]}/manga/page/{page}?filter=1"
        
        if query:
            url += f"&search={quote_plus(query)}&search_by=book_name"

        if filters:
            for f in filters:
                if f.id == "genres" and f.value:
                    if isinstance(f.value, list):
                        # Use underscore to join multiple genres for MangaKatana
                        # include=action_adventure
                        url += f"&include={'_'.join(f.value)}"
                    else:
                        url += f"&include={f.value}"
                elif f.id == "genre_mode" and f.value:
                    # include_mode=and or include_mode=or
                    url += f"&include_mode={f.value}"
                elif f.id == "status" and f.value:
                    url += f"&status={f.value}"
                elif f.id == "order" and f.value:
                    url += f"&order={f.value}"

        try:
            doc = await self._get(url)
            return self._parse_cards_list(doc, self.base_urls[0])
        except Exception:
            return []

    async def popular(self, page: int = 1) -> List[MangaCard]:
        # Using manga directory sorted by views/popularity
        # https://mangakatana.com/manga/page/1?filter=1&order=views
        url = f"{self.base_urls[0]}/manga/page/{page}?filter=1&order=views"
        try:
            doc = await self._get(url)
            return self._parse_cards_list(doc, self.base_urls[0])
        except Exception:
            return []

    async def latest(self, page: int = 1) -> List[MangaCard]:
        # https://mangakatana.com/latest/page/1
        url = f"{self.base_urls[0]}/latest/page/{page}"
        try:
            doc = await self._get(url)
            return self._parse_cards_list(doc, self.base_urls[0])
        except Exception:
            return []

    async def details(self, manga_url: str) -> MangaDetails:
        doc = await self._get(manga_url)
        
        heading = doc.select_one("h1.heading")
        title = heading.get_text(strip=True) if heading else ""
        
        summary = doc.select_one("div.summary p")
        description = summary.get_text(strip=True) if summary else ""
        
        # Author
        author = None
        author_links = doc.select("div.value.authors a")
        if author_links:
            author = ", ".join([a.get_text(strip=True) for a in author_links])
            
        # Status
        status_raw = ""
        status_el = doc.select_one("div.value.status")
        if status_el:
            status_raw = status_el.get_text(strip=True).lower()
            
        status_map = {
            "ongoing": "ongoing",
            "completed": "completed",
            "hiatus": "hiatus",
            "cancelled": "cancelled",
        }
        status = status_map.get(status_raw, "unknown")
        
        # Genres
        genres = [a.get_text(strip=True) for a in doc.select("div.value div.genres a")]
        
        # Thumbnail
        thumb = None
        img_el = doc.select_one("div.media div.cover img")
        if img_el:
            thumb = img_el.get("src")
            if thumb:
                thumb = self.abs(manga_url, thumb)
        
        return MangaDetails(
            title=title,
            description=description,
            author=author,
            artist=None, # Site doesn't seem to distinct author/artist clearly in info
            status=status,
            genres=genres,
            thumbnail_url=thumb,
            source_url=manga_url,
        )

    async def chapters(self, manga_url: str) -> List[Chapter]:
        doc = await self._get(manga_url)
        chapters: List[Chapter] = []
        
        # Chapter rows are in a table with class 'uk-table' inside div.chapters
        rows = doc.select("div.chapters table.uk-table tr")
        for row in rows:
            a = row.select_one("div.chapter a")
            if not a:
                continue
                
            title = a.get_text(strip=True)
            url = a.get("href")
            if not url:
                continue
                
            # Date extraction (optional but good for UX if BaseScraper supported it)
            # update_time = row.select_one("div.update_time")
            
            chapters.append(
                Chapter(
                    title=title,
                    url=self.abs(manga_url, url),
                    chapter_number=self._chapter_num(title)
                )
            )
            
        # Mangakatana lists chapters newest first, we want them oldest first (canonical)
        chapters.reverse()
        return chapters

    async def pages(self, chapter_url: str) -> List[str]:
        r = await self.client.get(chapter_url)
        r.raise_for_status()
        html = r.text
        
        # Extract image URLs from script variable 'thzq' (full list) or 'ytaw' (fallback)
        # Prioritize 'thzq' as it contains all pages, 'ytaw' often has only 1 page
        match = re.search(r"var thzq=\[(.*?)\];", html, re.DOTALL)
        if not match:
            # Fallback to ytaw if thzq not found
            match = re.search(r"var ytaw=\[(.*?)\];", html, re.DOTALL)
        
        if not match:
            return []
            
        raw_list = match.group(1)
        url_matches = re.findall(r"'(.*?)'", raw_list)
        # Filter out commas if they were matched (though regex above shouldn't)
        urls = [u for u in url_matches if u and u != ',']
        
        return urls

    def _chapter_num(self, text: str) -> Optional[float]:
        m = re.search(r'(?:ch(?:apter)?\s*)?(\d+(?:\.\d+)?)', text, flags=re.I)
        return float(m.group(1)) if m else None

# export instance for loader
source = MangaKatana()
