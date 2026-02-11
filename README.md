# PyYomi

Electron-first manga reader with FastAPI backend and React frontend.

## Runtime policy

- Active desktop runtime: `electron/`
- Removed legacy runtime: `desktop/` (Tauri)

## Repository layout

- `frontend/`: React + Vite + MUI UI
- `backend/`: FastAPI + SQLModel + extension scrapers
- `electron/`: Electron shell + packaging
- `.github/workflows/`: CI + release automation
- `docs/`: project documentation

## Quick start

### Local frontend/backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:create_app --reload
```

```bash
cd frontend
npm install
npm run dev
```

### Electron desktop

```bash
npm run frontend:install
npm run electron:install
npm run frontend:build
npm run electron:dev
```

## Build commands

- Frontend typecheck: `npm run frontend:typecheck`
- Frontend build: `npm run frontend:build`
- Electron package (Windows): `npm run electron:build:win`

## Automated release flow

- Push/merge to `main` runs CI.
- `auto-version-tag.yml` creates next SemVer tag on `main`.
- Tag push triggers `release-electron.yml` to build and publish release assets.

## Notes

- Backend URL is injected by Electron preload as `window.__BACKEND_URL__`.
- Frontend falls back to `http://localhost:8000` when not injected.

## License

Apache-2.0
