import { calcAll } from '../domain/nutrition'
import { isPlannedDay, WEEK_DAY_LABELS } from '../domain/weeklyMock'
import type { TodayData, WeekDayId } from '../domain/types'
import StatusBadge from './StatusBadge'

type SelectedDayPanelProps = {
  day: TodayData
  dayId: WeekDayId
}

function SelectedDayPanel({ day, dayId }: SelectedDayPanelProps) {
  const totals = calcAll(day)
  const planned = isPlannedDay(day)

  return (
    <section id={`weekly-panel-${dayId}`} className={`selected-day-panel${planned ? ' planned' : ' empty'}`} role="tabpanel" aria-labelledby={`weekly-tab-${dayId}`} tabIndex={0}>
      <div className="selected-day-heading">
        <div>
          <p className="eyebrow">Selected day</p>
          <h2>{WEEK_DAY_LABELS[dayId]}</h2>
        </div>
        <StatusBadge variant={planned ? 'success' : 'muted'}>{planned ? 'Planned' : 'Empty'}</StatusBadge>
      </div>
      {planned ? <><div className="selected-day-primary"><div><strong>{totals.p.toFixed(0)}g</strong><span>Protein</span></div><div><strong>{totals.k.toFixed(0)}</strong><span>Calories</span></div><div><strong>₹{totals.c.toFixed(0)}</strong><span>Cost</span></div></div><p className="selected-day-secondary">Carbs {totals.carb.toFixed(0)}g · Fat {totals.fat.toFixed(0)}g · Fibre {totals.fibre.toFixed(0)}g</p></> : <div className="weekly-day-empty"><strong>No meals planned for {WEEK_DAY_LABELS[dayId]}.</strong><span>Copy another day to start this plan.</span></div>}
    </section>
  )
}

export default SelectedDayPanel
