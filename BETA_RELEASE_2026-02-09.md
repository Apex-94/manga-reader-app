# Beta Release Notes - February 9, 2026

## Release Tag
`v0.9.0-beta.1`

## Summary
This beta focuses on Electron-first runtime stabilization and reader usability fixes.

## Included Changes
- Fixed desktop backend initialization flow by removing false Tauri invoke behavior in Electron runtime.
- Added deterministic frontend backend URL contract via `window.__BACKEND_URL__` fallback handling.
- Expanded backend CORS origins to include `127.0.0.1` desktop frontend ports.
- Reduced Electron BrokenPipe/EPIPE crash popup frequency with targeted main-process guards.
- Improved reader layout stacking so top controls remain clickable at narrower window widths.
- Updated settings UI to use dropdown controls for:
  - default reader mode (`single`, `scroll`)
  - default reading direction (`ltr`, `rtl`)
- Improved categories page header layout resilience on constrained widths.

## Validation
- `frontend`: `npm run build` (pass)
- `frontend`: `npx tsc --noEmit` (pass)
- `electron`: `npm run start` smoke run (pass)

## Deferred
- Full downloads/offline implementation parity
- Scheduler notifications parity
- Tauri runtime parity for this milestone
