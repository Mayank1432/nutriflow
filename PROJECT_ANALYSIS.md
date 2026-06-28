# Project Analysis

## Current Architecture

NutriFlow is a static client-side PWA built with HTML, CSS, and Vanilla JavaScript. It has no backend, database, runtime framework, or runtime build step.

Runtime files:

- `index.html`: application markup, inline styles, state, calculations, rendering, and actions.
- `js/storage.js`: global `KEYS` and `LS` persistence helpers.
- `manifest.json`: external web app manifest.
- `sw.js`: external service worker and app-shell cache.
- `icons/`: install icons.

The app is hosted through GitHub Pages and can be installed as a PWA. The current service-worker cache is `nutriflow-v0.6.0`.

Playwright and npm are development-only QA tooling. They do not change the plain HTML/CSS/JavaScript runtime.

A staged React/Vite/TypeScript migration is planned in `ROADMAP.md` and accepted in ADR-005. Its first isolated shell prototype exists in `react-app/`; no production feature or data port has started.

### React Prototype Boundary

- `react-app/` is a separate Vite, React, and TypeScript package.
- It provides static Today, Weekly, History, and More shell screens.
- It uses local React state only for active navigation and the selected weekly day.
- It does not read or write Local Storage.
- It does not register a service worker or provide production PWA behavior.
- It does not replace or modify the root vanilla production app.
- The root PWA cache remains `nutriflow-v0.6.0`.

### React Mock Domain Layer

`react-app/src/domain/` contains the first compatibility-focused TypeScript port:

- `types.ts`: permissive types for ingredients, dishes, meals, Today, Weekly Plan, and legacy History shapes.
- `nutrition.ts`: pure calculations for per-100, per-unit, meal, day, planner, History, conversion, and display rounding behavior.
- `fixtures.ts`: hardcoded mock library and compatibility fixtures only.
- `verifyNutrition.ts`: lightweight expected-total, finite-output, and non-mutation checks.

Library lookup is supplied explicitly to calculation functions as mock data. The domain layer has no browser API access, does not reference production storage keys, and does not read, migrate, normalize, or save real data. A real storage adapter and production integration remain deferred.

### React Today Prototype

The prototype Today screen now renders its hardcoded `meals -> dishes -> ingredients` fixture through local React state and the mock domain helpers.

- Daily and meal totals recalculate after mock additions, quantity changes, and removals.
- Protein and calorie progress plus carbs, fat, fibre, and cost summaries are calculated from state.
- Breakfast, Lunch, Dinner, and Snacks remain expanded and support empty states.
- Quick Add uses an accessible bottom sheet and entered-quantity nutrition values.
- Quantity edits scale the item's base nutrition by ratio through pure, non-mutating helpers.
- Refreshing restores the original fixture.

This screen still has no Local Storage, export/import, History, Weekly Planner, library linking, migration, or production PWA integration.

### React Weekly Planner Prototype

The Weekly screen uses a seven-day mock fixture and local React state.

- Only one selected day is shown at a time.
- Week totals and planned-day averages use the pure nutrition helpers.
- Selected-day summaries cover protein, calories, carbs, fat, fibre, and cost.
- Today meal and ingredient components are reused in read-only mode.
- Empty days and empty meals have explicit states.
- Copy Day deep-clones the selected mock day into another day.
- Clear Day requires confirmation and replaces the selected day with an empty mock shape.
- Refreshing restores the original mock week.

The Weekly prototype has no Local Storage, planner editing forms, Quick Add, Today transfer, History logging, export/import, migration, or production PWA integration.

### React History Prototype

The History screen uses five newest-first mock saved days and local selection state.

- Summary averages are calculated from mock saved-day meal data.
- Saved-day cards show date, day name, protein, calories, cost, fibre, meal count, and a mock status badge.
- The newest day is selected by default.
- Selected details show all six nutrition totals and Breakfast, Lunch, Dinner, and Snacks in read-only mode.
- Empty meals use explicit placeholders, and an empty-history component covers a future zero-day state.
- Refreshing resets selection to the newest mock day.

History has no Local Storage, production schema, migration, real saved data, editing, deletion, restore, copy, search, filters, export/import, or production PWA integration.

## User-Facing Areas

- Today: summary metrics, meal tabs, meal ingredient rows, Quick Add, custom ingredients, and the editable Today Ingredients table.
- Weekly Plan: ingredients grouped by date and meal, with copy-to-Today behavior.
- History: recent day summaries and editable previous-day details.
- Cost / Protein Table.
- Backup export and import.

Today is meal-first. Users do not see dish controls or a fixed Daily Staples section. Today Ingredients supports quantity and nutrition edits, meal reassignment, and source-path deletion.

Old History entries may still display legacy Staples or dish-style information so historical data remains readable.

## State and Data Flow

The app uses global mutable state and direct state-to-DOM rendering:

1. `js/storage.js` defines `KEYS` and `LS`.
2. `index.html` loads persisted state from Local Storage.
3. Startup compatibility logic fills missing meal buckets and normalizes active legacy staples.
4. Render functions derive totals and replace targeted DOM sections.
5. Inline event handlers call global action functions.
6. Actions update state, persist through `autosave()`, and rerender the affected UI.

Important state:

- `todayData`: the active day, including `dateKey` and meals.
- `custom`: custom ingredient library.
- `weekPlan`: planned ingredients by date and meal.
- `log`: History entries.
- `staples`: retained compatibility state that is normally empty after normalization.

## Today Data Model

The internal Today model remains:

```text
meals -> dishes -> ingredients
```

This shape is preserved for existing Local Storage data, backups, Weekly-to-Today copying, and History compatibility. The Today UI flattens ingredients for display and hides the dish concept from users. New Quick Add, custom, and copied ingredients are placed into an internal default dish.

Library-backed ingredient example:

```js
{
  libId: 'chicken',
  name: 'Chicken breast (raw)',
  qty: 100,
  unit: 'g'
}
```

Editable snapshot example:

```js
{
  name: 'Tofu',
  qty: 100,
  unit: 'g',
  pr100: 12,
  kc100: 100,
  carb100: 2,
  fat100: 6,
  fibre100: 1,
  pp100: 40
}
```

Library and custom-library nutrition values are stored per unit. Editable `pr100`, `kc100`, and related fields mean per 100 g/ml, but per piece when `unit === 'piece'`.

Quantity-only edits preserve `libId`. Direct edits to name, unit, macros, or cost use `ensureEditableIngredient()` to detach a library-backed ingredient into an editable snapshot.

## Legacy Staples

Today no longer presents Daily Staples as a separate feature. On startup and import, active legacy staples are converted into normal Breakfast ingredients, deduplicated when necessary, and removed from active staple state.

The compatibility flow:

- Accepts legacy staples from the top-level `staples` state or `todayData.staples`.
- Converts per-unit nutrition into the normal editable field representation.
- Preserves `libId` and piece-unit values where present.
- Adds converted items to an internal Breakfast dish.
- Clears active staple storage so repeated reloads do not duplicate ingredients.

`calcDayLog()` continues to understand old History entries containing staples. History cleanup is deferred because old data must remain readable.

## Nutrition Calculations

- `qtyFactor(unit, qty)`: uses `qty / 100` for g/ml and `qty` for pieces.
- `calcFromP100(item)`: calculates editable/ad hoc ingredient totals.
- `calcFromPerUnit(food, qty)`: calculates library/custom-library totals.
- `calcIngr(ingredient)`: selects the correct calculation path.
- `calcDish(dish)`, `calcMealToday(mealId)`, and `calcAll()`: aggregate Today totals.
- `calcPlanDay(dateKey)`: aggregates Weekly Plan totals through shared ingredient logic.
- `calcDayLog(entry)`: aggregates current and legacy History shapes.
- `pu2p100()` and `p100pu()`: convert g/ml display values while leaving piece values per piece.

Weekly-to-Today copy deep-clones ingredient objects and does not recalculate, convert units, remove `libId`, or mutate the source plan.

## Persistence

`KEYS` and `LS` live in `js/storage.js` and must not be moved back into `index.html`.

Current Local Storage keys:

- `pptd_v5`: Today data.
- `ppc_v5`: custom ingredient library.
- `ppwk_v5`: Weekly Plan.
- `ppst_v5`: legacy staple compatibility state.
- `ppl_v5`: History log.

Export/import preserves the current backup structure, including `custom`, `log`, `weekPlan`, `staples`, and `todayData`. Storage keys and exported field names must remain compatible unless a separately approved migration is provided.

Normal autosave persists working state. History logging is intentionally separated from ordinary autosave and Weekly-to-Today copy. Daily rollover and explicit History actions control History snapshots.

## PWA

- `manifest.json` provides install metadata.
- `sw.js` caches the app shell for offline reload.
- `tests/pwa-smoke.spec.js` verifies hosted or local service-worker registration, cache creation, and offline reload.
- The current cache name is `nutriflow-v0.6.0`.

When `index.html` changes, the cache name in `sw.js` and the expected name in the PWA smoke test must be updated together. `skipWaiting()` and `clients.claim()` are not part of the approved update strategy.

## Current Compatibility Risks

- Import validation and versioned migration are limited.
- Old History entries can retain legacy Staples and dish-style display.
- The internal dish shape remains coupled to compatibility code even though Today hides it.
- Autosave debounce can lose a very recent change if the page closes immediately.
- Custom ingredient ID generation should be made collision-safe.
- Weekly custom-item fields and meal selection need further review.
- User/imported string escaping is not uniform across every inline handler context.

## Planned Direction

The current vanilla PWA remains the production base. The migration will run in parallel and port modules incrementally; it is not a big-bang rewrite. The React version must not replace the live app until compatibility, PWA, hosted, and installed-Android checks pass.

### Target Architecture

- React, Vite, and TypeScript with simple, pragmatic types.
- No state-management library unless component state and focused context become insufficient.
- A Local Storage adapter that preserves safe JSON parsing and serialization behavior.
- Framework-independent nutrition calculation utilities.
- Legacy normalization and migration helpers.
- Export/import compatibility helpers.
- Mobile-first, app-like UI with bottom navigation for core sections.
- Light mode by default, with dark mode added later.
- A Vite-compatible PWA strategy handled during the final deployment task.
- Optional Capacitor Android packaging only after the React PWA is stable.

The React UI must preserve the current meal-first Today experience: no user-facing dish UI, no fixed Daily Staples section, normal ingredients across meals, smooth Quick Add, and Today Ingredients edit, delete, and move behavior.

The isolated React prototype now has shared UI patterns for headers, notices, summaries, macros, progress, statuses, meal and ingredient cards, empty states, and four-tab navigation. Real storage integration, schema handling, and migration remain deferred.

### Data Compatibility Plan

The first React port must preserve these keys:

- `pptd_v5`
- `ppc_v5`
- `ppwk_v5`
- `ppst_v5`
- `ppl_v5`

The storage adapter will read and write the existing formats without a schema-breaking migration. Compatibility work must cover:

- Safe JSON parsing and stringifying.
- Existing exports, imports, and representative old backup files.
- Startup normalization for legacy Today staples.
- Old History entries containing staples or dish-style data.
- The internal `meals -> dishes -> ingredients` shape during the initial port.
- Existing piece-unit, library-backed, and editable snapshot calculations.

Any later schema change needs a separately approved, versioned migration and rollback plan.

### Module Porting Order

1. Types and storage adapter.
2. Nutrition calculation utilities.
3. Normalization helpers.
4. Export/import helpers.
5. Today and Quick Add.
6. Weekly Planner.
7. History.
8. Analytics and theme system.
9. PWA deployment.

Each phase should be testable before the next feature area is ported.

### Deployment and Rollback

The React prototype may live in a dedicated subfolder such as `react-app/` in a later task. Development should use small feature branches while `main` and the deployed vanilla app stay stable.

GitHub Pages will serve this project from `/nutriflow/`, so Vite will need the correct base configuration. The current service worker remains unchanged during planning and feature porting. The React PWA strategy and production switch belong to the final deploy task.

Before switching production:

- Verify existing Local Storage and old backup compatibility.
- Run local and hosted PWA checks.
- Check the installed Android PWA.
- Confirm offline behavior and update behavior.
- Keep the vanilla release available as the rollback path until React parity is confirmed.
