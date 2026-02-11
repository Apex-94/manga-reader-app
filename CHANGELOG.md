# Changelog

## v1.0.1 - 2026-02-11

### Added
- Smart disk-backed metadata image cache in backend proxy with bounded size and TTL.
- Settings support for:
  - `downloads.path`
  - `images.cache.enabled`
  - `images.cache.max_bytes`
  - `images.cache.ttl_hours`
- Native download-folder picker in Electron settings.
- Downloaded-file deletion actions:
  - Per item in Downloads page
  - Per chapter in Manga details page

### Changed
- Browse covers now route through backend proxy for improved source compatibility (including MangaHere).
- Reader single-page rendering now clears stale image state and waits for full image load before display.
- Reader single-page mode now prefetches adjacent pages and prioritizes current page fetch.
- Reader auto-zooms very tall pages by fitting width when appropriate.

### Fixed
- Download worker detached SQLAlchemy session (`bhk3`) failure path.
- Source-key normalization/resolution for downloads (`MangaHere` / `MangaKatana` naming mismatch).
- Chapter download path structure now follows:
  - `/path/<manga-name>/<chapter>/<pages>`

### Build Artifacts (Windows)
- `electron/release-electron/Pyyomi-1.0.1-Electron-win.exe`
  - SHA256: `260A2C257A8D005AC46C672EB34E89B0303E2521F7B0B2976642E94CAEE82363`
- `electron/release-electron/Pyyomi-1.0.1-Electron-win.exe.blockmap`
  - SHA256: `0E8BF1A585201227F1D454042EBDC542004B50F723E3C8D296490C6F63EE03C0`
