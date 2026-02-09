# PyYomi UI Stabilization Status

**Last Updated**: February 9, 2026  
**Milestone**: Electron-first UI stabilization

## Scope Lock
- Desktop runtime in scope: `electron/`
- Deferred runtime: `desktop/` (Tauri)
- Quality gate: `npm run build` and `npx tsc --noEmit` must pass in `frontend/`

## Delivery Matrix

| Area | Status | Notes |
|---|---|---|
| Desktop runtime target | Implemented | Electron is treated as active runtime for this milestone. |
| Tauri runtime | Deferred | Kept in repo; excluded from acceptance criteria. |
| App shell provider ownership | Implemented | Single provider mount (`App.tsx`). |
| Reader shell boundary | Implemented | Reader remains outside `AppFrame`. |
| Primary nav IA | Implemented | Includes Browse, Library, Categories, History, Sources, Downloads, Updates, Settings. |
| Categories API + UI | Partial | Functional endpoints and page; now type-safe with MUI v7 usage. |
| History API + UI | Partial | Functional endpoints and page; snackbar typing stabilized. |
| Downloads UI | Placeholder | Standardized placeholder with explicit "Planned Next". |
| Updates UI | Placeholder | Standardized placeholder with explicit "Planned Next". |
| Settings UI | Placeholder | Standardized placeholder with explicit "Planned Next". |
| API bootstrap contract | Implemented | Frontend uses `window.__BACKEND_URL__` if injected; otherwise defaults to `http://localhost:8000`. |
| Electron backend URL injection | Implemented | `preload.js` exposes `window.__BACKEND_URL__`. |
| Type safety gate | Implemented | Typecheck errors addressed as part of this milestone. |
| Electron startup stability | Implemented | Removed false Tauri invoke path in Electron and aligned runtime base URL resolution. |
| Backend CORS for desktop dev | Implemented | Added `127.0.0.1` origins for common frontend ports. |
| BrokenPipe popup suppression | Implemented | Disabled backend console stream logging in Electron and guarded broken-pipe exceptions in main process. |
| Reader top-bar collision fix | Implemented | Reader nav click-zones no longer overlap top controls/back button at narrow sizes. |
| Reader settings UX | Implemented | Default reader mode and direction now use dropdown selects. |

## Known Deferred
- Download queue implementation and offline chapter persistence
- Scheduler-driven update checks and desktop notifications
- Extension package management UX
- Tauri packaging parity and release validation

## Acceptance Checklist
- [x] `frontend`: `npm run build`
- [x] `frontend`: `npx tsc --noEmit`
- [x] Electron launch sanity check (`npm run start` from `electron/`)
- [ ] Route smoke check for all AppFrame entries
- [ ] Reader flow check (`/manga` -> `/reader` -> back)
