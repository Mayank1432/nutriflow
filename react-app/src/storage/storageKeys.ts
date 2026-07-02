export const CURRENT_REACT_SCHEMA_VERSION = 1 as const;

export const REACT_STORAGE_KEYS = {
  today: "nutriflow_react_today_v1",
  weekly: "nutriflow_react_weekly_v1",
  history: "nutriflow_react_history_v1",
  ingredients: "nutriflow_react_ingredients_v1",
  settings: "nutriflow_react_settings_v1",
  meta: "nutriflow_react_meta_v1",
} as const;

export type ReactStorageKey =
  (typeof REACT_STORAGE_KEYS)[keyof typeof REACT_STORAGE_KEYS];

export const REACT_STORAGE_KEY_ALLOWLIST: readonly ReactStorageKey[] =
  Object.freeze(Object.values(REACT_STORAGE_KEYS));

export const RESERVED_REACT_STORAGE_KEYS = {
  shopping: "nutriflow_react_shopping_v1",
  pantry: "nutriflow_react_pantry_v1",
  dailyStaples: "nutriflow_react_daily_staples_v1",
} as const;
