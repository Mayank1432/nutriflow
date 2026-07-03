import { useEffect, useState } from 'react'
import ClearDayConfirm from '../components/ClearDayConfirm'
import CopyDaySheet from '../components/CopyDaySheet'
import DaySelector from '../components/DaySelector'
import MealCard from '../components/MealCard'
import ScreenContainer from '../components/ScreenContainer'
import SelectedDayPanel from '../components/SelectedDayPanel'
import SuccessToast from '../components/SuccessToast'
import WeeklySummaryCard from '../components/WeeklySummaryCard'
import PrototypeNotice from '../components/PrototypeNotice'
import type {
  Ingredient,
  MealId,
  TodayData,
  WeekData,
  WeekDayId as DomainWeekDayId,
} from '../domain/types'
import {
  calcWeeklySummary,
  isPlannedDay,
  WEEK_DAY_IDS,
  WEEK_DAY_LABELS,
} from '../domain/weeklyMock'
import {
  createEmptyDailyTotals,
  createEmptyMeals,
  readReactWeeklyStore,
  writeReactWeeklyStore,
  type DailyTotals,
  type FoodEntry,
  type MealName,
  type ReactWeeklyStore,
  type WeekDayId,
  type WeeklyDay,
} from '../storage'

const meals: Array<{ id: MealId; name: MealName }> = [
  { id: 'breakfast', name: 'Breakfast' },
  { id: 'lunch', name: 'Lunch' },
  { id: 'dinner', name: 'Dinner' },
  { id: 'snacks', name: 'Snacks' },
]

function nextCopyTarget(sourceDay: WeekDayId): WeekDayId {
  return WEEK_DAY_IDS.find((dayId) => dayId !== sourceDay) ?? 'mon'
}

const calculateEntryTotals = (entry: FoodEntry): DailyTotals => {
  const factor = entry.basisType === 'per_100'
    ? entry.quantity / 100
    : entry.quantity

  return {
    protein: entry.nutritionSnapshot.protein * factor,
    calories: entry.nutritionSnapshot.calories * factor,
    carbs: entry.nutritionSnapshot.carbs * factor,
    fat: entry.nutritionSnapshot.fat * factor,
    fibre: entry.nutritionSnapshot.fibre * factor,
    cost: (entry.costSnapshot?.amount ?? 0) * factor,
  }
}

const calculateDayTotals = (day: WeeklyDay): DailyTotals =>
  meals.reduce<DailyTotals>((dayTotals, meal) => (
    day.meals[meal.name].entries.reduce<DailyTotals>((totals, entry) => {
      const entryTotals = calculateEntryTotals(entry)
      return {
        protein: totals.protein + entryTotals.protein,
        calories: totals.calories + entryTotals.calories,
        carbs: totals.carbs + entryTotals.carbs,
        fat: totals.fat + entryTotals.fat,
        fibre: totals.fibre + entryTotals.fibre,
        cost: totals.cost + entryTotals.cost,
      }
    }, dayTotals)
  ), createEmptyDailyTotals())

const toDisplayIngredient = (entry: FoodEntry): Ingredient => {
  if (entry.basisType === 'per_unit') {
    return {
      id: entry.id,
      name: entry.name,
      qty: entry.quantity,
      unit: entry.unit,
      entryMode: 'enteredQuantity',
      baseQty: 1,
      baseProtein: entry.nutritionSnapshot.protein,
      baseCalories: entry.nutritionSnapshot.calories,
      baseCarbs: entry.nutritionSnapshot.carbs,
      baseFat: entry.nutritionSnapshot.fat,
      baseFibre: entry.nutritionSnapshot.fibre,
      baseCost: entry.costSnapshot?.amount ?? 0,
    }
  }

  return {
    id: entry.id,
    name: entry.name,
    qty: entry.quantity,
    unit: entry.unit,
    pr100: entry.nutritionSnapshot.protein,
    kc100: entry.nutritionSnapshot.calories,
    carb100: entry.nutritionSnapshot.carbs,
    fat100: entry.nutritionSnapshot.fat,
    fibre100: entry.nutritionSnapshot.fibre,
    pp100: entry.costSnapshot?.amount ?? 0,
  }
}

const toDisplayDay = (day: WeeklyDay): TodayData => ({
  dateKey: day.id,
  meals: Object.fromEntries(meals.map(({ id, name }) => [
    id,
    {
      dishes: [{
        id: `react-weekly-${day.id}-${id}`,
        ingredients: day.meals[name].entries.map(toDisplayIngredient),
      }],
    },
  ])),
})

const toDisplayWeek = (store: ReactWeeklyStore): WeekData => ({
  days: Object.fromEntries(store.days.map((day) => [
    day.id,
    toDisplayDay(day),
  ])) as WeekData['days'],
})

export const copyReactWeeklyDay = (
  store: ReactWeeklyStore,
  sourceDayId: WeekDayId,
  targetDayId: WeekDayId,
): ReactWeeklyStore => {
  const sourceDay = store.days.find(({ id }) => id === sourceDayId)
  if (!sourceDay || sourceDayId === targetDayId) return store

  const updatedAt = new Date().toISOString()
  const days = store.days.map((day) => {
    if (day.id !== targetDayId) return day

    const copiedDay: WeeklyDay = {
      ...day,
      meals: structuredClone(sourceDay.meals),
      totals: structuredClone(calculateDayTotals(sourceDay)),
    }
    return copiedDay
  })

  return { ...store, updatedAt, days }
}

const clearReactWeeklyDay = (
  store: ReactWeeklyStore,
  dayId: WeekDayId,
): ReactWeeklyStore => ({
  ...store,
  updatedAt: new Date().toISOString(),
  days: store.days.map((day) => (
    day.id === dayId
      ? {
          ...day,
          meals: createEmptyMeals(),
          totals: createEmptyDailyTotals(),
        }
      : day
  )),
})

function WeeklyScreen() {
  const [weeklyStore, setWeeklyStore] = useState<ReactWeeklyStore>(() => readReactWeeklyStore())
  const [selectedDay, setSelectedDay] = useState<WeekDayId>('mon')
  const [copyTargetDay, setCopyTargetDay] = useState<WeekDayId>('tue')
  const [isCopyOpen, setCopyOpen] = useState(false)
  const [isClearOpen, setClearOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const weekData = toDisplayWeek(weeklyStore)
  const selectedDayData = weekData.days[selectedDay]
  const summary = calcWeeklySummary(weekData)

  useEffect(() => {
    writeReactWeeklyStore(weeklyStore)
  }, [weeklyStore])

  const openCopy = () => {
    setCopyTargetDay(nextCopyTarget(selectedDay))
    setCopyOpen(true)
    setToastMessage('')
  }

  const copyDay = () => {
    setWeeklyStore((current) => copyReactWeeklyDay(current, selectedDay, copyTargetDay))
    setToastMessage(`Copied ${WEEK_DAY_LABELS[selectedDay]} to ${WEEK_DAY_LABELS[copyTargetDay]}.`)
    setSelectedDay(copyTargetDay)
    setCopyOpen(false)
  }

  const clearDay = () => {
    setWeeklyStore((current) => clearReactWeeklyDay(current, selectedDay))
    setToastMessage(`Cleared ${WEEK_DAY_LABELS[selectedDay]}.`)
    setClearOpen(false)
  }

  return (
    <ScreenContainer title="Weekly Planner" subtitle="Plan your meals for the week before you start.">
      <PrototypeNotice>React Weekly data is stored locally on this device.</PrototypeNotice>
      <WeeklySummaryCard summary={summary} />
      <DaySelector
        weekData={weekData}
        selectedDay={selectedDay as DomainWeekDayId}
        onSelect={(dayId) => setSelectedDay(dayId as WeekDayId)}
      />
      <SelectedDayPanel day={selectedDayData} dayId={selectedDay as DomainWeekDayId} />
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
          sourceDay={selectedDay as DomainWeekDayId}
          targetDay={copyTargetDay as DomainWeekDayId}
          onTargetChange={(dayId) => setCopyTargetDay(dayId as WeekDayId)}
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
