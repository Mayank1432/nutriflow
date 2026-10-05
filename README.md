# NutriFlow

NutriFlow is a nutrition, protein, meal-planning, cost, and analytics application being migrated in stages from a stable Vanilla JavaScript PWA to a React/Vite/TypeScript PWA.

## Production Status

The **live production application is the React/Vite/TypeScript PWA**, served through GitHub Pages at https://mayank1432.github.io/nutriflow/.

The site is built and deployed by the **Deploy site** GitHub Actions workflow on every push to `main` (Markdown-only changes are skipped). It publishes:

- `/` — the React app (service-worker cache `nutriflow-react-<build hash>`)
- `/classic/` — a frozen copy of the original Vanilla app (`index.html` and `js/storage.js` only, with no service worker)

The original Vanilla app source stays in the repository root as the rollback path:

- Release: **NutriFlow Vanilla v1.0.0**
- Tag: `vanilla-v1.0.0`
- Snapshot: `ddd67751c682fac7a3a4ac2db9c1fa62468427b7`

To roll back, set **Settings → Pages → Source** to "Deploy from a branch" (`main`, `/ (root)`).

React data and Vanilla data use separate Local Storage keys. Nothing is migrated between them.

## React Migration Status

The active React application lives under `react-app/` and uses Vite, React, TypeScript, and a separate React-only Local Storage schema.

Completed React work through Sprint 10 includes:

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
- Pantry / Stock list with low-stock indicator and staple flag
- Shopping List with manual add, check-off, and clear-completed
- Generate Shopping List from Weekly Planner, Daily Staples, and low-stock pantry items
- Shopping Cost Estimate with budget comparison
- Cost / Protein Table with search, sort, and per-100/per-unit basis handling
- Edit Previous Day in History (change quantity, add a missing item, remove an item)
- History delete safety with a Recently deleted list, restore, and confirmed permanent delete
- Backup & Restore: export all React data to one file and restore it all-or-nothing
- React PWA launch: installable, offline-capable app served at the site root, with the original Vanilla app archived at `/classic/`
- App Info / Help: version and build information plus in-app help

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
|-- index.html                       # Original Vanilla app (rollback source; also published at /classic/)
|-- js/storage.js                    # Vanilla Local Storage helper
|-- manifest.json                    # Vanilla PWA manifest (rollback only, not published)
|-- sw.js                            # Vanilla service worker (rollback only, not published)
|-- icons/                           # Original Vanilla install icons
|-- tests/                           # PWA smoke tests (React app and /classic/ archive)
|-- scripts/                         # Site assembly, check, and local-serve scripts
|-- .github/workflows/               # Deploy site workflow (GitHub Pages)
|-- react-app/                       # React/Vite/TypeScript application (live production)
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

## Run the Original Vanilla App Locally

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

## PWA Smoke Test

The smoke test covers the live React app (manifest, service worker, cache, tab navigation, backup download, offline reload) and the `/classic/` Vanilla archive.

```````````bash
npm install
npx playwright install chromium
``````````

Local: build and serve the assembled site first.

`````````powershell
cd react-app
npm run build
cd ..
node scripts/assemble-site.mjs
node scripts/check-site.mjs
node scripts/serve-site.mjs
````````

Then, in a second terminal:

```````powershell
$env:PWA_BASE_URL="http://localhost:4173/nutriflow/"
npm run test:pwa
``````

Hosted:

`````powershell
$env:PWA_BASE_URL="https://mayank1432.github.io/nutriflow/"
npm run test:pwa
````

## Tags and Releases

Stable production rollback release:

- `vanilla-v1.0.0` — NutriFlow Vanilla v1.0.0

React sprint milestone tags:

- `v0.6.0` — Sprint 5: Quick Add V2
- `v0.7.0` — Sprint 6: Option C App UI Redesign
- `v0.8.0` — Sprint 7: Analytics + Chart Library
- `v0.9.0` — Sprint 8: Shopping List + Pantry Stock
- `v0.10.0` — Sprint 9: History Catch-Up Editing
- `v0.11.0` — Sprint 10: Backup, Export/Import + Local Production Readiness

These React sprint tags are development milestones. The React app has been the live production app since the Task 10.3 launch (see Production Status).

See `ROADMAP.md` for the locked remaining sequence and `PROJECT_ANALYSIS.md` for the current architecture.
