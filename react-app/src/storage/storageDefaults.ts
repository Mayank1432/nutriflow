import { CURRENT_REACT_SCHEMA_VERSION } from "./storageKeys";
import type {
  DailyTotals,
  MealsByName,
  ReactHistoryStore,
  ReactIngredientsStore,
  ReactMetaStore,
  ReactSettingsStore,
  ReactStores,
  ReactTodayStore,
  ReactWeeklyStore,
  WeekDayId,
  WeekDayLabel,
  WeeklyDay,
} from "./storageTypes";

const WEEK_DAYS: ReadonlyArray<readonly [WeekDayId, WeekDayLabel]> = [
  ["mon", "Mon"],
  ["tue", "Tue"],
  ["wed", "Wed"],
  ["thu", "Thu"],
  ["fri", "Fri"],
  ["sat", "Sat"],
  ["sun", "Sun"],
];

const nowIso = (): string => new Date().toISOString();

const localDate = (): string => {
  const date = new Date();
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 10);
};

export const createEmptyDailyTotals = (): DailyTotals => ({
  protein: 0,
  calories: 0,
  carbs: 0,
  fat: 0,
  fibre: 0,
  cost: 0,
});

export const createEmptyMeals = (): MealsByName => ({
  Breakfast: { name: "Breakfast", entries: [] },
  Lunch: { name: "Lunch", entries: [] },
  Dinner: { name: "Dinner", entries: [] },
  Snacks: { name: "Snacks", entries: [] },
});

const createEmptyWeeklyDay = (
  id: WeekDayId,
  label: WeekDayLabel,
): WeeklyDay => ({
  id,
  label,
  meals: createEmptyMeals(),
  totals: createEmptyDailyTotals(),
});

export const createDefaultReactTodayStore = (): ReactTodayStore => ({
  schemaVersion: CURRENT_REACT_SCHEMA_VERSION,
  updatedAt: nowIso(),
  date: localDate(),
  meals: createEmptyMeals(),
  totals: createEmptyDailyTotals(),
});

export const createDefaultReactWeeklyStore = (): ReactWeeklyStore => ({
  schemaVersion: CURRENT_REACT_SCHEMA_VERSION,
  updatedAt: nowIso(),
  weekStartDay: "Monday",
  days: WEEK_DAYS.map(([id, label]) => createEmptyWeeklyDay(id, label)),
});

export const createDefaultReactHistoryStore = (): ReactHistoryStore => ({
  schemaVersion: CURRENT_REACT_SCHEMA_VERSION,
  updatedAt: nowIso(),
  savedDays: [],
  deletedDays: [],
});

export const createDefaultReactIngredientsStore = (): ReactIngredientsStore => ({
  schemaVersion: CURRENT_REACT_SCHEMA_VERSION,
  updatedAt: nowIso(),
  ingredients: [],
});

export const createDefaultReactSettingsStore = (): ReactSettingsStore => ({
  schemaVersion: CURRENT_REACT_SCHEMA_VERSION,
  updatedAt: nowIso(),
  theme: "light",
  weekStartDay: "Monday",
  macroGoals: {
    protein: { enabled: true, value: 120 },
    calories: { enabled: false },
    carbs: { enabled: false },
    fat: { enabled: false },
    fibre: { enabled: false },
    cost: { enabled: false },
  },
  preferences: {},
  account: { cloudEnabled: false },
});

export const createDefaultReactMetaStore = (): ReactMetaStore => {
  const timestamp = nowIso();
  return {
    schemaVersion: CURRENT_REACT_SCHEMA_VERSION,
    appFamily: "nutriflow_react",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

export const createDefaultReactStores = (): ReactStores => ({
  today: createDefaultReactTodayStore(),
  weekly: createDefaultReactWeeklyStore(),
  history: createDefaultReactHistoryStore(),
  ingredients: createDefaultReactIngredientsStore(),
  settings: createDefaultReactSettingsStore(),
  meta: createDefaultReactMetaStore(),
});
