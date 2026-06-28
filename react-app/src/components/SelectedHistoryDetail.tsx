import { calcAll } from '../domain/nutrition'
import { savedDayToToday } from '../domain/historyMock'
import type { MealId, MockSavedDay } from '../domain/types'
import MacroChip from './MacroChip'
import MealCard from './MealCard'

const meals: Array<{ id: MealId; name: string }> = [
  { id: 'breakfast', name: 'Breakfast' },
  { id: 'lunch', name: 'Lunch' },
  { id: 'dinner', name: 'Dinner' },
  { id: 'snacks', name: 'Snacks' },
]

type SelectedHistoryDetailProps = {
  day: MockSavedDay
}

function SelectedHistoryDetail({ day }: SelectedHistoryDetailProps) {
  const todayShape = savedDayToToday(day)
  const totals = calcAll(todayShape)

  return (
    <section className="selected-history-detail" aria-labelledby="history-detail-title">
      <div className="history-detail-heading">
        <div>
          <p className="eyebrow">Selected saved day</p>
          <h3 id="history-detail-title">{day.dateLabel}</h3>
          <span>{day.dayName} · {day.savedAtLabel}</span>
        </div>
        <span className={`history-badge ${day.statusBadge.toLowerCase().replace(' ', '-')}`}>
          {day.statusBadge}
        </span>
      </div>
      <div className="history-detail-macros">
        <MacroChip label="Protein" value={`${totals.p.toFixed(1)} g`} />
        <MacroChip label="Calories" value={`${totals.k.toFixed(0)} kcal`} />
        <MacroChip label="Carbs" value={`${totals.carb.toFixed(1)} g`} />
        <MacroChip label="Fat" value={`${totals.fat.toFixed(1)} g`} />
        <MacroChip label="Fibre" value={`${totals.fibre.toFixed(1)} g`} />
        <MacroChip label="Cost" value={`₹${totals.c.toFixed(0)}`} />
      </div>
      <div className="history-meals">
        {meals.map((meal) => (
          <MealCard
            key={meal.id}
            mealId={meal.id}
            mealName={meal.name}
            todayData={todayShape}
            readOnly
            emptyMessage="No ingredients tracked for this meal."
          />
        ))}
      </div>
    </section>
  )
}

export default SelectedHistoryDetail
