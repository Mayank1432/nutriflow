import { useEffect, useRef, useState, type FormEvent } from 'react'
import { parsePantryQuantity } from '../domain/pantry'
import type { IngredientDefinition, PantryItem } from '../storage'
import { PantryThumbnail } from './PantryIngredientPickerSheet'

export type PantryDraft = { quantity: string; inStock: boolean; lowStock: boolean; usedOften: boolean }
type Identity = Pick<IngredientDefinition, 'name' | 'defaultUnit' | 'image'> | PantryItem
type Props = { mode: 'create' | 'edit'; identity: Identity; item?: PantryItem; onSave: (draft: PantryDraft) => string | null; onCancel: () => void }

function PantryEditSheet({ mode, identity, item, onSave, onCancel }: Props) {
  const unit = 'defaultUnit' in identity ? identity.defaultUnit : identity.unit
  const [draft, setDraft] = useState<PantryDraft>(() => ({ quantity: item ? String(item.quantityInStock) : '0', inStock: item?.inStock ?? true, lowStock: item?.lowStock ?? false, usedOften: item?.usedOften ?? false }))
  const [error, setError] = useState('')
  const dialogRef = useRef<HTMLElement>(null)
  const quantityRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    quantityRef.current?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
      if (event.key !== 'Tab') return
      const controls = [...(dialogRef.current?.querySelectorAll<HTMLElement>('input:not(:disabled), button:not(:disabled)') ?? [])]
      if (!controls.length) return
      const first = controls[0]; const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [onCancel])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (parsePantryQuantity(draft.quantity) === null) { setError('Enter a finite quantity of zero or more.'); return }
    setError(onSave(draft) ?? '')
  }
  return <div className="pantry-sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
    <section ref={dialogRef} className="pantry-sheet pantry-editor" role="dialog" aria-modal="true" aria-labelledby="pantry-editor-title" aria-describedby="pantry-editor-copy">
      <header className="pantry-sheet-heading"><div><p className="eyebrow">{mode === 'create' ? 'New Pantry item' : 'Edit Pantry item'}</p><h2 id="pantry-editor-title">{identity.name}</h2></div><button type="button" className="sheet-close" aria-label="Cancel Pantry changes" onClick={onCancel}>×</button></header>
      <div className="pantry-editor-identity"><PantryThumbnail name={identity.name} image={identity.image} /><div><strong>{identity.name}</strong><span>Stored unit: {unit}</span></div></div>
      <p id="pantry-editor-copy">Changes are saved only when you choose Save.</p>
      <form noValidate onSubmit={submit}>
        <label className="pantry-quantity"><span>Quantity in stock</span><span><input ref={quantityRef} type="number" min="0" step="any" inputMode="decimal" value={draft.quantity} aria-invalid={!!error} aria-describedby={error ? 'pantry-quantity-error' : undefined} onChange={(e) => { setDraft({ ...draft, quantity: e.target.value }); setError('') }} /><b>{unit}</b></span></label>
        <div className="pantry-toggles">
          {([['inStock', 'In stock'], ['usedOften', 'Used often'], ['lowStock', 'Low stock']] as const).map(([field, label]) => <label key={field}><input type="checkbox" checked={draft[field]} onChange={(e) => setDraft({ ...draft, [field]: e.target.checked })} /><span>{label}</span></label>)}
        </div>
        {error && <p id="pantry-quantity-error" className="pantry-error" role="alert">{error}</p>}
        <div className="pantry-sheet-actions"><button type="button" className="secondary-action" onClick={onCancel}>Cancel</button><button type="submit" className="primary-action">Save</button></div>
      </form>
    </section>
  </div>
}
export default PantryEditSheet
