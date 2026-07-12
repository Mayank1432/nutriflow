import { useEffect, useRef, useState } from 'react'
import {
  readReactIngredientsStore,
  readReactTodayStore,
  writeReactIngredientsStore,
  writeReactTodayStore,
  type IngredientDefinition,
  type MealName,
  type NutritionBasisType,
  type ServingUnit,
} from '../storage'
import { calculateTodayTotals } from '../screens/TodayScreen'

const meals: MealName[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']
const units: ServingUnit[] = ['g', 'ml', 'piece', 'serving']

const emptyDraft = {
  name: '', basisType: 'per_100' as NutritionBasisType, unit: 'g' as ServingUnit,
  quantity: '100', meal: 'Breakfast' as MealName, category: '',
  protein: '0', calories: '0', carbs: '0', fat: '0', fibre: '0', cost: '0',
}

type IngredientLibraryProps = {
  createIntentToken?: number
  onCreateIntentConsumed?: (token: number) => void
}

function IngredientLibrary({ createIntentToken, onCreateIntentConsumed }: IngredientLibraryProps) {
  const [store, setStore] = useState(() => readReactIngredientsStore())
  const [draft, setDraft] = useState(emptyDraft)
  const [editingId, setEditingId] = useState('')
  const [message, setMessage] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (createIntentToken === undefined) return
    setEditingId('')
    nameInputRef.current?.focus()
    nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    onCreateIntentConsumed?.(createIntentToken)
  }, [createIntentToken, onCreateIntentConsumed])
  const number = (value: string) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
  }
  const update = (key: keyof typeof draft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }))

  const save = () => {
    const quantity = number(draft.quantity)
    const values = [draft.protein, draft.calories, draft.carbs, draft.fat, draft.fibre, draft.cost].map(number)
    if (!draft.name.trim() || quantity === null || quantity <= 0 || values.some((value) => value === null)) {
      setMessage('Enter a name, positive default quantity, and non-negative nutrition values.')
      return
    }
    const timestamp = new Date().toISOString()
    const previous = store.ingredients.find(({ id }) => id === editingId)
    const definition: IngredientDefinition = {
      id: previous?.id ?? globalThis.crypto?.randomUUID?.() ?? `ingredient-${Date.now()}`,
      name: draft.name.trim(),
      unit: draft.unit,
      defaultQuantity: quantity,
      defaultUnit: draft.unit,
      defaultMeal: draft.meal,
      category: draft.category.trim() || undefined,
      basisType: draft.basisType,
      nutrition: { protein: values[0]!, calories: values[1]!, carbs: values[2]!, fat: values[3]!, fibre: values[4]! },
      cost: { amount: values[5]!, currency: 'INR' },
      createdAt: previous?.createdAt ?? timestamp,
      updatedAt: timestamp,
    }
    const next = {
      ...store,
      updatedAt: timestamp,
      ingredients: previous
        ? store.ingredients.map((item) => item.id === previous.id ? definition : item)
        : [...store.ingredients, definition],
    }
    if (writeReactIngredientsStore(next)) {
      setStore(next); setDraft(emptyDraft); setEditingId(''); setMessage('Ingredient saved.')
    } else setMessage('Ingredient could not be saved.')
  }

  const edit = (item: IngredientDefinition) => {
    setEditingId(item.id)
    setDraft({
      name: item.name, basisType: item.basisType, unit: item.defaultUnit,
      quantity: String(item.defaultQuantity), meal: item.defaultMeal ?? 'Breakfast',
      category: item.category ?? '', protein: String(item.nutrition.protein),
      calories: String(item.nutrition.calories), carbs: String(item.nutrition.carbs),
      fat: String(item.nutrition.fat), fibre: String(item.nutrition.fibre),
      cost: String(item.cost?.amount ?? 0),
    })
  }

  const addToToday = (item: IngredientDefinition) => {
    const today = readReactTodayStore()
    const timestamp = new Date().toISOString()
    const meal = item.defaultMeal ?? 'Breakfast'
    const next = structuredClone(today)
    next.updatedAt = timestamp
    next.meals[meal].entries.push({
      id: globalThis.crypto?.randomUUID?.() ?? `today-${Date.now()}`,
      ingredientId: item.id, name: item.name, quantity: item.defaultQuantity,
      unit: item.defaultUnit, basisType: item.basisType,
      nutritionSnapshot: structuredClone(item.nutrition),
      costSnapshot: item.cost ? structuredClone(item.cost) : undefined,
      createdAt: timestamp, updatedAt: timestamp,
    })
    next.totals = calculateTodayTotals(next)
    setMessage(writeReactTodayStore(next) ? `Added ${item.name} to ${meal}.` : 'Could not add ingredient.')
  }

  return (
    <section className="about-card" aria-labelledby="ingredient-library-title">
      <p className="eyebrow">Reusable definitions</p>
      <h3 id="ingredient-library-title">Ingredient Library</h3>
      <p className="ingredient-library-intro">Create a reusable food, then add it to Today whenever you need it.</p>
      <div className="quick-add-form form-grid">
        <label><span>Name</span><input ref={nameInputRef} value={draft.name} onChange={(e) => update('name', e.target.value)} /></label>
        <label><span>Basis</span><select value={draft.basisType} onChange={(e) => update('basisType', e.target.value)}><option value="per_100">Per 100</option><option value="per_unit">Per unit</option></select></label>
        <label><span>Unit</span><select value={draft.unit} onChange={(e) => update('unit', e.target.value)}>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
        <label><span>Default quantity</span><input type="number" value={draft.quantity} onChange={(e) => update('quantity', e.target.value)} /></label>
        <label><span>Default meal</span><select value={draft.meal} onChange={(e) => update('meal', e.target.value)}>{meals.map((meal) => <option key={meal}>{meal}</option>)}</select></label>
        <label><span>Category</span><input value={draft.category} onChange={(e) => update('category', e.target.value)} /></label>
        {(['protein','calories','carbs','fat','fibre','cost'] as const).map((field) => <label key={field}><span>{field}</span><input type="number" min="0" value={draft[field]} onChange={(e) => update(field, e.target.value)} /></label>)}
      </div>
      <button className="primary-action ingredient-library-save" type="button" onClick={save}>
        {editingId ? 'Update ingredient' : '+ Create ingredient for Quick Add'}
      </button>
      {message && <p role="status">{message}</p>}
      {store.ingredients.map((item) => <div className="placeholder-card" key={item.id}><strong>{item.name}</strong><p>{item.basisType} · {item.defaultQuantity} {item.defaultUnit} · {item.category || 'Uncategorised'}</p><button type="button" onClick={() => addToToday(item)}>Add to Today</button> <button type="button" onClick={() => edit(item)}>Edit</button></div>)}
    </section>
  )
}

export default IngredientLibrary
