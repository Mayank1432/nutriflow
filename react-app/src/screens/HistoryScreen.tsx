import { useState } from 'react'
import EmptyHistoryState from '../components/EmptyHistoryState'
import HistorySummaryCard from '../components/HistorySummaryCard'
import SavedDayList from '../components/SavedDayList'
import ScreenContainer from '../components/ScreenContainer'
import SelectedHistoryDetail from '../components/SelectedHistoryDetail'
import { calcHistorySummary } from '../domain/historyMock'
import type {
  Ingredient,
  MealId,
  MockHistoryData,
  MockSavedDay,
  TodayData,
} from '../domain/types'
import PrototypeNotice from '../components/PrototypeNotice'
import {
  readReactHistoryStore,
  type FoodEntry,
  type HistoryDay,
  type MealName,
} from '../storage'

const meals: Array<{ id: MealId; name: MealName }> = [
  { id: 'breakfast', name: 'Breakfast' },
  { id: 'lunch', name: 'Lunch' },
  { id: 'dinner', name: 'Dinner' },
  { id: 'snacks', name: 'Snacks' },
]

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

const toTodayData = (day: HistoryDay): TodayData => ({
  dateKey: day.date,
  meals: Object.fromEntries(meals.map(({ id, name }) => [
    id,
    {
      dishes: [{
        id: `react-history-${day.id}-${id}`,
        ingredients: day.meals[name].entries.map(toDisplayIngredient),
      }],
    },
  ])),
})

const formatDate = (date: string): string => {
  const parsed = new Date(`${date}T00:00:00`)
  return Number.isNaN(parsed.getTime())
    ? date
    : new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(parsed)
}

const formatDayName = (date: string): string => {
  const parsed = new Date(`${date}T00:00:00`)
  return Number.isNaN(parsed.getTime())
    ? 'Saved day'
    : new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(parsed)
}

const formatSavedAt = (savedAt: string): string => {
  const parsed = new Date(savedAt)
  return Number.isNaN(parsed.getTime())
    ? savedAt
    : `Saved ${new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(parsed)}`
}

const toMockSavedDay = (day: HistoryDay): MockSavedDay => {
  const todayData = toTodayData(day)
  return {
    id: day.id,
    dateLabel: formatDate(day.date),
    dayName: formatDayName(day.date),
    savedAtLabel: formatSavedAt(day.savedAt),
    statusBadge: day.totals.protein >= 120 ? 'High protein' : 'Partial day',
    meals: todayData.meals,
  }
}

function HistoryScreen() {
  const [historyData] = useState<MockHistoryData>(() => {
    const store = readReactHistoryStore()
    return {
      savedDays: [...store.savedDays]
        .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
        .map(toMockSavedDay),
    }
  })
  const [selectedHistoryId, setSelectedHistoryId] = useState(
    () => historyData.savedDays[0]?.id ?? '',
  )
  const selectedDay = historyData.savedDays.find((day) => day.id === selectedHistoryId)
  const summary = calcHistorySummary(historyData)

  return (
    <ScreenContainer title="History" subtitle="Review your saved days and track your consistency.">
      <PrototypeNotice>React History shows read-only saved snapshots from this device.</PrototypeNotice>
      {historyData.savedDays.length === 0 || !selectedDay ? (
        <EmptyHistoryState />
      ) : (
        <>
          <HistorySummaryCard summary={summary} />
          <div className="history-layout">
            <SavedDayList
              days={historyData.savedDays}
              selectedId={selectedHistoryId}
              onSelect={setSelectedHistoryId}
            />
            <SelectedHistoryDetail day={selectedDay} />
          </div>
        </>
      )}
    </ScreenContainer>
  )
}

export default HistoryScreen
