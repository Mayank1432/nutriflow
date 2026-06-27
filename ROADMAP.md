# Protein Diet Planner Roadmap

Protein Diet Planner is moving from a stable Vanilla JavaScript PWA toward a staged React/Vite architecture. The current app remains the production base until migration tasks are planned, implemented, reviewed, and live-checked.

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

Plan a staged React, Vite, and TypeScript migration covering:

- Existing data and backup compatibility.
- Component and navigation structure.
- GitHub Pages deployment.
- PWA update and offline behavior.
- Playwright smoke tests and future calculation/storage unit tests.
- Reversible migration phases.

### Task 7 - React/Vite App Shell Prototype

Create a minimal mobile-first prototype without porting the full application:

- Today, Weekly, History, and Analytics navigation.
- Tool access for Quick Add, Today Ingredients, custom ingredients, cost comparison, backup, and settings.
- Light and dark theme foundations.
- PWA and GitHub Pages foundations.

The prototype must not present Daily Staples or dishes as user-facing Today concepts.

### Task 8 - Port Storage + Calculations

Port persistence and nutrition logic before feature screens:

- Preserve `pptd_v5`, `ppc_v5`, `ppwk_v5`, `ppst_v5`, and `ppl_v5`.
- Preserve backup export/import compatibility.
- Port calculation and unit-conversion helpers.
- Add focused calculation and storage tests.

### Task 9 - Port Today + Quick Add

Port the core daily workflow:

- Summary metrics and meal-first Today view.
- Today Ingredients editing and meal reassignment.
- Custom ingredients.
- Legacy staple normalization compatibility.
- Quick Add search, categories, quantity prompt, confirmation, and smooth return to Today.

The internal dish model remains a compatibility concern until an approved migration replaces it.

### Task 10 - Analytics + Theme System

- Light/dark themes.
- Settings and editable nutrition/budget targets.
- Weekly averages and protein/spend trends.
- Macro and meal-level analysis.

### Task 11 - PWA Deploy + QA

- GitHub Pages deployment.
- Manifest, service worker, and cache verification.
- Local and hosted PWA smoke tests.
- Android installed-PWA check.
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
