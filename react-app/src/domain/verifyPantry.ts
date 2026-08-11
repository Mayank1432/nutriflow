import { createDefaultReactPantryStore, createDefaultReactStores } from '../storage/storageDefaults'
import { isPantryItem, isReactPantryStore, resetReactPantryStore } from '../storage/storageHelpers'
import { CURRENT_REACT_SCHEMA_VERSION, REACT_STORAGE_KEY_ALLOWLIST, REACT_STORAGE_KEYS, RESERVED_REACT_STORAGE_KEYS } from '../storage/storageKeys'
import type { IngredientDefinition, PantryItem, ReactPantryStore, ServingUnit } from '../storage/storageTypes'
import { createPantryItem, derivePantrySummary, parsePantryQuantity } from './pantry'

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message) }
const timestamp = '2026-08-11T00:00:00.000Z'
const ingredient: IngredientDefinition = {
  id: 'ingredient-1', name: 'Lentils', unit: 'g', defaultQuantity: 100, defaultUnit: 'g', defaultMeal: 'Lunch', category: 'Veg', basisType: 'per_100',
  nutrition: { protein: 9, calories: 116, carbs: 20, fat: 0.4, fibre: 8 }, cost: { amount: 0.4 }, barcode: 'future', image: 'lentils.png', createdAt: timestamp, updatedAt: timestamp,
}
const item = createPantryItem(ingredient, timestamp, () => 'pantry-1')
const store = (pantryItems: PantryItem[]): ReactPantryStore => ({ schemaVersion: 1, updatedAt: timestamp, pantryItems })

assert(REACT_STORAGE_KEYS.pantry === 'nutriflow_react_pantry_v1', 'Pantry key must be active')
assert(RESERVED_REACT_STORAGE_KEYS.shopping === 'nutriflow_react_shopping_v1', 'Shopping key must remain reserved')
assert(CURRENT_REACT_SCHEMA_VERSION === 1, 'Schema version must remain 1')
assert(REACT_STORAGE_KEY_ALLOWLIST.includes(REACT_STORAGE_KEYS.pantry), 'Pantry must be allowlisted')
assert(!REACT_STORAGE_KEY_ALLOWLIST.includes(RESERVED_REACT_STORAGE_KEYS.shopping as never), 'Shopping must not be allowlisted')
for (const key of ['pptd_v5', 'ppc_v5', 'ppwk_v5', 'ppst_v5', 'ppl_v5']) assert(!REACT_STORAGE_KEY_ALLOWLIST.includes(key as never), `${key} must be protected`)

const firstDefault = createDefaultReactPantryStore(); const secondDefault = createDefaultReactPantryStore()
assert(firstDefault.schemaVersion === 1 && firstDefault.pantryItems.length === 0 && Number.isFinite(Date.parse(firstDefault.updatedAt)), 'Default Pantry store invalid')
assert(firstDefault !== secondDefault && firstDefault.pantryItems !== secondDefault.pantryItems, 'Pantry defaults must be fresh')
assert(createDefaultReactStores().pantry.pantryItems.length === 0, 'Pantry must be in aggregate defaults')

assert(item.id === 'pantry-1' && item.ingredientId === ingredient.id && item.name === ingredient.name && item.unit === ingredient.defaultUnit && item.image === ingredient.image, 'Minimal snapshot identity failed')
assert(item.quantityInStock === 0 && item.inStock && !item.lowStock && !item.usedOften, 'Creation defaults failed')
for (const forbidden of ['nutrition', 'cost', 'defaultMeal', 'basisType', 'barcode', 'category']) assert(!(forbidden in item), `${forbidden} must not be snapshotted`)
assert(ingredient.name === 'Lentils' && ingredient.nutrition.protein === 9, 'Ingredient source was mutated')

for (const unit of ['g', 'ml', 'piece', 'serving'] as ServingUnit[]) assert(isPantryItem({ ...item, unit }), `${unit} should validate`)
for (const unit of ['kg', 'L', 'pcs']) assert(!isPantryItem({ ...item, unit }), `${unit} should fail`)
for (const quantity of [0, 5, 1.25]) assert(isPantryItem({ ...item, quantityInStock: quantity }), `${quantity} should validate`)
for (const quantity of [-1, Number.NaN, Infinity, -Infinity]) assert(!isPantryItem({ ...item, quantityInStock: quantity }), `${quantity} should fail`)
assert(parsePantryQuantity('') === null && parsePantryQuantity('-1') === null && parsePantryQuantity('Infinity') === null && parsePantryQuantity('0') === 0 && parsePantryQuantity('1.5') === 1.5, 'Draft quantity validation failed')
for (const field of ['inStock', 'lowStock', 'usedOften'] as const) assert(!isPantryItem({ ...item, [field]: 'yes' }), `${field} must be boolean`)
assert(isPantryItem({ ...item, image: undefined }) && !isPantryItem({ ...item, image: 1 }), 'Optional image validation failed')

assert(isReactPantryStore(store([item])), 'Valid Pantry store rejected')
assert(!isReactPantryStore(store([item, { ...item, ingredientId: 'ingredient-2' }])), 'Duplicate ids must be rejected')
assert(!isReactPantryStore(store([item, { ...item, id: 'pantry-2' }])), 'Duplicate ingredientIds must be rejected')
assert(store([item, { ...item, id: 'pantry-2' }]).pantryItems.length === 2, 'Validation must not merge/dedupe')

const summaryInput = [item, { ...item, id: 'pantry-2', ingredientId: 'ingredient-2', quantityInStock: 0, inStock: false, lowStock: true }]
const summaryCopy = structuredClone(summaryInput); const summary = derivePantrySummary(summaryInput)
assert(summary.totalItems === 2 && summary.inStockCount === 1 && summary.lowStockCount === 1, 'Summary counts failed')
assert(summaryInput[1].quantityInStock === 0 && !summaryInput[1].inStock && summaryInput[1].lowStock, 'Manual state independence failed')
assert(JSON.stringify(summaryInput) === JSON.stringify(summaryCopy), 'Summary mutated its input')

const removed: string[] = []
Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: { removeItem: (key: string) => removed.push(key) } } })
resetReactPantryStore()
assert(removed.length === 1 && removed[0] === REACT_STORAGE_KEYS.pantry, 'Pantry reset must remove only its active key')
delete (globalThis as { window?: unknown }).window

console.log('Pantry verifier: all Task 8.1 assertions passed.')
