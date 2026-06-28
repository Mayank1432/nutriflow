# NutriFlow Roadmap

NutriFlow is moving from a stable Vanilla JavaScript PWA toward a staged React/Vite architecture. The current app remains the production base until migration tasks are planned, implemented, reviewed, and live-checked.

## Current Direction

- Mobile-first, app-like experience.
- Option C colorful and friendly design.
- Light mode by default with optional dark mode.
- Faster Quick Add and meal-first daily workflows.
- Analytics, graphs, settings, and editable targets.
- Installable and offline-capable GitHub Pages PWA.
- Compatibility with current Local Storage and backup data.

## Sprint 5 Forward Plan

### Task 5 - Documentation Refresh + Workflow Rules

Refresh current-state documentation and record the Main Chat, Sprint Chat, Codex, and QA Chat workflow and authority boundaries.

### Task 6 - Framework Migration Planning

Document a parallel, incremental React, Vite, and TypeScript migration. This task is planning only; it does not create the React app or change the deployed vanilla PWA.

The plan covers data and backup compatibility, module order, GitHub Pages deployment, PWA behavior, testing, and rollback.

### Task 7 - React/Vite App Shell Prototype

Create a minimal mobile-first prototype without porting the full application:

- Today, Weekly, History, and Analytics navigation.
- Tool access for Quick Add, Today Ingredients, custom ingredients, cost comparison, backup, and settings.
- Light and dark theme foundations.
- PWA and GitHub Pages foundations.

The prototype must not present Daily Staples or dishes as user-facing Today concepts.

Current implementation: an isolated shell exists in `react-app/` with static placeholder content, local tab/day state, no Local Storage access, and no PWA registration. Production remains the root vanilla app.

### Task 8 - Port Storage + Calculations

Port persistence and nutrition logic before feature screens:

- Preserve `pptd_v5`, `ppc_v5`, `ppwk_v5`, `ppst_v5`, and `ppl_v5`.
- Preserve backup export/import compatibility.
- Port calculation and unit-conversion helpers.
- Add focused calculation and storage tests.

Current implementation: compatibility-first types and pure calculation helpers are available in `react-app/src/domain/` with mock fixtures and lightweight verification. Real Local Storage access, protected-key integration, data migration, and production feature wiring remain deferred.

### Task 9 - Port Today + Quick Add

Port the core daily workflow:

- Summary metrics and meal-first Today view.
- Today Ingredients editing and meal reassignment.
- Custom ingredients.
- Legacy staple normalization compatibility.
- Quick Add search, categories, quantity prompt, confirmation, and smooth return to Today.

The internal dish model remains a compatibility concern until an approved migration replaces it.

Current implementation: the React prototype demonstrates Today and Quick Add with mock-only state, calculated meal/day totals, quantity editing, removal, entered-quantity additions, and refresh reset. Real storage, library linking, migration, and production integration remain deferred.

### Task 10 - Port Weekly + History

- Port Weekly Planner state, editing, totals, and copy-to-Today behavior.
- Port History rollover, summaries, detail editing, and legacy entry compatibility.
- Verify old History entries and Weekly Plan data before proceeding.

Current implementation: the React Weekly Planner prototype uses mock-only state for calculated summaries, day selection, read-only meals, deep-copy Copy Day, and confirmed Clear Day actions. Real editing, storage, Today transfer, History integration, and production behavior remain deferred.

### Task 11 - Analytics + Theme System

- Light/dark themes.
- Settings and editable nutrition/budget targets.
- Weekly averages and protein/spend trends.
- Macro and meal-level analysis.

### Task 12 - PWA Deploy + QA

- GitHub Pages deployment.
- Correct Vite base configuration for `/nutriflow/`.
- Manifest, service worker, and cache verification.
- Local and hosted PWA smoke tests.
- Android installed-PWA check.
- Production switch and vanilla rollback verification.
- Documentation and release notes.

## Documentation Rule

Every task checks the documents relevant to its impact:

- `README.md`: current features and setup.
- `CHANGELOG.md`: shipped changes.
- `BACKLOG.md`: remaining work and follow-ups.
- `ROADMAP.md`: planned task order.
- `DECISIONS.md`: major product or architecture decisions.
- `PROJECT_ANALYSIS.md`: current architecture and state.
- `CONTRIBUTING.md`: workflow, QA, and cache rules.

## Current Non-Goals

- User accounts, cloud sync, or a backend database.
- Multi-user sharing.
- Barcode scanning or food-image recognition.
- Immediate full rewrite of the working app.
- Native wrapper work before the migrated PWA is stable.
