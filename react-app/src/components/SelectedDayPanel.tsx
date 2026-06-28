import { calcAll } from '../domain/nutrition'
import { isPlannedDay, WEEK_DAY_LABELS } from '../domain/weeklyMock'
import type { TodayData, WeekDayId } from '../domain/types'
import MacroChip from './MacroChip'

type SelectedDayPanelProps = {
  day: TodayData
  dayId: WeekDayId
}

function SelectedDayPanel({ day, dayId }: SelectedDayPanelProps) {
  const totals = calcAll(day)
  const planned = isPlannedDay(day)

  return (
    <section className="selected-day-panel" aria-labelledby="selected-day-title">
      <div className="selected-day-heading">
        <div>
          <p className="eyebrow">Selected day</p>
          <h3 id="selected-day-title">{WEEK_DAY_LABELS[dayId]}</h3>
        </div>
        <span>{planned ? 'Planned' : 'Empty'}</span>
      </div>
      <div className="selected-day-macros">
        <MacroChip label="Protein" value={`${totals.p.toFixed(1)} g`} />
        <MacroChip label="Calories" value={`${totals.k.toFixed(0)} kcal`} />
        <MacroChip label="Carbs" value={`${totals.carb.toFixed(1)} g`} />
        <MacroChip label="Fat" value={`${totals.fat.toFixed(1)} g`} />
        <MacroChip label="Fibre" value={`${totals.fibre.toFixed(1)} g`} />
        <MacroChip label="Cost" value={`₹${totals.c.toFixed(0)}`} />
      </div>
      {!planned && (
        <p className="selected-day-empty">No meals planned for this day yet.</p>
      )}
    </section>
  )
}

export default SelectedDayPanel
