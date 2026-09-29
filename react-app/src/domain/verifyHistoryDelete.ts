import { CURRENT_REACT_SCHEMA_VERSION } from '../storage/storageKeys'
import type { FoodEntry, HistoryDay, ReactHistoryStore } from '../storage/storageTypes'
import { calculateMealsTotals } from './historyIntegrity'
import {
  permanentlyDeleteHistoryDay,
  restoreHistoryDay,
  softDeleteHistoryDay,
} from './historyEdit'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const entry = (id: string): FoodEntry => ({
  id,
  name: `Food ${id}`,
  quantity: 100,
  unit: 'g',
  basisType: 'per_100',
  nutritionSnapshot: { protein: 20, calories: 100, carbs: 10, fat: 4, fibre: 2 },
  costSnapshot: { amount: 8, currency: 'INR' },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

const emptyMeals = () => ({
  Breakfast: { name: 'Breakfast' as const, entries: [] as FoodEntry[] },
  Lunch: { name: 'Lunch' as const, entries: [] as FoodEntry[] },
  Dinner: { name: 'Dinner' as const, entries: [] as FoodEntry[] },
  Snacks: { name: 'Snacks' as const, entries: [] as FoodEntry[] },
})

const makeDay = (id: string, date: string): HistoryDay => {
  const meals = emptyMeals()
  meals.Breakfast.entries = [entry(`${id}-a`)]
  return { id, date, savedAt: '2026-05-10T20:00:00.000Z', meals, totals: calculateMealsTotals(meals) }
}

const store = (): ReactHistoryStore => ({
  schemaVersion: CURRENT_REACT_SCHEMA_VERSION,
  updatedAt: '2026-05-10T20:00:00.000Z',
  savedDays: [makeDay('d1', '2026-05-09'), makeDay('d2', '2026-05-08')],
  deletedDays: [],
})

const NOW = '2026-05-11T09:00:00.000Z'

// Soft delete moves day from savedDays to deletedDays, unchanged in shape.
{
  const before = store()
  const result = softDeleteHistoryDay(before, 'd1', NOW)
  assert(result.ok, 'soft delete should succeed')
  assert(result.store.savedDays.length === 1 && result.store.savedDays[0].id === 'd2', 'd1 removed from savedDays')
  assert(result.store.deletedDays?.length === 1 && result.store.deletedDays[0].id === 'd1', 'd1 present in deletedDays')
  assert(result.store.deletedDays?.[0].meals.Breakfast.entries[0].id === 'd1-a', 'deleted day content preserved')
  assert(result.store.updatedAt === NOW, 'store updatedAt bumped')
  assert(before.savedDays.length === 2, 'input store not mutated')
}

// Soft delete on missing day.
{
  const result = softDeleteHistoryDay(store(), 'nope', NOW)
  assert(!result.ok && result.reason === 'day_not_found', 'soft delete missing day rejected')
}

// deletedDays defaults to [] when absent on the input store.
{
  const noDeletedField: ReactHistoryStore = {
    schemaVersion: CURRENT_REACT_SCHEMA_VERSION,
    updatedAt: '2026-05-10T20:00:00.000Z',
    savedDays: [makeDay('d3', '2026-05-07')],
  }
  const result = softDeleteHistoryDay(noDeletedField, 'd3', NOW)
  assert(result.ok && result.store.deletedDays?.length === 1, 'deletedDays created when absent')
}

// Restore moves a deleted day back into savedDays.
{
  const deleted = softDeleteHistoryDay(store(), 'd1', NOW)
  assert(deleted.ok, 'setup: soft delete')
  const restored = restoreHistoryDay(deleted.store, 'd1', NOW)
  assert(restored.ok, 'restore should succeed')
  assert(restored.store.savedDays.some((d) => d.id === 'd1'), 'd1 back in savedDays')
  assert(!(restored.store.deletedDays ?? []).some((d) => d.id === 'd1'), 'd1 removed from deletedDays')
}

// Restore rejects when a day already exists for that date (avoids canonical-day collision).
{
  const deleted = softDeleteHistoryDay(store(), 'd1', NOW)
  assert(deleted.ok, 'setup: soft delete')
  const withConflict: ReactHistoryStore = {
    ...deleted.store,
    savedDays: [...deleted.store.savedDays, makeDay('d1-new', '2026-05-09')],
  }
  const restored = restoreHistoryDay(withConflict, 'd1', NOW)
  assert(!restored.ok && restored.reason === 'date_conflict', 'restore blocked on date conflict')
}

// Restore on missing/already-restored day.
{
  const result = restoreHistoryDay(store(), 'nope', NOW)
  assert(!result.ok && result.reason === 'day_not_found', 'restore missing day rejected')
}

// Permanent delete removes from deletedDays and does not touch savedDays.
{
  const deleted = softDeleteHistoryDay(store(), 'd1', NOW)
  assert(deleted.ok, 'setup: soft delete')
  const purged = permanentlyDeleteHistoryDay(deleted.store, 'd1', NOW)
  assert(purged.ok, 'permanent delete should succeed')
  assert(!(purged.store.deletedDays ?? []).some((d) => d.id === 'd1'), 'd1 gone from deletedDays')
  assert(purged.store.savedDays.length === 1, 'savedDays untouched by permanent delete')
}

// Permanent delete on missing day.
{
  const result = permanentlyDeleteHistoryDay(store(), 'nope', NOW)
  assert(!result.ok && result.reason === 'day_not_found', 'permanent delete missing day rejected')
}

console.log('History delete/restore verifier: all Task 9.2 domain assertions passed.')