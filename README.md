# NutriFlow

NutriFlow is a nutrition, protein, meal-planning, cost, and analytics application being migrated in stages from a stable Vanilla JavaScript PWA to a React/Vite/TypeScript PWA.

## Production Status

The **live production application is still the root Vanilla HTML/CSS/JavaScript PWA** served through GitHub Pages.

Production runtime:

- `index.html`
- `js/storage.js`
- `manifest.json`
- `sw.js`
- `icons/`
- Browser Local Storage
- No runtime framework or backend

The stable rollback release is:

- Release: **NutriFlow Vanilla v1.0.0**
- Tag: `vanilla-v1.0.0`
- Snapshot: `ddd67751c682fac7a3a4ac2db9c1fa62468427b7`
- Current Vanilla service-worker cache: `nutriflow-v0.6.0`

The React application has **not** replaced production yet.

## React Migration Status

The active React application lives under `react-app/` and uses Vite, React, TypeScript, and a separate React-only Local Storage schema.

Completed React work through Sprint 7 includes:

- React-only v1 storage schema and safe storage helpers
- Persistent Today data
- Persistent Weekly Planner data
- Real saved History
- Ingredient Library
- Daily Staples
- Settings
- Light/Dark Theme Foundation
- Macro Goals
- Option C mobile header
- Hamburger drawer
- Bottom navigation
- Quick Add V2 with quantity selection
- Add more / Add & return flow
- Option C whole-app visual redesign work
- Today dashboard cards and progress
- Weekly and History visual redesigns
- Analytics powered by saved React History
- Recharts-based Protein, Calories, Spend, Macro, and Meal-wise Protein visualizations

React storage is intentionally isolated from the protected Vanilla keys. React must not read, write, reset, or remove:

- `pptd_v5`
- `ppc_v5`
- `ppwk_v5`
- `ppst_v5`
- `ppl_v5`

See `STORAGE_SCHEMA.md` for the locked React v1 storage contract.

## Current Navigation

Bottom navigation is reserved for the main frequent screens:

- Today
- Weekly
- History
- Analytics

The hamburger drawer provides broader navigation and tool flows, including Quick Add, Today tools, Settings, and future roadmap destinations.

Option C – Colorful & Friendly is the locked visual direction for the whole React app. Light mode is the default; dark mode is controlled through Settings.

## Current Analytics

Sprint 7 selected **Recharts** as the chart library.

The implemented Analytics screen uses a seven-day local-calendar History context and includes:

- Protein Trend
- Calories Trend
- Spend Trend
- Macro Trends
- Macro Split
- Meal-wise Protein Split

Macro Split and Meal-wise Protein Split each have an independent selector for the seven-day average or an eligible saved date.

Sprint 7 Task 7.8 — Weight Trend, If Added Later — was intentionally skipped with explicit user approval and is not outstanding required Sprint 7 work.

## Repository

```text
nutriflow/
|-- index.html                       # Live Vanilla production application
|-- js/storage.js                    # Vanilla Local Storage helper
|-- manifest.json                    # Vanilla PWA manifest
|-- sw.js                            # Vanilla service worker
|-- icons/                           # Production install icons
|-- tests/                           # Vanilla PWA smoke tests
|-- react-app/                       # Staged React/Vite/TypeScript application
|   `-- src/storage/                 # React-only v1 storage helpers
|-- STORAGE_SCHEMA.md                # Locked React storage contract
|-- README.md                        # Project overview
|-- CONTRIBUTING.md                  # Workflow and contribution rules
|-- PROJECT_ANALYSIS.md              # Current technical architecture
|-- BACKLOG.md                       # Outstanding work / follow-ups
|-- ROADMAP.md                       # Locked sprint/task sequence
|-- CHANGELOG.md                     # Project change history
`-- DECISIONS.md                     # Architecture decisions
```

## Run the Vanilla Production App Locally

```bash
python -m http.server 4173
```

Then open `http://127.0.0.1:4173/`.

## Run the React App Locally

```bash
cd react-app
npm install
npm run dev
```

Build and primary verification:

```bash
npm run build
npm run verify:nutrition
```

Additional focused verification utilities exist in `react-app/src/domain/` for History integrity, Analytics charts, and Today protein-preview behavior.

## Vanilla PWA Smoke Test

```bash
npm install
npx playwright install chromium
```

Local:

```powershell
$env:PWA_BASE_URL="http://127.0.0.1:4173/"
npm run test:pwa
```

Hosted:

```powershell
$env:PWA_BASE_URL="https://mayank1432.github.io/nutriflow/"
npm run test:pwa
```

## Tags and Releases

Stable production rollback release:

- `vanilla-v1.0.0` — NutriFlow Vanilla v1.0.0

React sprint milestone tags:

- `v0.6.0` — Sprint 5: Quick Add V2
- `v0.7.0` — Sprint 6: Option C App UI Redesign
- `v0.8.0` — Sprint 7: Analytics + Chart Library

These React sprint tags are development milestones. They do **not** mean the React app is already deployed as production.

See `ROADMAP.md` for the locked remaining sequence and `PROJECT_ANALYSIS.md` for the current architecture.
