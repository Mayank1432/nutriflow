import type {
  DailyStapleDefinition,
  PantryItem,
  ReactShoppingStore,
  ReactWeeklyStore,
  ServingUnit,
  ShoppingGeneratedSnapshot,
  ShoppingItem,
} from '../storage'

export type ShoppingGenerationSource = 'weekly' | 'dailyStaple' | 'pantry'
export type ShoppingGenerationMatch = 'new' | 'active' | 'completed'
export type ShoppingGenerationCandidate = {
  key: string
  source: ShoppingGenerationSource
  name: string
  generated: ShoppingGeneratedSnapshot
  match: ShoppingGenerationMatch
}
export type ShoppingGenerationSources = Record<ShoppingGenerationSource, boolean>

const units: readonly ServingUnit[] = ['g', 'ml', 'piece', 'serving']
const validUnit = (value: unknown): value is ServingUnit => units.includes(value as ServingUnit)
const validPositive = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0
const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const canonicalOccurrences = (ids: readonly string[]) => [...ids].sort().join('\u0000')

export const generatedSnapshotsMatch = (candidate: ShoppingGeneratedSnapshot, item: ShoppingGeneratedSnapshot): boolean => {
  if (candidate.weekly && item.weekly) {
    if (nonEmpty(candidate.ingredientId) && nonEmpty(item.ingredientId)) {
      return candidate.ingredientId === item.ingredientId && candidate.weekly.unit === item.weekly.unit
    }
    const left = candidate.weekly.occurrenceIds
    const right = item.weekly.occurrenceIds
    return !candidate.ingredientId && !item.ingredientId && !!left?.length && !!right?.length && canonicalOccurrences(left) === canonicalOccurrences(right)
  }
  if (candidate.dailyStaple && item.dailyStaple) return candidate.dailyStaple.stapleId === item.dailyStaple.stapleId
  if (candidate.pantry && item.pantry) return candidate.pantry.pantryItemId === item.pantry.pantryItemId
  return false
}

export const classifyGeneratedCandidate = (generated: ShoppingGeneratedSnapshot, items: readonly ShoppingItem[]): ShoppingGenerationMatch => {
  if (items.some((item) => !item.completed && item.generated && generatedSnapshotsMatch(generated, item.generated))) return 'active'
  if (items.some((item) => item.completed && item.generated && generatedSnapshotsMatch(generated, item.generated))) return 'completed'
  return 'new'
}

export const buildWeeklyShoppingCandidates = (weekly: ReactWeeklyStore): Omit<ShoppingGenerationCandidate, 'match'>[] => {
  const occurrences: { key: string; name: string; ingredientId?: string; quantity: number; unit: ServingUnit; occurrenceId: string; reliable: boolean }[] = []
  const structuralCounts = new Map<string, number>()
  let index = 0
  for (const day of weekly.days) for (const mealName of ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const) {
    for (const entry of day.meals[mealName].entries) {
      const name = entry.name.trim()
      if (!name || !validPositive(entry.quantity) || !validUnit(entry.unit)) { index += 1; continue }
      const occurrenceId = JSON.stringify([day.id, mealName, entry.id])
      structuralCounts.set(occurrenceId, (structuralCounts.get(occurrenceId) ?? 0) + 1)
      occurrences.push({ key: `weekly-occurrence-${index}`, name, ingredientId: nonEmpty(entry.ingredientId) ? entry.ingredientId : undefined, quantity: entry.quantity, unit: entry.unit, occurrenceId, reliable: nonEmpty(entry.id) })
      index += 1
    }
  }
  const result: Omit<ShoppingGenerationCandidate, 'match'>[] = []
  const aggregate = new Map<string, number>()
  for (const occurrence of occurrences) {
    if (occurrence.ingredientId) {
      const identity = `${occurrence.ingredientId}\u0000${occurrence.unit}`
      const existingIndex = aggregate.get(identity)
      if (existingIndex !== undefined) {
        result[existingIndex].generated.weekly!.quantity += occurrence.quantity
      } else {
        aggregate.set(identity, result.length)
        result.push({ key: `weekly-ingredient-${occurrence.ingredientId}-${occurrence.unit}`, source: 'weekly', name: occurrence.name, generated: { ingredientId: occurrence.ingredientId, weekly: { quantity: occurrence.quantity, unit: occurrence.unit } } })
      }
    } else {
      const reliable = occurrence.reliable && structuralCounts.get(occurrence.occurrenceId) === 1
      result.push({ key: occurrence.key, source: 'weekly', name: occurrence.name, generated: { weekly: { quantity: occurrence.quantity, unit: occurrence.unit, ...(reliable ? { occurrenceIds: [occurrence.occurrenceId] } : {}) } } })
    }
  }
  return result
}

export const buildDailyStapleShoppingCandidates = (staples: readonly DailyStapleDefinition[]): Omit<ShoppingGenerationCandidate, 'match'>[] => {
  const idCounts = new Map<string, number>()
  for (const staple of staples) if (staple.isArchived !== true && nonEmpty(staple.id)) idCounts.set(staple.id, (idCounts.get(staple.id) ?? 0) + 1)
  return staples.flatMap((staple) => {
    const name = staple.name.trim()
    if (staple.isArchived === true || !name || !nonEmpty(staple.id) || idCounts.get(staple.id) !== 1 || !validPositive(staple.defaultQuantity) || !validUnit(staple.unit)) return []
    return [{ key: `staple-${staple.id}`, source: 'dailyStaple' as const, name, generated: { ...(nonEmpty(staple.ingredientId) ? { ingredientId: staple.ingredientId } : {}), dailyStaple: { stapleId: staple.id, quantity: staple.defaultQuantity, unit: staple.unit } } }]
  })
}

export const buildPantryShoppingCandidates = (items: readonly PantryItem[]): Omit<ShoppingGenerationCandidate, 'match'>[] => items.flatMap((item) => {
  const name = item.name.trim()
  if (!item.lowStock || !name || !nonEmpty(item.id) || !validUnit(item.unit) || typeof item.quantityInStock !== 'number' || !Number.isFinite(item.quantityInStock) || item.quantityInStock < 0) return []
  return [{ key: `pantry-${item.id}`, source: 'pantry' as const, name, generated: { ingredientId: item.ingredientId, pantry: { pantryItemId: item.id, quantityInStock: item.quantityInStock, unit: item.unit } } }]
})

export const buildShoppingGenerationPreview = (
  sources: ShoppingGenerationSources,
  weekly: ReactWeeklyStore,
  staples: readonly DailyStapleDefinition[],
  pantry: readonly PantryItem[],
  shoppingItems: readonly ShoppingItem[],
): ShoppingGenerationCandidate[] => {
  const raw = [
    ...(sources.weekly ? buildWeeklyShoppingCandidates(weekly) : []),
    ...(sources.dailyStaple ? buildDailyStapleShoppingCandidates(staples) : []),
    ...(sources.pantry ? buildPantryShoppingCandidates(pantry) : []),
  ]
  return raw.map((candidate) => ({ ...candidate, match: classifyGeneratedCandidate(candidate.generated, shoppingItems) }))
}

export type ShoppingGenerationPlan = { store: ReactShoppingStore; added: ShoppingItem[]; skipped: ShoppingGenerationCandidate[] }

export const planShoppingGeneration = (
  latest: ReactShoppingStore,
  selectedPreview: readonly ShoppingGenerationCandidate[],
  timestamp: string,
  createId: () => string,
): ShoppingGenerationPlan => {
  const working = [...latest.shoppingItems]
  const added: ShoppingItem[] = []
  const skipped: ShoppingGenerationCandidate[] = []
  for (const candidate of selectedPreview) {
    const latestMatch = classifyGeneratedCandidate(candidate.generated, working)
    if (latestMatch === 'active' || (candidate.match === 'new' && latestMatch === 'completed')) { skipped.push(candidate); continue }
    const item: ShoppingItem = { id: createId(), name: candidate.name, completed: false, createdAt: timestamp, updatedAt: timestamp, generated: structuredClone(candidate.generated) }
    working.push(item); added.push(item)
  }
  return { store: added.length ? { ...latest, updatedAt: timestamp, shoppingItems: working } : latest, added, skipped }
}
