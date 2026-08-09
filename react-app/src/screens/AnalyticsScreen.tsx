import { useState } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import { useOpenDrawer } from '../components/DrawerContext'
import AnalyticsIcon from '../components/analytics/AnalyticsIcon'
import AnalyticsRangeControl from '../components/analytics/AnalyticsRangeControl'
import { AnalyticsChartShell, AnalyticsGoals, AnalyticsSummaryGrid, AnalyticsTotalsSection } from '../components/analytics/AnalyticsSections'
import { buildLocalDateRange, buildProteinTrendPoints, getValidProteinGoal, summarizeHistoryRange, summarizeProteinTrend, type AnalyticsRangeDays } from '../domain/analyticsCharts'
import { calculateMealsTotals, parseStrictLocalDateKey } from '../domain/historyIntegrity'
import { readReactHistoryStore, readReactSettingsStore, readReactTodayStore, readReactWeeklyStore, type DailyTotals } from '../storage'

const zero = (): DailyTotals => ({ protein: 0, calories: 0, carbs: 0, fat: 0, fibre: 0, cost: 0 })
const add = (a: DailyTotals, b: DailyTotals): DailyTotals => ({ protein: a.protein + b.protein, calories: a.calories + b.calories, carbs: a.carbs + b.carbs, fat: a.fat + b.fat, fibre: a.fibre + b.fibre, cost: a.cost + b.cost })
const displayDate = (key: string) => parseStrictLocalDateKey(key)?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) ?? key

export default function AnalyticsScreen() {
  const openDrawer = useOpenDrawer()
  const [rangeDays, setRangeDays] = useState<AnalyticsRangeDays>(7)
  const now = new Date()
  const todayStore = readReactTodayStore(); const weeklyStore = readReactWeeklyStore(); const settings = readReactSettingsStore()
  const savedDays = readReactHistoryStore().savedDays
  const summary = summarizeHistoryRange(savedDays, rangeDays, now)
  const proteinTrend = summarizeProteinTrend(buildProteinTrendPoints(savedDays, now))
  const proteinGoal = getValidProteinGoal(settings.macroGoals.protein)
  const proteinTickLabels = buildLocalDateRange(7, now).map((key) => parseStrictLocalDateKey(key)!.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }))
  const today = calculateMealsTotals(todayStore.meals)
  const weekly = weeklyStore.days.reduce((totals, day) => add(totals, calculateMealsTotals(day.meals)), zero())
  const plannedDays = weeklyStore.days.filter((day) => Object.values(day.meals).some((meal) => meal.entries.length)).length
  const rangeLabel = `${displayDate(summary.range.startDateKey)} – ${displayDate(summary.range.endDateKey)}`
  return <ScreenContainer title="Analytics" subtitle="Understand your nutrition and spending over time."><div className="analytics-shell"><button className="analytics-back" type="button" onClick={openDrawer}><AnalyticsIcon name="back" />Back to More</button><AnalyticsRangeControl value={rangeDays} onChange={setRangeDays} /><div className="analytics-range-context" aria-live="polite" aria-atomic="true"><span><AnalyticsIcon name="calendar" />{rangeLabel}</span><strong>{summary.trackedDays} saved History {summary.trackedDays === 1 ? 'day' : 'days'} in this range.</strong></div><AnalyticsSummaryGrid summary={summary} /><AnalyticsChartShell rangeDays={rangeDays} trend={proteinTrend} goal={proteinGoal} tickLabels={proteinTickLabels} /><AnalyticsTotalsSection kind="live" totals={today} /><AnalyticsGoals goals={settings.macroGoals} totals={today} /><AnalyticsTotalsSection kind="planned" totals={weekly} plannedDays={plannedDays} /></div></ScreenContainer>
}
