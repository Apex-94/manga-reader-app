# Beta Release Notes - February 11, 2026

## Release Tag
`v0.9.0-beta.2`

## Summary
This beta delivers Library add-flow reliability and clearer UX feedback across Browse, Details, Library, and Categories.

## Included Changes
- Added idempotent Library add API response contract in `POST /api/v1/library`:
  - `manga`
  - `created`
  - `alreadyExists`
  - `libraryEntryId`
- Added frontend shared library membership state (`React Query`-backed) to keep Browse/Details/Library synchronized.
- Implemented explicit Library button states:
  - `Add`
  - `Adding...`
  - `In Library`
- Added duplicate-aware feedback:
  - `Already in Library` snackbar when re-adding existing entries.
- Replaced alert-based add feedback with responsive snackbar system:
  - desktop: bottom-right
  - mobile: bottom-center (navigation-safe offset)
- Added quick actions for in-library items:
  - `Open`
  - `Set categories`
  - `Remove`
- Added reusable category assignment picker:
  - multi-select categories
  - inline category creation
  - save assignment diff (add/remove)
- Integrated category assignment entry points from add feedback and in-library menus.
- Fixed card action button readability/contrast for `Add` and `In Library` on artwork overlays.
- Fixed category manga cover rendering by mapping API `thumbnail_url` to proxied `coverUrl` in category cards.

## Artifacts
- `artifacts/beta/v0.9.0-beta.2/frontend-dist.zip`
- `artifacts/beta/v0.9.0-beta.2/manifest.json`
  - SHA256 (`frontend-dist.zip`): `C5E46C96DFEE6172D6DF479B33D46CC0A776EDB7FB8B7A1606FB6568BB74F31B`

## Validation
- `frontend`: `npx tsc --noEmit` (pass)
- `frontend`: `npm run build` (pass)
- `backend`: `python -m py_compile backend/app/api/library.py` (pass)

## Notes
- Library uniqueness remains URL-based (`Manga.url` unique).
- No schema migrations were required in this release.
