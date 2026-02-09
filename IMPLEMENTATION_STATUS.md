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
| Downloads UI | Placeholder | Standardized placeholder with explicit “Planned Next”. |
| Updates UI | Placeholder | Standardized placeholder with explicit “Planned Next”. |
| Settings UI | Placeholder | Standardized placeholder with explicit “Planned Next”. |
| API bootstrap contract | Implemented | Frontend uses `window.__BACKEND_URL__` if injected; otherwise defaults to `http://localhost:8000`. |
| Electron backend URL injection | Implemented | `preload.js` exposes `window.__BACKEND_URL__`. |
| Type safety gate | Implemented | Typecheck errors addressed as part of this milestone. |

## Known Deferred
- Download queue implementation and offline chapter persistence
- Scheduler-driven update checks and desktop notifications
- Extension package management UX
- Tauri packaging parity and release validation

## Acceptance Checklist
- [ ] `frontend`: `npm run build`
- [ ] `frontend`: `npx tsc --noEmit`
- [ ] Electron launch sanity check (`npm run electron:dev` from root)
- [ ] Route smoke check for all AppFrame entries
- [ ] Reader flow check (`/manga` -> `/reader` -> back)
