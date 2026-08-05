import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
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
import { formatContextualPrice, formatPriceBasis } from '../utils/priceDisplay'

type IngredientLibraryProps = {
  createIntentToken?: number
  onCreateIntentConsumed?: (token: number) => void
}

function IngredientLibrary({ createIntentToken, onCreateIntentConsumed }: IngredientLibraryProps) {
  const [store, setStore] = useState(() => readReactIngredientsStore())
  const [draft, setDraft] = useState(() => createEmptyIngredientDraft())
  const [editingId, setEditingId] = useState('')
  const [message, setMessage] = useState<ReactNode>('')
  const [saveError, setSaveError] = useState('')
  const [staleEdit, setStaleEdit] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<IngredientDefinition | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const saveErrorRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (saveError) saveErrorRef.current?.focus()
  }, [saveError])

  useEffect(() => {
    if (createIntentToken === undefined) return
    setEditingId('')
    setSaveError('')
    setStaleEdit(false)
    nameInputRef.current?.focus()
    nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    onCreateIntentConsumed?.(createIntentToken)
  }, [createIntentToken, onCreateIntentConsumed])
  const save = () => {
    const timestamp = new Date().toISOString()
    const latestStore = readReactIngredientsStore()
    const previous = editingId
      ? latestStore.ingredients.find(({ id }) => id === editingId)
      : undefined
    if (editingId && !previous) {
      setStaleEdit(true)
      setSaveError('This ingredient no longer exists and could not be updated.')
      return
    }
    const result = buildIngredientDefinition(draft, {
      previous,
      timestamp,
      createId: () => globalThis.crypto?.randomUUID?.() ?? `ingredient-${Date.now()}`,
    })
    if (!result.ok) {
      setSaveError(result.error)
      return
    }
    const definition = result.definition
    const next = {
      ...latestStore,
      updatedAt: timestamp,
      ingredients: previous
        ? latestStore.ingredients.map((item) => item.id === previous.id ? definition : item)
        : [...latestStore.ingredients, definition],
    }
    if (writeReactIngredientsStore(next)) {
      const wasEditing = Boolean(editingId)
      setStore(next)
      setDraft(createEmptyIngredientDraft())
      setEditingId('')
      setSaveError('')
      setStaleEdit(false)
      setMessage(wasEditing ? <span className="ingredient-save-success"><strong>{definition.name} updated</strong><span>Price: {formatContextualPrice(definition.cost, definition.basisType, definition.defaultUnit)}</span></span> : 'Ingredient saved.')
    } else {
      setSaveError('The ingredient could not be saved. Try again.')
    }
  }

  const edit = (item: IngredientDefinition) => {
    setEditingId(item.id)
    setDraft(ingredientDefinitionToDraft(item))
    setSaveError('')
    setStaleEdit(false)
    setMessage('')
  }

  const cancelEdit = () => {
    setEditingId('')
    setDraft(createEmptyIngredientDraft())
    setSaveError('')
    setStaleEdit(false)
    setMessage('')
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
      <h4 className="ingredient-form-heading">{editingId ? 'Edit Ingredient' : 'Create Ingredient'}</h4>
      <IngredientDefinitionForm draft={draft} onChange={setDraft} nameInputRef={nameInputRef} />
      <div className="ingredient-form-actions">
        {editingId && <button className="secondary-action" type="button" onClick={cancelEdit}>Cancel</button>}
        <button className="primary-action ingredient-library-save" type="button" disabled={staleEdit} onClick={save}>{editingId ? 'Save Changes' : 'Create Ingredient'}</button>
      </div>
      {saveError && <p ref={saveErrorRef} className="ingredient-save-error" role="alert" tabIndex={-1}>{saveError}</p>}
      {message && <p role="status">{message}</p>}
      {store.ingredients.map((item) => {
        const basis = formatPriceBasis(item.basisType, item.defaultUnit)
        const contextualPrice = formatContextualPrice(item.cost, item.basisType, item.defaultUnit)
        return <div className="placeholder-card ingredient-library-item" key={item.id}><div className="ingredient-library-heading"><strong>{item.name}</strong><button className="ingredient-library-edit" type="button" onClick={() => edit(item)}>Edit</button></div><p>{item.defaultQuantity} {item.defaultUnit} · {basis ?? 'Price basis unavailable'} · {item.category || 'Uncategorised'}</p><p className={`ingredient-library-price${!item.cost ? ' missing' : basis ? '' : ' unsupported'}`}>{contextualPrice}</p><div className="ingredient-library-actions"><button type="button" onClick={() => addToToday(item)}>Add to Today</button><button className="compact-delete-button" type="button" onClick={() => setDeleteTarget(item)}>Delete</button></div></div>
      })}
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
