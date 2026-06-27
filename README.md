# Protein Diet Planner

Protein Diet Planner is a lightweight, browser-based app for tracking daily protein, nutrition, and food cost. It runs entirely in the browser, stores data in Local Storage, and requires no account, backend, or runtime build step.

## Features

- Meal-first Today view for breakfast, lunch, dinner, and snacks.
- Daily protein, calories, macros, fibre, and cost tracking.
- Built-in and custom ingredient libraries.
- Editable Today Ingredients table with quantity, nutrition, cost, meal reassignment, and delete controls.
- Weekly ingredient planning with Weekly-to-Today copy.
- Last-30-days History with editable previous days.
- Cost-per-gram-of-protein comparison.
- JSON backup export and import.
- Installable PWA with an offline app shell.

Today does not expose dishes or a fixed Daily Staples section. The internal `meals -> dishes -> ingredients` structure remains for data compatibility, and legacy Today staples are normalized into normal Breakfast ingredients.

## Stack

- HTML5 and CSS3
- Vanilla JavaScript
- Browser Local Storage
- External `manifest.json` and `sw.js`
- Playwright for development-only PWA smoke testing

The runtime app has no backend, framework, or build step. A staged React/Vite migration is planned but has not started.

## Repository

```text
Protein Diet Planner/
|-- index.html              # Runtime application
|-- js/storage.js           # Local Storage keys and helper
|-- manifest.json           # PWA manifest
|-- sw.js                   # Service worker and app-shell cache
|-- icons/                  # Install icons
|-- tests/                  # Playwright PWA smoke test
|-- README.md               # User and developer overview
|-- CONTRIBUTING.md         # Workflow and contribution rules
|-- PROJECT_ANALYSIS.md     # Current technical architecture
|-- BACKLOG.md              # Pending work
|-- ROADMAP.md              # Planned task sequence
`-- DECISIONS.md            # Architecture decisions
```

## Run Locally

The page can be opened directly for basic use. Serve the repository over HTTP to test service-worker and install behavior:

```bash
python -m http.server 4173
```

Then open `http://127.0.0.1:4173/`.

The hosted app is deployed through GitHub Pages.

## PWA Smoke Test

Install development dependencies and Playwright Chromium once:

```bash
npm install
npx playwright install chromium
```

Run against the local server from another PowerShell terminal:

```powershell
$env:PWA_BASE_URL="http://127.0.0.1:4173/"
npm run test:pwa
```

Run against GitHub Pages:

```powershell
$env:PWA_BASE_URL="https://mayank1432.github.io/protein-diet-planner/"
npm run test:pwa
```

See `ROADMAP.md` for planned migration and product work. Detailed current internals live in `PROJECT_ANALYSIS.md`.
