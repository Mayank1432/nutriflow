import type { IngredientDefinition, ServingUnit, ShoppingItem } from '../storage'

export type ShoppingCostUnpricedReason =
  | 'quantity_unavailable'
  | 'purchase_quantity_unavailable'
  | 'price_unavailable'
  | 'unsupported_price_basis'
  | 'unsupported_currency'
  | 'ambiguous_purchase_quantity'

export type ShoppingCostResult =
  | { status: 'priced'; estimatedCost: number }
  | { status: 'unpriced'; reason: ShoppingCostUnpricedReason }

export interface ShoppingEstimateSummary {
  totalActiveCount: number
  pricedActiveCount: number
  unpricedActiveCount: number
  estimatedTotal: number
}

export type ShoppingCostRow = { item: ShoppingItem; cost: ShoppingCostResult }
export type ShoppingFilter = 'all' | 'protein'

type PurchaseQuantity = { quantity: number; unit: ServingUnit }

export const resolveShoppingPurchaseQuantity = (item: ShoppingItem): PurchaseQuantity | ShoppingCostUnpricedReason => {
  if (!item.generated) return 'quantity_unavailable'
  const { weekly, dailyStaple } = item.generated
  if (weekly && dailyStaple) return 'ambiguous_purchase_quantity'
  if (weekly) return { quantity: weekly.quantity, unit: weekly.unit }
  if (dailyStaple) return { quantity: dailyStaple.quantity, unit: dailyStaple.unit }
  return 'purchase_quantity_unavailable'
}

export const resolveUniqueActiveIngredient = (
  ingredientId: string | undefined,
  ingredients: readonly IngredientDefinition[],
): IngredientDefinition | null => {
  if (!ingredientId?.trim()) return null
  const matches = ingredients.filter((ingredient) => ingredient.id === ingredientId && ingredient.archived !== true)
  return matches.length === 1 ? matches[0] : null
}

export const estimateShoppingItemCost = (item: ShoppingItem, ingredients: readonly IngredientDefinition[]): ShoppingCostResult => {
  const purchase = resolveShoppingPurchaseQuantity(item)
  if (typeof purchase === 'string') return { status: 'unpriced', reason: purchase }
  const ingredient = resolveUniqueActiveIngredient(item.generated?.ingredientId, ingredients)
  if (!ingredient?.cost || !Number.isFinite(ingredient.cost.amount) || ingredient.cost.amount < 0) return { status: 'unpriced', reason: 'price_unavailable' }
  if (ingredient.cost.currency !== undefined && ingredient.cost.currency !== 'INR') return { status: 'unpriced', reason: 'unsupported_currency' }
  if (purchase.unit !== ingredient.defaultUnit) return { status: 'unpriced', reason: 'unsupported_price_basis' }
  const perHundred = ingredient.basisType === 'per_100' && (ingredient.defaultUnit === 'g' || ingredient.defaultUnit === 'ml')
  const perUnit = ingredient.basisType === 'per_unit' && (ingredient.defaultUnit === 'piece' || ingredient.defaultUnit === 'serving')
  if (!perHundred && !perUnit) return { status: 'unpriced', reason: 'unsupported_price_basis' }
  return { status: 'priced', estimatedCost: ingredient.cost.amount * (perHundred ? purchase.quantity / 100 : purchase.quantity) }
}

export const isProteinFocusedShoppingItem = (item: ShoppingItem, ingredients: readonly IngredientDefinition[]): boolean => {
  const ingredient = resolveUniqueActiveIngredient(item.generated?.ingredientId, ingredients)
  if (!ingredient) return false
  const { protein, calories } = ingredient.nutrition
  return Number.isFinite(protein) && Number.isFinite(calories) && protein > 0 && calories > 0 && protein * 4 >= calories * 0.20
}

export const deriveShoppingActiveSubset = (items: readonly ShoppingItem[], ingredients: readonly IngredientDefinition[], filter: ShoppingFilter): ShoppingItem[] =>
  items.filter((item) => !item.completed && (filter === 'all' || isProteinFocusedShoppingItem(item, ingredients)))

export const deriveShoppingCostRows = (items: readonly ShoppingItem[], ingredients: readonly IngredientDefinition[]): ShoppingCostRow[] =>
  items.map((item) => ({ item, cost: estimateShoppingItemCost(item, ingredients) }))

export const summarizeShoppingEstimate = (rows: readonly ShoppingCostRow[]): ShoppingEstimateSummary => {
  let pricedActiveCount = 0
  let estimatedTotal = 0
  for (const row of rows) if (row.cost.status === 'priced') { pricedActiveCount += 1; estimatedTotal += row.cost.estimatedCost }
  return { totalActiveCount: rows.length, pricedActiveCount, unpricedActiveCount: rows.length - pricedActiveCount, estimatedTotal }
}

export const shoppingCostReasonLabel = (reason: ShoppingCostUnpricedReason): string => ({
  quantity_unavailable: 'quantity unavailable',
  purchase_quantity_unavailable: 'purchase quantity unavailable',
  ambiguous_purchase_quantity: 'purchase quantity is ambiguous',
  price_unavailable: 'price unavailable',
  unsupported_currency: 'currency unsupported',
  unsupported_price_basis: 'price basis unavailable',
})[reason]
