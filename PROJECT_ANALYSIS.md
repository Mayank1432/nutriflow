# Project Analysis

## Current Architecture

Protein Diet Planner is a static client-side PWA built with HTML, CSS, and Vanilla JavaScript. It has no backend, database, runtime framework, or runtime build step.

Runtime files:

- `index.html`: application markup, inline styles, state, calculations, rendering, and actions.
- `js/storage.js`: global `KEYS` and `LS` persistence helpers.
- `manifest.json`: external web app manifest.
- `sw.js`: external service worker and app-shell cache.
- `icons/`: install icons.

The app is hosted through GitHub Pages and can be installed as a PWA. The current service-worker cache is `protein-planner-v0.5.5`.

Playwright and npm are development-only QA tooling. They do not change the plain HTML/CSS/JavaScript runtime.

No React/Vite migration has started. A staged React/Vite/TypeScript migration is planned in `ROADMAP.md` and accepted in ADR-005.

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
- The current cache name is `protein-planner-v0.5.5`.

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

The current vanilla PWA remains the production base. Planned work proceeds in stages:

1. Framework migration planning.
2. React/Vite app shell prototype.
3. Storage and calculation port with compatibility tests.
4. Today and Quick Add port.
5. Analytics and theme system.
6. PWA deployment and QA.

The migration must preserve Local Storage keys, backup compatibility, calculation behavior, GitHub Pages hosting, and installable/offline PWA behavior.
