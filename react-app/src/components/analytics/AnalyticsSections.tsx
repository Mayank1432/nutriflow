import type { HistoricalSummary } from '../../domain/analyticsCharts'
import type { DailyTotals, MacroGoals } from '../../storage'
import AnalyticsIcon from './AnalyticsIcon'

const number = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })
const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const metrics: Array<{ key: keyof DailyTotals; label: string; unit: string }> = [{ key: 'protein', label: 'Protein', unit: 'g' }, { key: 'calories', label: 'Calories', unit: 'kcal' }, { key: 'carbs', label: 'Carbs', unit: 'g' }, { key: 'fat', label: 'Fat', unit: 'g' }, { key: 'fibre', label: 'Fibre', unit: 'g' }, { key: 'cost', label: 'Cost', unit: '₹' }]
const value = (amount: number, unit: string) => unit === '₹' ? money.format(amount) : `${number.format(amount)} ${unit}`

export function AnalyticsSummaryGrid({ summary }: { summary: HistoricalSummary }) {
  const supporting = summary.trackedDays ? `Across ${summary.trackedDays} saved ${summary.trackedDays === 1 ? 'day' : 'days'}` : 'No saved data'
  const cards = [
    ['protein', 'Average Protein', summary.averageProtein === null ? '—' : `${number.format(summary.averageProtein)} g`, supporting],
    ['calories', 'Average Calories', summary.averageCalories === null ? '—' : `${number.format(summary.averageCalories)} kcal`, supporting],
    ['spend', 'Total Spend', summary.totalSpend === null ? '—' : money.format(summary.totalSpend), summary.trackedDays ? 'In this range' : 'No saved data'],
    ['tracked', 'Days Tracked', `${summary.trackedDays} of ${summary.rangeCapacity}`, summary.trackedDays ? 'In this range' : 'No saved data'],
  ] as const
  return <div className="analytics-summary-grid" aria-label="Historical summary">{cards.map(([icon, label, display, detail]) => <article className={`analytics-summary-card ${icon}`} key={label}><AnalyticsIcon name={icon} /><span>{label}</span><strong>{display}</strong><small>{detail}</small></article>)}</div>
}

export function AnalyticsChartShell({ summary }: { summary: HistoricalSummary }) {
  const copy = summary.status === 'empty' ? ['No saved data for this period.', 'Saved History days within the selected range will appear here.'] : summary.status === 'insufficient' ? ['1 day tracked.', 'Save at least 2 days to view this trend.'] : ['Chart coming in the next Analytics task.', 'Charts will appear here as tasks are completed.']
  return <section className="analytics-section" aria-labelledby="historical-trends-title"><p className="eyebrow">HISTORICAL TRENDS</p><h2 id="historical-trends-title">Historical Trends</h2><div className="analytics-chart-shell"><AnalyticsIcon name="trend" /><strong>{copy[0]}</strong><p>{copy[1]}</p><span className="sr-only">{summary.trackedDays} saved History days in the selected {summary.rangeCapacity}-day range.</span></div></section>
}

function Totals({ totals }: { totals: DailyTotals }) { return <><div className="analytics-primary-metrics">{metrics.slice(0, 2).concat(metrics.slice(5)).map(({ key, label, unit }) => <div key={key}><span>{label}</span><strong>{value(totals[key], unit)}</strong></div>)}</div><p className="analytics-secondary">Carbs {number.format(totals.carbs)} g · Fat {number.format(totals.fat)} g · Fibre {number.format(totals.fibre)} g</p></> }

export function AnalyticsTotalsSection({ kind, totals, plannedDays = 0 }: { kind: 'live' | 'planned'; totals: DailyTotals; plannedDays?: number }) { const live = kind === 'live'; return <section className="analytics-section analytics-data-card" aria-labelledby={`${kind}-analytics-title`}><div className="analytics-section-heading"><div><p className="eyebrow">{live ? 'LIVE TODAY' : 'PLANNED WEEK'}</p><h2 id={`${kind}-analytics-title`}>{live ? 'Today at a glance' : 'Planned Week'}</h2></div><span className={`analytics-badge ${live ? 'live' : 'planned'}`}><AnalyticsIcon name={live ? 'live' : 'planned'} />{live ? 'Live data' : 'Planned data'}</span></div><Totals totals={totals} /><footer>{live ? 'Current Today data is separate from saved History.' : `${plannedDays} of 7 days planned in Weekly Planner.`}</footer></section> }

export function AnalyticsGoals({ goals, totals }: { goals: MacroGoals; totals: DailyTotals }) { return <section className="analytics-section analytics-data-card" aria-labelledby="current-goals-title"><p className="eyebrow">CURRENT GOALS</p><h2 id="current-goals-title">Today compared with current goals</h2><div className="analytics-goal-list">{metrics.map(({ key, label, unit }) => { const goal = goals[key]; const valid = goal.enabled && goal.value !== null && Number.isFinite(goal.value) && goal.value > 0; if (!valid) return <div className="analytics-goal-row is-disabled" key={key}><span>{label}</span><strong>Goal not set</strong></div>; const percentage = Math.max(0, totals[key] / goal.value! * 100); return <div className="analytics-goal-row" key={key}><div><span>{label}</span><strong>{value(totals[key], unit)} of {value(goal.value!, unit)}</strong><b>{number.format(percentage)}%</b></div><div className="analytics-progress" role="progressbar" aria-label={`${label}: ${number.format(percentage)} percent of goal`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, percentage)}><span style={{ width: `${Math.min(100, percentage)}%` }} /></div></div> })}</div><footer>Uses your current Settings goals and live Today totals.</footer></section> }
