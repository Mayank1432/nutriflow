import { useEffect, useRef, useState } from 'react'
import {
  readReactDailyStaplesStore,
  readReactIngredientsStore,
  readReactTodayStore,
  writeReactIngredientsStore,
  writeReactTodayStore,
  type IngredientDefinition,
} from '../storage'
import { calculateTodayTotals } from '../screens/TodayScreen'
import IngredientDefinitionForm, {
  buildIngredientDefinition,
  createEmptyIngredientDraft,
  ingredientDefinitionToDraft,
} from './IngredientDefinitionForm'

type IngredientLibraryProps = {
  createIntentToken?: number
  onCreateIntentConsumed?: (token: number) => void
}

function IngredientLibrary({ createIntentToken, onCreateIntentConsumed }: IngredientLibraryProps) {
  const [store, setStore] = useState(() => readReactIngredientsStore())
  const [draft, setDraft] = useState(() => createEmptyIngredientDraft())
  const [editingId, setEditingId] = useState('')
  const [message, setMessage] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<IngredientDefinition | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (createIntentToken === undefined) return
    setEditingId('')
    nameInputRef.current?.focus()
    nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    onCreateIntentConsumed?.(createIntentToken)
  }, [createIntentToken, onCreateIntentConsumed])
  const save = () => {
    const timestamp = new Date().toISOString()
    const previous = store.ingredients.find(({ id }) => id === editingId)
    const result = buildIngredientDefinition(draft, {
      previous,
      timestamp,
      createId: () => globalThis.crypto?.randomUUID?.() ?? `ingredient-${Date.now()}`,
    })
    if (!result.ok) {
      setMessage(result.error)
      return
    }
    const definition = result.definition
    const next = {
      ...store,
      updatedAt: timestamp,
      ingredients: previous
        ? store.ingredients.map((item) => item.id === previous.id ? definition : item)
        : [...store.ingredients, definition],
    }
    if (writeReactIngredientsStore(next)) {
      setStore(next); setDraft(createEmptyIngredientDraft()); setEditingId(''); setMessage('Ingredient saved.')
    } else setMessage('Ingredient could not be saved.')
  }

  const edit = (item: IngredientDefinition) => {
    setEditingId(item.id)
    setDraft(ingredientDefinitionToDraft(item))
  }

  const deleteIngredient = () => {
    if (!deleteTarget) return
    const latestStore = readReactIngredientsStore()
    const currentTarget = latestStore.ingredients.find((item) => item.id === deleteTarget.id)
    if (!currentTarget) {
      setStore(latestStore)
      setDeleteTarget(null)
      setMessage('This ingredient is no longer in Ingredient Library.')
      return
    }
    const isUsedByStaple = readReactDailyStaplesStore().staples.some((staple) => (
      staple.ingredientId === currentTarget.id
    ))
    if (isUsedByStaple) {
      setDeleteTarget(null)
      setMessage(`Can't delete "${currentTarget.name}". This ingredient is currently used in Daily Staples. Remove it from Daily Staples first, then try again.`)
      return
    }
    const next = {
      ...latestStore,
      updatedAt: new Date().toISOString(),
      ingredients: latestStore.ingredients.filter((item) => item.id !== currentTarget.id),
    }
    if (!writeReactIngredientsStore(next)) {
      setDeleteTarget(null)
      setMessage('Ingredient could not be deleted.')
      return
    }
    setStore(next)
    if (editingId === currentTarget.id) {
      setEditingId('')
      setDraft(createEmptyIngredientDraft())
    }
    setDeleteTarget(null)
    setMessage(`${currentTarget.name} deleted from Ingredient Library.`)
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
      <IngredientDefinitionForm draft={draft} onChange={setDraft} nameInputRef={nameInputRef} />
      <button className="primary-action ingredient-library-save" type="button" onClick={save}>
        {editingId ? 'Update ingredient' : '+ Create ingredient for Quick Add'}
      </button>
      {message && <p role="status">{message}</p>}
      {store.ingredients.map((item) => <div className="placeholder-card ingredient-library-item" key={item.id}><strong>{item.name}</strong><p>{item.basisType} · {item.defaultQuantity} {item.defaultUnit} · {item.category || 'Uncategorised'}</p><div><button type="button" onClick={() => addToToday(item)}>Add to Today</button> <button type="button" onClick={() => edit(item)}>Edit</button> <button className="compact-delete-button" type="button" onClick={() => setDeleteTarget(item)}>Delete</button></div></div>)}
      {deleteTarget && (
        <div className="confirm-dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDeleteTarget(null)
        }}>
          <section className="ingredient-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-ingredient-title">
            <p className="eyebrow">Ingredient Library</p>
            <h2 id="delete-ingredient-title">Delete “{deleteTarget.name}”?</h2>
            <p>This removes it from Ingredient Library and future Quick Add availability.</p>
            <p>Existing Today, Weekly, and History entries will remain unchanged.</p>
            <div className="confirm-actions">
              <button className="secondary-action" type="button" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="danger-action" type="button" onClick={deleteIngredient}>Delete</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

export default IngredientLibrary
