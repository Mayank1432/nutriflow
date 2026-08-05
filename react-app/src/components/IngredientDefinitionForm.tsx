import { useId } from 'react'
import type { RefObject } from 'react'
import type {
  IngredientDefinition,
  MealName,
  NutritionBasisType,
  ServingUnit,
} from '../storage'
import { formatPriceFormHelper } from '../utils/priceDisplay'

export type IngredientDefinitionDraft = {
  name: string
  basisType: NutritionBasisType
  unit: ServingUnit
  quantity: string
  meal: MealName
  category: string
  protein: string
  calories: string
  carbs: string
  fat: string
  fibre: string
  cost: string
}

const meals: MealName[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']
const units: ServingUnit[] = ['g', 'ml', 'piece', 'serving']

export const createEmptyIngredientDraft = (meal: MealName = 'Breakfast'): IngredientDefinitionDraft => ({
  name: '',
  basisType: 'per_100',
  unit: 'g',
  quantity: '100',
  meal,
  category: '',
  protein: '0',
  calories: '0',
  carbs: '0',
  fat: '0',
  fibre: '0',
  cost: '',
})

export const ingredientDefinitionToDraft = (item: IngredientDefinition): IngredientDefinitionDraft => ({
  name: item.name,
  basisType: item.basisType,
  unit: item.defaultUnit,
  quantity: String(item.defaultQuantity),
  meal: item.defaultMeal ?? 'Breakfast',
  category: item.category ?? '',
  protein: String(item.nutrition.protein),
  calories: String(item.nutrition.calories),
  carbs: String(item.nutrition.carbs),
  fat: String(item.nutrition.fat),
  fibre: String(item.nutrition.fibre),
  cost: item.cost ? String(item.cost.amount) : '',
})

const nonNegativeNumber = (value: string): number | null => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

type BuildIngredientOptions = {
  previous?: IngredientDefinition
  timestamp: string
  createId: () => string
}

export type BuildIngredientResult =
  | { ok: true; definition: IngredientDefinition }
  | { ok: false; error: string }

export const buildIngredientDefinition = (
  draft: IngredientDefinitionDraft,
  { previous, timestamp, createId }: BuildIngredientOptions,
): BuildIngredientResult => {
  const quantity = nonNegativeNumber(draft.quantity)
  const nutritionValues = [
    draft.protein,
    draft.calories,
    draft.carbs,
    draft.fat,
    draft.fibre,
  ].map(nonNegativeNumber)
  const trimmedCost = draft.cost.trim()
  const costAmount = trimmedCost === '' ? undefined : nonNegativeNumber(trimmedCost)

  if (!draft.name.trim() || quantity === null || quantity <= 0 || nutritionValues.some((value) => value === null)) {
    return {
      ok: false,
      error: 'Enter a name, positive default quantity, and non-negative nutrition values.',
    }
  }
  if (costAmount === null) return { ok: false, error: 'Enter a price of 0 or more.' }

  return {
    ok: true,
    definition: {
      ...(previous ?? {}),
      id: previous?.id ?? createId(),
      name: draft.name.trim(),
      unit: draft.unit,
      defaultQuantity: quantity,
      defaultUnit: draft.unit,
      defaultMeal: draft.meal,
      category: draft.category.trim() || undefined,
      basisType: draft.basisType,
      nutrition: {
        protein: nutritionValues[0]!,
        calories: nutritionValues[1]!,
        carbs: nutritionValues[2]!,
        fat: nutritionValues[3]!,
        fibre: nutritionValues[4]!,
      },
      cost: costAmount === undefined
        ? undefined
        : { amount: costAmount, currency: previous?.cost?.currency ?? 'INR' },
      createdAt: previous?.createdAt ?? timestamp,
      updatedAt: timestamp,
    },
  }
}

type IngredientDefinitionFormProps = {
  draft: IngredientDefinitionDraft
  onChange: (draft: IngredientDefinitionDraft) => void
  nameInputRef?: RefObject<HTMLInputElement | null>
  disabled?: boolean
}

function IngredientDefinitionForm({
  draft,
  onChange,
  nameInputRef,
  disabled = false,
}: IngredientDefinitionFormProps) {
  const priceHelperId = useId()
  const priceInputId = `${priceHelperId}-input`
  const update = <K extends keyof IngredientDefinitionDraft>(field: K, value: IngredientDefinitionDraft[K]) => {
    onChange({ ...draft, [field]: value })
  }

  return (
    <div className="ingredient-definition-form form-grid">
      <label><span>Name</span><input ref={nameInputRef} disabled={disabled} value={draft.name} onChange={(event) => update('name', event.target.value)} /></label>
      <label><span>Basis</span><select disabled={disabled} value={draft.basisType} onChange={(event) => update('basisType', event.target.value as NutritionBasisType)}><option value="per_100">Per 100</option><option value="per_unit">Per unit</option></select></label>
      <label><span>Unit</span><select disabled={disabled} value={draft.unit} onChange={(event) => update('unit', event.target.value as ServingUnit)}>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
      <label><span>Default quantity</span><input required disabled={disabled} type="number" min="0.01" step="any" value={draft.quantity} onChange={(event) => update('quantity', event.target.value)} /></label>
      <label><span>Default meal</span><select disabled={disabled} value={draft.meal} onChange={(event) => update('meal', event.target.value as MealName)}>{meals.map((meal) => <option key={meal}>{meal}</option>)}</select></label>
      <label><span>Category</span><input disabled={disabled} value={draft.category} onChange={(event) => update('category', event.target.value)} /></label>
      {(['protein', 'calories', 'carbs', 'fat', 'fibre'] as const).map((field) => (
        <label key={field}>
          <span>{field}</span>
          <input disabled={disabled} type="number" min="0" step="any" value={draft[field]} onChange={(event) => update(field, event.target.value)} />
        </label>
      ))}
      <label className="ingredient-price-field" htmlFor={priceInputId}>
        <span>Price in ₹</span>
        <input id={priceInputId} disabled={disabled} type="number" min="0" step="any" inputMode="decimal" value={draft.cost} aria-describedby={priceHelperId} onChange={(event) => update('cost', event.target.value)} />
        <small id={priceHelperId}>{formatPriceFormHelper(draft.basisType, draft.unit)}</small>
      </label>
    </div>
  )
}

export default IngredientDefinitionForm
