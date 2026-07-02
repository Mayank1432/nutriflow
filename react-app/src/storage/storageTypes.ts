import type { CURRENT_REACT_SCHEMA_VERSION } from "./storageKeys";

export type ReactSchemaVersion = typeof CURRENT_REACT_SCHEMA_VERSION;
export type MealName = "Breakfast" | "Lunch" | "Dinner" | "Snacks";
export type ServingUnit = "g" | "ml" | "piece" | "serving";
export type NutritionBasisType = "per_100" | "per_unit";
export type WeekDayId = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type WeekDayLabel = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export interface VersionedSlice {
  schemaVersion: ReactSchemaVersion;
  updatedAt: string;
}

export interface DailyTotals {
  protein: number;
  calories: number;
  carbs: number;
  fat: number;
  fibre: number;
  cost: number;
}

export interface NutritionSnapshot {
  protein: number;
  calories: number;
  carbs: number;
  fat: number;
  fibre: number;
}

export interface CostSnapshot {
  amount: number;
  currency?: string;
}

export interface FoodEntry {
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

export interface MealEntry {
  name: MealName;
  entries: FoodEntry[];
}

export type MealsByName = Record<MealName, MealEntry>;

export interface ReactTodayStore extends VersionedSlice {
  date: string;
  meals: MealsByName;
  totals: DailyTotals;
}

export interface WeeklyDay {
  id: WeekDayId;
  label: WeekDayLabel;
  meals: MealsByName;
  totals: DailyTotals;
}

export interface ReactWeeklyStore extends VersionedSlice {
  weekStartDay: "Monday";
  days: WeeklyDay[];
}

export interface HistoryDay {
  id: string;
  date: string;
  savedAt: string;
  meals: MealsByName;
  totals: DailyTotals;
  note?: string;
}

export interface ReactHistoryStore extends VersionedSlice {
  savedDays: HistoryDay[];
  deletedDays?: HistoryDay[];
}

export interface IngredientDefinition {
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

export interface ReactIngredientsStore extends VersionedSlice {
  ingredients: IngredientDefinition[];
}

export interface MacroGoal {
  enabled: boolean;
  value?: number;
}

export interface MacroGoals {
  protein: MacroGoal;
  calories: MacroGoal;
  carbs: MacroGoal;
  fat: MacroGoal;
  fibre: MacroGoal;
  cost: MacroGoal;
}

export interface ReactSettingsStore extends VersionedSlice {
  theme: "light" | "dark";
  weekStartDay: "Monday";
  macroGoals: MacroGoals;
  preferences: Record<string, unknown>;
  account?: {
    cloudEnabled?: boolean;
  };
}

export interface ReactMetaStore extends VersionedSlice {
  appFamily: "nutriflow_react";
  createdAt: string;
  lastOpenedAt?: string;
}

export interface ReactStores {
  today: ReactTodayStore;
  weekly: ReactWeeklyStore;
  history: ReactHistoryStore;
  ingredients: ReactIngredientsStore;
  settings: ReactSettingsStore;
  meta: ReactMetaStore;
}
