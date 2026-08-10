import { calculateMealsTotals, getCanonicalValidHistoryDays, getLocalDateKey, parseStrictLocalDateKey } from './historyIntegrity'
import type { DailyTotals, HistoryDay } from '../storage/storageTypes'

export type AnalyticsRangeDays = 7 | 30
export type AnalyticsHistoryStatus = 'empty' | 'insufficient' | 'available'
export type AnalyticsDayPoint = { id: string; date: string; totals: DailyTotals }
export type ProteinTrendPoint = { id: string; date: string; dayIndex: number; dateLabel: string; shortDateLabel: string; proteinGrams: number }
export type ProteinTrendSummary = { points: ProteinTrendPoint[]; trackedDays: number; status: AnalyticsHistoryStatus; averageProtein: number | null; minimumProtein: number | null; maximumProtein: number | null; latestPoint: ProteinTrendPoint | null }
export type CaloriesTrendPoint = { id: string; date: string; dayIndex: number; dateLabel: string; shortDateLabel: string; caloriesKcal: number }
export type CaloriesTrendSummary = { points: CaloriesTrendPoint[]; trackedDays: number; status: AnalyticsHistoryStatus; averageCalories: number | null; minimumCalories: number | null; maximumCalories: number | null; latestPoint: CaloriesTrendPoint | null }
export type ContinuousMetricDomainOptions = { values: readonly number[]; referenceValues?: readonly number[]; minimumSpan: number; paddingRatio: number; roundingStep: number; floorAtZero: boolean }
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
    .sort((left, right) => left.date.localeCompare(right.date))
}

export const buildProteinTrendPoints = (savedDays: readonly HistoryDay[], endDate = new Date()): ProteinTrendPoint[] => {
  const range = buildLocalDateRange(7, endDate)
  const indexByDate = new Map(range.map((date, index) => [date, index]))
  return selectHistoryRange(savedDays, 7, endDate).flatMap((point) => {
    if (!Number.isFinite(point.totals.protein) || point.totals.protein < 0) return []
    const parsed = parseStrictLocalDateKey(point.date)!
    return [{ id: point.id, date: point.date, dayIndex: indexByDate.get(point.date)!, dateLabel: parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), shortDateLabel: parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), proteinGrams: point.totals.protein }]
  })
}

export const summarizeProteinTrend = (points: readonly ProteinTrendPoint[]): ProteinTrendSummary => {
  const copy = [...points].sort((a, b) => a.dayIndex - b.dayIndex)
  const values = copy.map((point) => point.proteinGrams)
  return { points: copy, trackedDays: copy.length, status: copy.length === 0 ? 'empty' : copy.length === 1 ? 'insufficient' : 'available', averageProtein: copy.length ? values.reduce((a, b) => a + b, 0) / copy.length : null, minimumProtein: copy.length ? Math.min(...values) : null, maximumProtein: copy.length ? Math.max(...values) : null, latestPoint: copy.at(-1) ?? null }
}

export const getValidProteinGoal = (goal: { enabled: boolean; value: number | null }): number | null => goal.enabled && goal.value !== null && Number.isFinite(goal.value) && goal.value > 0 ? goal.value : null
export const countPointsMeetingCurrentGoal = (points: readonly ProteinTrendPoint[], goal: number | null) => goal === null ? null : points.filter((point) => point.proteinGrams >= goal).length

export const buildCaloriesTrendPoints = (savedDays: readonly HistoryDay[], endDate = new Date()): CaloriesTrendPoint[] => {
  const range = buildLocalDateRange(7, endDate)
  const indexByDate = new Map(range.map((date, index) => [date, index]))
  return selectHistoryRange(savedDays, 7, endDate).flatMap((point) => {
    if (!Number.isFinite(point.totals.calories) || point.totals.calories < 0) return []
    const parsed = parseStrictLocalDateKey(point.date)!
    return [{ id: point.id, date: point.date, dayIndex: indexByDate.get(point.date)!, dateLabel: parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), shortDateLabel: parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), caloriesKcal: point.totals.calories }]
  })
}

export const summarizeCaloriesTrend = (points: readonly CaloriesTrendPoint[]): CaloriesTrendSummary => {
  const copy = [...points].sort((a, b) => a.dayIndex - b.dayIndex)
  const values = copy.map((point) => point.caloriesKcal)
  return { points: copy, trackedDays: copy.length, status: copy.length === 0 ? 'empty' : copy.length === 1 ? 'insufficient' : 'available', averageCalories: copy.length ? values.reduce((a, b) => a + b, 0) / copy.length : null, minimumCalories: copy.length ? Math.min(...values) : null, maximumCalories: copy.length ? Math.max(...values) : null, latestPoint: copy.at(-1) ?? null }
}

export const getValidCaloriesGoal = (goal: { enabled: boolean; value: number | null }): number | null => goal.enabled && goal.value !== null && Number.isFinite(goal.value) && goal.value > 0 ? goal.value : null

export const buildContinuousMetricDomain = ({ values, referenceValues = [], minimumSpan, paddingRatio, roundingStep, floorAtZero }: ContinuousMetricDomainOptions): [number, number] => {
  const finiteValues = [...values, ...referenceValues].filter(Number.isFinite)
  const min = finiteValues.length ? Math.min(...finiteValues) : 0
  const max = finiteValues.length ? Math.max(...finiteValues) : 0
  const span = Math.max(minimumSpan, max - min)
  const padding = span * paddingRatio
  let lower = Math.floor((min - padding) / roundingStep) * roundingStep
  let upper = Math.ceil((max + padding) / roundingStep) * roundingStep
  if (floorAtZero) lower = Math.max(0, lower)
  if (upper - lower < minimumSpan) { const missing = minimumSpan - (upper - lower); lower = floorAtZero ? Math.max(0, lower - missing / 2) : lower - missing / 2; upper = lower + minimumSpan }
  if (upper <= lower) upper = lower + minimumSpan
  return [lower, upper]
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
