import { calcAll } from '../domain/nutrition'
import { countTrackedMeals, savedDayToToday } from '../domain/historyMock'
import type { MockSavedDay } from '../domain/types'
import StatusBadge from './StatusBadge'

type SavedDayCardProps = {
  active: boolean
  day: MockSavedDay
  onSelect: () => void
}

function SavedDayCard({ active, day, onSelect }: SavedDayCardProps) {
  const totals = calcAll(savedDayToToday(day))
  const mealCount = countTrackedMeals(day)

  return (
    <button
      className={`saved-day-card${active ? ' selected' : ''}`}
      type="button"
      aria-pressed={active}
      onClick={onSelect}
    >
      <div className="saved-day-heading">
        <div>
          <strong>{day.dateLabel}</strong>
          <span>{day.dayName}</span>
        </div>
        <StatusBadge variant={day.statusBadge === 'High protein' ? 'success' : 'info'}>
          {day.statusBadge}
        </StatusBadge>
      </div>
      <p>{totals.p.toFixed(0)}g protein · {totals.k.toFixed(0)} kcal · ₹{totals.c.toFixed(0)}</p>
      <small>{totals.fibre.toFixed(1)}g fibre · {mealCount} {mealCount === 1 ? 'meal' : 'meals'}</small>
    </button>
  )
}

export default SavedDayCard
