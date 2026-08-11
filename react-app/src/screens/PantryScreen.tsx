import { useRef, useState } from 'react'
import PantryEditSheet, { type PantryDraft } from '../components/PantryEditSheet'
import PantryIngredientPickerSheet, { PantryThumbnail } from '../components/PantryIngredientPickerSheet'
import ScreenContainer from '../components/ScreenContainer'
import StatusBadge from '../components/StatusBadge'
import { createPantryItem, derivePantrySummary, findPantryItemByIngredientId, parsePantryQuantity } from '../domain/pantry'
import { readReactIngredientsStore, readReactPantryStore, writeReactPantryStore, type IngredientDefinition, type PantryItem } from '../storage'

type Editor = { mode: 'create'; ingredient: IngredientDefinition } | { mode: 'edit'; item: PantryItem }

function PantryScreen() {
  const [pantry, setPantry] = useState(() => readReactPantryStore())
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [feedback, setFeedback] = useState('')
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const editOriginRef = useRef<HTMLButtonElement | null>(null)
  const summary = derivePantrySummary(pantry.pantryItems)

  const restoreFocus = () => requestAnimationFrame(() => (editOriginRef.current ?? addButtonRef.current)?.focus())
  const closePicker = () => { setPickerOpen(false); restoreFocus() }
  const closeEditor = () => { setEditor(null); restoreFocus() }
  const chooseIngredient = (ingredient: IngredientDefinition) => {
    const latest = readReactPantryStore()
    setPantry(latest)
    const existing = findPantryItemByIngredientId(latest.pantryItems, ingredient.id)
    setPickerOpen(false)
    setEditor(existing ? { mode: 'edit', item: existing } : { mode: 'create', ingredient })
  }

  const save = (draft: PantryDraft): string | null => {
    const quantity = parsePantryQuantity(draft.quantity)
    if (quantity === null) return 'Enter a finite quantity of zero or more.'
    const timestamp = new Date().toISOString()
    if (!editor) return 'This Pantry draft is no longer available.'
    if (editor.mode === 'create') {
      const latestIngredients = readReactIngredientsStore()
      const source = latestIngredients.ingredients.find((item) => item.id === editor.ingredient.id)
      if (!source || source.archived === true) return 'This Ingredient is no longer available for Pantry creation.'
      const latest = readReactPantryStore()
      const existing = findPantryItemByIngredientId(latest.pantryItems, source.id)
      if (existing) {
        setPantry(latest); setEditor({ mode: 'edit', item: existing })
        return 'This Ingredient is already in Pantry. Its existing record is open for editing.'
      }
      const item = { ...createPantryItem(source, timestamp, () => globalThis.crypto?.randomUUID?.() ?? `pantry-${Date.now()}`), quantityInStock: quantity, inStock: draft.inStock, lowStock: draft.lowStock, usedOften: draft.usedOften }
      const updated = { ...latest, updatedAt: timestamp, pantryItems: [...latest.pantryItems, item] }
      if (!writeReactPantryStore(updated)) return 'Pantry could not be saved. Try again.'
      setPantry(updated); setEditor(null); setFeedback(`${item.name} added to Pantry.`); restoreFocus(); return null
    }
    const latest = readReactPantryStore()
    const index = latest.pantryItems.findIndex((item) => item.id === editor.item.id)
    if (index < 0) return 'This Pantry item no longer exists. Your draft was not saved.'
    const current = latest.pantryItems[index]
    const updatedItem: PantryItem = { ...current, quantityInStock: quantity, inStock: draft.inStock, lowStock: draft.lowStock, usedOften: draft.usedOften, updatedAt: timestamp }
    const items = latest.pantryItems.map((item, itemIndex) => itemIndex === index ? updatedItem : item)
    const updated = { ...latest, updatedAt: timestamp, pantryItems: items }
    if (!writeReactPantryStore(updated)) return 'Pantry could not be saved. Try again.'
    setPantry(updated); setEditor(null); setFeedback(`${updatedItem.name} updated.`); restoreFocus(); return null
  }

  return <ScreenContainer title="Pantry / Stock" subtitle="Track what you have and what is running low.">
    <div className="pantry-screen">
      <section className="pantry-summary" aria-label="Pantry summary">
        <div><strong>{summary.totalItems}</strong><span>Total items</span></div><div><strong>{summary.inStockCount}</strong><span>In stock</span></div><div><strong>{summary.lowStockCount}</strong><span>Low stock</span></div>
      </section>
      <button ref={addButtonRef} type="button" className="primary-action pantry-add" onClick={() => { editOriginRef.current = addButtonRef.current; setFeedback(''); setPickerOpen(true) }}>+ Add to Pantry</button>
      {feedback && <p className="pantry-feedback" role="status" aria-live="polite">{feedback}</p>}
      <section className="pantry-items" aria-labelledby="pantry-items-title"><p className="eyebrow" id="pantry-items-title">PANTRY ITEMS</p>
        {pantry.pantryItems.length === 0 ? <div className="pantry-empty"><strong>Your Pantry is ready</strong><p>Add an Ingredient Library item to start tracking stock.</p><button type="button" className="secondary-action" onClick={() => { editOriginRef.current = addButtonRef.current; setPickerOpen(true) }}>+ Add to Pantry</button></div> :
          <div className="pantry-list">{pantry.pantryItems.map((item) => <article className="pantry-card" key={item.id}>
            <PantryThumbnail name={item.name} image={item.image} /><div className="pantry-card-copy"><h2>{item.name}</h2><p>{item.quantityInStock} {item.unit}</p><div className="pantry-status"><StatusBadge variant={item.inStock ? 'success' : 'muted'}>{item.inStock ? 'In stock' : 'Out of stock'}</StatusBadge>{item.lowStock && <StatusBadge variant="warning">Low stock</StatusBadge>}{item.usedOften && <StatusBadge variant="info">Used often</StatusBadge>}</div></div>
            <button type="button" className="secondary-action pantry-edit" onClick={(event) => { editOriginRef.current = event.currentTarget; setFeedback(''); setEditor({ mode: 'edit', item }) }}>Edit</button>
          </article>)}</div>}
      </section>
    </div>
    {pickerOpen && <PantryIngredientPickerSheet ingredients={readReactIngredientsStore().ingredients} pantryItems={pantry.pantryItems} onSelect={chooseIngredient} onCancel={closePicker} />}
    {editor && <PantryEditSheet mode={editor.mode} identity={editor.mode === 'create' ? editor.ingredient : editor.item} item={editor.mode === 'edit' ? editor.item : undefined} onSave={save} onCancel={closeEditor} />}
  </ScreenContainer>
}
export default PantryScreen
