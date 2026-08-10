import { calculateFoodEntryTotals, calculateMealsTotals, getCanonicalValidHistoryDays, getLocalDateKey, parseStrictLocalDateKey } from './historyIntegrity'
import type { DailyTotals, HistoryDay, MealName } from '../storage/storageTypes'

export type AnalyticsHistoryStatus = 'empty' | 'insufficient' | 'available'
export type AnalyticsDayPoint = { id: string; date: string; totals: DailyTotals }
export type ProteinTrendPoint = { id: string; date: string; dayIndex: number; dateLabel: string; shortDateLabel: string; proteinGrams: number }
export type ProteinTrendSummary = { points: ProteinTrendPoint[]; trackedDays: number; status: AnalyticsHistoryStatus; averageProtein: number | null; minimumProtein: number | null; maximumProtein: number | null; latestPoint: ProteinTrendPoint | null }
export type CaloriesTrendPoint = { id: string; date: string; dayIndex: number; dateLabel: string; shortDateLabel: string; caloriesKcal: number }
export type CaloriesTrendSummary = { points: CaloriesTrendPoint[]; trackedDays: number; status: AnalyticsHistoryStatus; averageCalories: number | null; minimumCalories: number | null; maximumCalories: number | null; latestPoint: CaloriesTrendPoint | null }
export type SpendTrendPoint = { id: string; date: string; dayIndex: number; dateLabel: string; shortDateLabel: string; spendAmount: number }
export type SpendTrendSummary = { points: SpendTrendPoint[]; trackedDays: number; status: AnalyticsHistoryStatus; averageSpend: number | null; minimumSpend: number | null; maximumSpend: number | null; latestPoint: SpendTrendPoint | null }
export type MacroMetric = 'protein' | 'carbs' | 'fat' | 'fibre'
export type MacroTrendDay = { id: string; date: string; dayIndex: number; dateLabel: string; shortDateLabel: string; proteinGrams: number | null; carbsGrams: number | null; fatGrams: number | null; fibreGrams: number | null }
export type MacroMetricSummary = { trackedDays: number; status: AnalyticsHistoryStatus; average: number | null; minimum: number | null; maximum: number | null; latestValue: number | null; latestDate: string | null }
export type MacroTrendsSummary = { days: MacroTrendDay[]; status: AnalyticsHistoryStatus; protein: MacroMetricSummary; carbs: MacroMetricSummary; fat: MacroMetricSummary; fibre: MacroMetricSummary }
export type MacroSplitDatum = { metric: MacroMetric; label: string; grams: number | null; percentage: number | null }
export type MacroSplitSummary = { status: 'empty' | 'zero' | 'available' | 'incomplete'; completeDays: number; totalGrams: number | null; data: MacroSplitDatum[] }
export type MealProteinSplitDatum = { meal: MealName; proteinGrams: number | null }
export type MealProteinSplitSummary = { status: 'empty' | 'zero' | 'available' | 'incomplete'; completeDays: number; totalProteinGrams: number | null; data: MealProteinSplitDatum[] }
export type AnalyticsSavedDateOption = { date: string; dateLabel: string }
export type ContinuousMetricDomainOptions = { values: readonly number[]; referenceValues?: readonly number[]; minimumSpan: number; paddingRatio: number; roundingStep: number; floorAtZero: boolean }
export type HistoricalSummary = {
  range: { days: 7; startDateKey: string; endDateKey: string }
  points: AnalyticsDayPoint[]
  trackedDays: number
  rangeCapacity: 7
  averageProtein: number | null
  averageCalories: number | null
  totalSpend: number | null
  status: AnalyticsHistoryStatus
}

const finite = (value: number) => Number.isFinite(value) ? value : 0

export const buildLocalDateRange = (endDate = new Date()): string[] => {
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(end.getFullYear(), end.getMonth(), end.getDate())
    date.setDate(end.getDate() - (6 - index))
    return getLocalDateKey(date)
  })
}

export const selectHistoryRange = (
  savedDays: readonly HistoryDay[],
  endDate = new Date(),
): AnalyticsDayPoint[] => {
  const keys = new Set(buildLocalDateRange(endDate))
  return getCanonicalValidHistoryDays(savedDays)
    .filter((day) => keys.has(day.date))
    .map((day) => ({ id: day.id, date: day.date, totals: calculateMealsTotals(day.meals) }))
    .sort((left, right) => left.date.localeCompare(right.date))
}

export const buildProteinTrendPoints = (savedDays: readonly HistoryDay[], endDate = new Date()): ProteinTrendPoint[] => {
  const range = buildLocalDateRange(endDate)
  const indexByDate = new Map(range.map((date, index) => [date, index]))
  return selectHistoryRange(savedDays, endDate).flatMap((point) => {
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
  const range = buildLocalDateRange(endDate)
  const indexByDate = new Map(range.map((date, index) => [date, index]))
  return selectHistoryRange(savedDays, endDate).flatMap((point) => {
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

export const buildSpendTrendPoints = (savedDays: readonly HistoryDay[], endDate = new Date()): SpendTrendPoint[] => {
  const range = buildLocalDateRange(endDate)
  const indexByDate = new Map(range.map((date, index) => [date, index]))
  return selectHistoryRange(savedDays, endDate).flatMap((point) => {
    if (!Number.isFinite(point.totals.cost) || point.totals.cost < 0) return []
    const parsed = parseStrictLocalDateKey(point.date)!
    return [{ id: point.id, date: point.date, dayIndex: indexByDate.get(point.date)!, dateLabel: parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), shortDateLabel: parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), spendAmount: point.totals.cost }]
  })
}

export const summarizeSpendTrend = (points: readonly SpendTrendPoint[]): SpendTrendSummary => {
  const copy = [...points].sort((a, b) => a.dayIndex - b.dayIndex)
  const values = copy.map((point) => point.spendAmount)
  return { points: copy, trackedDays: copy.length, status: copy.length === 0 ? 'empty' : copy.length === 1 ? 'insufficient' : 'available', averageSpend: copy.length ? values.reduce((a, b) => a + b, 0) / copy.length : null, minimumSpend: copy.length ? Math.min(...values) : null, maximumSpend: copy.length ? Math.max(...values) : null, latestPoint: copy.at(-1) ?? null }
}

export const getValidCostGoal = (goal: { enabled: boolean; value: number | null }): number | null => goal.enabled && goal.value !== null && Number.isFinite(goal.value) && goal.value > 0 ? goal.value : null

const validMacro = (value: number): number | null => Number.isFinite(value) && value >= 0 ? value : null

export const buildMacroTrendDays = (savedDays: readonly HistoryDay[], endDate = new Date()): MacroTrendDay[] => {
  const range = buildLocalDateRange(endDate)
  const indexByDate = new Map(range.map((date, index) => [date, index]))
  return selectHistoryRange(savedDays, endDate).map((point) => {
    const parsed = parseStrictLocalDateKey(point.date)!
    return { id: point.id, date: point.date, dayIndex: indexByDate.get(point.date)!, dateLabel: parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), shortDateLabel: parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), proteinGrams: validMacro(point.totals.protein), carbsGrams: validMacro(point.totals.carbs), fatGrams: validMacro(point.totals.fat), fibreGrams: validMacro(point.totals.fibre) }
  })
}

const summarizeMacroMetric = (days: readonly MacroTrendDay[], key: 'proteinGrams' | 'carbsGrams' | 'fatGrams' | 'fibreGrams'): MacroMetricSummary => {
  const observations = days.flatMap((day) => day[key] === null ? [] : [{ value: day[key], date: day.dateLabel, dayIndex: day.dayIndex }]).sort((a, b) => a.dayIndex - b.dayIndex)
  const values = observations.map((item) => item.value)
  return { trackedDays: values.length, status: values.length === 0 ? 'empty' : values.length === 1 ? 'insufficient' : 'available', average: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null, minimum: values.length ? Math.min(...values) : null, maximum: values.length ? Math.max(...values) : null, latestValue: observations.at(-1)?.value ?? null, latestDate: observations.at(-1)?.date ?? null }
}

export const summarizeMacroTrends = (days: readonly MacroTrendDay[]): MacroTrendsSummary => {
  const copy = [...days].sort((a, b) => a.dayIndex - b.dayIndex)
  const protein = summarizeMacroMetric(copy, 'proteinGrams'); const carbs = summarizeMacroMetric(copy, 'carbsGrams'); const fat = summarizeMacroMetric(copy, 'fatGrams'); const fibre = summarizeMacroMetric(copy, 'fibreGrams')
  const series = [protein, carbs, fat, fibre]
  return { days: copy, status: series.some((item) => item.status === 'available') ? 'available' : series.some((item) => item.status === 'insufficient') ? 'insufficient' : 'empty', protein, carbs, fat, fibre }
}

export const summarizeMacroSplit = (days: readonly MacroTrendDay[]): MacroSplitSummary => {
  const complete = days.filter((day) => day.proteinGrams !== null && day.carbsGrams !== null && day.fatGrams !== null && day.fibreGrams !== null)
  const totals = { protein: complete.reduce((sum, day) => sum + day.proteinGrams!, 0), carbs: complete.reduce((sum, day) => sum + day.carbsGrams!, 0), fat: complete.reduce((sum, day) => sum + day.fatGrams!, 0), fibre: complete.reduce((sum, day) => sum + day.fibreGrams!, 0) }
  const averages = { protein: complete.length ? totals.protein / complete.length : 0, carbs: complete.length ? totals.carbs / complete.length : 0, fat: complete.length ? totals.fat / complete.length : 0, fibre: complete.length ? totals.fibre / complete.length : 0 }
  const totalGrams = averages.protein + averages.carbs + averages.fat + averages.fibre
  const data: MacroSplitDatum[] = ([['protein', 'Protein'], ['carbs', 'Carbs'], ['fat', 'Fat'], ['fibre', 'Fibre']] as const).map(([metric, label]) => ({ metric, label, grams: averages[metric], percentage: totalGrams > 0 ? averages[metric] / totalGrams * 100 : null }))
  return { status: complete.length === 0 ? 'empty' : totalGrams === 0 ? 'zero' : 'available', completeDays: complete.length, totalGrams, data }
}

const emptyMacroSplitData = (): MacroSplitDatum[] => ([['protein', 'Protein'], ['carbs', 'Carbs'], ['fat', 'Fat'], ['fibre', 'Fibre']] as const).map(([metric, label]) => ({ metric, label, grams: null, percentage: null }))

export const summarizeMacroSplitForDate = (savedDays: readonly HistoryDay[], selectedDate: string, endDate = new Date()): MacroSplitSummary => {
  const day = buildMacroTrendDays(savedDays, endDate).find((item) => item.date === selectedDate)
  if (!day) return { status: 'empty', completeDays: 0, totalGrams: null, data: emptyMacroSplitData() }
  const data: MacroSplitDatum[] = ([['protein', 'Protein', day.proteinGrams], ['carbs', 'Carbs', day.carbsGrams], ['fat', 'Fat', day.fatGrams], ['fibre', 'Fibre', day.fibreGrams]] as const).map(([metric, label, grams]) => ({ metric, label, grams, percentage: null }))
  if (data.some((item) => item.grams === null)) return { status: 'incomplete', completeDays: 0, totalGrams: null, data }
  const totalGrams = data.reduce((sum, item) => sum + item.grams!, 0)
  return { status: totalGrams === 0 ? 'zero' : 'available', completeDays: 1, totalGrams, data: data.map((item) => ({ ...item, percentage: totalGrams > 0 ? item.grams! / totalGrams * 100 : null })) }
}

export const buildAnalyticsSavedDateOptions = (savedDays: readonly HistoryDay[], endDate = new Date()): AnalyticsSavedDateOption[] => {
  const range = new Set(buildLocalDateRange(endDate))
  return getCanonicalValidHistoryDays(savedDays)
    .filter((day) => range.has(day.date))
    .sort((left, right) => right.date.localeCompare(left.date))
    .map((day) => ({ date: day.date, dateLabel: parseStrictLocalDateKey(day.date)!.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) }))
}

const MEAL_PROTEIN_ORDER: readonly MealName[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']

export const summarizeMealProteinSplit = (savedDays: readonly HistoryDay[], endDate = new Date()): MealProteinSplitSummary => {
  const range = new Set(buildLocalDateRange(endDate))
  const days = getCanonicalValidHistoryDays(savedDays).filter((day) => range.has(day.date))
  const complete = days.map((day) => MEAL_PROTEIN_ORDER.map((meal) => {
    const values = day.meals[meal].entries.map((entry) => calculateFoodEntryTotals(entry).protein)
    return values.every((value) => Number.isFinite(value) && value >= 0) ? values.reduce((sum, value) => sum + value, 0) : null
  })).filter((values) => values.every((value) => value !== null)) as number[][]
  const data = MEAL_PROTEIN_ORDER.map((meal, index) => ({ meal, proteinGrams: complete.length ? complete.reduce((sum, values) => sum + values[index], 0) / complete.length : null }))
  const totalProteinGrams = complete.length ? data.reduce((sum, item) => sum + item.proteinGrams!, 0) : null
  return { status: complete.length === 0 ? 'empty' : totalProteinGrams === 0 ? 'zero' : 'available', completeDays: complete.length, totalProteinGrams, data }
}

export const summarizeMealProteinSplitForDate = (savedDays: readonly HistoryDay[], selectedDate: string, endDate = new Date()): MealProteinSplitSummary => {
  const range = new Set(buildLocalDateRange(endDate))
  const day = getCanonicalValidHistoryDays(savedDays).find((item) => item.date === selectedDate && range.has(item.date))
  if (!day) return { status: 'empty', completeDays: 0, totalProteinGrams: null, data: MEAL_PROTEIN_ORDER.map((meal) => ({ meal, proteinGrams: null })) }
  const data = MEAL_PROTEIN_ORDER.map((meal) => {
    const values = day.meals[meal].entries.map((entry) => calculateFoodEntryTotals(entry).protein)
    return { meal, proteinGrams: values.every((value) => Number.isFinite(value) && value >= 0) ? values.reduce((sum, value) => sum + value, 0) : null }
  })
  if (data.some((item) => item.proteinGrams === null)) return { status: 'incomplete', completeDays: 0, totalProteinGrams: null, data }
  const totalProteinGrams = data.reduce((sum, item) => sum + item.proteinGrams!, 0)
  return { status: totalProteinGrams === 0 ? 'zero' : 'available', completeDays: 1, totalProteinGrams, data }
}

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
  endDate = new Date(),
): HistoricalSummary => {
  const keys = buildLocalDateRange(endDate)
  const points = selectHistoryRange(savedDays, endDate)
  const trackedDays = points.length
  const sums = points.reduce((total, point) => ({
    protein: total.protein + finite(point.totals.protein),
    calories: total.calories + finite(point.totals.calories),
    spend: total.spend + finite(point.totals.cost),
  }), { protein: 0, calories: 0, spend: 0 })
  return {
    range: { days: 7, startDateKey: keys[0], endDateKey: keys[keys.length - 1] },
    points,
    trackedDays,
    rangeCapacity: 7,
    averageProtein: trackedDays ? sums.protein / trackedDays : null,
    averageCalories: trackedDays ? sums.calories / trackedDays : null,
    totalSpend: trackedDays ? sums.spend : null,
    status: trackedDays === 0 ? 'empty' : trackedDays === 1 ? 'insufficient' : 'available',
  }
}

export const isStrictAnalyticsDate = (value: string) => parseStrictLocalDateKey(value) !== null
