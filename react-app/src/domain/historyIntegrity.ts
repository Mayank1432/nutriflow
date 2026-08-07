import { CURRENT_REACT_SCHEMA_VERSION } from '../storage/storageKeys'
import type {
  DailyTotals,
  FoodEntry,
  HistoryDay,
  MealName,
  MealsByName,
  ReactHistoryStore,
  ReactTodayStore,
} from '../storage/storageTypes'

const MEALS: MealName[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']

export const getLocalDateKey = (date = new Date()): string => {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const parseStrictLocalDateKey = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(year, month - 1, day)
  return parsed.getFullYear() === year
    && parsed.getMonth() === month - 1
    && parsed.getDate() === day
    ? parsed
    : null
}

export const compareLocalDateKeys = (left: string, right: string): number | null => {
  if (!parseStrictLocalDateKey(left) || !parseStrictLocalDateKey(right)) return null
  return left === right ? 0 : left < right ? -1 : 1
}

export type LocalDateClassification = 'current' | 'stale' | 'future' | 'invalid'

export const classifyLocalDateKey = (value: string, currentDateKey: string): LocalDateClassification => {
  const comparison = compareLocalDateKeys(value, currentDateKey)
  if (comparison === null) return 'invalid'
  return comparison === 0 ? 'current' : comparison < 0 ? 'stale' : 'future'
}

const timestampValue = (value: string): number | null => {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

const compareTimestamps = (left: string, right: string): number => {
  const leftValue = timestampValue(left)
  const rightValue = timestampValue(right)
  if (leftValue !== null && rightValue === null) return 1
  if (leftValue === null && rightValue !== null) return -1
  if (leftValue !== null && rightValue !== null && leftValue !== rightValue) {
    return leftValue > rightValue ? 1 : -1
  }
  return 0
}

export const resolveLatestTodayForOperation = (
  persistedToday: ReactTodayStore,
  inTabToday: ReactTodayStore,
): ReactTodayStore => {
  if (persistedToday.date !== inTabToday.date) return persistedToday
  return compareTimestamps(inTabToday.updatedAt, persistedToday.updatedAt) > 0
    ? inTabToday
    : persistedToday
}

export const calculateFoodEntryTotals = (entry: FoodEntry): DailyTotals => {
  const factor = entry.basisType === 'per_100' ? entry.quantity / 100 : entry.quantity
  return {
    protein: entry.nutritionSnapshot.protein * factor,
    calories: entry.nutritionSnapshot.calories * factor,
    carbs: entry.nutritionSnapshot.carbs * factor,
    fat: entry.nutritionSnapshot.fat * factor,
    fibre: entry.nutritionSnapshot.fibre * factor,
    cost: (entry.costSnapshot?.amount ?? 0) * factor,
  }
}

const emptyTotals = (): DailyTotals => ({ protein: 0, calories: 0, carbs: 0, fat: 0, fibre: 0, cost: 0 })

export const calculateMealsTotals = (meals: MealsByName): DailyTotals =>
  MEALS.flatMap((meal) => meals[meal].entries).reduce<DailyTotals>((totals, entry) => {
    const next = calculateFoodEntryTotals(entry)
    return {
      protein: totals.protein + next.protein,
      calories: totals.calories + next.calories,
      carbs: totals.carbs + next.carbs,
      fat: totals.fat + next.fat,
      fibre: totals.fibre + next.fibre,
      cost: totals.cost + next.cost,
    }
  }, emptyTotals())

export const calculateTodayTotals = (today: ReactTodayStore): DailyTotals =>
  calculateMealsTotals(today.meals)

export const isTodayStoreEmpty = (today: ReactTodayStore): boolean =>
  MEALS.every((meal) => today.meals[meal].entries.length === 0)

export const createHistoryDayFromToday = (
  today: ReactTodayStore,
  identity: { id: string; savedAt: string },
): HistoryDay => ({
  id: identity.id,
  date: today.date,
  savedAt: identity.savedAt,
  meals: structuredClone(today.meals),
  totals: calculateTodayTotals(today),
})

export const selectCanonicalHistoryDay = (days: readonly HistoryDay[]): HistoryDay | null =>
  days.reduce<HistoryDay | null>((selected, candidate) => {
    if (!selected) return candidate
    const timestampComparison = compareTimestamps(candidate.savedAt, selected.savedAt)
    if (timestampComparison !== 0) return timestampComparison > 0 ? candidate : selected
    return candidate.id > selected.id ? candidate : selected
  }, null)

export const sortHistoryDays = (days: readonly HistoryDay[]): HistoryDay[] =>
  [...days].sort((left, right) => {
    const timestampComparison = compareTimestamps(right.savedAt, left.savedAt)
    return timestampComparison !== 0
      ? timestampComparison
      : right.id.localeCompare(left.id)
  })

export const getCanonicalValidHistoryDays = (savedDays: readonly HistoryDay[]): HistoryDay[] => {
  const groups = new Map<string, HistoryDay[]>()
  for (const day of savedDays) {
    if (!parseStrictLocalDateKey(day.date)) continue
    groups.set(day.date, [...(groups.get(day.date) ?? []), day])
  }
  return sortHistoryDays([...groups.values()].flatMap((group) => {
    const survivor = selectCanonicalHistoryDay(group)
    return survivor ? [survivor] : []
  }))
}

export const normalizeActiveHistoryDays = (savedDays: readonly HistoryDay[]): {
  savedDays: HistoryDay[]
  duplicatesRemoved: number
} => {
  const malformed: HistoryDay[] = []
  const groups = new Map<string, HistoryDay[]>()
  for (const day of savedDays) {
    if (!parseStrictLocalDateKey(day.date)) {
      malformed.push(day)
      continue
    }
    groups.set(day.date, [...(groups.get(day.date) ?? []), day])
  }
  const canonical = [...groups.values()].flatMap((group) => {
    const survivor = selectCanonicalHistoryDay(group)
    return survivor ? [survivor] : []
  })
  return {
    savedDays: sortHistoryDays([...canonical, ...malformed]),
    duplicatesRemoved: savedDays.length - canonical.length - malformed.length,
  }
}

export type HistoryUpsertResult =
  | { ok: false; outcome: 'invalid'; store: ReactHistoryStore; canonicalId: null; duplicatesRemoved: 0 }
  | { ok: true; outcome: 'created' | 'updated'; store: ReactHistoryStore; canonicalId: string; duplicatesRemoved: number }

export const upsertTodayIntoHistory = (
  history: ReactHistoryStore,
  today: ReactTodayStore,
  options: { savedAt: string; createId: () => string },
): HistoryUpsertResult => {
  if (!parseStrictLocalDateKey(today.date)) {
    return { ok: false, outcome: 'invalid', store: history, canonicalId: null, duplicatesRemoved: 0 }
  }

  const targetRecords = history.savedDays.filter((day) => day.date === today.date)
  const targetSurvivor = selectCanonicalHistoryDay(targetRecords)
  const canonicalId = targetSurvivor?.id ?? options.createId()
  const incoming = createHistoryDayFromToday(today, { id: canonicalId, savedAt: options.savedAt })
  const replacement: HistoryDay = targetSurvivor?.note === undefined
    ? incoming
    : { ...incoming, note: targetSurvivor.note }

  const withoutTarget = history.savedDays.filter((day) => day.date !== today.date)
  const normalized = normalizeActiveHistoryDays([...withoutTarget, replacement])
  const duplicatesRemoved = history.savedDays.length
    + (targetSurvivor ? 0 : 1)
    - normalized.savedDays.length

  return {
    ok: true,
    outcome: targetSurvivor ? 'updated' : 'created',
    canonicalId,
    duplicatesRemoved,
    store: {
      ...history,
      updatedAt: options.savedAt,
      savedDays: normalized.savedDays,
    },
  }
}

export type TodayRolloverPlan =
  | { outcome: 'no_action_current' }
  | { outcome: 'rollover_populated' }
  | { outcome: 'reset_empty' }
  | { outcome: 'invalid_today_date' }
  | { outcome: 'future_today_date' }

export const planTodayRollover = (today: ReactTodayStore, currentDateKey: string): TodayRolloverPlan => {
  const classification = classifyLocalDateKey(today.date, currentDateKey)
  if (classification === 'invalid') return { outcome: 'invalid_today_date' }
  if (classification === 'future') return { outcome: 'future_today_date' }
  if (classification === 'current') return { outcome: 'no_action_current' }
  return { outcome: isTodayStoreEmpty(today) ? 'reset_empty' : 'rollover_populated' }
}

export const createFreshTodayStore = (date: string, updatedAt: string): ReactTodayStore => ({
  schemaVersion: CURRENT_REACT_SCHEMA_VERSION,
  date,
  updatedAt,
  meals: {
    Breakfast: { name: 'Breakfast', entries: [] },
    Lunch: { name: 'Lunch', entries: [] },
    Dinner: { name: 'Dinner', entries: [] },
    Snacks: { name: 'Snacks', entries: [] },
  },
  totals: emptyTotals(),
})
