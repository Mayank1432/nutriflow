# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog.

---

## [Unreleased]

### Added
-

### Changed
-

### Fixed
- Fixed desktop Today Ingredients quantity and macro editing so live multi-digit input keeps focus.
- Removed user-facing Today dish controls while preserving the internal dish data model.
- Migrated legacy Daily Staples into normal Breakfast ingredients and stopped hidden staples from contributing to Today totals.
- Bumped the PWA cache to `protein-planner-v0.5.5`.
- Fixed Today Ingredients live quantity editing so multi-digit input keeps focus.
- Fixed Today ingredient deletion to splice the source meal ingredient instead of leaving ghost rows.
- Added source-path meal reassignment from Today Ingredients while preserving ingredient nutrition data.
- Added History edit ingredient deletion and conservative ghost cleanup on History save.
- Bumped the PWA cache to `protein-planner-v0.5.4`.
- Quick Add ingredients are now fully editable after being added.
- Added `ensureEditableIngredient()` to centralize conversion of library-backed ingredients into editable snapshots.
- Prevented nutrition values from being lost when editing library-backed ingredients.
-

### Removed
-

---
## [0.5.0] - 2026-06-25

### Added

* Added external PWA setup with `manifest.json`, `sw.js`, and install icons.
* Added mobile/install metadata for hosted PWA usage.
* Added service worker app-shell caching for offline reload after first load.
* Added Playwright-based hosted/local PWA smoke automation.
* Added npm scripts for PWA smoke testing:

  * `test:pwa`
  * `test:pwa:headed`

### Changed

* Replaced inline/prototype service worker registration with external `sw.js`.
* Updated README with hosted/PWA smoke test instructions.

### Verified

* GitHub Pages hosting works at the live app URL.
* Manifest is detected by the browser.
* Service worker activates successfully.
* Cache Storage creates `protein-planner-v0.5.0`.
* Offline reload works in real browser testing.
* Playwright PWA smoke test passes against both live GitHub Pages and local static server.

### Notes

* Playwright and npm tooling are dev-only QA tools.
* Runtime app remains plain HTML/CSS/Vanilla JS with Local Storage.

## [0.4.0] - 2026-06-23

### Added
- Added safe planner ingredient clone helpers for Weekly-to-Today transfers.
- Added daily History rollover using app load, focus, and visibility resume detection.
- Added backward-compatible `todayData.dateKey` support.
- Added editable previous History days with Edit, Save, and Cancel flow.

### Changed
- Weekly-to-Today copy now clones ingredient objects to avoid shared references.
- History logging is now separated from normal autosave behavior.
- `autosave()` now saves working state only.
- History edits now use isolated draft state before saving.

### Fixed
- Prevented Weekly-to-Today copy from accidentally updating History.
- Prevented Today and Weekly copied ingredients from sharing object references.
- Preserved custom carbs, fat, fibre, and cost fields during Weekly-to-Today copy.
- Prevented daily rollover from overwriting existing History entries.

## [0.3.0] - 2026-06-21

### Added
- Added `js/storage.js` as a dedicated storage helper file.

### Changed
- Centralized nutrition calculation logic.
- Updated Weekly Planner totals to reuse shared ingredient calculation logic.
- Simplified Today ingredient update lookup logic.
- Improved internal code organization comments and section headers.
- Updated PWA cache list to include `js/storage.js`.

### Fixed
- Fixed piece-unit custom ingredient calculations so piece values calculate per piece instead of per 100.

## [0.1.0] - 2026-06-19

### Added
- Initial Protein Diet Planner application.
- Git version control.
- GitHub repository.
- Project documentation (README, CONTRIBUTING, BACKLOG, PROJECT_ANALYSIS).

### Changed
- Initial project structure.

### Fixed
-

### Removed
-
