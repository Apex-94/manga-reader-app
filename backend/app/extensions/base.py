"""
Base classes and data structures for manga source extensions.

Scrapers implement the abstract `BaseScraper` class to provide a unified
interface for discovery and reading operations across different websites.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional, Literal, Any

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


@dataclass
class Filter:
    """Base class for all filters."""
    id: str
    name: str
    value: Any = None

@dataclass
class SelectOption:
    value: str
    label: str

@dataclass
class SelectFilter(Filter):
    """A dropdown select filter."""
    options: List[SelectOption] = None
    type: Literal["select"] = "select"

@dataclass
class MultiSelectFilter(Filter):
    """A multi-select filter."""
    options: List[SelectOption] = None
    type: Literal["multiselect"] = "multiselect"

@dataclass
class TextFilter(Filter):
    """A generic text input filter."""
    type: Literal["text"] = "text"

@dataclass
class SortFilter(SelectFilter):
    """A special select filter for sorting results."""
    type: Literal["sort"] = "sort"


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

    async def get_filters(self) -> List[Filter]:
        """
        Return a list of supported filters for this source.
        
        The default implementation returns an empty list.
        """
        return []

    @abstractmethod
    async def search(self, query: str, page: int = 1, filters: List[Filter] = None) -> List[MangaCard]:
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

    async def resolve_image(self, url: str) -> str:
        """
        Resolve a lazy-loaded page URL to its actual image source.

        The default implementation returns the URL as-is, assuming it's already an image.
        Scrapers that return HTML page URLs from `pages` must override this.
        """
        return url
