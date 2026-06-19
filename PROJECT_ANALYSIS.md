# Project Analysis

## 1. High-Level Architecture

Protein Diet Planner is a static, client-side web application. The working application lives almost entirely in `index.html`.

- `index.html` contains the HTML structure, inline CSS, inline JavaScript, inline PWA manifest, and inline service worker registration.
- `script.js`, `style.css`, `README.md`, and `CONTRIBUTING.md` exist but are currently empty.
- There is no build system, package manager, backend, API, database, routing framework, or test setup.
- State is kept in JavaScript globals and persisted to browser Local Storage.
- Rendering is manual DOM replacement using `innerHTML` and inline `onclick` / `onchange` handlers.

The app has three main UI views:

- Today: daily staples, meal tabs, dishes, ingredients, editable ingredient table, quick-add form.
- Weekly Plan: a seven-day plan with per-day ingredient lists and copy-to-today behavior.
- History: last 30 days of logged totals and per-day details.

Global summary cards and cost-efficiency tables are visible around these views.

## 2. Main Modules / Functions

Because everything is in one script, the "modules" are logical sections rather than separate files.

### Constants and Seed Data

- `WB`: weekly budget target, set to `1500`.
- `MEAL_DEFS`: defines breakfast, lunch, dinner, and snacks with IDs, labels, icons, and colors.
- `DAYS_SHORT`: weekday labels.
- `LIB`: built-in ingredient library. Each food stores nutrient and cost values per unit, usually per 1g or 1ml, and for pieces per 1 piece.
- `DEFAULT_STAPLES`: initial daily staples such as eggs, milk, and almonds.
- `KEYS`: Local Storage keys for today data, custom foods, weekly plan, staples, and log.

### Storage Helpers

- `LS.get(k)`: reads JSON from `localStorage`, returning `null` on parse/read failure.
- `LS.set(k, v)`: writes JSON to `localStorage`, silently ignoring write failures.
- `autosave()`: debounces saves by 800ms, persists major app state, snapshots today into the history log, trims the log to 30 entries, and updates the "Last saved" label.

### State Initialization

- `blankDay()`: creates empty meal buckets for every meal.
- `todayData`: loaded from Local Storage or initialized with `blankDay()`.
- `custom`, `log`, `weekPlan`, `staples`: loaded from Local Storage or initialized with defaults.
- `dishForms`: transient UI state for add-dish and add-ingredient forms.
- `curView`, `curMeal`, `selHistDate`, `curWkDay`: transient navigation state.

### Date Helpers

- `todayKey()`: returns `YYYY-MM-DD` for the local current date.
- `getWeekDays()`: returns Monday-through-Sunday date keys for the current week.
- `fmtDate()` and `fmtDateFull()`: user-facing date formatting.
- `last30Keys()`: creates the rolling 30-day key list used by history and averages.

### Calculation Functions

- `zero()`: returns an empty nutrition/cost accumulator.
- `addV(a, b)`: adds two accumulator objects.
- `calcRow(r)`: calculates totals for a row with per-unit nutrition fields.
- `calcIngr(ing)`: calculates totals for a meal ingredient, branching between library-backed ingredients and custom per-100 ingredients.
- `calcDish(dish)`: sums ingredients in one dish.
- `calcMealToday(mId)`: sums checked staples assigned to a meal plus that meal's dishes.
- `calcAll()`: sums all checked staples and all today's dish ingredients.
- `calcDayLog(entry)`: calculates totals from a saved log entry.
- `last7Cost()`: sums cost from logged days in the last 7 date keys.
- `last30Avg()`: computes average logged protein over available logged days.
- `calcPlanDay(dateKey)`: calculates the weekly plan totals for a selected day.

### Rendering Functions

- `render()`: top-level render for current app state.
- `renderBars()`: updates summary metric cards and progress bars.
- `renderStaples()`: renders staple checkbox/quantity rows.
- `renderMealTabs()`: renders meal tab buttons with protein totals.
- `renderMealPanels()`: renders the active meal, dishes, and inline ingredient forms.
- `renderIngrForm(mId, di)`: renders the add-ingredient form for a dish.
- `renderAllIngr()`: renders the editable table containing checked staples and all today's ingredients.
- `renderLibPills()`: renders quick-add buttons for library and custom foods.
- `renderCostTable()`: renders cost per gram of protein.
- `renderWeekPlan()`: renders weekly day tabs, selected day totals, planned items, and plan add controls.
- `renderHistory()` and `renderHistDetail(key)`: render history overview and details.

### User Action Functions

- Staples: `stToggle`, `stStep`, `stQty`, `stMeal`, `updateSt`, `stQtyRow`, `updateStPer`.
- Meals and dishes: `switchMeal`, `toggleMeal`, `openDishForm`, `closeDishForm`, `commitDish`, `removeDish`.
- Ingredients: `toggleIngrForm`, `closeIngrForm`, `commitIngr`, `addLibIngrToDish`, `removeIngr`, `quickAddLib`, `addCustomIngr`, `updateIngr`, `updateIngrQty`, `ingrStep`, `updateIngr100`.
- Weekly plan: `selWkDay`, `wkStep`, `wkSetQty`, `removeWkItem`, `addWkLib`, `addWkCustom`, `clearWeekDay`, `copyPlanToToday`.
- Views: `showView`.
- Backup: `exportData`, `importData`.

## 3. How Data Flows Through the Application

1. On page load, JavaScript constants and helper functions are defined.
2. Persistent state is loaded from Local Storage:
   - today's meals,
   - custom foods,
   - weekly plan,
   - staples,
   - history log.
3. Missing meal buckets are added to `todayData` for compatibility.
4. `render()` runs immediately.
5. Render functions calculate totals from current state and replace sections of the DOM with generated HTML.
6. User interactions call global handler functions through inline event attributes.
7. Handler functions mutate global state directly.
8. Most mutations call `autosave()`.
9. `autosave()` waits 800ms, then writes state to Local Storage and snapshots today's current meals/staples into the daily log.
10. Render functions are called after mutations to refresh visible totals and lists.

The application uses direct global state mutation rather than immutable updates or a centralized event/store layer.

## 4. How Local Storage Is Used

Local Storage is the only persistence mechanism.

The keys are:

- `pptd_v5`: today's meal/dish/ingredient data.
- `ppc_v5`: custom ingredient library entries.
- `ppwk_v5`: weekly ingredient plan.
- `ppst_v5`: staple definitions, quantities, checked states, and meal assignments.
- `ppl_v5`: rolling history log.

`LS.get()` parses stored JSON and returns `null` if the key is missing or parsing fails. `LS.set()` stringifies data and writes it back. Both helpers suppress errors.

`autosave()` persists:

- `todayData`,
- `custom`,
- `weekPlan`,
- `staples`,
- `log`.

The log is updated automatically during autosave:

- The current date key from `todayKey()` is used.
- A deep copy of `{ meals: todayData.meals, staples }` is stored as `log[todayKey()]`.
- `savedAt` is added.
- If more than 30 log entries exist, the oldest sorted keys are deleted.

Export/import is also Local Storage based:

- `exportData()` serializes `custom`, `log`, `weekPlan`, `staples`, and `todayData` to a downloadable JSON backup.
- `importData(input)` reads JSON from a selected file, conditionally replaces matching state objects, writes them to Local Storage, and rerenders.

## 5. How Ingredients Are Stored

There are several ingredient shapes.

### Built-In Library Ingredients

`LIB` entries look like this:

```js
{
  n: 'Oats',
  u: 'g',
  s: 40,
  max: 40,
  pp: 270 / 1000,
  pr: 5 / 40,
  kc: 156 / 40,
  carb: 27.4 / 40,
  fat: 2.8 / 40,
  fibre: 4 / 40,
  t: 'v'
}
```

Important fields:

- `n`: display name.
- `u`: unit.
- `s`: default step/default serving.
- `max`: optional max quantity.
- `pp`: price per unit.
- `pr`, `kc`, `carb`, `fat`, `fibre`: nutrition per unit.
- `t`: type, apparently plant/animal.

### Custom Library Ingredients

When users quick-add a custom ingredient from the Today form, the app creates a custom library entry in `custom`.

The user enters values as per-100, but the app stores them as per-unit:

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

The custom entry is then referenced by a meal ingredient through `libId`.

### Meal Ingredients

Library-backed meal ingredients are stored compactly:

```js
{
  libId: 'chicken',
  name: 'Chicken breast (raw)',
  qty: 100,
  unit: 'g'
}
```

Ad hoc custom ingredients entered directly into a dish are stored with per-100 fields:

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

### Staples

Staples are stored separately from meals but assigned to a meal by `mealId`.

They use per-unit fields:

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

Only checked staples are included in calculations.

### Weekly Plan Items

Weekly plan items are grouped by date key and meal ID:

```js
weekPlan[dateKey][mealId] = [
  { libId, name, qty, unit },
  { name, qty, unit, pr100, kc100, pp100 }
]
```

Library-backed plan items use `libId`; weekly custom plan items use per-100 fields but only collect protein, calories, and cost in the UI.

## 6. How Calculations Are Performed

The app uses a common accumulator shape:

```js
{ p: 0, k: 0, carb: 0, fat: 0, fibre: 0, c: 0 }
```

Where:

- `p`: protein.
- `k`: calories.
- `carb`: carbohydrates.
- `fat`: fat.
- `fibre`: fibre.
- `c`: cost.

The key distinction is unit representation:

- `LIB`, `custom`, and `staples` use per-unit values.
- Ad hoc meal ingredients and weekly custom plan items use per-100 values.

Calculation patterns:

- Per-unit rows: value times quantity.
- Per-100 rows: value divided by 100, then multiplied by quantity.
- Dishes sum ingredients.
- Meals sum checked staples assigned to that meal plus all dish ingredients in the meal.
- Daily totals sum checked staples plus all dish ingredients across all meals.
- History totals reuse the daily log shape.
- Weekly plan totals read from `weekPlan[dateKey]` and calculate each item according to whether it has a `libId`.

Formatting helpers round values:

- `r1(n)`: one decimal place.
- `r0(n)`: nearest integer.

Display conversion helpers:

- `pu2p100(pu, unit)`: converts per-unit values to per-100 display values, except `piece`, where it returns the per-piece value.
- `p100pu(v, unit)`: converts edited display values back to per-unit, except `piece`, where it stores the value directly.

Targets and thresholds:

- Protein target is displayed as 120g/day.
- Protein color turns green at 115g+, amber at 100g+, red below 100g.
- Weekly budget target is INR 1500.
- Seven-day spend is calculated from logged history, not directly from current unsaved state unless autosave has logged today.

## 7. Potential Code Smells

- The entire application is concentrated in `index.html`, making it hard to test, reuse, or reason about in sections.
- Empty `script.js` and `style.css` suggest an intended separation that has not been implemented.
- Heavy use of global mutable state makes behavior order-dependent.
- Rendering is done with large template strings and `innerHTML`, which mixes markup, state access, formatting, and event wiring.
- Inline event handlers require functions to remain global and make refactoring harder.
- There is no validation layer for imported backups or Local Storage data.
- Errors from Local Storage reads/writes are silently swallowed.
- The data model mixes per-unit and per-100 representations, increasing conversion risk.
- `autosave()` is responsible for both persistence and history logging, coupling two separate concerns.
- Many render functions both compute business values and generate HTML.
- Several functions are very broad in responsibility, especially `renderAllIngr()`, `renderMealPanels()`, and `renderWeekPlan()`.
- There are magic constants such as `120`, `115`, `100`, `1500`, `30`, and `800` embedded in behavior.
- Some computed variables are unused, such as `dateNum` in weekly plan rendering.
- There are no automated tests for calculations, persistence, import/export, or date rollover behavior.

## 8. Potential Bugs

- `todayData` does not appear to reset automatically when the calendar date changes. If the app remains open or Local Storage has yesterday's `pptd_v5`, the Today view may continue showing the previous day's meals under the new date.
- `uid` is initialized as `Object.keys(custom).length`, which can collide with existing custom IDs after deletion, import, or non-contiguous IDs.
- Changing the unit of a library-backed ingredient through `updateIngr()` removes `libId` but does not copy library nutrition fields first. The item can then calculate as zero because the custom per-100 fields are missing.
- Changing a staple's unit does not convert existing per-unit nutrition/cost values. Values that were per-piece can become interpreted as per-gram or per-ml.
- The `met()` helper outputs an extra `}` before the closing `>` of the metric value div. Browsers may tolerate it, but it creates malformed HTML.
- Debounced autosave can lose the last change if the page closes before the 800ms timer fires.
- Seven-day spend uses the saved `log`, so it may lag behind the current visible day until autosave runs.
- `addWkLib()` reads the meal from the Today quick-add selector `in-meal`, even though the user is in the Weekly Plan view. If that hidden selector has an unexpected value, weekly items may be assigned to an unintended meal.
- `addWkCustom()` always adds custom weekly plan items to `snacks`, despite the comment saying it picks a meal from today's selector.
- Weekly custom plan items only collect protein, calories, and cost; carbs, fat, and fibre become zero when copied to Today.
- Imported data can contain unexpected shapes or malicious strings. Some render paths escape text, but others interpolate names or IDs into HTML/inline handlers without full escaping.
- Backup import does not migrate or normalize older versions despite exporting `version: 5`.
- The inline service worker caches `'.'` only, which may not reliably support all local/static-file serving scenarios.
- The PWA manifest is a data URL with an SVG text icon containing non-URL-encoded content; browser support may vary.

## 9. Features Already Implemented

- Static single-page diet planner UI.
- Daily protein, cost, seven-day spend, and 30-day average metric cards.
- Protein and budget progress bars.
- Built-in food library with default foods.
- Custom ingredient creation from the Today quick-add form.
- Daily staples with checkbox toggles, quantity controls, and meal assignment.
- Four meal categories: breakfast, lunch, dinner, snacks.
- Meal tabs with per-meal protein totals.
- Add/remove dishes.
- Add/remove ingredients inside dishes.
- Add ingredients from the built-in/custom library.
- Add ad hoc ingredients with protein, calories, carbs, fat, fibre, cost, quantity, and unit.
- Editable all-ingredients table for checked staples and today's meal ingredients.
- Quantity steppers and direct numeric entry.
- Per-100 editing for macro/cost values.
- Automatic debounced Local Storage persistence.
- Automatic daily history snapshots during autosave.
- Last-30-days history grid and daily detail view.
- Weekly ingredient planning for the current week.
- Weekly plan day tabs with planned protein totals.
- Add library foods to a weekly plan.
- Add custom weekly plan foods.
- Clear selected weekly plan day.
- Copy today's weekly plan into the Today meal data.
- Cost per gram of protein table.
- Export all app data to JSON.
- Import app backup JSON.
- Inline PWA manifest.
- Inline service worker registration for basic offline caching when served in a compatible context.
