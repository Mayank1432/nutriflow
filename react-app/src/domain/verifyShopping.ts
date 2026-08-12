import { createDefaultReactShoppingStore, createDefaultReactStores } from '../storage/storageDefaults'
import { isReactShoppingStore, isShoppingItem, resetReactShoppingStore } from '../storage/storageHelpers'
import { CURRENT_REACT_SCHEMA_VERSION, REACT_STORAGE_KEY_ALLOWLIST, REACT_STORAGE_KEYS, RESERVED_REACT_STORAGE_KEYS } from '../storage/storageKeys'
import type { ReactShoppingStore, ShoppingItem } from '../storage/storageTypes'
import { clearCompletedShoppingItems, createShoppingItem, deriveShoppingSections, normalizeShoppingName, toggleShoppingItemCompleted } from './shopping'

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message) }
const time = '2026-08-11T00:00:00.000Z'
const later = '2026-08-11T01:00:00.000Z'
const store = (shoppingItems: ShoppingItem[]): ReactShoppingStore => ({ schemaVersion: 1, updatedAt: time, shoppingItems })

assert(REACT_STORAGE_KEYS.shopping === 'nutriflow_react_shopping_v1', 'Shopping key must be active')
assert(REACT_STORAGE_KEY_ALLOWLIST.includes(REACT_STORAGE_KEYS.shopping), 'Shopping must be allowlisted')
assert(REACT_STORAGE_KEY_ALLOWLIST.includes(REACT_STORAGE_KEYS.pantry), 'Pantry must remain active')
assert(!('shopping' in RESERVED_REACT_STORAGE_KEYS), 'Shopping must no longer be reserved')
assert(CURRENT_REACT_SCHEMA_VERSION === 1, 'Schema must remain version 1')
for (const key of ['pptd_v5', 'ppc_v5', 'ppwk_v5', 'ppst_v5', 'ppl_v5']) assert(!REACT_STORAGE_KEY_ALLOWLIST.includes(key as never), `${key} must remain protected`)

const first = createDefaultReactShoppingStore(); const second = createDefaultReactShoppingStore()
assert(first.schemaVersion === 1 && first.shoppingItems.length === 0 && Number.isFinite(Date.parse(first.updatedAt)), 'Default Shopping store invalid')
assert(first !== second && first.shoppingItems !== second.shoppingItems, 'Default Shopping stores must be fresh')
assert(createDefaultReactStores().shopping.shoppingItems.length === 0, 'Aggregate defaults must include Shopping')

assert(normalizeShoppingName('   Greek Yogurt   ') === 'Greek Yogurt', 'Outer whitespace must trim')
assert(normalizeShoppingName('Greek   Yogurt') === 'Greek   Yogurt', 'Internal spacing must remain')
assert(normalizeShoppingName('MiLK') === 'MiLK' && normalizeShoppingName('豆腐') === '豆腐', 'Case and Unicode must remain')
assert(normalizeShoppingName('') === null && normalizeShoppingName('   ') === null, 'Blank names must fail')

const draft = 'Milk'; const milk1 = createShoppingItem(draft, time, () => 'one'); const milk2 = createShoppingItem(draft, time, () => 'two')
assert(draft === 'Milk' && milk1.id === 'one' && milk1.name === 'Milk' && !milk1.completed && milk1.createdAt === time && milk1.updatedAt === time, 'Item creation failed')
assert(Object.keys(milk1).sort().join(',') === 'completed,createdAt,id,name,updatedAt', 'Shopping item contains extra fields')
assert(isReactShoppingStore(store([milk1, milk2])), 'Duplicate names with unique IDs must validate')
assert(!isReactShoppingStore(store([milk1, { ...milk2, id: milk1.id }])), 'Duplicate IDs must fail')
assert(isShoppingItem(milk1) && !isShoppingItem({ ...milk1, name: ' Milk' }) && !isShoppingItem({ ...milk1, name: '' }), 'Name validation failed')

const toggleInput = [milk1, milk2]; const toggleCopy = structuredClone(toggleInput)
const toggled = toggleShoppingItemCompleted(toggleInput, milk2.id, true, later)
assert(toggled !== toggleInput && toggled[1].completed && toggled[1].id === milk2.id && toggled[1].name === milk2.name && toggled[1].createdAt === milk2.createdAt && toggled[1].updatedAt === later, 'Toggle target update failed')
assert(toggled[0] === milk1 && JSON.stringify(toggleInput) === JSON.stringify(toggleCopy), 'Toggle mutated input or peer')
assert(toggleShoppingItemCompleted(toggled, milk2.id, true, later) === toggled, 'Same-state toggle must be no-op')

const mixed = [milk1, { ...milk2, completed: true }, { ...milk1, id: 'three', name: '豆腐' }]
const mixedCopy = structuredClone(mixed); const sections = deriveShoppingSections(mixed)
assert(sections.activeItems.map((item) => item.id).join(',') === 'one,three' && sections.completedItems[0].id === 'two', 'Section order/derivation failed')
assert(JSON.stringify(mixed) === JSON.stringify(mixedCopy), 'Section derivation mutated input')
const cleared = clearCompletedShoppingItems(mixed)
assert(cleared.map((item) => item.id).join(',') === 'one,three' && cleared[0] === mixed[0] && cleared[1] === mixed[2], 'Clear must preserve active records/order')
assert(JSON.stringify(mixed) === JSON.stringify(mixedCopy), 'Clear mutated input')
const onlyActive = [milk1]; assert(clearCompletedShoppingItems(onlyActive) === onlyActive, 'No-completed clear must return same array')
assert(clearCompletedShoppingItems([{ ...milk1, completed: true }]).length === 0, 'All completed must clear to empty')

const removed: string[] = []
Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: { removeItem: (key: string) => removed.push(key) } } })
resetReactShoppingStore()
assert(removed.length === 1 && removed[0] === REACT_STORAGE_KEYS.shopping, 'Shopping reset must target Shopping only')
delete (globalThis as { window?: unknown }).window
console.log('Shopping verifier: all Task 8.2 assertions passed.')
