import { calcAll } from '../domain/nutrition'
import {
  isPlannedDay,
  WEEK_DAY_IDS,
  WEEK_DAY_LABELS,
} from '../domain/weeklyMock'
import type { WeekData, WeekDayId } from '../domain/types'
import DayChip from './DayChip'

type DaySelectorProps = {
  selectedDay: WeekDayId
  weekData: WeekData
  onSelect: (dayId: WeekDayId) => void
}

function DaySelector({ selectedDay, weekData, onSelect }: DaySelectorProps) {
  return (
    <div className="week-day-selector" aria-label="Select planner day">
      {WEEK_DAY_IDS.map((dayId) => {
        const day = weekData.days[dayId]
        return (
          <DayChip
            key={dayId}
            active={selectedDay === dayId}
            label={WEEK_DAY_LABELS[dayId].slice(0, 3)}
            planned={isPlannedDay(day)}
            protein={calcAll(day).p}
            onSelect={() => onSelect(dayId)}
          />
        )
      })}
    </div>
  )
}

export default DaySelector
