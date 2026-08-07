import { calcAll } from '../domain/nutrition'
import { countTrackedMeals, savedDayToToday } from '../domain/historyMock'
import type { MockSavedDay } from '../domain/types'
import StatusBadge from './StatusBadge'

type SavedDayCardProps = {
  day: MockSavedDay
  onSelect: () => void
}

function SavedDayCard({ day, onSelect }: SavedDayCardProps) {
  const totals = calcAll(savedDayToToday(day))
  const mealCount = countTrackedMeals(day)

  return (
    <button
      id={`saved-day-card-${day.id}`}
      className="saved-day-card"
      type="button"
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
      <div className="saved-day-metrics"><span className="history-protein">{totals.p.toFixed(0)}g protein</span><span className="history-calories">{totals.k.toFixed(0)} kcal</span></div>
      <div className="saved-day-footer"><small><span className="history-cost">₹{totals.c.toFixed(0)}</span> · {mealCount} {mealCount === 1 ? 'meal' : 'meals'}</small><span className="saved-day-chevron" aria-hidden="true">›</span></div>
    </button>
  )
}

export default SavedDayCard
