# PyYomi - Manga Reader Application

**A modern, cross-platform manga reader with desktop support**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10%2B-green.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green.svg)](https://fastapi.tiangolo.com/)

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Desktop Application](#desktop-application)
- [API Documentation](#api-documentation)
- [Extension System](#extension-system)
- [Database Schema](#database-schema)
- [Configuration](#configuration)
- [Building for Production](#building-for-production)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Functionality
- 📖 **Browse & Read Manga** - Discover popular, latest, and search for manga from various sources
- 📚 **Library Management** - Save and organize your favorite manga with categories
- 📊 **Reading Progress** - Automatically tracks your reading position
- 🔄 **Real-time Updates** - Auto-refreshes library and chapter information
- 🌙 **Dark/Light Mode** - Beautiful theming with automatic switching
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

### Desktop Features
- 🖥️ **Native Desktop App** - Built with Tauri for Windows, macOS, and Linux
- ⚡ **Self-Contained** - Bundled backend with automatic process management
- 🔔 **Notifications** - Get notified when new chapters are available
- 📦 **Offline Reading** - Download chapters for offline access (coming soon)

### Technical Features
- 🔌 **Pluggable Extension System** - Create custom extensions to support additional manga sources
- 🌐 **Image Proxy System** - Proxies images through backend to avoid CORS issues
- 🗄️ **SQLite Database** - Fast, reliable local storage with SQLModel ORM
- 🚀 **Async Architecture** - FastAPI backend with full async support
- 📝 **TypeScript** - Complete type safety across the frontend

---

## Technology Stack

### Frontend

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React | 18+ |
| Build Tool | Vite | 5.x |
| Language | TypeScript | 5.x |
| UI Framework | Material-UI (MUI) | 5.x |
| Routing | React Router | 6.x |
| State Management | TanStack Query | 5.x |
| HTTP Client | Axios | 1.x |
| Icons | Lucide React | 0.x |

### Backend

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | FastAPI | 0.104+ |
| Language | Python | 3.10+ |
| ORM | SQLModel | 0.0.x |
| Database | SQLite | - |
| HTTP Client | HTTPX | 0.25+ |
| HTML Parsing | Beautiful Soup | 4.12+ |
| Validation | Pydantic | 2.x |

### Desktop

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Tauri | 2.x |
| Language | Rust | 1.70+ |
| Build Tool | Cargo | - |

---

## Project Structure

```
pyyomi/
├── frontend/                  # React + Vite frontend
│   ├── src/
│   │   ├── app/              # Pages and layouts (Next.js-style)
│   │   │   ├── layout.tsx    # Root layout with providers
│   │   │   ├── providers.tsx # Theme & query providers
│   │   │   ├── browse/       # Browse manga page
│   │   │   ├── library/      # User library page
│   │   │   ├── manga/        # Manga details page
│   │   │   ├── reader/       # Manga reader page
│   │   │   ├── downloads/    # Downloads management
│   │   │   ├── updates/      # Chapter updates
│   │   │   ├── settings/     # App settings
│   │   │   └── sources/      # Source management
│   │   ├── components/       # Reusable UI components
│   │   │   ├── AppFrame.tsx  # Main layout (AppBar + Drawer)
│   │   │   ├── Navigation.tsx # Navigation sidebar
│   │   │   ├── MangaCard.tsx  # Manga card display
│   │   │   └── Reader.tsx     # Manga reader
│   │   ├── theme/            # MUI theme configuration
│   │   │   ├── theme.ts      # Theme definition
│   │   │   └── ColorModeContext.tsx # Dark/light mode
│   │   ├── lib/             # Utilities
│   │   │   └── api.ts        # API client with Tauri support
│   │   └── services/         # Business logic
│   │       └── geminiService.ts # AI integration
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                   # FastAPI backend
│   ├── app/
│   │   ├── main.py          # Application factory
│   │   ├── api/             # API routers
│   │   │   ├── library.py   # Library management
│   │   │   ├── manga.py     # Manga scraping
│   │   │   ├── sources.py   # Source management
│   │   │   └── proxy.py      # Image proxy
│   │   ├── db/              # Database layer
│   │   │   ├── models.py    # SQLModel models
│   │   │   ├── database.py   # Connection & sessions
│   │   │   └── migrations.py # Data migration
│   │   └── extensions/      # Extension system
│   │       ├── base.py      # BaseScraper class
│   │       ├── loader.py    # Extension registry
│   │       ├── mangahere/   # MangaHere source
│   │       └── mangakatana/ # MangaKatana source
│   ├── data/                 # Data directory
│   │   └── pyyomi.db        # SQLite database
│   ├── requirements.txt
│   └── pyinstaller.spec
│
├── desktop/                   # Tauri desktop wrapper
│   ├── src/                  # Tauri source
│   │   ├── main.tsx         # App entry
│   │   └── App.tsx          # Root component
│   ├── src-tauri/           # Rust backend
│   │   ├── src/             # Tauri commands
│   │   ├── Cargo.toml
│   │   ├── tauri.conf.json
│   │   └── resources/       # Bundled resources
│   └── package.json
│
├── docs/                      # Documentation
│   └── ARCHITECTURE.md       # Architecture documentation
│
├── docker-compose.yml         # Docker configuration
├── package.json              # Root scripts
└── README.md                 # This file
```

---

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Start all services
docker compose up --build

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000/api/v1
# API Docs: http://localhost:8000/docs
```

### Option 2: Local Development

#### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn app.main:create_app --reload
```

#### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Development Setup

### Prerequisites

- **Node.js** 18 or higher
- **Python** 3.10 or higher
- **Git**
- **Rust** (required for Tauri desktop development)

### Environment Variables

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api/v1
```

#### Backend (.env)
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
DATA_DIR=./data
PORT=8000
```

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

---

## Desktop Application

### Development

```bash
# Install dependencies
cd desktop
npm install

# Run desktop app
npm run tauri dev
```

### Building

```bash
# Build for all platforms
cd desktop
npm run tauri build

# Build for specific platform
npm run tauri build -- --platform windows   # Windows
npm run tauri build -- --platform macos    # macOS
npm run tauri build -- --platform linux    # Linux
```

### Desktop Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Tauri Desktop Shell                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐     │
│  │              Frontend (WebView)                    │     │
│  │   React + MUI Interface                           │     │
│  └─────────────────────────────────────────────────────┘     │
│                            │                                  │
│              ┌────────────┼────────────┐                     │
│              ▼            ▼            ▼                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Backend    │  │   Database   │  │  Extensions  │       │
│  │   Process    │  │   (SQLite)   │  │   System     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## API Documentation

### Base URL

- **Development**: `http://localhost:8000/api/v1`
- **Production**: `/api/v1` (relative)

### Endpoints

#### Library Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/library/` | Get all library manga |
| POST | `/api/v1/library/` | Add manga to library |
| DELETE | `/api/v1/library/` | Remove manga from library |

#### Manga Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/manga/search` | Search manga |
| GET | `/api/v1/manga/popular` | Get popular manga |
| GET | `/api/v1/manga/latest` | Get latest updates |
| GET | `/api/v1/manga/details` | Get manga details |
| GET | `/api/v1/manga/chapters` | Get chapter list |
| GET | `/api/v1/manga/pages` | Get chapter pages |
| GET | `/api/v1/manga/filters` | Get source filters |
| GET | `/api/v1/manga/resolve` | Resolve image URL |

#### Source Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/sources/` | List all sources |
| GET | `/api/v1/sources/{key}` | Get source details |

#### Proxy

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/proxy/image` | Proxy image requests |

### Example Requests

#### Search Manga
```bash
curl "http://localhost:8000/api/v1/manga/search?q=naruto&page=1"
```

#### Get Library
```bash
curl "http://localhost:8000/api/v1/library/"
```

#### Add to Library
```bash
curl -X POST "http://localhost:8000/api/v1/library/" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Naruto",
    "url": "https://example.com/naruto",
    "thumbnail_url": "https://example.com/naruto.jpg",
    "source": "mangahere:en"
  }'
```

---

## Extension System

### Overview

PyYomi uses a pluggable extension system that allows adding support for new manga sources without modifying the core application. Each extension is a self-contained Python module that implements the `BaseScraper` interface.

### Supported Sources

| Source | ID | Language | Status |
|--------|-----|----------|--------|
| MangaHere | `mangahere:en` | English | ✅ Active |
| MangaKatana | `mangakatana:en` | English | ✅ Active |

### Creating an Extension

1. **Create extension directory**:
   ```
   backend/app/extensions/mysource/
   ├── __init__.py
   ├── manifest.json
   └── MyScraper.py
   ```

2. **Define manifest** (`manifest.json`):
   ```json
   {
     "id": "mysource",
     "name": "My Source",
     "version": "1.0.0",
     "language": "en"
   }
   ```

3. **Implement scraper** (`MyScraper.py`):
   ```python
   from app.extensions.base import BaseScraper, MangaCard, MangaDetails, Chapter
   
   class MySourceScraper(BaseScraper):
       name = "My Source"
       base_urls = ["https://example.com"]
       language = "en"
       version = "1.0.0"
       
       async def search(self, query: str, page: int = 1):
           # Implementation
           pass
       
       async def popular(self, page: int = 1):
           # Implementation
           pass
       
       async def latest(self, page: int = 1):
           # Implementation
           pass
       
       async def details(self, manga_url: str):
           # Implementation
           pass
       
       async def chapters(self, manga_url: str):
           # Implementation
           pass
       
       async def pages(self, chapter_url: str):
           # Implementation
           pass
   ```

4. **Restart the backend** - Extensions are auto-loaded on startup.

For detailed extension development guide, see [Extension Development](docs/EXTENSIONS.md).

---

## Database Schema

### Models

| Model | Description |
|-------|-------------|
| `Manga` | Manga metadata and tracking |
| `Chapter` | Chapter information |
| `LibraryEntry` | User's manga library |
| `ReadingProgress` | Reading position tracking |
| `History` | Reading history |
| `Category` | Manga categories |
| `MangaCategory` | Manga-Category relationships |
| `Download` | Download queue items |
| `Setting` | Application settings |

### Relationships

```
Manga ──► Chapter (one-to-many)
Manga ──► LibraryEntry (one-to-many)
Manga ──► ReadingProgress (one-to-many)
Manga ──► History (one-to-many)
Manga ──► MangaCategory (one-to-many)
Category ──► MangaCategory (one-to-many)
Manga ──► Download (one-to-many)
```

### Database Location

- **Development**: `backend/data/pyyomi.db`
- **Desktop**: `./data/pyyomi.db` (relative to app data dir)

---

## Configuration

### Backend Configuration

#### Command Line Arguments

```bash
uvicorn app.main:create_app --reload --port 8000 --data-dir ./data
```

| Argument | Default | Description |
|----------|---------|-------------|
| `--port` | 8000 | API server port |
| `--data-dir` | ./data | Database directory |
| `--reload` | - | Enable auto-reload (development) |

#### Environment Variables

```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
DATA_DIR=./data
PORT=8000
```

### Frontend Configuration

#### Environment Variables

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_TAURI_API_URL=/api/v1
```

### Tauri Configuration

See [`desktop/src-tauri/tauri.conf.json`](desktop/src-tauri/tauri.conf.json) for desktop-specific configuration.

---

## Building for Production

### Docker

```bash
# Build images
docker compose build

# Run production containers
docker compose -f docker-compose.yml up -d
```

### Desktop Application

```bash
# Install dependencies
cd desktop
npm install

# Build for current platform
npm run tauri build

# Output in desktop/src-tauri/target/release/bundle/
```

### Backend Binary (PyInstaller)

```bash
cd backend
pip install pyinstaller
pyinstaller pyinstaller.spec --onefile

# Output in backend/dist/pyyomi-backend.exe
```

---

## Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/my-feature`
3. **Make your changes**
4. **Run tests**: `pytest` and `npm test`
5. **Commit changes**: `git commit -am 'Add my feature'`
6. **Push to branch**: `git push origin feature/my-feature`
7. **Create a Pull Request**

### Development Guidelines

- Follow PEP 8 for Python code
- Use TypeScript strict mode
- Write tests for new features
- Update documentation as needed
- Use conventional commits

---

## Troubleshooting

### Common Issues

#### Backend won't start
```bash
# Check if port is in use
lsof -i :8000

# Kill process using port
kill $(lsof -t -i:8000)
```

#### Frontend API calls fail
```bash
# Verify backend is running
curl http://localhost:8000/

# Check CORS settings in backend/.env
```

#### Desktop app won't build
```bash
# Verify Rust is installed
rustc --version

# Update Tauri CLI
npm update @tauri-apps/cli
```

### Getting Help

- 📖 [Documentation](docs/ARCHITECTURE.md)
- 💬 [Issues](https://github.com/Apex-94/manga-reader-app/issues)
- 📝 [API Docs](http://localhost:8000/docs)

---

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [MUI](https://mui.com/) for the beautiful component library
- [FastAPI](https://fastapi.tiangolo.com/) for the excellent API framework
- [Tauri](https://tauri.app/) for enabling desktop deployment
- [SQLModel](https://sqlmodel.tiangolo.com/) for the elegant ORM
- All the manga sources that make this application possible

---

**Happy Reading! 📚🎉**
