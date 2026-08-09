import { calculateMealsTotals, getCanonicalValidHistoryDays, getLocalDateKey, parseStrictLocalDateKey } from './historyIntegrity'
import type { DailyTotals, HistoryDay } from '../storage/storageTypes'

export type AnalyticsRangeDays = 7 | 30
export type AnalyticsHistoryStatus = 'empty' | 'insufficient' | 'available'
export type AnalyticsDayPoint = { id: string; date: string; totals: DailyTotals }
export type HistoricalSummary = {
  range: { days: AnalyticsRangeDays; startDateKey: string; endDateKey: string }
  points: AnalyticsDayPoint[]
  trackedDays: number
  rangeCapacity: AnalyticsRangeDays
  averageProtein: number | null
  averageCalories: number | null
  totalSpend: number | null
  status: AnalyticsHistoryStatus
}

const finite = (value: number) => Number.isFinite(value) ? value : 0

export const buildLocalDateRange = (days: AnalyticsRangeDays, endDate = new Date()): string[] => {
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(end.getFullYear(), end.getMonth(), end.getDate())
    date.setDate(end.getDate() - (days - 1 - index))
    return getLocalDateKey(date)
  })
}

export const selectHistoryRange = (
  savedDays: readonly HistoryDay[],
  rangeDays: AnalyticsRangeDays,
  endDate = new Date(),
): AnalyticsDayPoint[] => {
  const keys = new Set(buildLocalDateRange(rangeDays, endDate))
  return getCanonicalValidHistoryDays(savedDays)
    .filter((day) => keys.has(day.date))
    .map((day) => ({ id: day.id, date: day.date, totals: calculateMealsTotals(day.meals) }))
}

export const summarizeHistoryRange = (
  savedDays: readonly HistoryDay[],
  rangeDays: AnalyticsRangeDays,
  endDate = new Date(),
): HistoricalSummary => {
  const keys = buildLocalDateRange(rangeDays, endDate)
  const points = selectHistoryRange(savedDays, rangeDays, endDate)
  const trackedDays = points.length
  const sums = points.reduce((total, point) => ({
    protein: total.protein + finite(point.totals.protein),
    calories: total.calories + finite(point.totals.calories),
    spend: total.spend + finite(point.totals.cost),
  }), { protein: 0, calories: 0, spend: 0 })
  return {
    range: { days: rangeDays, startDateKey: keys[0], endDateKey: keys[keys.length - 1] },
    points,
    trackedDays,
    rangeCapacity: rangeDays,
    averageProtein: trackedDays ? sums.protein / trackedDays : null,
    averageCalories: trackedDays ? sums.calories / trackedDays : null,
    totalSpend: trackedDays ? sums.spend : null,
    status: trackedDays === 0 ? 'empty' : trackedDays === 1 ? 'insufficient' : 'available',
  }
}

export const isStrictAnalyticsDate = (value: string) => parseStrictLocalDateKey(value) !== null
