import { useState } from 'react'
import ClearDayConfirm from '../components/ClearDayConfirm'
import CopyDaySheet from '../components/CopyDaySheet'
import DaySelector from '../components/DaySelector'
import MealCard from '../components/MealCard'
import ScreenContainer from '../components/ScreenContainer'
import SelectedDayPanel from '../components/SelectedDayPanel'
import SuccessToast from '../components/SuccessToast'
import WeeklySummaryCard from '../components/WeeklySummaryCard'
import PrototypeNotice from '../components/PrototypeNotice'
import { mockWeekPrototype } from '../domain/fixtures'
import type { MealId, WeekData, WeekDayId } from '../domain/types'
import {
  calcWeeklySummary,
  clearWeekDay,
  copyWeekDay,
  isPlannedDay,
  WEEK_DAY_IDS,
  WEEK_DAY_LABELS,
} from '../domain/weeklyMock'

const meals: Array<{ id: MealId; name: string }> = [
  { id: 'breakfast', name: 'Breakfast' },
  { id: 'lunch', name: 'Lunch' },
  { id: 'dinner', name: 'Dinner' },
  { id: 'snacks', name: 'Snacks' },
]

function nextCopyTarget(sourceDay: WeekDayId): WeekDayId {
  return WEEK_DAY_IDS.find((dayId) => dayId !== sourceDay) ?? 'mon'
}

function WeeklyScreen() {
  const [weekData, setWeekData] = useState<WeekData>(() => structuredClone(mockWeekPrototype))
  const [selectedDay, setSelectedDay] = useState<WeekDayId>('mon')
  const [copyTargetDay, setCopyTargetDay] = useState<WeekDayId>('tue')
  const [isCopyOpen, setCopyOpen] = useState(false)
  const [isClearOpen, setClearOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const selectedDayData = weekData.days[selectedDay]
  const summary = calcWeeklySummary(weekData)

  const openCopy = () => {
    setCopyTargetDay(nextCopyTarget(selectedDay))
    setCopyOpen(true)
    setToastMessage('')
  }

  const copyDay = () => {
    setWeekData((current) => copyWeekDay(current, selectedDay, copyTargetDay))
    setToastMessage(`Copied ${WEEK_DAY_LABELS[selectedDay]} to ${WEEK_DAY_LABELS[copyTargetDay]}.`)
    setSelectedDay(copyTargetDay)
    setCopyOpen(false)
  }

  const clearDay = () => {
    setWeekData((current) => clearWeekDay(current, selectedDay))
    setToastMessage(`Cleared ${WEEK_DAY_LABELS[selectedDay]}.`)
    setClearOpen(false)
  }

  return (
    <ScreenContainer title="Weekly Planner" subtitle="Plan your meals for the week before you start.">
      <PrototypeNotice>Prototype only — weekly plan uses mock data. Changes reset on refresh.</PrototypeNotice>
      <WeeklySummaryCard summary={summary} />
      <DaySelector weekData={weekData} selectedDay={selectedDay} onSelect={setSelectedDay} />
      <SelectedDayPanel day={selectedDayData} dayId={selectedDay} />
      <div className="planner-actions">
        <button className="secondary-action" type="button" onClick={openCopy}>
          Copy Day
        </button>
        <button
          className="danger-action"
          type="button"
          disabled={!isPlannedDay(selectedDayData)}
          onClick={() => setClearOpen(true)}
        >
          Clear Day
        </button>
      </div>
      <div className="weekly-meals">
        {meals.map((meal) => (
          <MealCard
            key={meal.id}
            mealId={meal.id}
            mealName={meal.name}
            todayData={selectedDayData}
            readOnly
            emptyMessage="No ingredients planned for this meal."
          />
        ))}
      </div>
      {isCopyOpen && (
        <CopyDaySheet
          sourceDay={selectedDay}
          targetDay={copyTargetDay}
          onTargetChange={setCopyTargetDay}
          onClose={() => setCopyOpen(false)}
          onCopy={copyDay}
        />
      )}
      {isClearOpen && (
        <ClearDayConfirm
          dayName={WEEK_DAY_LABELS[selectedDay]}
          onCancel={() => setClearOpen(false)}
          onConfirm={clearDay}
        />
      )}
      <SuccessToast message={toastMessage} />
    </ScreenContainer>
  )
}

export default WeeklyScreen
