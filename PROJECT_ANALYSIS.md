# Project Analysis

## Current Architecture

NutriFlow currently has two deliberately separated application tracks:

1. The **root Vanilla HTML/CSS/JavaScript PWA**, which remains the live production application.
2. The **React/Vite/TypeScript application under `react-app/`**, which is the staged replacement and has completed the locked roadmap through Sprint 8.

The React application is no longer a mock-only shell, but it has **not** replaced production.

## Live Vanilla Production

Runtime files:

- `index.html` — production application markup, styles, state, calculations, rendering, and actions
- `js/storage.js` — Vanilla Local Storage keys and helper
- `manifest.json` — production manifest
- `sw.js` — production service worker and app-shell cache
- `icons/` — install icons

The production app:

- is hosted through GitHub Pages
- is installable as a PWA
- has no runtime framework or backend
- continues to use the protected Vanilla Local Storage keys
- currently uses service-worker cache `nutriflow-v0.6.0`

Protected Vanilla keys:

- `pptd_v5`
- `ppc_v5`
- `ppwk_v5`
- `ppst_v5`
- `ppl_v5`

Stable rollback release:

- **NutriFlow Vanilla v1.0.0**
- tag: `vanilla-v1.0.0`
- snapshot: `ddd67751c682fac7a3a4ac2db9c1fa62468427b7`

Publishing that release did not change production runtime source.

## React Application Boundary

`react-app/` is a separate Vite + React + TypeScript application.

Current boundaries:

- React uses its own versioned `nutriflow_react_*_v1` Local Storage namespace.
- React storage helpers must not read, write, reset, inspect, or remove protected Vanilla keys.
- React schema version remains `1`.
- React has not replaced the root GitHub Pages production deployment.
- Production PWA/service-worker work remains deferred to the locked production-readiness sprint.

## React Storage Architecture

The locked schema lives in `STORAGE_SCHEMA.md`.

The active React storage family contains approved v1 slices for meta, settings, ingredients, Today, Weekly, History, Daily Staples, Shopping, and Pantry.

`react-app/src/storage/` provides:

- storage-key constants
- TypeScript storage types
- fresh default factories
- safe JSON helpers
- schema/shape validation
- guarded Local Storage access
- store-specific read/write wrappers
- React-only reset allowlisting

The helpers never use `localStorage.clear()`.

## Persisted React Screens and Flows

### Today

Today reads and writes the React Today store and integrates with current History, Ingredients, Daily Staples, and Settings data.

Implemented behavior includes:

- persistent food additions
- persistent quantity/edit/remove flows in approved areas
- Quick Add V2
- custom/Ingredient Library entry flows
- Daily Staples integration
- Today-to-History saving
- History-aware Today rollover/integrity handling
- Today dashboard metrics and progress
- seven-day protein preview
- meal selection and meal-card presentation

### Weekly

Weekly reads/writes the React Weekly store.

Implemented behavior includes persisted plan changes, selected-day workflow, Copy Day, Clear Day, summaries, meal detail, and Option C visual redesign.

### History

History reads real React History storage rather than relying on a purely mock saved-day list.

Implemented behavior includes the real saved-day list/detail, the read-only-first History workflow, History integrity utilities, and Option C History presentation.

Catch-up editing and delete/restore safety remain in the locked future History sprint.

### Ingredient Library and Daily Staples

The React app includes reusable Ingredient Library definitions, custom ingredients, per-100 and per-unit semantics, default quantities/meals where approved, cost/macro data, and Daily Staples definitions with Today integration.

Food entries in Today, Weekly, and History remain snapshots. Later Ingredient Library edits must not silently mutate existing saved entries.

### Settings

Settings uses the persisted React Settings store.

Current implemented settings include light/dark theme, light mode default, Macro Goals, Option C Settings styling, and account/data placeholders where later roadmap work is not yet implemented.

### Shopping List and Pantry / Stock

Pantry / Stock reads and writes the React Pantry store, tracking in-stock status, quantity in stock, a low-stock indicator, and a used-often/staple flag per ingredient.

Shopping reads and writes the React Shopping store. Implemented behavior includes manually added items, check-off/complete tracking, clearing completed items, and Generate Shopping List, which combines the Weekly Planner, Daily Staples, and low-stock Pantry items into a single generated list. Shopping Cost Estimate adds an estimated total cost, a protein-focused shopping view, and budget comparison.

### Cost / Protein Table

The Cost / Protein Table screen derives comparison rows from the Ingredient Library, resolving each ingredient's nutrition basis (per-100 g/ml or per-piece/serving) and computing cost per gram of protein. It supports search, a basis filter (all/per-100/per-unit), and six sort modes (protein, cost, and cost-per-gram-of-protein, each ascending/descending). The screen renders as a sortable table on wide viewports and a card list on narrow viewports, using the app's existing theme tokens for light/dark support.

## React App Shell and Navigation

The final mobile structure is implemented around the Option C mobile header, hamburger drawer, and bottom navigation.

Bottom navigation:

- Today
- Weekly
- History
- Analytics

The drawer carries tool/settings/account/data destinations so Today does not become one oversized tools page.

Option C – Colorful & Friendly is the locked whole-app direction, not a Today-only theme.

## Quick Add V2

Implemented Quick Add behavior includes dedicated full-screen flow, search, category chips, recommended/all-food presentation, quantity selection before add, snapshot creation, **Add more**, **Add & return**, success feedback, and Option C styling.

## Analytics Architecture

Sprint 7 selected **Recharts**.

Analytics uses real saved React History and a seven-day local-calendar context.

Implemented areas:

- Analytics screen shell
- Protein Trend
- Calories Trend
- Spend Trend
- Macro Trends
- Macro Split
- Meal-wise Protein Split

The obsolete 30-day view was removed before the later Sprint 7 trend work.

### Trend Data Rules

Business calculations are performed in domain helpers rather than by Recharts.

Missing/invalid saved data is handled conservatively:

- missing dates are not fabricated as zero observations
- incomplete values are not silently converted to zero
- insufficient-data states are explicit
- current goals are current references, not rewritten as historical goals

### Macro Split

Macro Split uses a 100% horizontal stacked bar and has an independent selector for `7-day Average` or eligible saved dates. Average mode uses complete eligible saved days; selected-date mode uses exact saved-day values.

### Meal-wise Protein Split

Meal-wise Protein Split uses a donut chart across Breakfast, Lunch, Dinner, and Snacks. It has its own independent selector for `7-day Average` or eligible saved dates. Incomplete selected-day values do not produce a misleading partial donut.

### Task 7.8

Sprint 7 Task 7.8 — Weight Trend, If Added Later — was intentionally skipped with explicit user approval. It is optional and is not outstanding required Sprint 7 work.

## Domain and Verification Layer

`react-app/src/domain/` contains framework-independent or narrowly UI-supporting logic including nutrition calculations, core types, History integrity logic, Analytics data derivation, Today protein-preview derivation, and focused verifier scripts.

Current focused verifier files include:

- `verifyNutrition.ts`
- `verifyHistoryIntegrity.ts`
- `verifyAnalyticsCharts.ts`
- `verifyTodayProteinPreview.ts`
- `verifyPantry.ts`
- `verifyShopping.ts`
- `verifyShoppingGeneration.ts`
- `verifyShoppingCostEstimate.ts`
- `verifyCostProteinComparison.ts`

Some older files retain prototype-era names such as `historyMock.ts` or `weeklyMock.ts`; those filenames do not mean the current React application is still globally mock-only.

## Release and Milestone State

Stable live-production release:

- `vanilla-v1.0.0` — Vanilla production rollback

React development milestone tags:

- `v0.6.0` — Sprint 5: Quick Add V2
- `v0.7.0` — Sprint 6: Option C App UI Redesign
- `v0.8.0` — Sprint 7: Analytics + Chart Library
- `v0.9.0` — Sprint 8: Shopping List + Pantry Stock

The React tags are milestone markers, not production-deployment claims.

## Current Compatibility and Safety Rules

- Root Vanilla production remains untouched during ordinary React feature work.
- React must not use protected Vanilla keys.
- React schema changes require separately approved migration planning.
- Export/import and production replacement remain future locked-roadmap work.
- No production replacement occurs before the production-readiness sprint.
- The Vanilla v1.0.0 release remains an explicit rollback path until React production replacement is safely complete.

## Remaining Locked Direction

The next roadmap work begins with Sprint 9 — History Catch-Up Editing. Later locked work covers React export/import and production launch, App Info / Help, account/cloud architecture, login/cloud sync, food image upload and barcode scanner, multi-user sharing, Google Play Store release, and final stabilization.

See `ROADMAP.md` for the exact locked order and task names.
