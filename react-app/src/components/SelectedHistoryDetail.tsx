import type { RefObject } from 'react'
import { calcAll } from '../domain/nutrition'
import { savedDayToToday } from '../domain/historyMock'
import type { MealId, MockSavedDay } from '../domain/types'
import MealCard from './MealCard'
import StatusBadge from './StatusBadge'

const meals: Array<{ id: MealId; name: string }> = [
  { id: 'breakfast', name: 'Breakfast' },
  { id: 'lunch', name: 'Lunch' },
  { id: 'dinner', name: 'Dinner' },
  { id: 'snacks', name: 'Snacks' },
]

type SelectedHistoryDetailProps = {
  day: MockSavedDay
  headingRef: RefObject<HTMLHeadingElement | null>
  onBack: () => void
}

const displayNumber = (value: number, digits = 0): string =>
  Number.isFinite(value) ? value.toFixed(digits) : '—'

function SelectedHistoryDetail({ day, headingRef, onBack }: SelectedHistoryDetailProps) {
  const todayShape = savedDayToToday(day)
  const totals = calcAll(todayShape)
  const hasFoods = meals.some(({ id }) => (
    todayShape.meals?.[id]?.dishes ?? []
  ).some((dish) => (dish.ingredients ?? []).length > 0))

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
          <StatusBadge variant="info">{day.statusBadge}</StatusBadge>
        </div>
        <div className="history-detail-summary" aria-label="Saved day nutrition summary">
          <div className="history-detail-primary">
            <div className="protein"><span>Protein</span><strong>{displayNumber(totals.p, 1)} g</strong></div>
            <div className="calories"><span>Calories</span><strong>{displayNumber(totals.k)} kcal</strong></div>
            <div className="cost"><span>Cost</span><strong>₹{displayNumber(totals.c)}</strong></div>
          </div>
          <p>Carbs {displayNumber(totals.carb, 1)} g · Fat {displayNumber(totals.fat, 1)} g · Fibre {displayNumber(totals.fibre, 1)} g</p>
        </div>
        {hasFoods ? (
          <div className="history-meals">
            {meals.map((meal) => (
              <MealCard key={meal.id} mealId={meal.id} mealName={meal.name} todayData={todayShape} readOnly variant="history" />
            ))}
          </div>
        ) : (
          <div className="history-day-empty">No foods were saved for this day.</div>
        )}
      </section>
    </div>
  )
}

export default SelectedHistoryDetail
