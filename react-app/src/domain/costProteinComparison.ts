import type { IngredientDefinition, NutritionBasisType, ServingUnit } from '../storage'

export type NumericAvailability = { status: 'available'; value: number } | { status: 'unavailable' }
export type ComparisonBasis =
  | { status: 'available'; label: 'Per 100 g' | 'Per 100 ml' | 'Per piece' | 'Per serving'; accessibleLabel: 'Per 100 grams' | 'Per 100 millilitres' | 'Per piece' | 'Per serving' }
  | { status: 'unavailable' }
export type CostProteinSort = 'protein_desc' | 'protein_asc' | 'cost_asc' | 'cost_desc' | 'cost_per_protein_asc' | 'cost_per_protein_desc'
export type CostProteinBasisFilter = 'all' | 'per_100' | 'per_unit'

export interface CostProteinComparisonRow {
  recordKey: string
  sourceIndex: number
  ingredientId: string
  name: string
  basisType: NutritionBasisType
  defaultUnit: ServingUnit
  basis: ComparisonBasis
  protein: NumericAvailability
  calories: NumericAvailability
  cost: NumericAvailability
  costPerGramProtein: NumericAvailability
}

const unavailable = (): NumericAvailability => ({ status: 'unavailable' })
const available = (value: number): NumericAvailability => Number.isFinite(value) ? { status: 'available', value } : unavailable()

export const resolveComparisonBasis = (basisType: NutritionBasisType, unit: ServingUnit): ComparisonBasis => {
  if (basisType === 'per_100' && unit === 'g') return { status: 'available', label: 'Per 100 g', accessibleLabel: 'Per 100 grams' }
  if (basisType === 'per_100' && unit === 'ml') return { status: 'available', label: 'Per 100 ml', accessibleLabel: 'Per 100 millilitres' }
  if (basisType === 'per_unit' && unit === 'piece') return { status: 'available', label: 'Per piece', accessibleLabel: 'Per piece' }
  if (basisType === 'per_unit' && unit === 'serving') return { status: 'available', label: 'Per serving', accessibleLabel: 'Per serving' }
  return { status: 'unavailable' }
}

export const deriveCostProteinRows = (ingredients: readonly IngredientDefinition[]): CostProteinComparisonRow[] => ingredients.flatMap((ingredient, sourceIndex) => {
  if (ingredient.archived === true) return []
  const basis = resolveComparisonBasis(ingredient.basisType, ingredient.defaultUnit)
  const protein = basis.status === 'available' ? available(ingredient.nutrition.protein) : unavailable()
  const calories = basis.status === 'available' ? available(ingredient.nutrition.calories) : unavailable()
  const compatibleCurrency = ingredient.cost?.currency === undefined || ingredient.cost.currency === 'INR'
  const cost = basis.status === 'available' && ingredient.cost && Number.isFinite(ingredient.cost.amount) && ingredient.cost.amount >= 0 && compatibleCurrency ? available(ingredient.cost.amount) : unavailable()
  const costPerGramProtein = cost.status === 'available' && protein.status === 'available' && protein.value > 0 ? available(cost.value / protein.value) : unavailable()
  return [{ recordKey: JSON.stringify([ingredient.id, sourceIndex]), sourceIndex, ingredientId: ingredient.id, name: ingredient.name, basisType: ingredient.basisType, defaultUnit: ingredient.defaultUnit, basis, protein, calories, cost, costPerGramProtein }]
})

const tieBreak = (left: CostProteinComparisonRow, right: CostProteinComparisonRow): number => {
  const name = left.name.toLocaleLowerCase().localeCompare(right.name.toLocaleLowerCase())
  if (name) return name
  const id = left.ingredientId.localeCompare(right.ingredientId)
  return id || left.sourceIndex - right.sourceIndex
}

export const sortCostProteinRows = (rows: readonly CostProteinComparisonRow[], sort: CostProteinSort): CostProteinComparisonRow[] => {
  const key = sort.startsWith('protein_') ? 'protein' : sort.startsWith('cost_per_') ? 'costPerGramProtein' : 'cost'
  const direction = sort.endsWith('_desc') ? -1 : 1
  return [...rows].sort((left, right) => {
    const a = left[key]; const b = right[key]
    if (a.status !== b.status) return a.status === 'available' ? -1 : 1
    if (a.status === 'available' && b.status === 'available' && a.value !== b.value) return (a.value - b.value) * direction
    return tieBreak(left, right)
  })
}

export const filterCostProteinRows = (rows: readonly CostProteinComparisonRow[], query: string, basisFilter: CostProteinBasisFilter): CostProteinComparisonRow[] => {
  const needle = query.trim().toLocaleLowerCase()
  return rows.filter((row) => (!needle || row.name.toLocaleLowerCase().includes(needle)) && (basisFilter === 'all' || row.basisType === basisFilter))
}

export const deriveVisibleCostProteinRows = (ingredients: readonly IngredientDefinition[], query: string, basisFilter: CostProteinBasisFilter, sort: CostProteinSort): CostProteinComparisonRow[] =>
  sortCostProteinRows(filterCostProteinRows(deriveCostProteinRows(ingredients), query, basisFilter), sort)
