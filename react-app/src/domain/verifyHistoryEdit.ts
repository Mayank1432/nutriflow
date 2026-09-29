import { CURRENT_REACT_SCHEMA_VERSION } from '../storage/storageKeys'
import type { FoodEntry, HistoryDay, ReactHistoryStore } from '../storage/storageTypes'
import { calculateMealsTotals } from './historyIntegrity'
import {
  addHistoryEntry,
  changeHistoryEntryQuantity,
  removeHistoryEntry,
} from './historyEdit'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const close = (actual: number, expected: number, message: string) => {
  assert(Math.abs(actual - expected) < 1e-9, `${message}: ${actual} !== ${expected}`)
}

const entry = (id: string, basisType: 'per_100' | 'per_unit', quantity: number): FoodEntry => ({
  id,
  name: `Food ${id}`,
  quantity,
  unit: basisType === 'per_100' ? 'g' : 'piece',
  basisType,
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
  meals.Breakfast.entries = [entry(`${id}-a`, 'per_100', 100), entry(`${id}-b`, 'per_unit', 2)]
  return { id, date, savedAt: '2026-05-10T20:00:00.000Z', meals, totals: calculateMealsTotals(meals) }
}

const store = (): ReactHistoryStore => ({
  schemaVersion: CURRENT_REACT_SCHEMA_VERSION,
  updatedAt: '2026-05-10T20:00:00.000Z',
  savedDays: [makeDay('d1', '2026-05-09'), makeDay('d2', '2026-05-08')],
})

const NOW = '2026-05-11T09:00:00.000Z'

// Quantity edit: per_100 entry 100g -> 200g doubles that entry's contribution.
{
  const before = store()
  const result = changeHistoryEntryQuantity(before, 'd1', 'Breakfast', 'd1-a', 200, NOW)
  assert(result.ok, 'quantity edit should succeed')
  const day = result.store.savedDays.find((d) => d.id === 'd1')!
  close(day.meals.Breakfast.entries[0].quantity, 200, 'quantity updated')
  assert(day.meals.Breakfast.entries[0].updatedAt === NOW, 'entry updatedAt bumped')
  close(day.totals.protein, 80, 'totals recalculated after quantity edit')
  close(day.totals.cost, 8 * 2 + 8 * 2, 'cost recalculated')
  assert(result.store.updatedAt === NOW, 'store updatedAt bumped')
  close(before.savedDays[0].meals.Breakfast.entries[0].quantity, 100, 'input store not mutated')
  assert(result.store.savedDays[1] === before.savedDays[1], 'other day untouched by reference')
  assert(day.savedAt === '2026-05-10T20:00:00.000Z' && day.date === '2026-05-09', 'date/savedAt preserved')
}

// Invalid quantities rejected.
for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
  const result = changeHistoryEntryQuantity(store(), 'd1', 'Breakfast', 'd1-a', bad, NOW)
  assert(!result.ok && result.reason === 'invalid_quantity', `quantity ${bad} rejected`)
}

// Missing day / entry.
{
  const a = changeHistoryEntryQuantity(store(), 'nope', 'Breakfast', 'd1-a', 5, NOW)
  assert(!a.ok && a.reason === 'day_not_found', 'missing day')
  const b = changeHistoryEntryQuantity(store(), 'd1', 'Lunch', 'd1-a', 5, NOW)
  assert(!b.ok && b.reason === 'entry_not_found', 'entry in wrong meal not found')
  const c = removeHistoryEntry(store(), 'd1', 'Breakfast', 'zzz', NOW)
  assert(!c.ok && c.reason === 'entry_not_found', 'remove missing entry')
  const d = removeHistoryEntry(store(), 'nope', 'Breakfast', 'd1-a', NOW)
  assert(!d.ok && d.reason === 'day_not_found', 'remove on missing day')
}

// Remove.
{
  const result = removeHistoryEntry(store(), 'd1', 'Breakfast', 'd1-a', NOW)
  assert(result.ok, 'remove should succeed')
  const day = result.store.savedDays.find((d) => d.id === 'd1')!
  assert(day.meals.Breakfast.entries.length === 1, 'one entry left')
  close(day.totals.protein, 40, 'totals after remove')
  const other = result.store.savedDays.find((d) => d.id === 'd2')!
  close(other.totals.protein, 60, 'other day totals unchanged')
}

// Removing the last entries yields zero totals, not NaN.
{
  let current = store()
  for (const id of ['d1-a', 'd1-b']) {
    const r = removeHistoryEntry(current, 'd1', 'Breakfast', id, NOW)
    assert(r.ok, 'remove chain')
    current = r.store
  }
  const day = current.savedDays.find((d) => d.id === 'd1')!
  assert(day.totals.protein === 0 && day.totals.cost === 0, 'empty day totals are zero')
}

// Add into a different meal.
{
  const added = entry('new', 'per_100', 50)
  const result = addHistoryEntry(store(), 'd2', 'Dinner', added, NOW)
  assert(result.ok, 'add should succeed')
  const day = result.store.savedDays.find((d) => d.id === 'd2')!
  assert(day.meals.Dinner.entries.length === 1 && day.meals.Dinner.entries[0].id === 'new', 'entry added to Dinner')
  close(day.totals.protein, 60 + 10, 'totals include added entry (20*0.5=10)')
  const bad = addHistoryEntry(store(), 'd2', 'Dinner', { ...added, quantity: 0 }, NOW)
  assert(!bad.ok && bad.reason === 'invalid_quantity', 'add with zero quantity rejected')
  const missing = addHistoryEntry(store(), 'nope', 'Dinner', added, NOW)
  assert(!missing.ok && missing.reason === 'day_not_found', 'add to missing day')
}

// deletedDays is preserved when present.
{
  const withDeleted: ReactHistoryStore = { ...store(), deletedDays: [makeDay('gone', '2026-04-01')] }
  const r = removeHistoryEntry(withDeleted, 'd1', 'Breakfast', 'd1-a', NOW)
  assert(r.ok && r.store.deletedDays?.length === 1, 'deletedDays preserved')
}

console.log('History edit verifier: all Task 9.1 domain assertions passed.')