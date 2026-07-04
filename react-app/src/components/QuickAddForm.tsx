import { useRef } from 'react'
import type { FormEvent } from 'react'
import type {
  DailyStapleDefinition,
  IngredientDefinition,
  MealName,
} from '../storage'

export type QuickAddSource =
  | { kind: 'ingredient'; item: IngredientDefinition }
  | { kind: 'staple'; item: DailyStapleDefinition }

export type QuickAddDraft = {
  sourceKey: string
  quantity: string
  meal: MealName
}

type QuickAddFormProps = {
  draft: QuickAddDraft
  sources: QuickAddSource[]
  error: string
  onChange: (draft: QuickAddDraft) => void
  onSubmit: (action: 'more' | 'return') => void
}

const mealOptions: MealName[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']

export const sourceKey = (source: QuickAddSource) =>
  `${source.kind}:${source.item.id}`

function QuickAddForm({
  draft,
  sources,
  error,
  onChange,
  onSubmit,
}: QuickAddFormProps) {
  const submittingRef = useRef(false)

  const selectSource = (key: string) => {
    const source = sources.find((candidate) => sourceKey(candidate) === key)
    if (!source) {
      onChange({ ...draft, sourceKey: key })
      return
    }

    onChange({
      sourceKey: key,
      quantity: String(source.item.defaultQuantity),
      meal: source.item.defaultMeal ?? draft.meal,
    })
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    const action = (event.nativeEvent as SubmitEvent).submitter
      ?.getAttribute('data-action')
    onSubmit(action === 'more' ? 'more' : 'return')
    window.setTimeout(() => {
      submittingRef.current = false
    }, 300)
  }

  return (
    <form className="quick-add-form" onSubmit={submit}>
      <p className="form-mode">
        Choose a saved ingredient or active daily staple. The saved definition is copied into Today.
      </p>
      <div className="form-grid">
        <label>
          <span>Item</span>
          <select
            required
            value={draft.sourceKey}
            onChange={(event) => selectSource(event.target.value)}
          >
            <option value="">Select an item</option>
            {sources.map((source) => (
              <option key={sourceKey(source)} value={sourceKey(source)}>
                {source.item.name} · {source.kind === 'ingredient' ? 'Ingredient Library' : 'Daily Staple'}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Quantity</span>
          <input
            required
            type="number"
            min="0.01"
            step="any"
            value={draft.quantity}
            onChange={(event) => onChange({ ...draft, quantity: event.target.value })}
          />
        </label>
        <label>
          <span>Meal</span>
          <select
            value={draft.meal}
            onChange={(event) => onChange({ ...draft, meal: event.target.value as MealName })}
          >
            {mealOptions.map((meal) => (
              <option key={meal} value={meal}>{meal}</option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className="quick-add-error" role="alert">{error}</p>}
      {!sources.length && (
        <p className="quick-add-error" role="status">
          Add an Ingredient Library item or an active Daily Staple first.
        </p>
      )}
      <div className="quick-add-actions">
        <button
          className="secondary-action"
          type="submit"
          data-action="more"
          disabled={!sources.length}
        >
          Add More
        </button>
        <button
          className="primary-action"
          type="submit"
          data-action="return"
          disabled={!sources.length}
        >
          Add &amp; Return
        </button>
      </div>
    </form>
  )
}

export default QuickAddForm
