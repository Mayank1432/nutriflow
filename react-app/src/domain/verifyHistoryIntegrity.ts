import { CURRENT_REACT_SCHEMA_VERSION } from '../storage/storageKeys'
import type { FoodEntry, HistoryDay, MealName, ReactHistoryStore, ReactTodayStore } from '../storage/storageTypes'
import {
  calculateFoodEntryTotals,
  calculateTodayTotals,
  classifyLocalDateKey,
  compareLocalDateKeys,
  createFreshTodayStore,
  createHistoryDayFromToday,
  getCanonicalValidHistoryDays,
  getLocalDateKey,
  isTodayStoreEmpty,
  parseStrictLocalDateKey,
  planTodayRollover,
  resolveLatestTodayForOperation,
  selectCanonicalHistoryDay,
  sortHistoryDays,
  upsertTodayIntoHistory,
} from './historyIntegrity'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const equal = (actual: unknown, expected: unknown, message: string) => {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`)
}

const mealNames: MealName[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']
const meals = () => ({
  Breakfast: { name: 'Breakfast' as const, entries: [] as FoodEntry[] },
  Lunch: { name: 'Lunch' as const, entries: [] as FoodEntry[] },
  Dinner: { name: 'Dinner' as const, entries: [] as FoodEntry[] },
  Snacks: { name: 'Snacks' as const, entries: [] as FoodEntry[] },
})
const totals = () => ({ protein: 0, calories: 0, carbs: 0, fat: 0, fibre: 0, cost: 0 })
const entry = (id: string, basisType: 'per_100' | 'per_unit' = 'per_100'): FoodEntry => ({
  id,
  ingredientId: `ingredient-${id}`,
  stapleId: `staple-${id}`,
  name: `Food ${id}`,
  quantity: basisType === 'per_100' ? 50 : 2,
  unit: basisType === 'per_100' ? 'g' : 'piece',
  basisType,
  nutritionSnapshot: { protein: 20, calories: 100, carbs: 10, fat: 4, fibre: 2 },
  costSnapshot: { amount: 8, currency: 'INR' },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})
const today = (date = '2026-05-10', updatedAt = '2026-05-10T08:00:00.000Z'): ReactTodayStore => ({
  schemaVersion: CURRENT_REACT_SCHEMA_VERSION,
  date,
  updatedAt,
  meals: meals(),
  totals: totals(),
})
const historyDay = (id: string, date: string, savedAt: string, note?: string): HistoryDay => ({
  id, date, savedAt, meals: meals(), totals: totals(), ...(note === undefined ? {} : { note }),
})
const historyStore = (savedDays: HistoryDay[], deletedDays?: HistoryDay[]): ReactHistoryStore => ({
  schemaVersion: CURRENT_REACT_SCHEMA_VERSION,
  updatedAt: '2026-05-01T00:00:00.000Z',
  savedDays,
  ...(deletedDays === undefined ? {} : { deletedDays }),
})

assert(getLocalDateKey(new Date(2026, 0, 2, 23, 30)) === '2026-01-02', 'local date formatting')
const localBoundary = new Date(2026, 0, 2, 0, 30)
assert(getLocalDateKey(localBoundary) === '2026-01-02', 'local date does not substitute the UTC day')
assert(parseStrictLocalDateKey('2026-05-10') !== null, 'strict valid date')
assert(parseStrictLocalDateKey('2024-02-29') !== null, 'valid leap date')
assert(parseStrictLocalDateKey('2026-02-29') === null, 'invalid leap date')
assert(parseStrictLocalDateKey('05/10/2026') === null, 'malformed date')
assert(parseStrictLocalDateKey('2026-02-30') === null, 'impossible date')
assert(classifyLocalDateKey('2026-05-10', '2026-05-10') === 'current', 'current classification')
assert(classifyLocalDateKey('2026-05-09', '2026-05-10') === 'stale', 'stale classification')
assert(classifyLocalDateKey('2026-05-11', '2026-05-10') === 'future', 'future classification')
assert(classifyLocalDateKey('bad', '2026-05-10') === 'invalid', 'invalid classification')
assert(compareLocalDateKeys('2026-05-09', '2026-05-10') === -1, 'local calendar comparison')
assert(compareLocalDateKeys('bad', '2026-05-10') === null, 'invalid comparison')

const persisted = today('2026-05-10', '2026-05-10T09:00:00.000Z')
const inTab = today('2026-05-10', '2026-05-10T10:00:00.000Z')
const resolverInputs = structuredClone([persisted, inTab])
assert(resolveLatestTodayForOperation(persisted, today('2026-05-11')) === persisted, 'different dates choose persisted')
assert(resolveLatestTodayForOperation(persisted, inTab) === inTab, 'later valid in-tab timestamp')
assert(resolveLatestTodayForOperation(today('2026-05-10', 'bad'), inTab) === inTab, 'valid timestamp beats invalid')
assert(resolveLatestTodayForOperation(persisted, today('2026-05-10', persisted.updatedAt)) === persisted, 'equal timestamps choose persisted')
assert(resolveLatestTodayForOperation(today('2026-05-10', 'bad-a'), today('2026-05-10', 'bad-b')).updatedAt === 'bad-a', 'both invalid choose persisted')
equal([persisted, inTab], resolverInputs, 'resolver inputs remain unchanged')

const emptyToday = today()
assert(isTodayStoreEmpty(emptyToday), 'all meals empty')
for (const meal of mealNames) {
  const populated = today()
  populated.meals[meal].entries.push(entry(meal))
  populated.totals = totals()
  assert(!isTodayStoreEmpty(populated), `${meal} entry is populated despite zero totals`)
}

equal(calculateFoodEntryTotals(entry('100')), { protein: 10, calories: 50, carbs: 5, fat: 2, fibre: 1, cost: 4 }, 'per_100 totals')
equal(calculateFoodEntryTotals(entry('unit', 'per_unit')), { protein: 40, calories: 200, carbs: 20, fat: 8, fibre: 4, cost: 16 }, 'per_unit totals')
const totalsToday = today()
totalsToday.meals.Breakfast.entries.push(entry('100'), entry('unit', 'per_unit'))
equal(calculateTodayTotals(totalsToday), { protein: 50, calories: 250, carbs: 25, fat: 10, fibre: 5, cost: 20 }, 'Today totals')
const beforeSnapshot = structuredClone(totalsToday)
const snapshot = createHistoryDayFromToday(totalsToday, { id: 'history-id', savedAt: '2026-05-10T12:00:00.000Z' })
assert(snapshot.date === totalsToday.date, 'snapshot date')
assert(snapshot.id === 'history-id', 'snapshot supplied ID')
assert(snapshot.savedAt === '2026-05-10T12:00:00.000Z', 'snapshot supplied savedAt')
assert(snapshot.meals.Breakfast.entries[0].id === '100', 'FoodEntry ID preserved')
equal(snapshot.meals.Breakfast.entries[0].nutritionSnapshot, entry('100').nutritionSnapshot, 'nutrition snapshot preserved')
equal(snapshot.meals.Breakfast.entries[0].costSnapshot, entry('100').costSnapshot, 'cost snapshot preserved')
equal(snapshot.totals, calculateTodayTotals(totalsToday), 'snapshot totals recalculated')
equal(totalsToday, beforeSnapshot, 'snapshot source unchanged')

const invalidTs = historyDay('z', '2026-05-10', 'bad')
const olderTs = historyDay('a', '2026-05-10', '2026-05-10T08:00:00.000Z')
const newerTs = historyDay('b', '2026-05-10', '2026-05-10T09:00:00.000Z')
assert(selectCanonicalHistoryDay([invalidTs, olderTs])?.id === 'a', 'valid savedAt beats invalid')
assert(selectCanonicalHistoryDay([olderTs, newerTs])?.id === 'b', 'newer savedAt wins')
const tiedA = historyDay('a', '2026-05-10', newerTs.savedAt)
assert(selectCanonicalHistoryDay([tiedA, newerTs])?.id === 'b', 'ID tie-break')
for (const permutation of [[invalidTs, olderTs, newerTs], [newerTs, invalidTs, olderTs], [olderTs, newerTs, invalidTs]]) {
  assert(selectCanonicalHistoryDay(permutation)?.id === 'b', 'canonical survivor independent of order')
}
const unsorted = [invalidTs, olderTs, newerTs]
const unsortedBefore = [...unsorted]
equal(sortHistoryDays(unsorted).map((day) => day.id), ['b', 'a', 'z'], 'deterministic History sorting')
equal(unsorted, unsortedBefore, 'sorting source unchanged')
equal(sortHistoryDays([historyDay('a', 'bad-a', 'bad-a'), historyDay('b', 'bad-b', 'bad-b')]).map((day) => day.id), ['b', 'a'], 'invalid timestamp ID tie-break')

const validOther = historyDay('c', '2026-05-09', '2026-05-11T00:00:00.000Z')
const malformed = historyDay('malformed', 'not-a-date', '2026-05-12T00:00:00.000Z')
const canonicalSource = [olderTs, newerTs, validOther, malformed]
const canonicalBefore = structuredClone(canonicalSource)
equal(getCanonicalValidHistoryDays(canonicalSource).map((day) => day.id), ['c', 'b'], 'canonical valid-date view')
equal(canonicalSource, canonicalBefore, 'canonical source unchanged')

let idCalls = 0
const deleted = historyDay('deleted', '2026-05-10', '2026-05-01T00:00:00.000Z')
const newUpsert = upsertTodayIntoHistory(historyStore([validOther, malformed], [deleted]), totalsToday, { savedAt: '2026-05-13T00:00:00.000Z', createId: () => { idCalls += 1; return 'new-id' } })
assert(newUpsert.ok && newUpsert.outcome === 'created' && newUpsert.canonicalId === 'new-id', 'new date creates record')
assert(idCalls === 1, 'new date creates one ID')
equal(newUpsert.ok ? newUpsert.store.deletedDays : null, [deleted], 'deletedDays preserved')
assert(newUpsert.ok && newUpsert.store.savedDays.some((day) => day.id === 'malformed'), 'malformed record preserved')
assert(!Object.hasOwn(upsertTodayIntoHistory(historyStore([]), totalsToday, { savedAt: '2026-05-13T00:00:00.000Z', createId: () => 'without-deleted' }).store, 'deletedDays'), 'undefined deletedDays stays undefined')

const updateToday = today('2026-05-10', '2026-05-14T00:00:00.000Z')
updateToday.meals.Lunch.entries.push(entry('replacement'))
const duplicateStore = historyStore([
  historyDay('old', '2026-05-10', '2026-05-10T08:00:00.000Z', 'old note'),
  historyDay('winner', '2026-05-10', '2026-05-10T09:00:00.000Z', 'keep note'),
  historyDay('other-a', '2026-05-09', '2026-05-09T08:00:00.000Z'),
  historyDay('other-b', '2026-05-09', '2026-05-09T09:00:00.000Z'),
  malformed,
], [deleted])
const duplicateBefore = structuredClone(duplicateStore)
const updated = upsertTodayIntoHistory(duplicateStore, updateToday, { savedAt: '2026-05-15T00:00:00.000Z', createId: () => 'unused' })
assert(updated.ok && updated.outcome === 'updated', 'existing date updated')
assert(updated.ok && updated.canonicalId === 'winner', 'canonical ID preserved')
assert(updated.ok && updated.store.savedDays.find((day) => day.id === 'winner')?.note === 'keep note', 'canonical note preserved')
assert(updated.ok && updated.store.savedDays.find((day) => day.id === 'winner')?.savedAt === '2026-05-15T00:00:00.000Z', 'savedAt updated')
assert(updated.ok && updated.store.savedDays.filter((day) => day.date === '2026-05-10').length === 1, 'target duplicates collapse')
assert(updated.ok && updated.store.savedDays.filter((day) => day.date === '2026-05-09').length === 1, 'other duplicates normalize')
assert(updated.ok && updated.store.savedDays.some((day) => day.id === 'malformed'), 'malformed survives update')
equal(duplicateStore, duplicateBefore, 'upsert input unchanged')
const invalidUpsert = upsertTodayIntoHistory(duplicateStore, today('bad-date'), { savedAt: 'now', createId: () => 'never' })
assert(!invalidUpsert.ok && invalidUpsert.outcome === 'invalid', 'invalid incoming date rejected')
const emptyUpsert = upsertTodayIntoHistory(historyStore([]), today(), { savedAt: '2026-05-10T12:00:00.000Z', createId: () => 'empty-id' })
assert(emptyUpsert.ok && emptyUpsert.store.savedDays.length === 1, 'manual empty day can be upserted')

assert(planTodayRollover(today('2026-05-10'), '2026-05-10').outcome === 'no_action_current', 'current rollover plan')
const stalePopulated = today('2026-05-09'); stalePopulated.meals.Snacks.entries.push(entry('stale'))
assert(planTodayRollover(stalePopulated, '2026-05-10').outcome === 'rollover_populated', 'stale populated plan')
assert(planTodayRollover(today('2026-05-09'), '2026-05-10').outcome === 'reset_empty', 'stale empty plan')
assert(planTodayRollover(today('2026-05-11'), '2026-05-10').outcome === 'future_today_date', 'future plan')
assert(planTodayRollover(today('invalid'), '2026-05-10').outcome === 'invalid_today_date', 'invalid plan')
assert(planTodayRollover(stalePopulated, '2026-05-20').outcome === 'rollover_populated', 'multiple missed days plan')

const fresh = createFreshTodayStore('2026-05-20', '2026-05-20T00:00:01.000Z')
assert(fresh.schemaVersion === CURRENT_REACT_SCHEMA_VERSION, 'fresh Today schema version')
assert(fresh.date === '2026-05-20', 'fresh Today date')
assert(fresh.updatedAt === '2026-05-20T00:00:01.000Z', 'fresh Today timestamp')
assert(isTodayStoreEmpty(fresh), 'fresh Today meals empty')
equal(fresh.totals, totals(), 'fresh Today zero totals')

console.log('History integrity verification passed.')
