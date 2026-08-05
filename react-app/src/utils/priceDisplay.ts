import type { CostSnapshot, NutritionBasisType, ServingUnit } from '../storage'

export const formatPriceAmount = (amount: number): string => {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100
  return `₹${rounded.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')}`
}

export const formatPriceBasis = (
  basisType: NutritionBasisType,
  unit: ServingUnit,
): string | null => {
  if (basisType === 'per_100' && (unit === 'g' || unit === 'ml')) return `per 100 ${unit}`
  if (basisType === 'per_unit' && (unit === 'piece' || unit === 'serving')) return `per ${unit}`
  return null
}

export const formatContextualPrice = (
  cost: CostSnapshot | undefined,
  basisType: NutritionBasisType,
  unit: ServingUnit,
): string => {
  if (!cost) return 'No cost'
  const amount = formatPriceAmount(cost.amount)
  const basis = formatPriceBasis(basisType, unit)
  return basis ? `${amount} ${basis}` : `${amount} · Price basis unavailable`
}

export const formatPriceFormHelper = (
  basisType: NutritionBasisType,
  unit: ServingUnit,
): string => {
  const basis = formatPriceBasis(basisType, unit)
  return basis
    ? `Stored as price ${basis}. Leave blank for no cost.`
    : 'Price basis unavailable. Review the selected Basis and Unit.'
}
