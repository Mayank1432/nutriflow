import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type {
  DailyStapleDefinition,
  IngredientDefinition,
  MealName,
} from '../storage'
import { formatContextualPrice, formatPriceBasis } from '../utils/priceDisplay'

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
  onSaveCost: (ingredientId: string, amount: number) => { ok: boolean; message: string }
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
  onSaveCost,
}: QuickAddFormProps) {
  const submittingRef = useRef(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryLabel | null>(null)
  const [isAllFoodsOpen, setAllFoodsOpen] = useState(false)
  const [isEditingCost, setEditingCost] = useState(false)
  const [costDraft, setCostDraft] = useState('')
  const [costMessage, setCostMessage] = useState('')

  const selectSource = (key: string) => {
    const source = sources.find((candidate) => sourceKey(candidate) === key)
    if (!source) {
      onChange({ ...draft, sourceKey: key })
      return
    }

    onChange({
      sourceKey: key,
      quantity: String(quickAddDefaultQuantity(source)),
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
  const isSearching = normalizedSearch.length > 0
  const selectedSource = sources.find((source) => sourceKey(source) === draft.sourceKey)
  const selectedUnit = selectedSource
    ? selectedSource.kind === 'ingredient'
      ? selectedSource.item.defaultUnit
      : selectedSource.item.unit
    : ''

  function quickAddDefaultQuantity(source: QuickAddSource) {
    if (source.kind === 'staple' || source.item.defaultQuantity !== 100) {
      return source.item.defaultQuantity
    }
    if (source.item.defaultUnit === 'g') return 25
    if (source.item.defaultUnit === 'piece') return 1
    return source.item.defaultQuantity
  }
  const selectedQuantity = Number(draft.quantity)
  const previewFactor = selectedSource && Number.isFinite(selectedQuantity)
    ? selectedSource.item.basisType === 'per_100'
      ? selectedQuantity / 100
      : selectedQuantity
    : 0
  const selectedPreview = selectedSource ? {
    protein: selectedSource.item.nutrition.protein * previewFactor,
    carbs: selectedSource.item.nutrition.carbs * previewFactor,
    fat: selectedSource.item.nutrition.fat * previewFactor,
    fibre: selectedSource.item.nutrition.fibre * previewFactor,
    calories: selectedSource.item.nutrition.calories * previewFactor,
    cost: (selectedSource.item.cost?.amount ?? 0) * previewFactor,
  } : null

  useEffect(() => {
    setEditingCost(false)
    setCostMessage('')
  }, [draft.sourceKey])

  const openCostEditor = () => {
    if (selectedSource?.kind !== 'ingredient') return
    setCostDraft(String(selectedSource.item.cost?.amount ?? 0))
    setCostMessage('')
    setEditingCost(true)
  }

  const saveCost = () => {
    if (selectedSource?.kind !== 'ingredient') return
    const amount = Number(costDraft)
    if (costDraft.trim() === '' || !Number.isFinite(amount) || amount < 0) {
      setCostMessage('Price must be a finite, non-negative number.')
      return
    }
    const result = onSaveCost(selectedSource.item.id, amount)
    setCostMessage(result.message)
    if (result.ok) setEditingCost(false)
  }

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
    const priceUnit = source.kind === 'ingredient' ? source.item.defaultUnit : source.item.unit
    const priceBasis = formatPriceBasis(source.item.basisType, priceUnit)
    return (
      <button
        className={`quick-add-food-card${selected ? ' selected' : ''}`}
        key={key}
        type="button"
        aria-pressed={selected}
        onClick={() => selectSource(key)}
      >
        <span className="quick-add-food-icon" aria-hidden="true">{source.kind === 'ingredient' ? '◉' : '⚡'}</span>
        <span className="quick-add-food-copy">
          <span className="quick-add-food-heading">
            <strong title={source.item.name}>{source.item.name}</strong>
            <b>{source.item.nutrition.protein.toFixed(1)}g Protein</b>
          </span>
          <span>{source.item.defaultQuantity} {source.kind === 'ingredient' ? source.item.defaultUnit : source.item.unit} · <span className="quick-add-source-badge">{source.kind === 'ingredient' ? 'Ingredient Library' : 'Daily Staples'}</span></span>
          <small>{source.item.nutrition.calories.toFixed(0)} kcal · <span className={`quick-add-contextual-price${!source.item.cost ? ' missing' : priceBasis ? '' : ' unsupported'}`}>{formatContextualPrice(source.item.cost, source.item.basisType, priceUnit)}</span></small>
          <small className="quick-add-macro-line"><span className="metric-protein">{source.item.nutrition.protein.toFixed(1)}g Protein</span> · <span className="metric-carbs">{source.item.nutrition.carbs.toFixed(1)}g Carbs</span> · <span className="metric-fat">{source.item.nutrition.fat.toFixed(1)}g Fat</span> · <span>{source.item.nutrition.fibre.toFixed(1)}g Fibre</span></small>
        </span>
        <span className="quick-add-selected-mark" aria-hidden="true">{selected ? '✓' : '›'}</span>
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
      ) : isSearching && !visibleSources.length ? (
        <div className="quick-add-empty" role="status">
          <strong>No foods found</strong>
          <span>Try another search or clear the selected category.</span>
        </div>
      ) : isSearching ? (
        <section className="quick-add-library-section" aria-labelledby="search-results-title">
          <div className="quick-add-section-heading">
            <h3 id="search-results-title">Search results</h3>
            <span>{visibleSources.length}</span>
          </div>
          <div className="quick-add-food-list">{visibleSources.map(sourceCard)}</div>
        </section>
      ) : (
        <section className="quick-add-library-section quick-add-all-foods" aria-labelledby="all-foods-title">
          <button
            className="quick-add-disclosure"
            type="button"
            aria-expanded={isAllFoodsOpen}
            aria-controls="all-foods-list"
            onClick={() => setAllFoodsOpen((current) => !current)}
          >
            <span id="all-foods-title">All Foods</span>
            <span>{visibleSources.length}</span>
            <span aria-hidden="true">{isAllFoodsOpen ? '▲' : '▼'}</span>
          </button>
          {isAllFoodsOpen && (
            <div className="quick-add-food-list" id="all-foods-list">
              {visibleSources.length
                ? visibleSources.map(sourceCard)
                : <div className="quick-add-empty" role="status"><strong>No foods found</strong><span>Clear the selected category to browse all foods.</span></div>}
            </div>
          )}
        </section>
      )}
      {selectedSource && selectedPreview && (
        <section className="quick-add-selected-summary" aria-label="Selected food summary">
          <span className="quick-add-selected-label">Selected</span>
          <strong>{selectedSource.item.name}</strong>
          <p className="quick-add-macro-line"><span className="metric-protein">{selectedPreview.protein.toFixed(1)}g Protein</span> · <span className="metric-carbs">{selectedPreview.carbs.toFixed(1)}g Carbs</span> · <span className="metric-fat">{selectedPreview.fat.toFixed(1)}g Fat</span> · <span>{selectedPreview.fibre.toFixed(1)}g Fibre</span></p>
          <p>{selectedPreview.calories.toFixed(0)} kcal · ₹{selectedPreview.cost.toFixed(2).replace(/\.00$/, '')}</p>
          {selectedSource.kind === 'ingredient' && !isEditingCost && (
            <button className="quick-add-edit-cost" type="button" onClick={openCostEditor} aria-label={`Edit cost for ${selectedSource.item.name}`}>Edit cost</button>
          )}
          {selectedSource.kind === 'ingredient' && isEditingCost && (
            <div className="quick-add-cost-editor">
              <p>Current cost: {formatContextualPrice(selectedSource.item.cost, selectedSource.item.basisType, selectedSource.item.defaultUnit)}</p>
              <label><span>Price</span><span className="quick-add-price-input"><b aria-hidden="true">₹</b><input type="number" min="0" step="any" value={costDraft} onChange={(event) => setCostDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); saveCost() } else if (event.key === 'Escape') { event.preventDefault(); setEditingCost(false); setCostMessage('') } }} /></span></label>
              <p>Basis: {formatPriceBasis(selectedSource.item.basisType, selectedSource.item.defaultUnit) ?? 'Price basis unavailable'}</p>
              <div><button type="button" className="secondary-action" onClick={() => { setEditingCost(false); setCostMessage('') }}>Cancel</button><button type="button" className="primary-action" onClick={saveCost}>Save cost</button></div>
            </div>
          )}
          {costMessage && <p className={isEditingCost ? 'quick-add-error' : 'quick-add-cost-success'} role="status">{costMessage}</p>}
        </section>
      )}
      <div className="form-grid">
        <fieldset className="quick-add-quantity">
          <legend>Confirm quantity</legend>
          <span className="quick-add-quantity-label">Quantity</span>
          <div className="quick-add-quantity-control">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => adjustQuantity(-1)}
              disabled={!selectedSource || Number(draft.quantity) <= 0.01}
            >
              −
            </button>
            <label className="quick-add-quantity-value">
              <input
                required
                type="number"
                min="0.01"
                step="any"
                aria-label="Quantity"
                value={draft.quantity}
                onChange={(event) => onChange({ ...draft, quantity: event.target.value })}
              />
              {selectedUnit && <span className="quick-add-quantity-unit">{selectedUnit}</span>}
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
              Default: {quickAddDefaultQuantity(selectedSource)} {selectedUnit} · Adjustments apply only to this add.
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
