import type {
  FoodEntry,
  HistoryDay,
  MealName,
  ReactHistoryStore,
} from '../storage/storageTypes'
import { calculateMealsTotals } from './historyIntegrity'

export type HistoryEditResult =
  | { ok: true; store: ReactHistoryStore }
  | { ok: false; reason: 'day_not_found' | 'entry_not_found' | 'invalid_quantity' }

const applyToDay = (
  history: ReactHistoryStore,
  dayId: string,
  mealName: MealName,
  updateEntries: (entries: FoodEntry[]) => FoodEntry[],
  updatedAt: string,
): HistoryEditResult => {
  const day = history.savedDays.find((candidate) => candidate.id === dayId)
  if (!day) return { ok: false, reason: 'day_not_found' }

  const nextMeals = {
    ...day.meals,
    [mealName]: {
      ...day.meals[mealName],
      entries: updateEntries(day.meals[mealName].entries),
    },
  }
  const nextDay: HistoryDay = {
    ...day,
    meals: nextMeals,
    totals: calculateMealsTotals(nextMeals),
  }

  return {
    ok: true,
    store: {
      ...history,
      updatedAt,
      savedDays: history.savedDays.map((candidate) => (
        candidate.id === dayId ? nextDay : candidate
      )),
    },
  }
}

export const changeHistoryEntryQuantity = (
  history: ReactHistoryStore,
  dayId: string,
  mealName: MealName,
  entryId: string,
  quantity: number,
  updatedAt: string,
): HistoryEditResult => {
  if (!Number.isFinite(quantity) || quantity <= 0) return { ok: false, reason: 'invalid_quantity' }
  const day = history.savedDays.find((candidate) => candidate.id === dayId)
  if (!day) return { ok: false, reason: 'day_not_found' }
  if (!day.meals[mealName].entries.some((entry) => entry.id === entryId)) {
    return { ok: false, reason: 'entry_not_found' }
  }
  return applyToDay(history, dayId, mealName, (entries) => entries.map((entry) => (
    entry.id === entryId ? { ...entry, quantity, updatedAt } : entry
  )), updatedAt)
}

export const removeHistoryEntry = (
  history: ReactHistoryStore,
  dayId: string,
  mealName: MealName,
  entryId: string,
  updatedAt: string,
): HistoryEditResult => {
  const day = history.savedDays.find((candidate) => candidate.id === dayId)
  if (!day) return { ok: false, reason: 'day_not_found' }
  if (!day.meals[mealName].entries.some((entry) => entry.id === entryId)) {
    return { ok: false, reason: 'entry_not_found' }
  }
  return applyToDay(history, dayId, mealName, (entries) => (
    entries.filter((entry) => entry.id !== entryId)
  ), updatedAt)
}

export const addHistoryEntry = (
  history: ReactHistoryStore,
  dayId: string,
  mealName: MealName,
  entry: FoodEntry,
  updatedAt: string,
): HistoryEditResult => {
  if (!Number.isFinite(entry.quantity) || entry.quantity <= 0) return { ok: false, reason: 'invalid_quantity' }
  return applyToDay(history, dayId, mealName, (entries) => [...entries, entry], updatedAt)
}