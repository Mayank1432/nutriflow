# Project Analysis

## Architecture Overview

Protein Diet Planner is a static, client-side diet tracking application. The app is designed to work without a server, build step, framework, package manager, or database.

The active application is implemented almost entirely in `index.html`:

- HTML defines the visible app shell and view containers.
- Inline CSS defines all layout, colors, controls, cards, tables, tabs, and responsive behavior.
- Inline JavaScript defines state, storage, calculations, rendering, event handlers, export/import, and basic PWA setup.
- An inline web app manifest is embedded as a data URL.
- An inline service worker is generated from a JavaScript string and registered through a blob URL.

Other repository files:

- `README.md`: project overview, usage, feature list, technologies, and roadmap.
- `CONTRIBUTING.md`: contribution rules focused on minimal changes, Local Storage compatibility, no frameworks, and direct `index.html` support.
- `BACKLOG.md`: planned bugs, refactors, and feature ideas.
- `script.js`: empty placeholder.
- `style.css`: empty placeholder.
- `PROJECT_ANALYSIS.md`: this analysis document.

There is no module system. The JavaScript relies on global constants, global mutable state, helper functions, render functions, and inline DOM event attributes such as `onclick`, `onchange`, and `oninput`.

Main UI areas:

- Header metrics for today's protein, today's cost, seven-day spend, and 30-day average.
- Daily staples section.
- View tabs for Today, Weekly Plan, and History.
- Today view with meal tabs, meal panels, editable ingredient table, and quick-add form.
- Weekly Plan view with current-week day tabs and planned ingredients.
- History view with last-30-days summaries and day details.
- Cost per gram of protein table.
- Backup and restore controls.

## Data Flow

The app follows a direct state-to-DOM flow:

1. Browser loads `index.html`.
2. Constants and helper functions are defined.
3. Persistent state is read from Local Storage using `LS.get`.
4. Missing meal buckets are patched into `todayData` for compatibility.
5. Global UI state is initialized, including current view, current meal, selected history date, selected weekly day, and temporary form state.
6. `render()` runs once at startup.
7. Render functions calculate totals from global state and replace DOM sections with generated HTML strings.
8. User actions call global functions through inline event handlers.
9. Those functions mutate global state directly.
10. Most state changes call `autosave()`.
11. `autosave()` waits 800ms, writes state to Local Storage, snapshots today into the history log, trims old history entries, and updates the saved timestamp.
12. Action handlers call targeted render functions or full `render()` to refresh the UI.

The app does not use a central store, virtual DOM, router, controller layer, or immutable state updates.

Important state objects:

- `custom`: custom ingredient library entries.
- `log`: saved daily history.
- `weekPlan`: planned ingredients by date and meal.
- `staples`: daily staple foods and checked states.
- `todayData`: today's meals, dishes, and ingredients.
- `dishForms`: transient UI state for add-dish/add-ingredient forms.

## Ingredient Model

The app uses multiple ingredient shapes. This is one of the most important things to preserve when changing code.

### Built-In Library Ingredients

Built-in foods live in `LIB`.

They store nutrition and cost as per-unit values:

```js
{
  n: 'Chicken breast (raw)',
  u: 'g',
  s: 25,
  max: 250,
  pp: 122 / 235,
  pr: 0.225,
  kc: 1.20,
  carb: 0,
  fat: 0.031,
  fibre: 0,
  t: 'p'
}
```

Fields:

- `n`: display name.
- `u`: unit, usually `g`, `ml`, or `piece`.
- `s`: default serving or quantity step.
- `max`: optional max quantity.
- `pp`: price per unit.
- `pr`: protein per unit.
- `kc`: calories per unit.
- `carb`: carbs per unit.
- `fat`: fat per unit.
- `fibre`: fibre per unit.
- `t`: type, currently `p` or `v`.

### Custom Library Ingredients

Custom foods created through the Today quick-add form are stored in `custom`.

Users enter values as per-100, but the app converts them to per-unit before storing:

```js
custom[id] = {
  n: name,
  u: unit,
  s: step,
  max: null,
  pp: pp100 / 100,
  pr: pr100 / 100,
  kc: kc100 / 100,
  carb: carb100 / 100,
  fat: fat100 / 100,
  fibre: fibre100 / 100,
  t: type
}
```

These custom entries behave like `LIB` entries and are referenced through `libId`.

### Today Meal Ingredients

Ingredients inside dishes can be library-backed or ad hoc.

Library-backed ingredient:

```js
{
  libId: 'chicken',
  name: 'Chicken breast (raw)',
  qty: 100,
  unit: 'g'
}
```

Ad hoc ingredient:

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

Ad hoc ingredients store per-100 values directly.

### Staples

Staples are separate from `todayData` but included in daily calculations when checked.

```js
{
  id: 'st_egg',
  name: 'Whole egg',
  qty: 5,
  unit: 'piece',
  pr: 6,
  kc: 78,
  carb: 0.6,
  fat: 5,
  fibre: 0,
  pp: 250 / 30,
  checked: true,
  mealId: 'breakfast'
}
```

Staples use per-unit values and are assigned to a meal through `mealId`.

### Weekly Plan Ingredients

Weekly plan items are grouped by date key and meal ID:

```js
weekPlan[dateKey][mealId] = [
  { libId, name, qty, unit },
  { name, qty, unit, pr100, kc100, pp100 }
]
```

Library-backed weekly items use `libId`. Custom weekly items use per-100 values but currently collect only protein, calories, and cost from the Weekly Plan UI.

## Local Storage Model

Local Storage is the only persistence layer.

Storage helper:

```js
const LS = {
  get(k) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : null;
    } catch (e) {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {}
  }
};
```

Storage keys:

- `pptd_v5`: `todayData`, including meals, dishes, ingredients, and collapsed states.
- `ppc_v5`: `custom`, the custom ingredient library.
- `ppwk_v5`: `weekPlan`, the weekly planner state.
- `ppst_v5`: `staples`, including quantities, checked states, nutrients, and meal assignments.
- `ppl_v5`: `log`, the daily history log.

Autosave behavior:

- Debounced by 800ms using `saveTimer`.
- Writes `todayData`, `custom`, `weekPlan`, and `staples`.
- Creates a deep-copy snapshot of `{ meals: todayData.meals, staples }`.
- Saves that snapshot as `log[todayKey()]`.
- Adds `savedAt`.
- Sorts log keys and keeps only the latest 30 entries.
- Writes `log`.
- Updates the `saved-ts` DOM label.

Backup behavior:

- `exportData()` downloads JSON containing `version`, `exportedAt`, `custom`, `log`, `weekPlan`, `staples`, and `todayData`.
- `importData(input)` parses a selected JSON file, conditionally replaces matching state objects, writes all storage keys, and rerenders.

Compatibility concerns:

- Existing storage keys must be preserved.
- Existing object shapes must remain readable.
- Import/export should remain compatible with current backup files.
- No migration layer currently exists despite `version: 5` in exports.

## Main Functions

### Constants and Lookup

- `fd(id)`: returns an ingredient from `LIB` or `custom`.
- `clamp(id, v)`: clamps quantity based on a food's optional `max`; currently not widely used.

### State Initialization

- `blankDay()`: creates a day object with meal buckets for all entries in `MEAL_DEFS`.
- Startup meal patching ensures any missing meal ID exists in loaded `todayData`.

### Persistence

- `LS.get(k)`: reads and parses Local Storage JSON.
- `LS.set(k, v)`: serializes and writes Local Storage JSON.
- `autosave()`: debounced persistence plus daily history logging.

### Dates

- `todayKey()`: current local date as `YYYY-MM-DD`.
- `pad(n)`: two-character numeric padding.
- `getWeekDays()`: current Monday-to-Sunday week as date keys.
- `fmtDate(k)`: short date display.
- `fmtDateFull(k)`: weekday/month/day/year display.
- `last30Keys()`: rolling 30 date keys.

### Calculations

- `zero()`: creates an empty totals accumulator.
- `addV(a, b)`: adds two totals accumulators.
- `calcRow(r)`: calculates totals for per-unit rows such as staples and library foods.
- `calcIngr(ing)`: calculates one dish ingredient, using `libId` for per-unit library/custom-library foods or `pr100`/`kc100` fields for ad hoc foods.
- `calcDish(dish)`: sums ingredients in a dish.
- `calcMealToday(mId)`: sums checked staples assigned to the meal and dish ingredients in that meal.
- `calcAll()`: sums all checked staples and all dish ingredients for today.
- `calcDayLog(entry)`: calculates totals for a saved history entry.
- `last7Cost()`: sums logged cost for the last 7 date keys.
- `last30Avg()`: averages logged protein over available logged days.
- `calcPlanDay(dateKey)`: calculates weekly plan totals for a date.
- `pu2p100(pu, unit)`: converts per-unit values to per-100 display values, except pieces stay per-piece.
- `p100pu(v, unit)`: converts per-100 display values back to per-unit storage, except pieces stay per-piece.

### Rendering

- `render()`: top-level render for the Today view and shared sections.
- `renderBars()`: summary cards and progress bars.
- `renderStaples()`: staple rows.
- `renderMealTabs()`: meal tabs with protein totals.
- `renderMealPanels()`: active meal, dishes, and dish ingredient rows/forms.
- `renderIngrForm(mId, di)`: add-ingredient form for a dish.
- `renderAllIngr()`: editable combined table of checked staples and today's dish ingredients.
- `renderLibPills()`: quick-add library/custom food buttons.
- `renderCostTable()`: protein cost comparison table.
- `renderWeekPlan()`: current-week planner UI.
- `renderHistory()`: last-30-days grid.
- `renderHistDetail(key)`: selected history day details.

### User Actions

- View switching: `showView(v)`.
- Staples: `stToggle`, `stStep`, `stQty`, `stMeal`, `updateSt`, `stQtyRow`, `updateStPer`.
- Meal/dish actions: `switchMeal`, `toggleMeal`, `openDishForm`, `closeDishForm`, `commitDish`, `removeDish`.
- Ingredient actions: `toggleIngrForm`, `closeIngrForm`, `commitIngr`, `addLibIngrToDish`, `removeIngr`, `quickAddLib`, `addCustomIngr`, `updateIngr`, `updateIngrQty`, `ingrStep`, `updateIngr100`.
- Weekly plan actions: `initWkDay`, `selWkDay`, `wkStep`, `wkSetQty`, `removeWkItem`, `addWkLib`, `addWkCustom`, `clearWeekDay`, `copyPlanToToday`.
- Backup: `exportData`, `importData`.

## Existing Features

- Static browser app that can run by opening `index.html`.
- Daily protein, cost, seven-day spend, and 30-day average metrics.
- Protein target progress bar.
- Seven-day budget progress bar.
- Built-in food library.
- Custom food creation.
- Daily staples with checkboxes, quantities, and meal assignment.
- Meal categories: breakfast, lunch, dinner, snacks.
- Meal tabs with per-meal protein totals.
- Add/remove dishes.
- Add/remove ingredients inside dishes.
- Add library/custom-library foods to dishes.
- Add ad hoc ingredients with nutrition and cost values.
- Editable all-ingredients table.
- Quantity steppers and numeric inputs.
- Per-100 nutrition/cost editing.
- Automatic debounced Local Storage persistence.
- Automatic daily logging.
- Last-30-days history overview.
- History day detail view.
- Weekly ingredient plan for the current week.
- Weekly plan item quantity controls.
- Weekly plan clear-day action.
- Copy weekly plan for today into Today meals.
- Cost per gram of protein comparison table.
- JSON export backup.
- JSON import restore.
- Inline PWA manifest.
- Basic service worker registration when served in a compatible browser context.

## Known Bugs

Known from code review and `BACKLOG.md`:

- Editing quantity is listed in the backlog as resetting nutrition values. In current code, quantity edits call `updateIngrQty()` and should only change `qty`; however related editing paths still need testing because library detachment and per-100 conversion are fragile.
- Quick Add ingredients should remain editable is listed in the backlog. Quick-added foods are library-backed through `libId`, and editing some fields detaches them from the library.
- `todayData` is not keyed by date and does not automatically reset on a new day. Opening the app tomorrow may show yesterday's current meal data under today's label.
- `uid` is initialized with `Object.keys(custom).length`, so custom IDs can collide after deletion, import, or non-contiguous IDs.
- Changing a library-backed ingredient's `unit` in `updateIngr()` clears `libId` without copying the library's nutrition fields first. The ingredient can then calculate as zero.
- Changing a staple's `unit` does not convert existing per-unit nutrition/cost values, so values may be reinterpreted incorrectly.
- `met()` has malformed template output: an extra `}` appears in the generated `<div class="mv"...>` markup.
- Autosave is debounced, so closing the page within 800ms of a change can lose that change.
- Seven-day spend reads from `log`, so it can lag behind visible today totals until autosave logs today.
- `addWkLib()` uses the Today quick-add meal selector `in-meal` to choose the weekly meal, even though that selector is hidden while using Weekly Plan.
- `addWkCustom()` always assigns custom weekly items to `snacks`.
- Weekly custom plan items collect only protein, calories, and cost; when copied to Today, carbs, fat, and fibre are set to zero.
- Import accepts arbitrary object shapes without validation or migration.
- Some rendered text is escaped with `esc()`, but not every interpolation is protected equally, especially imported data and inline handler contexts.
- Service worker caching only adds `'.'`, which is minimal and may not provide robust offline behavior.
- The inline manifest and service worker approach may behave differently when opened as a local file versus served over HTTP.

## Duplicate Logic

Several concepts are implemented more than once:

- Per-unit versus per-100 calculation is repeated in `calcIngr()` and `calcPlanDay()`.
- Library item total calculation appears in `calcIngr()` and again inline inside `calcPlanDay()`.
- Custom per-100 item total calculation appears in `calcIngr()` and again inline inside `calcPlanDay()`.
- Rendering-time per-100 display conversion is repeated for staples and ingredients in `renderAllIngr()`.
- Quantity parsing and clamping appears in `stQty`, `stQtyRow`, `updateIngrQty`, `ingrStep`, `wkStep`, and `wkSetQty`.
- Add-from-library behavior is similar in `addLibIngrToDish`, `quickAddLib`, and `addWkLib`.
- Custom ingredient parsing is similar in `commitIngr`, `addCustomIngr`, and `addWkCustom`.
- Totals are recomputed independently in render functions rather than cached or centralized.
- Protein threshold color logic is repeated in daily metrics, weekly plan progress, and history rendering.
- Backup/import and autosave both manually write multiple Local Storage keys.

## Possible Improvements

Keep improvements minimal and compatible with the contribution rules.

- Add a small date-aware wrapper around `todayData` so the app can safely handle new-day rollover without breaking existing `pptd_v5` data.
- Centralize ingredient calculation into one helper that both `calcIngr()` and `calcPlanDay()` can reuse.
- Add a helper for converting a library-backed item into detached per-100 fields before clearing `libId`.
- Add a safe custom ID generator that scans existing `custom` keys and avoids collisions.
- Add validation and normalization for imported backup data.
- Add a versioned migration function for future Local Storage changes.
- Centralize target constants such as protein goal, green/amber thresholds, weekly budget, history length, and autosave delay.
- Make weekly plan meal selection explicit instead of relying on the hidden Today selector or defaulting to snacks.
- Preserve carbs, fat, and fibre for weekly custom plan items.
- Extract CSS into `style.css` and JavaScript into `script.js` only if direct `index.html` usage remains supported.
- Add lightweight manual or automated calculation tests without introducing frameworks or npm packages.
- Improve escaping consistency for imported/user-provided strings.
- Split large render functions into smaller functions while preserving the current UI and behavior.
- Make Local Storage write failures visible enough for debugging instead of silently swallowing all errors.
