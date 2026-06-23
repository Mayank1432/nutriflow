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
- Quick Add ingredients are now fully editable after being added.
- Added `ensureEditableIngredient()` to centralize conversion of library-backed ingredients into editable snapshots.
- Prevented nutrition values from being lost when editing library-backed ingredients.
-

### Removed
-

---

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