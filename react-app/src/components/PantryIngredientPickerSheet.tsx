import { useEffect, useRef } from 'react'
import type { IngredientDefinition, PantryItem } from '../storage'

type Props = {
  ingredients: IngredientDefinition[]
  pantryItems: PantryItem[]
  onSelect: (ingredient: IngredientDefinition) => void
  onCancel: () => void
}

function PantryIngredientPickerSheet({ ingredients, pantryItems, onSelect, onCancel }: Props) {
  const dialogRef = useRef<HTMLElement>(null)
  const activeIngredients = ingredients.filter((item) => item.archived !== true)
  const pantryIngredientIds = new Set(pantryItems.map((item) => item.ingredientId))

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>('button')?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
      if (event.key !== 'Tab') return
      const controls = [...(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled)') ?? [])]
      if (!controls.length) return
      const first = controls[0]; const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [onCancel])

  return <div className="pantry-sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
    <section ref={dialogRef} className="pantry-sheet pantry-picker" role="dialog" aria-modal="true" aria-labelledby="pantry-picker-title" aria-describedby="pantry-picker-copy">
      <header className="pantry-sheet-heading"><div><p className="eyebrow">Ingredient Library</p><h2 id="pantry-picker-title">Add to Pantry</h2></div><button className="sheet-close" type="button" aria-label="Close ingredient picker" onClick={onCancel}>×</button></header>
      <p id="pantry-picker-copy">Choose a saved, active ingredient. Existing Pantry ingredients open for editing.</p>
      {activeIngredients.length === 0 ? <div className="pantry-empty compact"><strong>No ingredients available</strong><p>Add an active ingredient in Ingredient Library first.</p></div> :
        <div className="pantry-picker-list">{activeIngredients.map((ingredient) => {
          const existing = pantryIngredientIds.has(ingredient.id)
          return <button type="button" key={ingredient.id} onClick={() => onSelect(ingredient)}>
            <PantryThumbnail name={ingredient.name} image={ingredient.image} />
            <span><strong>{ingredient.name}</strong><small>{ingredient.defaultUnit} · {existing ? 'Already in Pantry — edit' : 'Add new Pantry item'}</small></span>
          </button>
        })}</div>}
      <div className="pantry-sheet-actions"><button type="button" className="secondary-action" onClick={onCancel}>Cancel</button></div>
    </section>
  </div>
}

export function PantryThumbnail({ name, image }: { name: string; image?: string }) {
  const imageRef = useRef<HTMLImageElement>(null)
  return <span className="pantry-thumbnail" aria-hidden="true">
    <span>{name.trim().charAt(0).toUpperCase() || 'P'}</span>
    {image && <img ref={imageRef} src={image} alt="" onError={() => { if (imageRef.current) imageRef.current.hidden = true }} />}
  </span>
}

export default PantryIngredientPickerSheet
