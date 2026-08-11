import type { IngredientDefinition, PantryItem } from '../storage'

export type PantrySummary = { totalItems: number; inStockCount: number; lowStockCount: number }

export const createPantryItem = (
  ingredient: IngredientDefinition,
  timestamp: string,
  createId: () => string,
): PantryItem => ({
  id: createId(),
  ingredientId: ingredient.id,
  name: ingredient.name,
  unit: ingredient.defaultUnit,
  ...(ingredient.image === undefined ? {} : { image: ingredient.image }),
  quantityInStock: 0,
  inStock: true,
  lowStock: false,
  usedOften: false,
  createdAt: timestamp,
  updatedAt: timestamp,
})

export const derivePantrySummary = (items: readonly PantryItem[]): PantrySummary => ({
  totalItems: items.length,
  inStockCount: items.filter((item) => item.inStock).length,
  lowStockCount: items.filter((item) => item.lowStock).length,
})

export const findPantryItemByIngredientId = (items: readonly PantryItem[], ingredientId: string) =>
  items.find((item) => item.ingredientId === ingredientId)

export const parsePantryQuantity = (draft: string): number | null => {
  if (draft.trim() === '') return null
  const value = Number(draft)
  return Number.isFinite(value) && value >= 0 ? value : null
}
