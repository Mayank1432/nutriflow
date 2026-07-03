import { useState } from 'react'
import {
  readReactDailyStaplesStore,
  writeReactDailyStaplesStore,
  type DailyStapleDefinition,
  type MealName,
  type NutritionBasisType,
  type ServingUnit,
} from '../storage'

const meals: MealName[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']
const units: ServingUnit[] = ['g', 'ml', 'piece', 'serving']
const blank = {
  name: '', quantity: '100', meal: 'Breakfast' as MealName,
  unit: 'g' as ServingUnit, basisType: 'per_100' as NutritionBasisType,
  protein: '0', calories: '0', carbs: '0', fat: '0', fibre: '0', cost: '0',
}

export function DailyStaplesManager() {
  const [store, setStore] = useState(() => readReactDailyStaplesStore())
  const [draft, setDraft] = useState(blank)
  const [editingId, setEditingId] = useState('')
  const [message, setMessage] = useState('')
  const update = (field: keyof typeof draft, value: string) =>
    setDraft((current) => ({ ...current, [field]: value }))
  const numeric = (value: string) => {
    const result = Number(value)
    return Number.isFinite(result) && result >= 0 ? result : null
  }
  const persist = (staples: DailyStapleDefinition[], message: string) => {
    const next = { ...store, updatedAt: new Date().toISOString(), staples }
    if (writeReactDailyStaplesStore(next)) { setStore(next); setMessage(message) }
    else setMessage('Daily Staples could not be saved.')
  }
  const save = () => {
    const quantity = numeric(draft.quantity)
    const values = [draft.protein, draft.calories, draft.carbs, draft.fat, draft.fibre, draft.cost].map(numeric)
    if (!draft.name.trim() || quantity === null || quantity <= 0 || values.some((value) => value === null)) {
      setMessage('Use a name, positive quantity, and non-negative nutrition values.'); return
    }
    const timestamp = new Date().toISOString()
    const prior = store.staples.find(({ id }) => id === editingId)
    const staple: DailyStapleDefinition = {
      id: prior?.id ?? globalThis.crypto?.randomUUID?.() ?? `staple-${Date.now()}`,
      ingredientId: prior?.ingredientId, name: draft.name.trim(),
      defaultQuantity: quantity, defaultMeal: draft.meal, unit: draft.unit,
      basisType: draft.basisType,
      nutrition: { protein: values[0]!, calories: values[1]!, carbs: values[2]!, fat: values[3]!, fibre: values[4]! },
      cost: { amount: values[5]!, currency: 'INR' },
      isArchived: false, createdAt: prior?.createdAt ?? timestamp, updatedAt: timestamp,
    }
    persist(prior ? store.staples.map((item) => item.id === prior.id ? staple : item) : [...store.staples, staple], 'Daily Staple saved.')
    setDraft(blank); setEditingId('')
  }
  const edit = (item: DailyStapleDefinition) => {
    setEditingId(item.id)
    setDraft({ name: item.name, quantity: String(item.defaultQuantity), meal: item.defaultMeal,
      unit: item.unit, basisType: item.basisType, protein: String(item.nutrition.protein),
      calories: String(item.nutrition.calories), carbs: String(item.nutrition.carbs),
      fat: String(item.nutrition.fat), fibre: String(item.nutrition.fibre), cost: String(item.cost?.amount ?? 0) })
  }
  const archive = (id: string) => persist(store.staples.map((item) =>
    item.id === id ? { ...item, isArchived: true, updatedAt: new Date().toISOString() } : item), 'Daily Staple archived.')

  return <section className="about-card"><h3>Daily Staples</h3><div className="quick-add-form form-grid">
    <label><span>Name</span><input value={draft.name} onChange={(e) => update('name', e.target.value)} /></label>
    <label><span>Basis</span><select value={draft.basisType} onChange={(e) => update('basisType', e.target.value)}><option value="per_100">Per 100</option><option value="per_unit">Per unit</option></select></label>
    <label><span>Unit</span><select value={draft.unit} onChange={(e) => update('unit', e.target.value)}>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
    <label><span>Default quantity</span><input type="number" min="0.01" value={draft.quantity} onChange={(e) => update('quantity', e.target.value)} /></label>
    <label><span>Default meal</span><select value={draft.meal} onChange={(e) => update('meal', e.target.value)}>{meals.map((meal) => <option key={meal}>{meal}</option>)}</select></label>
    {(['protein','calories','carbs','fat','fibre','cost'] as const).map((field) => <label key={field}><span>{field}</span><input type="number" min="0" value={draft[field]} onChange={(e) => update(field, e.target.value)} /></label>)}
  </div><button type="button" className="primary-action" onClick={save}>{editingId ? 'Update staple' : 'Save staple'}</button>
  {message && <p role="status">{message}</p>}
  {store.staples.map((item) => <div key={item.id} className="placeholder-card"><strong>{item.name}</strong><p>{item.isArchived ? 'Archived' : `${item.defaultQuantity} ${item.unit} · ${item.defaultMeal}`}</p>{!item.isArchived && <><button type="button" onClick={() => edit(item)}>Edit</button> <button type="button" onClick={() => archive(item.id)}>Archive</button></>}</div>)}</section>
}

export function ActiveDailyStaples({ onAdd }: { onAdd: (staple: DailyStapleDefinition) => void }) {
  const active = readReactDailyStaplesStore().staples.filter((staple) => !staple.isArchived)
  if (!active.length) return null
  return <section className="about-card"><h3>Daily Staples</h3><p>Quickly add a saved staple to Today.</p>
    {active.map((staple) => <button key={staple.id} type="button" className="secondary-action" onClick={() => onAdd(staple)}>Add {staple.name}</button>)}
  </section>
}
