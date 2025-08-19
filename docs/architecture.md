# Architecture

## Overview

The Manga Reader App is split into two major components:

- **Backend** – An asynchronous FastAPI application that exposes a
  versioned REST API and loads source scrapers at runtime.
- **Frontend** – A Next.js application that consumes the API and
  provides a modern user interface for browsing, searching and reading
  manga.

### Extension system

The backend supports loading multiple manga sources via a plugin
architecture.  Each source implements the `BaseScraper` abstract class
defined in `app/extensions/base.py` and is exposed via a module‑level
`source` variable.  A registry scans the `app/extensions` package for
these modules on startup and records any loading errors.

The data structures provided by the base module include:

| Class          | Purpose                                                      |
|---------------|--------------------------------------------------------------|
| `MangaCard`   | Lightweight representation of a manga used in list views.    |
| `MangaDetails`| Detailed metadata such as author, artist, status and genres. |
| `Chapter`     | Represents a single chapter with a title, URL and number.    |

To create a new extension you simply define a subclass of `BaseScraper`
and populate the required methods (`search`, `popular`, `latest`,
`details`, `chapters` and `pages`).  At the bottom of the module
assign an instance of your class to a variable named `source` so the
loader can register it.

### API

All API endpoints are namespaced under `/api/v1`.  They provide the
following functionality:

- `GET /manga/search` – Search for titles by query string.
- `GET /manga/popular` – Retrieve a list of popular titles.
- `GET /manga/latest` – Retrieve a list of recently updated titles.
- `GET /manga/details` – Fetch metadata for a single manga by URL.
- `GET /manga/chapters` – Fetch the chapter list for a manga by URL.
- `GET /manga/pages` – Fetch the page image URLs for a chapter.
- `GET /sources` – List loaded sources and any load errors.
- `POST /sources/reload` – Reload the extension registry from disk.

All operations delegate to the selected scraper.  If no source is
specified the API defaults to `mangahere:en`.

### Frontend

The frontend is built with Next.js using the app router.  It makes
requests to the backend via Axios and uses React Query for caching and
loading states.  Styling is provided by Tailwind CSS.  Key pages
include:

- **Browse** – Browse popular or latest manga and perform title
  searches.  Buttons switch between latest and popular lists and a
  search box triggers queries.
- **Sources** – Inspect and reload available sources.  This page
  displays metadata for all loaded scrapers and lists any load errors.
- **Reader** – Display chapter images in single‑page or continuous
  scroll mode.  A simple toolbar allows toggling reading modes and
  switching between left‑to‑right and right‑to‑left reading directions.

### Sample extension

The repository includes a sample extension at `app/extensions/mangahere`
which supports both the desktop and mobile variants of the MangaHere
website.  It demonstrates how to implement fallback strategies for
retrieving lists, metadata and pages in case the primary selectors
fail.
