# Architecture

## Overview

The Manga Reader App is split into two major components:

- **Backend** – An asynchronous FastAPI application that exposes a
  versioned REST API and loads source scrapers at runtime.
- **Frontend** – A Next.js application that consumes the API and
  provides a modern user interface for browsing, searching and reading
  manga.

## Extension System

The backend supports loading multiple manga sources via a plugin
architecture. Each source implements the `BaseScraper` abstract class
defined in `app/extensions/base.py` and is exposed via a module‑level
`source` variable. A registry scans the `app/extensions` package for
these modules on startup and records any loading errors.

### Data Structures

| Class          | Purpose                                                      |
|---------------|--------------------------------------------------------------|
| `MangaCard`   | Lightweight representation of a manga used in list views.    |
| `MangaDetails`| Detailed metadata such as author, artist, status and genres. |
| `Chapter`     | Represents a single chapter with a title, URL and number.    |

To create a new extension you simply define a subclass of `BaseScraper`
and populate the required methods (`search`, `popular`, `latest`,
`details`, `chapters` and `pages`). At the bottom of the module,
assign an instance of your class to a variable named `source` so the
loader can register it.

### Extension Loading Process

1. On startup, the backend scans all directories under `app/extensions/`
2. For each directory, it attempts to import the module
3. If the module exposes a `source` variable that implements `BaseScraper`,
   it is registered
4. Any loading errors are recorded and available via the `/api/v1/sources` endpoint

## API

All API endpoints are namespaced under `/api/v1`. They provide the
following functionality:

- `GET /manga/search` – Search for titles by query string.
- `GET /manga/popular` – Retrieve a list of popular titles.
- `GET /manga/latest` – Retrieve a list of recently updated titles.
- `GET /manga/details` – Fetch metadata for a single manga by URL.
- `GET /manga/chapters` – Fetch the chapter list for a manga by URL.
- `GET /manga/pages` – Fetch the page image URLs for a chapter.
- `GET /proxy` – Proxy image requests through backend to avoid CORS issues.
- `GET /sources` – List loaded sources and any load errors.
- `POST /sources/reload` – Reload the extension registry from disk.

All operations delegate to the selected scraper. If no source is
specified the API defaults to `mangahere:en`.

## Image Proxy System

To solve CORS (Cross-Origin Resource Sharing) issues when loading images
from external manga sources, the application implements an image proxy
system.

### How It Works

1. Frontend requests page images from backend API
2. Backend returns proxy URLs instead of direct image URLs
3. Frontend requests images through the `/api/v1/proxy` endpoint
4. Backend fetches the actual image from the external source with appropriate headers
5. Backend streams the image back to the frontend

### Proxy Implementation

The proxy system is implemented in [`app/api/proxy.py`](../backend/app/api/proxy.py)
and provides:

- **Headers Management**: Automatically attaches appropriate Referer and User-Agent headers
- **Source-Specific Headers**: Uses source-specific headers if provided
- **Retry Logic**: Retries failed requests with exponential backoff
- **Error Handling**: Gracefully handles timeouts and HTTP errors
- **Caching**: Sets appropriate cache headers for better performance

### Proxy Endpoint

```
GET /api/v1/proxy?url=<image_url>&source=<source_id>
```

- `url`: The absolute URL of the image to proxy
- `source`: Optional source identifier (name:lang) to get source-specific headers

## Frontend Architecture

The frontend is built with Next.js using the app router. It makes
requests to the backend via Axios and uses React Query for caching and
loading states. Styling is provided by Tailwind CSS. Key pages include:

### Browse Page
- Browse popular or latest manga
- Perform title searches
- Switch between different manga sources

### Library Page
- Manage your saved manga
- View reading progress
- Filter and search library

### Manga Details Page
- View detailed manga information
- See available chapters
- Add to library

### Reader Page
- Display chapter images in single-page or continuous scroll mode
- Toggle reading modes
- Switch between reading directions (left-to-right/right-to-left)
- Zoom functionality
- Navigation between chapters

### Sources Page
- Inspect and reload available sources
- View source metadata and versions
- Display extension load errors

## Data Flow

1. Frontend fetches data from backend API endpoints
2. Backend delegates to appropriate extension
3. Extension scrapes data from external manga source
4. Data is returned in structured format (MangaCard, MangaDetails, Chapter)
5. Frontend caches data using React Query
6. Components render based on cached data

## Sample Extension

The repository includes a sample extension at `app/extensions/mangahere`
which supports both the desktop and mobile variants of the MangaHere
website. It demonstrates how to implement fallback strategies for
retrieving lists, metadata and pages in case the primary selectors
fail.

Key features of the MangaHere extension:
- Support for both desktop and mobile site versions
- Multiple fallback strategies for parsing different page layouts
- Image extraction from lazy-loaded pages
- Chapter number parsing with regex
- Async HTTP client with connection pooling
- Error handling and retry logic
