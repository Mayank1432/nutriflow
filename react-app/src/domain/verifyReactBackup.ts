import {
  REACT_BACKUP_VERSION,
  applyReactBackup,
  createReactBackup,
  parseReactBackup,
  replaceReactStores,
  resetAllReactStores,
  summarizeReactBackup,
  writeReactHistoryStore,
  readReactHistoryStore,
  readReactPantryStore,
  REACT_STORAGE_KEY_ALLOWLIST,
  REACT_STORAGE_KEYS,
  CURRENT_REACT_SCHEMA_VERSION,
  type FoodEntry,
  type HistoryDay,
  type ReactHistoryStore,
} from '../storage'
import { calculateMealsTotals } from './historyIntegrity'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

class MemoryStorage {
  data = new Map<string, string>()
  sets = 0
  failOnSetNumber = -1
  getItem(key: string): string | null {
    return this.data.has(key) ? (this.data.get(key) as string) : null
  }
  setItem(key: string, value: string): void {
    this.sets += 1
    if (this.sets === this.failOnSetNumber) throw new Error('quota exceeded')
    this.data.set(key, value)
  }
  removeItem(key: string): void {
    this.data.delete(key)
  }
}

const storage = new MemoryStorage()
Object.assign(globalThis, { window: { localStorage: storage } })

const VANILLA = { pptd_v5: 'v-today', ppc_v5: 'v-custom', ppwk_v5: 'v-week', ppst_v5: 'v-staples', ppl_v5: 'v-log' }
const seedVanilla = () => Object.entries(VANILLA).forEach(([k, v]) => storage.data.set(k, v))
const assertVanillaIntact = (label: string) =>
  Object.entries(VANILLA).forEach(([k, v]) => assert(storage.data.get(k) === v, `${label}: vanilla key ${k} untouched`))
const reactSnapshot = () => JSON.stringify(REACT_STORAGE_KEY_ALLOWLIST.map((key) => [key, storage.getItem(key)]))

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

const makeDay = (id: string, date: string): HistoryDay => {
  const meals = {
    Breakfast: { name: 'Breakfast' as const, entries: [entry(`${id}-a`)] },
    Lunch: { name: 'Lunch' as const, entries: [] as FoodEntry[] },
    Dinner: { name: 'Dinner' as const, entries: [] as FoodEntry[] },
    Snacks: { name: 'Snacks' as const, entries: [] as FoodEntry[] },
  }
  return { id, date, savedAt: '2026-05-10T20:00:00.000Z', meals, totals: calculateMealsTotals(meals) }
}

const historyWith = (ids: Array<[string, string]>, deleted: Array<[string, string]> = []): ReactHistoryStore => ({
  schemaVersion: CURRENT_REACT_SCHEMA_VERSION,
  updatedAt: '2026-05-10T20:00:00.000Z',
  savedDays: ids.map(([id, date]) => makeDay(id, date)),
  deletedDays: deleted.map(([id, date]) => makeDay(id, date)),
})

const EXPORTED_AT = '2026-06-01T10:00:00.000Z'

// 1. Round trip with real data, including Recently deleted.
seedVanilla()
assert(writeReactHistoryStore(historyWith([['d1', '2026-05-09'], ['d2', '2026-05-08']], [['x1', '2026-05-01']])), 'seed history')
const original = createReactBackup(EXPORTED_AT)
assert(original.backupVersion === REACT_BACKUP_VERSION && original.appFamily === 'nutriflow_react', 'backup header')
const text = JSON.stringify(original)
resetAllReactStores()
assert(readReactHistoryStore().savedDays.length === 0, 'wiped before restore')
const parsed = parseReactBackup(text)
assert(parsed.ok, 'valid backup parses')
const summary = summarizeReactBackup(parsed.backup)
assert(summary.savedDays === 2 && summary.deletedDays === 1 && summary.exportedAt === EXPORTED_AT, 'summary counts')
assert(applyReactBackup(parsed.backup), 'apply succeeds')
assert(JSON.stringify(createReactBackup(EXPORTED_AT)) === text, 'round trip is identical, including deletedDays')
assertVanillaIntact('after round trip')

// 2. Rejections leave nothing to apply.
const rejects: Array<[string, string, string]> = [
  ['not json', 'this is not json', 'invalid_json'],
  ['json null', 'null', 'invalid_json'],
  ['array', '[]', 'not_a_backup'],
  ['wrong app', JSON.stringify({ ...original, appFamily: 'other' }), 'wrong_app'],
  ['future version', JSON.stringify({ ...original, backupVersion: REACT_BACKUP_VERSION + 1 }), 'unsupported_version'],
  ['version zero', JSON.stringify({ ...original, backupVersion: 0 }), 'not_a_backup'],
  ['version string', JSON.stringify({ ...original, backupVersion: '1' }), 'not_a_backup'],
  ['no exportedAt', JSON.stringify({ ...original, exportedAt: undefined }), 'not_a_backup'],
  ['corrupt history', JSON.stringify({ ...original, history: { ...original.history, savedDays: 'nope' } }), 'invalid_store'],
  ['missing today', JSON.stringify({ ...original, today: undefined }), 'invalid_store'],
  ['wrong schema version', JSON.stringify({ ...original, weekly: { ...original.weekly, schemaVersion: 99 } }), 'invalid_store'],
  ['corrupt optional pantry', JSON.stringify({ ...original, pantry: { schemaVersion: 1, pantryItems: 5 } }), 'invalid_store'],
]
for (const [label, body, reason] of rejects) {
  const result = parseReactBackup(body)
  assert(!result.ok && result.reason === reason, `${label} rejected as ${reason}`)
  assert(!result.ok && result.message.length > 0, `${label} has a message`)
}

// 3. Older backups without optional stores are accepted and fall back to defaults.
{
  const { dailyStaples: _a, pantry: _b, shopping: _c, ...older } = original
  const result = parseReactBackup(JSON.stringify(older))
  assert(result.ok, 'backup without optional stores parses')
  assert(applyReactBackup(result.backup), 'apply older backup')
  assert(storage.getItem(REACT_STORAGE_KEYS.pantry) === null, 'missing optional store removed')
  assert(readReactPantryStore().pantryItems.length === 0, 'pantry falls back to default')
  assert(readReactHistoryStore().savedDays.length === 2, 'required stores restored')
  assertVanillaIntact('after older backup')
}

// 4. A failed write part-way through restores the previous data.
{
  assert(writeReactHistoryStore(historyWith([['keep', '2026-04-01']])), 'seed data to keep')
  const before = reactSnapshot()
  const replacement = parseReactBackup(text)
  assert(replacement.ok, 'replacement parses')
  storage.sets = 0
  storage.failOnSetNumber = 3
  assert(!applyReactBackup(replacement.backup), 'apply reports failure')
  storage.failOnSetNumber = -1
  assert(reactSnapshot() === before, 'previous React data restored after failed write')
  assertVanillaIntact('after failed write')
}

// 5. Invalid values are refused before anything is touched.
{
  const before = reactSnapshot()
  assert(!replaceReactStores({ [REACT_STORAGE_KEYS.history]: { schemaVersion: 1, savedDays: 'bad' } }), 'invalid value refused')
  assert(reactSnapshot() === before, 'nothing changed by refused replace')
}

// 6. No storage available.
{
  Object.assign(globalThis, { window: undefined })
  const result = parseReactBackup(text)
  assert(result.ok, 'parsing needs no storage')
  assert(!applyReactBackup(result.backup), 'apply fails safely without storage')
  Object.assign(globalThis, { window: { localStorage: storage } })
}

console.log('React backup verifier: all Task 10.1 assertions passed.')