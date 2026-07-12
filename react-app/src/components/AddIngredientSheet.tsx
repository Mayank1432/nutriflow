import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { MealName } from '../storage'
import IngredientDefinitionForm, {
  createEmptyIngredientDraft,
  type IngredientDefinitionDraft,
} from './IngredientDefinitionForm'

export type SaveAndAddResult = {
  status: 'success' | 'failure' | 'partial'
  message: string
}

type AddIngredientSheetProps = {
  mealName: MealName
  onClose: () => void
  onSaveAndAdd: (draft: IngredientDefinitionDraft) => SaveAndAddResult
}

function AddIngredientSheet({ mealName, onClose, onSaveAndAdd }: AddIngredientSheetProps) {
  const [draft, setDraft] = useState(() => createEmptyIngredientDraft(mealName))
  const [message, setMessage] = useState('')
  const [locked, setLocked] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameInputRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (locked) return
    const result = onSaveAndAdd(draft)
    if (result.status === 'success') return
    setMessage(result.message)
    if (result.status === 'partial') setLocked(true)
  }

  return (
    <div className="ingredient-sheet-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section
        className="add-ingredient-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-ingredient-title"
      >
        <div className="add-ingredient-heading">
          <div>
            <p className="eyebrow">Add to {mealName}</p>
            <h2 id="add-ingredient-title">Create Ingredient</h2>
          </div>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close Add Ingredient">×</button>
        </div>
        <p className="add-ingredient-copy">Save a reusable definition, then add one independent snapshot to {mealName}.</p>
        <form onSubmit={submit}>
          <IngredientDefinitionForm
            draft={draft}
            onChange={setDraft}
            nameInputRef={nameInputRef}
            disabled={locked}
          />
          {message && <p className={locked ? 'partial-failure-message' : 'quick-add-error'} role="alert">{message}</p>}
          <div className="add-ingredient-actions">
            <button type="button" className="secondary-action" onClick={onClose}>{locked ? 'Close' : 'Cancel'}</button>
            {!locked && <button type="submit" className="primary-action">Save &amp; Add</button>}
          </div>
        </form>
      </section>
    </div>
  )
}

export default AddIngredientSheet
