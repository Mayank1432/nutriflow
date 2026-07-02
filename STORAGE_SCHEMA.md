# NutriFlow React Storage Schema

## 1. Purpose and Scope

This document is the canonical lock for the fresh React-only Local Storage schema. It defines the contract that later approved React storage work must follow.

Task 1.1 is documentation-only. Real storage helpers, Local Storage reads and writes, screen persistence, export/import implementation, reset behavior, and migrations are deferred to later approved tasks.

## 2. Non-Goals for Task 1.1

- No storage implementation or Local Storage reads/writes.
- No screen persistence.
- No migration or old backup import.
- No export/import implementation.
- No reset implementation.
- No replacement of the root vanilla production app.

## 3. React Storage Keys

The active React v1 keys are:

- `nutriflow_react_today_v1`
- `nutriflow_react_weekly_v1`
- `nutriflow_react_history_v1`
- `nutriflow_react_ingredients_v1`
- `nutriflow_react_settings_v1`
- `nutriflow_react_meta_v1`

These are the only active keys in the initial React schema.

## 4. Reserved Future Keys

- `nutriflow_react_shopping_v1`
- `nutriflow_react_pantry_v1`
- `nutriflow_react_daily_staples_v1`

These names are reserved only. They must not be created as active empty slices before their approved future sprints.

## 5. Protected Vanilla Keys

- `pptd_v5`
- `ppc_v5`
- `ppwk_v5`
- `ppst_v5`
- `ppl_v5`

React code and React storage helpers must not read, write, reset, or remove these keys. React reset operations must never affect them.

## 6. Versioning Rules

- Every active React storage slice has `schemaVersion: 1`.
- Versioned slices should include `updatedAt`.
- The `nutriflow_react_meta_v1` store tracks React application storage metadata.
- A future schema change requires an explicitly approved, versioned migration.

## 7. Shared Types

The following TypeScript-like contracts are documentation only:

```ts
type SchemaVersion = 1;

interface VersionedSlice {
  schemaVersion: SchemaVersion;
  updatedAt: string;
}

type MealName = "Breakfast" | "Lunch" | "Dinner" | "Snacks";
type ServingUnit = "g" | "ml" | "piece" | "serving";
type NutritionBasisType = "per_100" | "per_unit";

interface DailyTotals {
  protein: number;
  calories: number;
  carbs: number;
  fat: number;
  fibre: number;
  cost: number;
}

interface NutritionSnapshot {
  protein: number;
  calories: number;
  carbs: number;
  fat: number;
  fibre: number;
}

interface CostSnapshot {
  amount: number;
  currency?: string;
}

interface FoodEntry {
  id: string;
  ingredientId?: string;
  name: string;
  quantity: number;
  unit: ServingUnit;
  basisType: NutritionBasisType;
  nutritionSnapshot: NutritionSnapshot;
  costSnapshot?: CostSnapshot;
  createdAt: string;
  updatedAt: string;
}

interface MealEntry {
  name: MealName;
  entries: FoodEntry[];
}
```

`FoodEntry` values are snapshots. They remain stable when Ingredient Library definitions change later.

## 8. Meta Store

Key: `nutriflow_react_meta_v1`

```ts
interface MetaStore extends VersionedSlice {
  schemaVersion: 1;
  appFamily: "nutriflow_react";
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
}
```

The meta store identifies the React storage family and records storage-level timestamps.

## 9. Settings Store

Key: `nutriflow_react_settings_v1`

```ts
interface MacroGoal {
  enabled: boolean;
  value?: number;
}

interface SettingsStore extends VersionedSlice {
  schemaVersion: 1;
  theme: "light" | "dark";
  weekStartDay: "Monday";
  macroGoals: {
    protein: MacroGoal;
    calories: MacroGoal;
    carbs: MacroGoal;
    fat: MacroGoal;
    fibre: MacroGoal;
    cost: MacroGoal;
  };
  preferences: Record<string, unknown>;
  account?: { cloudEnabled?: boolean };
}
```

The default theme is `light`; dark mode will be stored in Settings when implemented later. The UI name is **Macro Goals**. Defaults are:

- Protein: enabled, `120` g.
- Calories: disabled.
- Carbs: disabled.
- Fat: disabled.
- Fibre: disabled.
- Cost: disabled.

The default week start is Monday. Preferences and future account/cloud flags belong in this slice.

## 10. Ingredient Library Store

Key: `nutriflow_react_ingredients_v1`

```ts
interface IngredientDefinition {
  id: string;
  name: string;
  unit: ServingUnit;
  defaultQuantity: number;
  defaultUnit: ServingUnit;
  defaultMeal?: MealName;
  category?: string;
  basisType: NutritionBasisType;
  nutrition: NutritionSnapshot;
  cost?: CostSnapshot;
  barcode?: string;
  image?: string;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface IngredientsStore extends VersionedSlice {
  schemaVersion: 1;
  ingredients: IngredientDefinition[];
}
```

This slice stores reusable ingredient definitions only, including custom ingredients; it does not store active Today, Weekly, or History entries. Definitions support explicit `per_100` and `per_unit` basis types, default quantity and unit, cost, and optional archived status. Default meal and category support may be used later, while barcode and image fields are reserved for future use. Definitions must also remain ready for later Pantry and Shopping integrations.

Ingredient Library edits affect future use only. They must not silently alter old `FoodEntry` snapshots in Today, Weekly, or History.

## 11. Today Store

Key: `nutriflow_react_today_v1`

```ts
interface TodayStore extends VersionedSlice {
  schemaVersion: 1;
  date: string;
  meals: Record<MealName, MealEntry>;
  totals: DailyTotals;
}
```

Today holds current daily tracking state for Breakfast, Lunch, Dinner, and Snacks. It stores `FoodEntry` snapshots and calculated totals and supports future item quantity editing.

Future approved work may add Quick Add V2 with **Add more** and **Add & return**, plus Save Today to History. Neither behavior is implemented by Task 1.1.

## 12. Weekly Store

Key: `nutriflow_react_weekly_v1`

The store contains seven days in Monday-first order:

| ID | Label |
| --- | --- |
| `mon` | Mon |
| `tue` | Tue |
| `wed` | Wed |
| `thu` | Thu |
| `fri` | Fri |
| `sat` | Sat |
| `sun` | Sun |

```ts
interface WeeklyDay {
  id: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  label: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  meals: Record<MealName, MealEntry>;
  totals: DailyTotals;
}

interface WeeklyStore extends VersionedSlice {
  schemaVersion: 1;
  weekStartDay: "Monday";
  days: WeeklyDay[];
}
```

Meals contain ingredient `FoodEntry` snapshots. The schema supports Copy Day and Clear Day, and anticipates future Copy Weekly day to Today and shopping-list generation behavior.

Copy Day must deep-copy meals and their `FoodEntry` snapshots. The copied day and source day must not share object references, so later edits to the copied day cannot mutate the original. Later Ingredient Library edits must not silently change snapshots in either day.

## 13. History Store

Key: `nutriflow_react_history_v1`

```ts
interface HistoryDay {
  id: string;
  date: string;
  savedAt: string;
  meals: Record<MealName, MealEntry>;
  totals: DailyTotals;
  note?: string;
}

interface HistoryStore extends VersionedSlice {
  schemaVersion: 1;
  savedDays: HistoryDay[];
  deletedDays?: HistoryDay[];
}
```

History stores meal details and calculated daily totals as snapshots. It starts read-only. `deletedDays?: []` reserves future restore support; deletion and restore are deferred.

## 14. FoodEntry Snapshot Rule

- Today, Weekly, and History store `FoodEntry` snapshots.
- `nutritionSnapshot` and `costSnapshot` are saved at add time.
- `ingredientId` is an optional reference only.
- Ingredient Library edits never mutate existing snapshots.
- Quantity editing recalculates from the entry's saved snapshot and basis.

## 15. Export / Import Direction

Future React export/import should use one full backup object:

```ts
interface ReactBackup {
  backupVersion: number;
  appFamily: "nutriflow_react";
  exportedAt: string;
  meta: MetaStore;
  settings: SettingsStore;
  ingredients: IngredientsStore;
  today: TodayStore;
  weekly: WeeklyStore;
  history: HistoryStore;
  shopping?: unknown;
  pantry?: unknown;
  dailyStaples?: unknown;
}
```

Old vanilla backup import is deferred. Compatibility with old vanilla backups is optional unless separately approved. Task 1.1 does not implement export or import.

## 16. Reset Direction

Reset must affect React keys only and must never touch protected vanilla keys. Future reset options should include:

- Reset Today only.
- Reset Weekly only.
- Reset History only.
- Reset Ingredients only.
- Reset all React data.
- Reset all React data but preserve Settings.

Task 1.1 does not implement reset behavior.

## 17. Deferred Migration Rule

React v1 storage starts fresh. Migration from old vanilla Local Storage and old vanilla backup import are deferred. React storage helpers must not read protected vanilla keys unless a future Main Chat-approved migration task explicitly reopens that work.

## 18. Future Reserved Slices

Shopping, Pantry, and Daily Staples keys are reserved. No active empty slices are created now; their schemas will be added only in their approved sprints.

## 19. Implementation Rules for Task 1.2

Task 1.2 may create:

- React storage key constants.
- Storage helpers.
- Default store factories.
- Safe JSON parse/stringify behavior.
- `schemaVersion` checks.
- Reset helper functions.
- A React-only key allowlist.

Task 1.2 must still not use protected vanilla keys unless separately approved.

## 20. QA / Review Checklist

- [ ] Active keys match the approved list.
- [ ] Reserved keys match the approved list.
- [ ] Protected keys match the approved list.
- [ ] `schemaVersion: 1` is documented for every active slice.
- [ ] The snapshot rule is documented.
- [ ] Macro Goals defaults are documented.
- [ ] The reset rule is documented.
- [ ] Migration and old backup import remain deferred.
- [ ] Documentation-only Task 1.1 boundaries are respected.
