import type { FormEvent } from 'react'
import type { MealId } from '../domain/types'

export type QuickAddDraft = {
  mealId: MealId
  name: string
  qty: string
  unit: string
  protein: string
  calories: string
  carbs: string
  fat: string
  fibre: string
  cost: string
}

type QuickAddFormProps = {
  draft: QuickAddDraft
  onChange: (draft: QuickAddDraft) => void
  onSubmit: () => void
}

const mealOptions: Array<{ id: MealId; label: string }> = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snacks', label: 'Snacks' },
]

const nutritionFields = [
  ['protein', 'Protein', 'g'],
  ['calories', 'Calories', 'kcal'],
  ['carbs', 'Carbs', 'g'],
  ['fat', 'Fat', 'g'],
  ['fibre', 'Fibre', 'g'],
  ['cost', 'Cost', '₹'],
] as const

function QuickAddForm({ draft, onChange, onSubmit }: QuickAddFormProps) {
  const update = (field: keyof QuickAddDraft, value: string) => {
    onChange({ ...draft, [field]: value })
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className="quick-add-form" onSubmit={submit}>
      <p className="form-mode">Nutrition values are for the entered quantity.</p>
      <div className="form-grid">
        <label>
          <span>Meal</span>
          <select value={draft.mealId} onChange={(event) => update('mealId', event.target.value)}>
            {mealOptions.map((meal) => (
              <option key={meal.id} value={meal.id}>{meal.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Food name</span>
          <input
            required
            value={draft.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="e.g. Paneer wrap"
          />
        </label>
        <label>
          <span>Quantity</span>
          <input
            required
            type="number"
            min="0.01"
            step="any"
            value={draft.qty}
            onChange={(event) => update('qty', event.target.value)}
          />
        </label>
        <label>
          <span>Unit</span>
          <select value={draft.unit} onChange={(event) => update('unit', event.target.value)}>
            <option value="g">g</option>
            <option value="ml">ml</option>
            <option value="piece">piece</option>
          </select>
        </label>
        {nutritionFields.map(([field, label, suffix]) => (
          <label key={field}>
            <span>{label} <small>{suffix}</small></span>
            <input
              type="number"
              min="0"
              step="any"
              value={draft[field]}
              onChange={(event) => update(field, event.target.value)}
            />
          </label>
        ))}
      </div>
      <button className="primary-action quick-add-submit" type="submit">
        Add to meal
      </button>
    </form>
  )
}

export default QuickAddForm
