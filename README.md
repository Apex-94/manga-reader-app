# Manga Reader App

This repository contains a cross‑platform manga reader built with a Python
FastAPI backend and a React (Next.js) frontend.  The goal of this project
is to demonstrate how a modular scraping backend can be paired with a
modern web interface to deliver an enjoyable reading experience across
multiple devices.

## Features

- 🔌 **Pluggable source system** – A modular extension architecture allows
  new manga sources to be added simply by implementing a Python class
  conforming to the `BaseScraper` interface.
- 🌐 **Modern backend** – FastAPI provides an asynchronous HTTP API that
  proxies search, popular, latest, details, chapter list and page
  requests to installed sources.  Extensions are discovered at runtime
  without changing the core application.
- 🖥️ **Responsive frontend** – The Next.js UI offers browsing, search,
  source management and an immersive reader with single‑page or
  continuous scroll modes.  It uses React Query for data fetching and
  Tailwind CSS for styling.
- 📦 **Docker support** – A `docker‑compose.yml` file is included to
  start the backend and frontend together with a single command for
  development or demonstration purposes.

## Project layout

```
.
├── backend/               # FastAPI service and extension system
│   ├── app/               # API endpoints, core code and extensions
│   └── requirements.txt   # Python dependencies
├── frontend/              # Next.js application
│   └── package.json       # JavaScript dependencies
├── docker‑compose.yml     # Compose file to run both services
└── docs/                  # Additional documentation
```

## Quick start

The fastest way to get up and running is to use Docker Compose which
builds and runs both services:

```sh
docker compose up --build
```

To run the backend directly without Docker:

```sh
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

To run the frontend directly:

```sh
cd frontend
npm install
npm run dev
```

The frontend expects the backend API to be available at
`http://localhost:8000/api/v1`.  You can customise this by setting
`NEXT_PUBLIC_API_URL` in the environment before starting the frontend.

## Adding new sources

The backend discovers scraper classes placed under `app/extensions` on
startup.  Each extension must expose a `source` object implementing the
interface defined in `app/extensions/base.py`.  A minimal scraper must
provide methods for search, popular titles, latest updates, details,
chapters and pages.  See the [architecture documentation](docs/architecture.md)
for more details on how the plugin system works.

## License

This project is open source and available under the Apache 2.0 License.