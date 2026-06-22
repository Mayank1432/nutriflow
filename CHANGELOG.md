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