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
  const tabRefs = useRef<Partial<Record<WeekDayId, HTMLButtonElement | null>>>({})

  useEffect(() => {
    const tab = tabRefs.current[selectedDay]
    tab?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [selectedDay])

  const selectFromKeyboard = (event: KeyboardEvent<HTMLButtonElement>, dayId: WeekDayId) => {
    const currentIndex = WEEK_DAY_IDS.indexOf(dayId)
    let targetIndex: number | null = null
    if (event.key === 'ArrowRight') targetIndex = (currentIndex + 1) % WEEK_DAY_IDS.length
    if (event.key === 'ArrowLeft') targetIndex = (currentIndex - 1 + WEEK_DAY_IDS.length) % WEEK_DAY_IDS.length
    if (event.key === 'Home') targetIndex = 0
    if (event.key === 'End') targetIndex = WEEK_DAY_IDS.length - 1
    if (targetIndex === null) return
    event.preventDefault()
    const target = WEEK_DAY_IDS[targetIndex]
    onSelect(target)
    window.requestAnimationFrame(() => {
      tabRefs.current[target]?.focus()
      tabRefs.current[target]?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    })
  }

  return (
    <div className="week-day-selector" role="tablist" aria-label="Weekly planner days">
      {WEEK_DAY_IDS.map((dayId) => {
        const day = weekData.days[dayId]
        return (
          <DayChip
            ref={(node) => { tabRefs.current[dayId] = node }}
            key={dayId}
            dayId={dayId}
            active={selectedDay === dayId}
            label={WEEK_DAY_LABELS[dayId].slice(0, 3)}
            planned={isPlannedDay(day)}
            protein={calcAll(day).p}
            onSelect={() => onSelect(dayId)}
            onKeyDown={(event) => selectFromKeyboard(event, dayId)}
          />
        )
      })}
    </div>
  )
}

export default DaySelector
import { useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
