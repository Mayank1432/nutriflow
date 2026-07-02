import {
  createDefaultReactHistoryStore,
  createDefaultReactIngredientsStore,
  createDefaultReactMetaStore,
  createDefaultReactSettingsStore,
  createDefaultReactTodayStore,
  createDefaultReactWeeklyStore,
} from "./storageDefaults";
import {
  CURRENT_REACT_SCHEMA_VERSION,
  REACT_STORAGE_KEY_ALLOWLIST,
  REACT_STORAGE_KEYS,
  type ReactStorageKey,
} from "./storageKeys";
import { safeJsonParse, safeJsonStringify } from "./storageJson";
import type {
  CostSnapshot,
  DailyTotals,
  FoodEntry,
  HistoryDay,
  IngredientDefinition,
  MacroGoal,
  MealEntry,
  MealName,
  MealsByName,
  NutritionSnapshot,
  ReactHistoryStore,
  ReactIngredientsStore,
  ReactMetaStore,
  ReactSettingsStore,
  ReactTodayStore,
  ReactWeeklyStore,
  ServingUnit,
  WeeklyDay,
} from "./storageTypes";

type StoreFactory<T> = () => T;
type StoreValidator<T> = (value: unknown) => value is T;

const MEAL_NAMES: readonly MealName[] = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snacks",
];
const SERVING_UNITS: readonly ServingUnit[] = ["g", "ml", "piece", "serving"];
const WEEK_DAY_PAIRS = [
  ["mon", "Mon"],
  ["tue", "Tue"],
  ["wed", "Wed"],
  ["thu", "Thu"],
  ["fri", "Fri"],
  ["sat", "Sat"],
  ["sun", "Sun"],
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";
const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isOptionalString = (value: unknown): value is string | undefined =>
  value === undefined || isString(value);

const hasOnlyOptionalBoolean = (value: unknown): value is boolean | undefined =>
  value === undefined || typeof value === "boolean";

export const isReactStorageKey = (key: string): key is ReactStorageKey =>
  REACT_STORAGE_KEY_ALLOWLIST.includes(key as ReactStorageKey);

export const hasValidSchemaVersion = (
  value: unknown,
): boolean =>
  isRecord(value) &&
  value.schemaVersion === CURRENT_REACT_SCHEMA_VERSION &&
  isString(value.updatedAt);

const isDailyTotals = (value: unknown): value is DailyTotals =>
  isRecord(value) &&
  isNumber(value.protein) &&
  isNumber(value.calories) &&
  isNumber(value.carbs) &&
  isNumber(value.fat) &&
  isNumber(value.fibre) &&
  isNumber(value.cost);

const isNutritionSnapshot = (value: unknown): value is NutritionSnapshot =>
  isRecord(value) &&
  isNumber(value.protein) &&
  isNumber(value.calories) &&
  isNumber(value.carbs) &&
  isNumber(value.fat) &&
  isNumber(value.fibre);

const isCostSnapshot = (value: unknown): value is CostSnapshot =>
  isRecord(value) &&
  isNumber(value.amount) &&
  isOptionalString(value.currency);

const isFoodEntry = (value: unknown): value is FoodEntry =>
  isRecord(value) &&
  isString(value.id) &&
  isOptionalString(value.ingredientId) &&
  isString(value.name) &&
  isNumber(value.quantity) &&
  SERVING_UNITS.includes(value.unit as ServingUnit) &&
  (value.basisType === "per_100" || value.basisType === "per_unit") &&
  isNutritionSnapshot(value.nutritionSnapshot) &&
  (value.costSnapshot === undefined || isCostSnapshot(value.costSnapshot)) &&
  isString(value.createdAt) &&
  isString(value.updatedAt);

const isMealEntry = (value: unknown, name: MealName): value is MealEntry =>
  isRecord(value) &&
  value.name === name &&
  Array.isArray(value.entries) &&
  value.entries.every(isFoodEntry);

const isMealsByName = (value: unknown): value is MealsByName =>
  isRecord(value) &&
  MEAL_NAMES.every((name) => isMealEntry(value[name], name));

const isHistoryDay = (value: unknown): value is HistoryDay =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.date) &&
  isString(value.savedAt) &&
  isMealsByName(value.meals) &&
  isDailyTotals(value.totals) &&
  isOptionalString(value.note);

const isIngredientDefinition = (
  value: unknown,
): value is IngredientDefinition =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.name) &&
  SERVING_UNITS.includes(value.unit as ServingUnit) &&
  isNumber(value.defaultQuantity) &&
  SERVING_UNITS.includes(value.defaultUnit as ServingUnit) &&
  (value.defaultMeal === undefined ||
    MEAL_NAMES.includes(value.defaultMeal as MealName)) &&
  isOptionalString(value.category) &&
  (value.basisType === "per_100" || value.basisType === "per_unit") &&
  isNutritionSnapshot(value.nutrition) &&
  (value.cost === undefined || isCostSnapshot(value.cost)) &&
  isOptionalString(value.barcode) &&
  isOptionalString(value.image) &&
  hasOnlyOptionalBoolean(value.archived) &&
  isString(value.createdAt) &&
  isString(value.updatedAt);

const isMacroGoal = (value: unknown): value is MacroGoal =>
  isRecord(value) &&
  typeof value.enabled === "boolean" &&
  (value.value === undefined || isNumber(value.value));

const isWeeklyDay = (value: unknown, index: number): value is WeeklyDay => {
  const expected = WEEK_DAY_PAIRS[index];
  return (
    expected !== undefined &&
    isRecord(value) &&
    value.id === expected[0] &&
    value.label === expected[1] &&
    isMealsByName(value.meals) &&
    isDailyTotals(value.totals)
  );
};

const isReactTodayStore: StoreValidator<ReactTodayStore> = (
  value,
): value is ReactTodayStore =>
  isRecord(value) &&
  hasValidSchemaVersion(value) &&
  isString(value.date) &&
  isMealsByName(value.meals) &&
  isDailyTotals(value.totals);

const isReactWeeklyStore: StoreValidator<ReactWeeklyStore> = (
  value,
): value is ReactWeeklyStore =>
  isRecord(value) &&
  hasValidSchemaVersion(value) &&
  value.weekStartDay === "Monday" &&
  Array.isArray(value.days) &&
  value.days.length === WEEK_DAY_PAIRS.length &&
  value.days.every(isWeeklyDay);

const isReactHistoryStore: StoreValidator<ReactHistoryStore> = (
  value,
): value is ReactHistoryStore =>
  isRecord(value) &&
  hasValidSchemaVersion(value) &&
  Array.isArray(value.savedDays) &&
  value.savedDays.every(isHistoryDay) &&
  (value.deletedDays === undefined ||
    (Array.isArray(value.deletedDays) && value.deletedDays.every(isHistoryDay)));

const isReactIngredientsStore: StoreValidator<ReactIngredientsStore> = (
  value,
): value is ReactIngredientsStore =>
  isRecord(value) &&
  hasValidSchemaVersion(value) &&
  Array.isArray(value.ingredients) &&
  value.ingredients.every(isIngredientDefinition);

const isReactSettingsStore: StoreValidator<ReactSettingsStore> = (
  value,
): value is ReactSettingsStore => {
  if (
    !isRecord(value) ||
    !hasValidSchemaVersion(value) ||
    (value.theme !== "light" && value.theme !== "dark") ||
    value.weekStartDay !== "Monday" ||
    !isRecord(value.macroGoals) ||
    !isRecord(value.preferences)
  ) {
    return false;
  }

  const goals = value.macroGoals;
  const goalsValid = [
    "protein",
    "calories",
    "carbs",
    "fat",
    "fibre",
    "cost",
  ].every((name) => isMacroGoal(goals[name]));
  const accountValid =
    value.account === undefined ||
    (isRecord(value.account) &&
      hasOnlyOptionalBoolean(value.account.cloudEnabled));

  return goalsValid && accountValid;
};

const isReactMetaStore: StoreValidator<ReactMetaStore> = (
  value,
): value is ReactMetaStore =>
  isRecord(value) &&
  hasValidSchemaVersion(value) &&
  value.appFamily === "nutriflow_react" &&
  isString(value.createdAt) &&
  isOptionalString(value.lastOpenedAt);

const getLocalStorage = (): Storage | null => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }
    return window.localStorage;
  } catch {
    return null;
  }
};

export const readReactStore = <T>(
  key: string,
  defaultFactory: StoreFactory<T>,
  validator: StoreValidator<T>,
): T => {
  if (!isReactStorageKey(key)) {
    return defaultFactory();
  }

  const storage = getLocalStorage();
  if (storage === null) {
    return defaultFactory();
  }

  try {
    const parsed = safeJsonParse<unknown>(storage.getItem(key));
    return validator(parsed) ? parsed : defaultFactory();
  } catch {
    return defaultFactory();
  }
};

export const writeReactStore = <T>(
  key: string,
  value: T,
  validator: StoreValidator<T>,
): boolean => {
  if (!isReactStorageKey(key) || !validator(value)) {
    return false;
  }

  const storage = getLocalStorage();
  const serialized = safeJsonStringify(value);
  if (storage === null || serialized === null) {
    return false;
  }

  try {
    storage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
};

export const removeReactStore = (key: string): boolean => {
  if (!isReactStorageKey(key)) {
    return false;
  }

  const storage = getLocalStorage();
  if (storage === null) {
    return false;
  }

  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

export const resetReactStore = <T>(
  key: string,
  defaultFactory: StoreFactory<T>,
  _validator: StoreValidator<T>,
): T => {
  const defaultStore = defaultFactory();
  if (isReactStorageKey(key)) {
    removeReactStore(key);
  }
  return defaultStore;
};

export const resetAllReactStores = (): boolean => {
  const storage = getLocalStorage();
  if (storage === null) {
    return false;
  }

  try {
    REACT_STORAGE_KEY_ALLOWLIST.forEach((key) => storage.removeItem(key));
    return true;
  } catch {
    return false;
  }
};

export const readReactTodayStore = (): ReactTodayStore =>
  readReactStore(
    REACT_STORAGE_KEYS.today,
    createDefaultReactTodayStore,
    isReactTodayStore,
  );
export const writeReactTodayStore = (store: ReactTodayStore): boolean =>
  writeReactStore(REACT_STORAGE_KEYS.today, store, isReactTodayStore);
export const resetReactTodayStore = (): ReactTodayStore =>
  resetReactStore(
    REACT_STORAGE_KEYS.today,
    createDefaultReactTodayStore,
    isReactTodayStore,
  );

export const readReactWeeklyStore = (): ReactWeeklyStore =>
  readReactStore(
    REACT_STORAGE_KEYS.weekly,
    createDefaultReactWeeklyStore,
    isReactWeeklyStore,
  );
export const writeReactWeeklyStore = (store: ReactWeeklyStore): boolean =>
  writeReactStore(REACT_STORAGE_KEYS.weekly, store, isReactWeeklyStore);
export const resetReactWeeklyStore = (): ReactWeeklyStore =>
  resetReactStore(
    REACT_STORAGE_KEYS.weekly,
    createDefaultReactWeeklyStore,
    isReactWeeklyStore,
  );

export const readReactHistoryStore = (): ReactHistoryStore =>
  readReactStore(
    REACT_STORAGE_KEYS.history,
    createDefaultReactHistoryStore,
    isReactHistoryStore,
  );
export const writeReactHistoryStore = (store: ReactHistoryStore): boolean =>
  writeReactStore(REACT_STORAGE_KEYS.history, store, isReactHistoryStore);
export const resetReactHistoryStore = (): ReactHistoryStore =>
  resetReactStore(
    REACT_STORAGE_KEYS.history,
    createDefaultReactHistoryStore,
    isReactHistoryStore,
  );

export const readReactIngredientsStore = (): ReactIngredientsStore =>
  readReactStore(
    REACT_STORAGE_KEYS.ingredients,
    createDefaultReactIngredientsStore,
    isReactIngredientsStore,
  );
export const writeReactIngredientsStore = (
  store: ReactIngredientsStore,
): boolean =>
  writeReactStore(
    REACT_STORAGE_KEYS.ingredients,
    store,
    isReactIngredientsStore,
  );
export const resetReactIngredientsStore = (): ReactIngredientsStore =>
  resetReactStore(
    REACT_STORAGE_KEYS.ingredients,
    createDefaultReactIngredientsStore,
    isReactIngredientsStore,
  );

export const readReactSettingsStore = (): ReactSettingsStore =>
  readReactStore(
    REACT_STORAGE_KEYS.settings,
    createDefaultReactSettingsStore,
    isReactSettingsStore,
  );
export const writeReactSettingsStore = (store: ReactSettingsStore): boolean =>
  writeReactStore(REACT_STORAGE_KEYS.settings, store, isReactSettingsStore);
export const resetReactSettingsStore = (): ReactSettingsStore =>
  resetReactStore(
    REACT_STORAGE_KEYS.settings,
    createDefaultReactSettingsStore,
    isReactSettingsStore,
  );

export const readReactMetaStore = (): ReactMetaStore =>
  readReactStore(
    REACT_STORAGE_KEYS.meta,
    createDefaultReactMetaStore,
    isReactMetaStore,
  );
export const writeReactMetaStore = (store: ReactMetaStore): boolean =>
  writeReactStore(REACT_STORAGE_KEYS.meta, store, isReactMetaStore);
export const resetReactMetaStore = (): ReactMetaStore =>
  resetReactStore(
    REACT_STORAGE_KEYS.meta,
    createDefaultReactMetaStore,
    isReactMetaStore,
  );
