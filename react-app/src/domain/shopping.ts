import type { ShoppingItem } from '../storage'

export const normalizeShoppingName = (draft: string): string | null => {
  const name = draft.trim()
  return name.length > 0 ? name : null
}

export const createShoppingItem = (name: string, timestamp: string, createId: () => string): ShoppingItem => ({
  id: createId(), name, completed: false, createdAt: timestamp, updatedAt: timestamp,
})

export const deriveShoppingSections = (items: readonly ShoppingItem[]) => ({
  activeItems: items.filter((item) => !item.completed),
  completedItems: items.filter((item) => item.completed),
})

export const toggleShoppingItemCompleted = (items: readonly ShoppingItem[], id: string, completed: boolean, timestamp: string) => {
  const current = items.find((item) => item.id === id)
  if (!current || current.completed === completed) return items
  return items.map((item) => item.id === id ? { ...item, completed, updatedAt: timestamp } : item)
}

export const clearCompletedShoppingItems = (items: readonly ShoppingItem[]) => {
  if (!items.some((item) => item.completed)) return items
  return items.filter((item) => !item.completed)
}
