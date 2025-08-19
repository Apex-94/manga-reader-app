"""
Base classes and data structures for manga source extensions.

Scrapers implement the abstract `BaseScraper` class to provide a unified
interface for discovery and reading operations across different websites.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional, Literal

# type alias for allowed status values
Status = Literal["ongoing", "completed", "hiatus", "cancelled", "unknown"]


@dataclass
class MangaCard:
    """A lightweight representation of a manga used in lists."""

    title: str
    url: str
    thumbnail_url: Optional[str] = None
    source: str = ""


@dataclass
class MangaDetails:
    """Detailed metadata about a manga."""

    title: str
    description: str
    author: Optional[str]
    artist: Optional[str]
    status: Status
    genres: List[str]
    thumbnail_url: Optional[str]
    source_url: str


@dataclass
class Chapter:
    """Represents a single chapter in a manga."""

    title: str
    url: str
    chapter_number: Optional[float] = None
    uploaded_at_ts: Optional[int] = None


class BaseScraper(ABC):
    """
    Abstract base class for manga scrapers.

    Implementations must provide methods for discovery, metadata and content
    retrieval. Each scraper should be stateless apart from any shared HTTP
    clients it configures internally.
    """

    #: Human-readable name of the source
    name: str
    #: List of base URLs that the source supports (desktop, mobile, mirrors)
    base_urls: List[str]
    #: ISO language code of the content served
    language: str = "en"
    #: Semantic version of the scraper implementation
    version: str = "1.0.0"

    @abstractmethod
    async def search(self, query: str, page: int = 1) -> List[MangaCard]:
        """Search for manga on the source."""
        raise NotImplementedError

    @abstractmethod
    async def popular(self, page: int = 1) -> List[MangaCard]:
        """Return a list of popular manga."""
        raise NotImplementedError

    @abstractmethod
    async def latest(self, page: int = 1) -> List[MangaCard]:
        """Return a list of recently updated manga."""
        raise NotImplementedError

    @abstractmethod
    async def details(self, manga_url: str) -> MangaDetails:
        """Fetch detailed metadata for a manga."""
        raise NotImplementedError

    @abstractmethod
    async def chapters(self, manga_url: str) -> List[Chapter]:
        """Fetch the list of chapters for a manga."""
        raise NotImplementedError

    @abstractmethod
    async def pages(self, chapter_url: str) -> List[str]:
        """Fetch a list of image URLs for a chapter."""
        raise NotImplementedError
