import type { RefObject } from 'react'
import { useState } from 'react'
import { calcAll } from '../domain/nutrition'
import { savedDayToToday } from '../domain/historyMock'
import type { MealId, MockSavedDay } from '../domain/types'
import DeleteDayConfirm from './DeleteDayConfirm'
import MealCard from './MealCard'
import StatusBadge from './StatusBadge'

const meals: Array<{ id: MealId; name: string }> = [
  { id: 'breakfast', name: 'Breakfast' },
  { id: 'lunch', name: 'Lunch' },
  { id: 'dinner', name: 'Dinner' },
  { id: 'snacks', name: 'Snacks' },
]

type DeleteDayOutcome = { ok: boolean; message?: string }

type SelectedHistoryDetailProps = {
  day: MockSavedDay
  headingRef: RefObject<HTMLHeadingElement | null>
  onBack: () => void
  onQuantityChange?: (mealId: MealId, entryId: string, quantity: number) => void
  onRemove?: (mealId: MealId, entryId: string) => void
  onOpenQuickAdd?: (mealId: MealId) => void
  onDeleteDay?: () => DeleteDayOutcome
}

const displayNumber = (value: number, digits = 0): string =>
  Number.isFinite(value) ? value.toFixed(digits) : '—'

function SelectedHistoryDetail({
  day,
  headingRef,
  onBack,
  onQuantityChange,
  onRemove,
  onOpenQuickAdd,
  onDeleteDay,
}: SelectedHistoryDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const todayShape = savedDayToToday(day)
  const totals = calcAll(todayShape)
  const hasFoods = meals.some(({ id }) => (
    todayShape.meals?.[id]?.dishes ?? []
  ).some((dish) => (dish.ingredients ?? []).length > 0))
  const canEdit = Boolean(onQuantityChange && onRemove)

  const confirmDelete = () => {
    if (!onDeleteDay) return
    setDeleteSubmitting(true)
    const result = onDeleteDay()
    setDeleteSubmitting(false)
    if (!result.ok) {
      setDeleteError(result.message ?? 'That could not be deleted. Try again.')
      return
    }
    setDeleteOpen(false)
    setDeleteError('')
    onBack()
  }

  return (
    <div className="history-detail-view">
      <button className="history-detail-back" type="button" onClick={onBack}>← Back to History</button>
      <section className="selected-history-detail" aria-labelledby="history-detail-title">
        <div className="history-detail-heading">
          <div>
            <p className="eyebrow">Saved snapshot</p>
            <h2 id="history-detail-title" ref={headingRef} tabIndex={-1}>{day.dayName}, {day.dateLabel}</h2>
            <span>{day.savedAtLabel}</span>
          </div>
          <div className="history-detail-heading-actions">
            <StatusBadge variant="info">{day.statusBadge}</StatusBadge>
            {canEdit && (
              <button
                className="history-edit-toggle"
                type="button"
                onClick={() => setIsEditing((value) => !value)}
              >
                {isEditing ? 'Done' : 'Edit day'}
              </button>
            )}
            {isEditing && onDeleteDay && (
              <button
                className="history-delete-toggle"
                type="button"
                onClick={() => { setDeleteError(''); setDeleteOpen(true) }}
              >
                Delete day
              </button>
            )}
          </div>
        </div>
        <div className="history-detail-summary" aria-label="Saved day nutrition summary">
          <div className="history-detail-primary">
            <div className="protein"><span>Protein</span><strong>{displayNumber(totals.p, 1)} g</strong></div>
            <div className="calories"><span>Calories</span><strong>{displayNumber(totals.k)} kcal</strong></div>
            <div className="cost"><span>Cost</span><strong>₹{displayNumber(totals.c)}</strong></div>
          </div>
          <p>Carbs {displayNumber(totals.carb, 1)} g · Fat {displayNumber(totals.fat, 1)} g · Fibre {displayNumber(totals.fibre, 1)} g</p>
        </div>
        {hasFoods || isEditing ? (
          <div className="history-meals">
            {meals.map((meal) => (
              <MealCard
                key={meal.id}
                mealId={meal.id}
                mealName={meal.name}
                todayData={todayShape}
                readOnly={!isEditing}
                variant="history"
                onAdd={() => onOpenQuickAdd?.(meal.id)}
                onQuantityChange={(entryId, qty) => onQuantityChange?.(meal.id, entryId, qty)}
                onRemove={(entryId) => onRemove?.(meal.id, entryId)}
              />
            ))}
          </div>
        ) : (
          <div className="history-day-empty">No foods were saved for this day.</div>
        )}
      </section>
      {isDeleteOpen && (
        <DeleteDayConfirm
          title={`Delete ${day.dayName}, ${day.dateLabel}?`}
          body="This moves the saved day to Recently deleted. You can restore it later, or delete it permanently from there."
          confirmLabel="Delete Day"
          pendingLabel="Deleting…"
          submitting={deleteSubmitting}
          error={deleteError}
          onCancel={() => { setDeleteOpen(false); setDeleteError('') }}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}

export default SelectedHistoryDetail