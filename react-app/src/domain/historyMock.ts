import { calcAll } from './nutrition'
import type {
  HistorySummary,
  MealId,
  MockHistoryData,
  MockSavedDay,
  TodayData,
} from './types'

const MEAL_IDS: MealId[] = ['breakfast', 'lunch', 'dinner', 'snacks']

export function savedDayToToday(day: MockSavedDay): TodayData {
  return { dateKey: day.id, meals: day.meals }
}

export function countTrackedMeals(day: MockSavedDay): number {
  return MEAL_IDS.filter((mealId) => (
    day.meals?.[mealId]?.dishes ?? []
  ).some((dish) => (dish.ingredients ?? []).length > 0)).length
}

export function calcHistorySummary(historyData: MockHistoryData): HistorySummary {
  const count = historyData.savedDays.length
  const dayTotals = historyData.savedDays.map((day) => calcAll(savedDayToToday(day)))
  const totalProtein = dayTotals.reduce((sum, totals) => sum + totals.p, 0)
  const totalCalories = dayTotals.reduce((sum, totals) => sum + totals.k, 0)
  const totalCost = dayTotals.reduce((sum, totals) => sum + totals.c, 0)

  return {
    savedDays: count,
    averageProtein: count ? totalProtein / count : 0,
    averageCalories: count ? totalCalories / count : 0,
    averageCost: count ? totalCost / count : 0,
    highProteinDays: historyData.savedDays.filter(
      (day) => day.statusBadge === 'High protein',
    ).length,
  }
}
