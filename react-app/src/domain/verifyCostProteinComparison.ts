import type { IngredientDefinition } from '../storage'
import { deriveCostProteinRows, deriveVisibleCostProteinRows, filterCostProteinRows, resolveComparisonBasis, sortCostProteinRows } from './costProteinComparison'

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message) }
const time = '2026-08-12T00:00:00.000Z'
const ingredient = (overrides: Partial<IngredientDefinition> = {}): IngredientDefinition => ({ id: 'a', name: 'Chicken Breast', unit: 'g', defaultQuantity: 100, defaultUnit: 'g', basisType: 'per_100', nutrition: { protein: 31, calories: 165, carbs: 0, fat: 3.6, fibre: 0 }, cost: { amount: 26, currency: 'INR' }, createdAt: time, updatedAt: time, ...overrides })

const per100g = resolveComparisonBasis('per_100', 'g')
assert(per100g.status === 'available' && per100g.label === 'Per 100 g', 'per_100 g basis failed')
assert(resolveComparisonBasis('per_100', 'ml').status === 'available', 'per_100 ml basis failed')
assert(resolveComparisonBasis('per_unit', 'piece').status === 'available', 'per-unit piece basis failed')
assert(resolveComparisonBasis('per_unit', 'serving').status === 'available', 'per-unit serving basis failed')
assert(resolveComparisonBasis('per_100', 'piece').status === 'unavailable' && resolveComparisonBasis('per_unit', 'g').status === 'unavailable', 'Unsupported basis accepted')

const source = [ingredient(), ingredient({ id: 'a', name: 'Chicken Breast' }), ingredient({ id: 'arch', archived: true })]
const copy = structuredClone(source); const rows = deriveCostProteinRows(source)
assert(rows.length === 2 && rows[0].recordKey !== rows[1].recordKey, 'Duplicate records were dropped or keys collided')
assert(JSON.stringify(source) === JSON.stringify(copy), 'Row derivation mutated source')
assert(rows[0].protein.status === 'available' && rows[0].protein.value === 31 && rows[0].calories.status === 'available' && rows[0].calories.value === 165, 'Nutrition was scaled')
assert(rows[0].cost.status === 'available' && rows[0].cost.value === 26 && rows[0].costPerGramProtein.status === 'available' && Math.abs(rows[0].costPerGramProtein.value - 26 / 31) < 1e-12, 'Cost derivation failed')

const unsupported = deriveCostProteinRows([ingredient({ basisType: 'per_100', defaultUnit: 'piece', unit: 'piece' })])[0]
assert(unsupported.basis.status === 'unavailable' && unsupported.protein.status === 'unavailable' && unsupported.calories.status === 'unavailable' && unsupported.cost.status === 'unavailable' && unsupported.costPerGramProtein.status === 'unavailable', 'Unsupported row metrics must all be unavailable')
assert(filterCostProteinRows([unsupported], '', 'per_100').length === 1, 'Unsupported row left raw basis bucket')

const zero = deriveCostProteinRows([ingredient({ cost: { amount: 0 }, nutrition: { protein: 10, calories: 0, carbs: 0, fat: 0, fibre: 0 } })])[0]
assert(zero.cost.status === 'available' && zero.cost.value === 0 && zero.costPerGramProtein.status === 'available' && zero.costPerGramProtein.value === 0 && zero.calories.status === 'available' && zero.calories.value === 0, 'Zero values became unavailable')
const zeroProtein = deriveCostProteinRows([ingredient({ nutrition: { protein: 0, calories: 50, carbs: 0, fat: 0, fibre: 0 } })])[0]
assert(zeroProtein.protein.status === 'available' && zeroProtein.costPerGramProtein.status === 'unavailable', 'Zero protein exposed invalid ratio')
assert(deriveCostProteinRows([ingredient({ cost: undefined })])[0].cost.status === 'unavailable', 'Missing cost became zero')
assert(deriveCostProteinRows([ingredient({ cost: { amount: 1 } })])[0].cost.status === 'available', 'Undefined currency rejected')
for (const currency of ['USD', 'inr', 'Inr', '']) assert(deriveCostProteinRows([ingredient({ cost: { amount: 1, currency } })])[0].cost.status === 'unavailable', `Unsupported currency ${currency} accepted`)

const searchable = deriveCostProteinRows([ingredient(), ingredient({ id: 'b', name: 'BREAST meat' }), ingredient({ id: 'c', name: 'Category only', category: 'chicken' })])
assert(filterCostProteinRows(searchable, ' breast ', 'all').length === 2, 'Trimmed case-insensitive name search failed')
assert(filterCostProteinRows(searchable, 'chicken', 'all').length === 1, 'Search used Category')
assert(filterCostProteinRows(searchable, 'b', 'all').length !== 1, 'Search unexpectedly used only Ingredient ID')

const sortable = deriveCostProteinRows([
  ingredient({ id: 'zero', name: 'Zero', nutrition: { protein: 5, calories: 10, carbs: 0, fat: 0, fibre: 0 }, cost: { amount: 0 } }),
  ingredient({ id: 'low', name: 'Low', nutrition: { protein: 6, calories: 10, carbs: 0, fat: 0, fibre: 0 }, cost: { amount: 8.33 } }),
  ingredient({ id: 'high', name: 'High', nutrition: { protein: 31, calories: 10, carbs: 0, fat: 0, fibre: 0 }, cost: { amount: 26 } }),
  ingredient({ id: 'none', name: 'Unavailable', basisType: 'per_100', defaultUnit: 'piece', unit: 'piece', cost: undefined }),
])
for (const mode of ['protein_desc','protein_asc','cost_asc','cost_desc','cost_per_protein_asc','cost_per_protein_desc'] as const) assert(sortCostProteinRows(sortable, mode).at(-1)?.name === 'Unavailable', `${mode} did not keep unavailable last`)
assert(sortCostProteinRows(sortable, 'cost_asc')[0].name === 'Zero' && sortCostProteinRows(sortable, 'cost_desc')[0].name === 'High', 'Cost direction/zero ordering failed')
assert(sortCostProteinRows(sortable, 'protein_desc')[0].name === 'High' && sortCostProteinRows(sortable, 'protein_asc')[0].name === 'Zero', 'Protein sort failed')
assert(sortCostProteinRows(sortable, 'cost_per_protein_asc')[0].name === 'Zero', 'Cost/g zero sort failed')

const rawPrecision = deriveCostProteinRows([ingredient({ id: 'x', name: 'X', nutrition: { protein: 3, calories: 1, carbs: 0, fat: 0, fibre: 0 }, cost: { amount: 2.514 } }), ingredient({ id: 'y', name: 'Y', nutrition: { protein: 3, calories: 1, carbs: 0, fat: 0, fibre: 0 }, cost: { amount: 2.513 } })])
assert(sortCostProteinRows(rawPrecision, 'cost_per_protein_asc')[0].name === 'Y', 'Raw precision sort used display rounding')
const tied = deriveCostProteinRows([ingredient({ id: 'z', name: 'same' }), ingredient({ id: 'a', name: 'Same' }), ingredient({ id: 'a', name: 'same' })])
const tiedSorted = sortCostProteinRows(tied, 'protein_desc')
assert(tiedSorted[0].ingredientId === 'a' && tiedSorted[0].sourceIndex < tiedSorted[1].sourceIndex && tiedSorted[2].ingredientId === 'z', 'Tie-break order failed')
assert(deriveVisibleCostProteinRows([ingredient(), ingredient({ basisType: 'per_unit', defaultUnit: 'piece', unit: 'piece' })], 'CHICKEN', 'per_unit', 'cost_asc').length === 1, 'Pipeline composition failed')

console.log('Cost / Protein comparison verifier: all Task 8.5 assertions passed.')
