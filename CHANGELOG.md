# Changelog

All notable changes to NutriFlow are documented here.

The format is based on Keep a Changelog.

---

## [Unreleased]

### Documentation
- Refresh repository documentation to match the implemented React state through Sprint 7.
- Record the stable Vanilla production release and current sprint milestone tags.
- Align workflow documentation with current Git ownership, three-batch Git flow, meaningful merge messages, and sprint-tag reminders.

No runtime behavior is changed by this documentation refresh.

## [vanilla-v1.0.0] — Stable Vanilla Production Release

### Release
- Published **NutriFlow Vanilla v1.0.0** as the stable release of the original HTML/CSS/Vanilla JavaScript PWA.
- Release tag: `vanilla-v1.0.0`.
- Production snapshot: `ddd67751c682fac7a3a4ac2db9c1fa62468427b7`.
- The release remains the rollback production version while React migration work continues.
- Publishing the release did not alter the production runtime.

## [v0.8.0] — Sprint 7: Analytics + Chart Library

### Added
- Selected Recharts as the React Analytics chart library.
- Added the Analytics screen shell using a seven-day local-calendar History context.
- Added Protein Trend with current goal reference and seven-day average.
- Added Calories Trend.
- Added Spend Trend.
- Added Macro Trends for protein, carbs, fat, and fibre.
- Added Macro Split with seven-day-average / saved-date selection.
- Added Meal-wise Protein Split for Breakfast, Lunch, Dinner, and Snacks using a donut chart with an independent selector.
- Added/expanded focused Analytics verification utilities.

### Changed
- Removed the obsolete 30-day Analytics mode before later Sprint 7 trend work.
- Kept business-data derivation in domain helpers rather than delegating calculations to Recharts.
- Preserved explicit empty, insufficient, zero, and incomplete-data states.

### Roadmap
- Sprint 7 Task 7.8 — Weight Trend, If Added Later — was intentionally skipped with explicit user approval.
- Sprint 7 required work therefore ends at Task 7.7.

Tag target: `2a0c62fe4f83f0c99398ec8a7db201e1af904a60`.

## [v0.7.0] — Sprint 6: Option C App UI Redesign

### Changed
- Applied the locked Option C – Colorful & Friendly visual direction across the React app.
- Added/refined Today dashboard cards and Protein/Calories progress.
- Added the meal selector / selected meal-card presentation.
- Redesigned Quick Add, Weekly, History, and Settings-related surfaces.
- Preserved light mode as default and dark mode through Settings.
- Added visual-alignment correction work without changing protected storage/domain semantics.

Tag target: `56756b61868b401c25d37a4fc726bbc5e0243966`.

## [v0.6.0] — Sprint 5: Quick Add V2

### Added
- Quick Add library UI with search, category chips, recommended foods, and all-food browsing.
- Quantity selection while adding.
- Add more and Add & return flows.
- Success/return behavior integrated with the selected Today meal.

Tag target: `53ecb621f2038cfd0fa834fa4ca608b9ceddbb1c`.

## React Migration Foundation Before v0.6.0

### Added / Changed
- Created the isolated Vite + React + TypeScript application under `react-app/`.
- Added React domain nutrition helpers and focused verification.
- Locked the fresh React-only v1 storage schema.
- Implemented safe React storage helpers.
- Persisted Today and Weekly data.
- Added real saved History.
- Added core data/editing fixes.
- Added Ingredient Library and Daily Staples workflows.
- Added Settings, persisted light/dark theme, and Macro Goals.
- Added Option C mobile header, hamburger drawer, and bottom navigation.

The root Vanilla production PWA remained the live app during this work.

## Vanilla Maintenance After 0.5.0

### Changed / Fixed
- Renamed the project/product to NutriFlow and updated the GitHub Pages slug.
- Updated PWA metadata/cache naming to `nutriflow-v0.6.0`.
- Improved Today ingredient editing and source-path deletion/reassignment.
- Removed user-facing Today dish controls while preserving compatibility data structures.
- Normalized legacy Daily Staples into the meal-first Today workflow.
- Preserved old History compatibility behavior.
- Kept Playwright/npm tooling development-only.

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
