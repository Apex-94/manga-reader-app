# Manga Reader App

A modern, cross-platform manga reader application with a pluggable architecture for extending manga sources. The app features a FastAPI backend with async support and a responsive React frontend.

## Features

- 📖 **Browse & Read Manga**: Discover popular, latest, and search for manga from various sources
- 🔌 **Pluggable Extension System**: Create custom extensions to support additional manga sources
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🔄 **Real-time Updates**: Auto-refreshes library and chapters
- 📚 **Library Management**: Save and organize your favorite manga
- 🌐 **Image Proxy System**: Proxies images through backend to avoid CORS issues
- 🎨 **Modern UI**: Clean, intuitive interface with dark/light mode support
- 📦 **Docker Support**: Easy deployment with Docker Compose

## Technologies Used

### Backend
- **FastAPI**: Modern async API framework
- **Python 3.10+**: Async/await support
- **Beautiful Soup**: HTML parsing for web scraping
- **HTTPX**: Async HTTP client
- **Pydantic**: Data validation and serialization

### Frontend
- **React 18**: Modern UI library
- **Next.js 14**: App router, SSR, and static generation
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Query**: Data fetching and caching
- **Axios**: HTTP client for API requests

## Project Layout

```
.
├── backend/               # FastAPI service and extension system
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── extensions/    # Manga source extensions
│   │   └── main.py        # Application entry point
│   └── requirements.txt   # Python dependencies
├── frontend/              # React/Next.js application
│   ├── src/
│   │   ├── app/           # Pages and layouts
│   │   ├── components/    # Reusable React components
│   │   └── lib/           # API and utility functions
│   └── package.json       # JavaScript dependencies
├── docs/                  # Documentation
├── docker-compose.yml     # Docker Compose configuration
└── README.md              # This file
```

## Quick Start

### Using Docker Compose (Recommended)

```bash
docker compose up --build
```

This will start both the backend and frontend services.

### Running Locally without Docker

#### Backend Setup
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend expects the backend API to be available at `http://localhost:8000/api/v1`. You can customize this by setting `NEXT_PUBLIC_API_URL` in the environment before starting the frontend.

## Usage

1. **Browse Manga**: Use the browse page to discover popular or latest manga
2. **Search**: Use the search bar to find manga by title
3. **Read**: Click on a manga to view chapters and start reading
4. **Manage Library**: Add manga to your library for quick access
5. **Sources**: View and manage available manga sources

## Extension Development

Creating extensions allows you to add support for additional manga sources. See the [Extension Development Guide](docs/extensions.md) for detailed instructions.

## Architecture

The application follows a modular architecture with clear separation between frontend and backend. See the [Architecture Documentation](docs/architecture.md) for more details.

## Contributing

Contributions are welcome! Please feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## License

This project is open source and available under the Apache 2.0 License.
