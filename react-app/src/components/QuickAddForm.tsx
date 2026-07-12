import { useRef, useState } from 'react'
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
  onOpenDailyStaples?: () => void
  onOpenIngredientLibrary?: () => void
  onSubmit: (action: 'more' | 'return') => void
}

const mealOptions: MealName[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']
const categoryLabels = ['High protein', 'Low cost', 'Veg', 'Animal', 'Custom/Saved'] as const
type CategoryLabel = typeof categoryLabels[number]

export const sourceKey = (source: QuickAddSource) =>
  `${source.kind}:${source.item.id}`

function QuickAddForm({
  draft,
  sources,
  error,
  onChange,
  onOpenDailyStaples,
  onOpenIngredientLibrary,
  onSubmit,
}: QuickAddFormProps) {
  const submittingRef = useRef(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryLabel | null>(null)

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

  const matchesCategory = (source: QuickAddSource, selected: CategoryLabel) => {
    const categoryText = source.kind === 'ingredient'
      ? `${source.item.category ?? ''} ${source.item.name}`.toLowerCase()
      : source.item.name.toLowerCase()
    if (selected === 'High protein') return source.item.nutrition.protein >= 10
    if (selected === 'Low cost') return (source.item.cost?.amount ?? Number.POSITIVE_INFINITY) <= 50
    if (selected === 'Custom/Saved') return source.kind === 'ingredient'
    if (selected === 'Animal') {
      return /(chicken|egg|fish|meat|mutton|beef|pork|tuna|prawn)/.test(categoryText)
    }
    return /(veg|plant|paneer|tofu|dal|lentil|bean|chickpea|soy)/.test(categoryText)
  }

  const normalizedSearch = search.trim().toLowerCase()
  const visibleSources = sources.filter((source) => (
    (!normalizedSearch || source.item.name.toLowerCase().includes(normalizedSearch))
    && (!category || matchesCategory(source, category))
  ))
  const recommendedSources = [...visibleSources]
    .sort((left, right) => (
      Number(right.kind === 'staple') - Number(left.kind === 'staple')
      || right.item.nutrition.protein - left.item.nutrition.protein
    ))
    .slice(0, 4)
  const selectedSource = sources.find((source) => sourceKey(source) === draft.sourceKey)
  const selectedUnit = selectedSource
    ? selectedSource.kind === 'ingredient'
      ? selectedSource.item.defaultUnit
      : selectedSource.item.unit
    : ''

  const adjustQuantity = (direction: -1 | 1) => {
    const current = Number(draft.quantity)
    const next = Number.isFinite(current)
      ? Math.max(0.01, current + direction)
      : 0.01
    onChange({ ...draft, quantity: String(Number(next.toFixed(2))) })
  }

  const sourceCard = (source: QuickAddSource) => {
    const key = sourceKey(source)
    const selected = draft.sourceKey === key
    return (
      <button
        className={`quick-add-food-card${selected ? ' selected' : ''}`}
        key={key}
        type="button"
        aria-pressed={selected}
        onClick={() => selectSource(key)}
      >
        <span className="quick-add-food-copy">
          <strong>{source.item.name}</strong>
          <span>
            {source.item.nutrition.protein.toFixed(1)}g protein · {source.item.defaultQuantity} {source.kind === 'ingredient' ? source.item.defaultUnit : source.item.unit}
          </span>
          <small>
            <span className="metric-protein">P {source.item.nutrition.protein.toFixed(1)}g</span>
            <span className="metric-carbs">C {source.item.nutrition.carbs.toFixed(1)}g</span>
            <span className="metric-fat">F {source.item.nutrition.fat.toFixed(1)}g</span>
            <span>{source.item.cost ? `₹${source.item.cost.amount.toFixed(0)}` : 'No cost'}</span>
          </small>
        </span>
        <span className="quick-add-source-badge">
          {source.kind === 'ingredient' ? 'Ingredient Library' : 'Daily Staples'}
        </span>
      </button>
    )
  }

  return (
    <form className="quick-add-form" onSubmit={submit}>
      <label className="quick-add-search">
        <span>Search foods</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search Ingredient Library and Daily Staples"
        />
      </label>
      <div className="quick-add-categories" aria-label="Food categories">
        {categoryLabels.map((label) => (
          <button
            key={label}
            type="button"
            className={category === label ? 'active' : ''}
            aria-pressed={category === label}
            onClick={() => setCategory(category === label ? null : label)}
          >
            {label}
          </button>
        ))}
      </div>
      {!sources.length ? (
        <div className="quick-add-empty" role="status">
          <strong>Your food library is empty</strong>
          <span>Add an Ingredient Library item or active Daily Staple first, then come back to Quick Add.</span>
          {(onOpenIngredientLibrary || onOpenDailyStaples) && (
            <div className="quick-add-empty-actions">
              {onOpenIngredientLibrary && (
                <button type="button" className="secondary-action" onClick={onOpenIngredientLibrary}>
                  Go to Ingredient Library
                </button>
              )}
              {onOpenDailyStaples && (
                <button type="button" className="secondary-action" onClick={onOpenDailyStaples}>
                  Go to Daily Staples
                </button>
              )}
            </div>
          )}
        </div>
      ) : !visibleSources.length ? (
        <div className="quick-add-empty" role="status">
          <strong>No matching foods</strong>
          <span>Try another search or clear the selected category.</span>
        </div>
      ) : (
        <>
          <section className="quick-add-library-section" aria-labelledby="recommended-foods-title">
            <div className="quick-add-section-heading">
              <h3 id="recommended-foods-title">Recommended Foods</h3>
              <span>{recommendedSources.length}</span>
            </div>
            <div className="quick-add-food-list">{recommendedSources.map(sourceCard)}</div>
          </section>
          <section className="quick-add-library-section" aria-labelledby="all-foods-title">
            <div className="quick-add-section-heading">
              <h3 id="all-foods-title">All Foods</h3>
              <span>{visibleSources.length}</span>
            </div>
            <div className="quick-add-food-list">{visibleSources.map(sourceCard)}</div>
          </section>
        </>
      )}
      <div className="form-grid">
        <fieldset className="quick-add-quantity">
          <legend>Confirm quantity</legend>
          <div className="quick-add-quantity-control">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => adjustQuantity(-1)}
              disabled={!selectedSource || Number(draft.quantity) <= 0.01}
            >
              −
            </button>
            <label>
              <span className="sr-only">Quantity</span>
              <input
                required
                type="number"
                min="0.01"
                step="any"
                value={draft.quantity}
                onChange={(event) => onChange({ ...draft, quantity: event.target.value })}
              />
              {selectedUnit && <span>{selectedUnit}</span>}
            </label>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => adjustQuantity(1)}
              disabled={!selectedSource}
            >
              +
            </button>
          </div>
          {selectedSource && (
            <small>
              Default: {selectedSource.item.defaultQuantity} {selectedUnit}. Adjustments apply only to this add.
            </small>
          )}
        </fieldset>
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
      {selectedSource && (
        <section className="quick-add-selected-summary" aria-label="Selected food summary">
          <div>
            <span>Selected food</span>
            <strong>{selectedSource.item.name}</strong>
          </div>
          <p>{draft.quantity || '—'} {selectedUnit} · Add to {draft.meal}</p>
        </section>
      )}
      {error && <p className="quick-add-error" role="alert">{error}</p>}
      {!selectedSource && sources.length > 0 && (
        <p className="quick-add-action-hint">Select a food to confirm quantity and use Add More or Add &amp; Return.</p>
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
      <p className="quick-add-return-helper">Add More keeps this library open. Add &amp; Return takes you back to Today.</p>
    </form>
  )
}

export default QuickAddForm
