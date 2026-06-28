import { addTotals, calcAll, emptyTotals } from './nutrition'
import type {
  MealId,
  TodayData,
  WeekData,
  WeekDayId,
  WeeklySummary,
} from './types'

export const WEEK_DAY_IDS: WeekDayId[] = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
]

export const WEEK_DAY_LABELS: Record<WeekDayId, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

const MEAL_IDS: MealId[] = ['breakfast', 'lunch', 'dinner', 'snacks']

export function isPlannedDay(day: TodayData): boolean {
  return MEAL_IDS.some((mealId) => (
    day.meals?.[mealId]?.dishes ?? []
  ).some((dish) => (dish.ingredients ?? []).length > 0))
}

export function calcWeeklySummary(weekData: WeekData): WeeklySummary {
  const plannedDays = WEEK_DAY_IDS.filter((dayId) => isPlannedDay(weekData.days[dayId]))
  const totals = plannedDays.reduce(
    (weekTotals, dayId) => addTotals(weekTotals, calcAll(weekData.days[dayId])),
    emptyTotals(),
  )
  const count = plannedDays.length

  return {
    ...totals,
    plannedDays: count,
    averageProtein: count ? totals.p / count : 0,
    averageCalories: count ? totals.k / count : 0,
    averageCost: count ? totals.c / count : 0,
  }
}

export function createEmptyWeekDay(dayId: WeekDayId): TodayData {
  return {
    dateKey: `mock-${dayId}`,
    meals: {
      breakfast: { dishes: [{ id: `${dayId}-breakfast`, ingredients: [] }] },
      lunch: { dishes: [{ id: `${dayId}-lunch`, ingredients: [] }] },
      dinner: { dishes: [{ id: `${dayId}-dinner`, ingredients: [] }] },
      snacks: { dishes: [{ id: `${dayId}-snacks`, ingredients: [] }] },
    },
  }
}

export function copyWeekDay(
  weekData: WeekData,
  sourceDay: WeekDayId,
  targetDay: WeekDayId,
): WeekData {
  return {
    ...weekData,
    days: {
      ...weekData.days,
      [targetDay]: structuredClone(weekData.days[sourceDay]),
    },
  }
}

export function clearWeekDay(weekData: WeekData, dayId: WeekDayId): WeekData {
  return {
    ...weekData,
    days: {
      ...weekData.days,
      [dayId]: createEmptyWeekDay(dayId),
    },
  }
}
