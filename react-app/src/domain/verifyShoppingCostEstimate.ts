import type { IngredientDefinition, ShoppingGeneratedSnapshot, ShoppingItem } from '../storage'
import { deriveShoppingActiveSubset, deriveShoppingCostRows, estimateShoppingItemCost, isProteinFocusedShoppingItem, resolveShoppingPurchaseQuantity, resolveUniqueActiveIngredient, shoppingCostReasonLabel, summarizeShoppingEstimate } from './shoppingCostEstimate'

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message) }
const assertUnpriced = (result: ReturnType<typeof estimateShoppingItemCost>, reason: string, message: string) => assert(result.status === 'unpriced' && result.reason === reason, message)
const time = '2026-08-12T00:00:00.000Z'
const ingredient = (overrides: Partial<IngredientDefinition> = {}): IngredientDefinition => ({ id: 'protein', name: 'Protein', unit: 'g', defaultQuantity: 100, defaultUnit: 'g', basisType: 'per_100', nutrition: { protein: 25, calories: 100, carbs: 0, fat: 0, fibre: 0 }, cost: { amount: 26, currency: 'INR' }, createdAt: time, updatedAt: time, ...overrides })
const item = (generated?: ShoppingGeneratedSnapshot, overrides: Partial<ShoppingItem> = {}): ShoppingItem => ({ id: 'item', name: 'Food', completed: false, createdAt: time, updatedAt: time, ...(generated ? { generated } : {}), ...overrides })
const weekly = (quantity = 750, unit: 'g' | 'ml' | 'piece' | 'serving' = 'g') => item({ ingredientId: 'protein', weekly: { quantity, unit } })
const staple = (quantity = 2, unit: 'g' | 'ml' | 'piece' | 'serving' = 'piece') => item({ ingredientId: 'protein', dailyStaple: { stapleId: 's', quantity, unit } })

assert(resolveShoppingPurchaseQuantity(item()) === 'quantity_unavailable', 'Manual quantity precedence failed')
assert(resolveShoppingPurchaseQuantity(item({ ingredientId: 'protein', pantry: { pantryItemId: 'p', quantityInStock: 0, unit: 'g' } })) === 'purchase_quantity_unavailable', 'Pantry stock became purchase quantity')
assert(resolveShoppingPurchaseQuantity(item({ ingredientId: 'protein', weekly: { quantity: 1, unit: 'g' }, dailyStaple: { stapleId: 's', quantity: 1, unit: 'g' } })) === 'ambiguous_purchase_quantity', 'Weekly+Staple ambiguity failed')
const withPantry = resolveShoppingPurchaseQuantity(item({ ingredientId: 'protein', weekly: { quantity: 2, unit: 'g' }, pantry: { pantryItemId: 'p', quantityInStock: 9, unit: 'g' } }))
assert(typeof withPantry !== 'string' && withPantry.quantity === 2, 'Pantry alongside Weekly changed purchase quantity')

assert(resolveUniqueActiveIngredient('protein', [ingredient()])?.id === 'protein', 'Unique active Ingredient resolution failed')
assert(resolveUniqueActiveIngredient('protein', []) === null, 'Missing Ingredient resolved')
assert(resolveUniqueActiveIngredient('protein', [ingredient({ archived: true })]) === null, 'Archived Ingredient resolved')
assert(resolveUniqueActiveIngredient('protein', [ingredient(), ingredient({ name: 'Duplicate' })]) === null, 'Duplicate active Ingredient ID resolved')
assert(resolveUniqueActiveIngredient(' protein ', [ingredient()]) === null, 'Ingredient ID was normalized instead of exact matched')

const weeklyPrice = estimateShoppingItemCost(weekly(), [ingredient()])
assert(weeklyPrice.status === 'priced' && weeklyPrice.estimatedCost === 195, 'Weekly per-100 pricing failed')
const mlPrice = estimateShoppingItemCost(weekly(250, 'ml'), [ingredient({ unit: 'ml', defaultUnit: 'ml', cost: { amount: 20 } })])
assert(mlPrice.status === 'priced' && mlPrice.estimatedCost === 50, 'ml per-100 pricing failed')
const piecePrice = estimateShoppingItemCost(staple(), [ingredient({ unit: 'piece', defaultUnit: 'piece', basisType: 'per_unit', cost: { amount: 10 } })])
assert(piecePrice.status === 'priced' && piecePrice.estimatedCost === 20, 'Daily Staple per-unit pricing failed or multiplied by seven')
const servingPrice = estimateShoppingItemCost(staple(3, 'serving'), [ingredient({ unit: 'serving', defaultUnit: 'serving', basisType: 'per_unit', cost: { amount: 4 } })])
assert(servingPrice.status === 'priced' && servingPrice.estimatedCost === 12, 'Serving per-unit pricing failed')
const zeroPrice = estimateShoppingItemCost(weekly(100), [ingredient({ cost: { amount: 0 } })])
assert(zeroPrice.status === 'priced' && zeroPrice.estimatedCost === 0, 'Known zero price became unavailable')
assertUnpriced(estimateShoppingItemCost(weekly(), []), 'price_unavailable', 'Missing price precedence failed')
assertUnpriced(estimateShoppingItemCost(weekly(), [ingredient({ cost: { amount: 1, currency: 'USD' } })]), 'unsupported_currency', 'Unsupported currency failed')
assertUnpriced(estimateShoppingItemCost(weekly(), [ingredient({ cost: { amount: 1, currency: 'inr' } })]), 'unsupported_currency', 'Currency was normalized')
assert(estimateShoppingItemCost(weekly(), [ingredient({ cost: { amount: 1 } })]).status === 'priced', 'Undefined legacy currency rejected')
assertUnpriced(estimateShoppingItemCost(weekly(), [ingredient({ defaultUnit: 'serving', basisType: 'per_unit' })]), 'unsupported_price_basis', 'Unit mismatch failed')
assertUnpriced(estimateShoppingItemCost(weekly(), [ingredient({ basisType: 'per_unit' })]), 'unsupported_price_basis', 'Unsupported basis/unit matrix failed')
assertUnpriced(estimateShoppingItemCost(item(), [ingredient()]), 'quantity_unavailable', 'Manual reason precedence failed')

assert(isProteinFocusedShoppingItem(weekly(), [ingredient({ nutrition: { protein: 10, calories: 200, carbs: 0, fat: 0, fibre: 0 } })]), 'Exact 20 percent boundary must qualify')
assert(!isProteinFocusedShoppingItem(weekly(), [ingredient({ nutrition: { protein: 9.99, calories: 200, carbs: 0, fat: 0, fibre: 0 } })]), 'Below 20 percent qualified')
assert(!isProteinFocusedShoppingItem(weekly(), [ingredient({ nutrition: { protein: 0, calories: 100, carbs: 0, fat: 0, fibre: 0 } })]), 'Zero protein qualified')
assert(!isProteinFocusedShoppingItem(weekly(), [ingredient({ nutrition: { protein: 10, calories: 0, carbs: 0, fat: 0, fibre: 0 } })]), 'Zero calories qualified')
assert(!isProteinFocusedShoppingItem(item(), [ingredient()]), 'Manual item classified by name')
assert(isProteinFocusedShoppingItem(item({ ingredientId: 'protein', pantry: { pantryItemId: 'p', quantityInStock: 0, unit: 'g' } }), [ingredient()]), 'Pricing improperly controls protein classification')

const manual = item(undefined, { id: 'manual', name: 'Manual' })
const nonProtein = weekly(100); nonProtein.id = 'non'; nonProtein.generated!.ingredientId = 'non'
const complete = item(undefined, { id: 'done', completed: true })
const ingredientInput = [ingredient(), ingredient({ id: 'non', nutrition: { protein: 1, calories: 100, carbs: 0, fat: 0, fibre: 0 } })]
const items = [manual, weekly(), nonProtein, complete]
const itemsCopy = structuredClone(items); const ingredientsCopy = structuredClone(ingredientInput)
assert(deriveShoppingActiveSubset(items, ingredientInput, 'all').length === 3, 'All active subset failed')
const proteinSubset = deriveShoppingActiveSubset(items, ingredientInput, 'protein')
assert(proteinSubset.length === 1 && proteinSubset[0].id === 'item', 'Protein subset failed')
assert(JSON.stringify(items) === JSON.stringify(itemsCopy) && JSON.stringify(ingredientInput) === JSON.stringify(ingredientsCopy), 'Derivation mutated inputs')

const precisionRows = deriveShoppingCostRows([weekly(1), weekly(1), manual], [ingredient({ cost: { amount: 33.333 } })])
const summary = summarizeShoppingEstimate(precisionRows)
assert(summary.totalActiveCount === 3 && summary.pricedActiveCount === 2 && summary.unpricedActiveCount === 1, 'Coverage summary failed')
assert(summary.estimatedTotal === 0.66666, 'Rows were rounded before summing')
assert(summarizeShoppingEstimate([]).totalActiveCount === 0, 'Empty summary failed')
assert(summarizeShoppingEstimate(deriveShoppingCostRows([manual], [ingredient()])).pricedActiveCount === 0, 'Unpriceable summary failed')
assert(shoppingCostReasonLabel('quantity_unavailable') === 'quantity unavailable' && shoppingCostReasonLabel('unsupported_price_basis') === 'price basis unavailable', 'Reason display mapping failed')

console.log('Shopping cost estimate verifier: all Task 8.4 assertions passed.')
