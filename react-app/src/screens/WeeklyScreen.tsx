import { useRef, useState } from 'react'
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
  const [copyError, setCopyError] = useState('')
  const [clearError, setClearError] = useState('')
  const [copySubmitting, setCopySubmitting] = useState(false)
  const [clearSubmitting, setClearSubmitting] = useState(false)
  const copySubmittingRef = useRef(false)
  const clearSubmittingRef = useRef(false)
  const copyOriginRef = useRef<HTMLButtonElement | null>(null)
  const clearTriggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement | null>(null)
  const weekData = toDisplayWeek(weeklyStore)
  const selectedDayData = weekData.days[selectedDay]
  const summary = calcWeeklySummary(weekData)

  const openCopy = (trigger?: HTMLButtonElement) => {
    if (trigger) copyOriginRef.current = trigger
    setCopyTargetDay(nextCopyTarget(selectedDay))
    setCopyOpen(true)
    setToastMessage('')
    setCopyError('')
  }

  const copyDay = () => {
    if (copySubmittingRef.current) return
    copySubmittingRef.current = true; setCopySubmitting(true)
    try {
      const nextWeekly = copyReactWeeklyDay(weeklyStore, selectedDay, copyTargetDay)
      if (!writeReactWeeklyStore(nextWeekly)) { setCopyError('The day could not be copied. Try again.'); return }
      const sourceName = WEEK_DAY_LABELS[selectedDay]; const targetName = WEEK_DAY_LABELS[copyTargetDay]
      setWeeklyStore(nextWeekly); setSelectedDay(copyTargetDay); setCopyOpen(false); setCopyError(''); setToastMessage(`${sourceName} copied to ${targetName}.`)
      window.requestAnimationFrame(() => document.getElementById(`weekly-tab-${copyTargetDay}`)?.focus())
    } finally { copySubmittingRef.current = false; setCopySubmitting(false) }
  }

  const clearDay = () => {
    if (clearSubmittingRef.current) return
    clearSubmittingRef.current = true; setClearSubmitting(true)
    try {
      const nextWeekly = clearReactWeeklyDay(weeklyStore, selectedDay)
      if (!writeReactWeeklyStore(nextWeekly)) { setClearError('The day could not be cleared. Try again.'); return }
      const dayName = WEEK_DAY_LABELS[selectedDay]
      setWeeklyStore(nextWeekly); setClearOpen(false); setClearError(''); setToastMessage(`${dayName} cleared.`)
      window.requestAnimationFrame(() => panelRef.current?.focus())
    } finally { clearSubmittingRef.current = false; setClearSubmitting(false) }
  }

  return (
    <ScreenContainer title="Weekly Planner" subtitle="Plan meals across your week.">
      <PrototypeNotice>React Weekly data is stored locally on this device.</PrototypeNotice>
      <WeeklySummaryCard summary={summary} />
      <DaySelector
        weekData={weekData}
        selectedDay={selectedDay as DomainWeekDayId}
        onSelect={(dayId) => setSelectedDay(dayId as WeekDayId)}
      />
      <div ref={(node) => { panelRef.current = node?.querySelector<HTMLElement>('[role="tabpanel"]') ?? null }}><SelectedDayPanel day={selectedDayData} dayId={selectedDay as DomainWeekDayId} /></div>
      <div className="planner-actions">
        <button className="secondary-action" type="button" aria-label={`Copy ${WEEK_DAY_LABELS[selectedDay]}`} onClick={(event) => openCopy(event.currentTarget)}>
          Copy Day
        </button>
        <button
          ref={clearTriggerRef}
          className="danger-action"
          type="button"
          aria-label={`Clear ${WEEK_DAY_LABELS[selectedDay]}`}
          disabled={!isPlannedDay(selectedDayData)}
          onClick={() => { setClearError(''); setClearOpen(true) }}
        >
          Clear Day
        </button>
      </div>
      {isPlannedDay(selectedDayData) && <div className="weekly-meals">
        {meals.map((meal) => (
          <MealCard
            key={meal.id}
            mealId={meal.id}
            mealName={meal.name}
            todayData={selectedDayData}
            readOnly
            variant="weekly"
          />
        ))}
      </div>}
      {isCopyOpen && (
        <CopyDaySheet
          sourceDay={selectedDay as DomainWeekDayId}
          targetDay={copyTargetDay as DomainWeekDayId}
          onTargetChange={(dayId) => setCopyTargetDay(dayId as WeekDayId)}
          onClose={() => { setCopyOpen(false); setCopyError(''); window.requestAnimationFrame(() => copyOriginRef.current?.focus()) }}
          onCopy={copyDay}
          submitting={copySubmitting}
          error={copyError}
        />
      )}
      {isClearOpen && (
        <ClearDayConfirm
          dayName={WEEK_DAY_LABELS[selectedDay]}
          onCancel={() => { setClearOpen(false); setClearError(''); window.requestAnimationFrame(() => clearTriggerRef.current?.focus()) }}
          onConfirm={clearDay}
          submitting={clearSubmitting}
          error={clearError}
        />
      )}
      <SuccessToast message={toastMessage} />
    </ScreenContainer>
  )
}

export default WeeklyScreen
