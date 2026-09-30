import { safeJsonParse } from "./storageJson";
import {
  isValidReactStoreValue,
  readReactDailyStaplesStore,
  readReactHistoryStore,
  readReactIngredientsStore,
  readReactMetaStore,
  readReactPantryStore,
  readReactSettingsStore,
  readReactShoppingStore,
  readReactTodayStore,
  readReactWeeklyStore,
  replaceReactStores,
  type ReactStoreValues,
} from "./storageHelpers";
import { REACT_STORAGE_KEYS } from "./storageKeys";
import type {
  ReactDailyStaplesStore,
  ReactHistoryStore,
  ReactIngredientsStore,
  ReactMetaStore,
  ReactPantryStore,
  ReactSettingsStore,
  ReactShoppingStore,
  ReactTodayStore,
  ReactWeeklyStore,
} from "./storageTypes";

export const REACT_BACKUP_VERSION = 1 as const;
export const REACT_BACKUP_APP_FAMILY = "nutriflow_react" as const;

export interface ReactBackup {
  backupVersion: number;
  appFamily: typeof REACT_BACKUP_APP_FAMILY;
  exportedAt: string;
  meta: ReactMetaStore;
  settings: ReactSettingsStore;
  ingredients: ReactIngredientsStore;
  today: ReactTodayStore;
  weekly: ReactWeeklyStore;
  history: ReactHistoryStore;
  dailyStaples?: ReactDailyStaplesStore;
  pantry?: ReactPantryStore;
  shopping?: ReactShoppingStore;
}

export type ReactBackupParseResult =
  | { ok: true; backup: ReactBackup }
  | {
      ok: false;
      reason:
        | "invalid_json"
        | "not_a_backup"
        | "wrong_app"
        | "unsupported_version"
        | "invalid_store";
      message: string;
    };

export interface ReactBackupSummary {
  exportedAt: string;
  savedDays: number;
  deletedDays: number;
  ingredients: number;
  staples: number;
  pantryItems: number;
  shoppingItems: number;
}

const REQUIRED_STORES = [
  ["meta", REACT_STORAGE_KEYS.meta],
  ["settings", REACT_STORAGE_KEYS.settings],
  ["ingredients", REACT_STORAGE_KEYS.ingredients],
  ["today", REACT_STORAGE_KEYS.today],
  ["weekly", REACT_STORAGE_KEYS.weekly],
  ["history", REACT_STORAGE_KEYS.history],
] as const;

const OPTIONAL_STORES = [
  ["dailyStaples", REACT_STORAGE_KEYS.dailyStaples],
  ["pantry", REACT_STORAGE_KEYS.pantry],
  ["shopping", REACT_STORAGE_KEYS.shopping],
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const createReactBackup = (
  exportedAt: string = new Date().toISOString(),
): ReactBackup => ({
  backupVersion: REACT_BACKUP_VERSION,
  appFamily: REACT_BACKUP_APP_FAMILY,
  exportedAt,
  meta: readReactMetaStore(),
  settings: readReactSettingsStore(),
  ingredients: readReactIngredientsStore(),
  today: readReactTodayStore(),
  weekly: readReactWeeklyStore(),
  history: readReactHistoryStore(),
  dailyStaples: readReactDailyStaplesStore(),
  pantry: readReactPantryStore(),
  shopping: readReactShoppingStore(),
});

export const parseReactBackup = (text: string): ReactBackupParseResult => {
  const parsed = safeJsonParse<unknown>(text);
  if (parsed === null) {
    return {
      ok: false,
      reason: "invalid_json",
      message: "This file is not a valid backup. It could not be read as JSON.",
    };
  }
  if (!isRecord(parsed)) {
    return {
      ok: false,
      reason: "not_a_backup",
      message: "This file is not a NutriFlow backup.",
    };
  }
  if (parsed.appFamily !== REACT_BACKUP_APP_FAMILY) {
    return {
      ok: false,
      reason: "wrong_app",
      message: "This file is not a NutriFlow backup from this version of the app.",
    };
  }
  const version = parsed.backupVersion;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) {
    return {
      ok: false,
      reason: "not_a_backup",
      message: "This backup file has no valid version number.",
    };
  }
  if (version > REACT_BACKUP_VERSION) {
    return {
      ok: false,
      reason: "unsupported_version",
      message: "This backup was made by a newer version of NutriFlow. Update the app and try again.",
    };
  }
  if (typeof parsed.exportedAt !== "string") {
    return {
      ok: false,
      reason: "not_a_backup",
      message: "This backup file is missing its export date.",
    };
  }
  for (const [field, key] of REQUIRED_STORES) {
    if (!isValidReactStoreValue(key, parsed[field])) {
      return {
        ok: false,
        reason: "invalid_store",
        message: `This backup is damaged or incomplete (problem in "${field}"). Nothing was changed.`,
      };
    }
  }
  for (const [field, key] of OPTIONAL_STORES) {
    if (parsed[field] !== undefined && !isValidReactStoreValue(key, parsed[field])) {
      return {
        ok: false,
        reason: "invalid_store",
        message: `This backup is damaged or incomplete (problem in "${field}"). Nothing was changed.`,
      };
    }
  }

  return { ok: true, backup: parsed as unknown as ReactBackup };
};

export const summarizeReactBackup = (backup: ReactBackup): ReactBackupSummary => ({
  exportedAt: backup.exportedAt,
  savedDays: backup.history.savedDays.length,
  deletedDays: backup.history.deletedDays?.length ?? 0,
  ingredients: backup.ingredients.ingredients.length,
  staples: backup.dailyStaples?.staples.length ?? 0,
  pantryItems: backup.pantry?.pantryItems.length ?? 0,
  shoppingItems: backup.shopping?.shoppingItems.length ?? 0,
});

export const applyReactBackup = (backup: ReactBackup): boolean => {
  const values: ReactStoreValues = {
    [REACT_STORAGE_KEYS.meta]: backup.meta,
    [REACT_STORAGE_KEYS.settings]: backup.settings,
    [REACT_STORAGE_KEYS.ingredients]: backup.ingredients,
    [REACT_STORAGE_KEYS.today]: backup.today,
    [REACT_STORAGE_KEYS.weekly]: backup.weekly,
    [REACT_STORAGE_KEYS.history]: backup.history,
  };
  if (backup.dailyStaples !== undefined) {
    values[REACT_STORAGE_KEYS.dailyStaples] = backup.dailyStaples;
  }
  if (backup.pantry !== undefined) {
    values[REACT_STORAGE_KEYS.pantry] = backup.pantry;
  }
  if (backup.shopping !== undefined) {
    values[REACT_STORAGE_KEYS.shopping] = backup.shopping;
  }
  return replaceReactStores(values);
};