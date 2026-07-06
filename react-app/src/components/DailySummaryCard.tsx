import type { MacroTotals } from '../domain/types'
import type { MacroGoal } from '../storage'

export type ProteinTrendPoint = {
  id: string
  date: string
  protein: number
}

type DailySummaryCardProps = {
  totals: MacroTotals
  proteinTrend: ProteinTrendPoint[]
  proteinGoal: MacroGoal
  caloriesGoal: MacroGoal
}

type GoalProgressProps = {
  current: number
  goal: MacroGoal
  label: string
  unit: string
  kind: 'protein' | 'calories'
}

const formatCalories = (value: number): string => {
  if (Number.isInteger(value)) return value.toFixed(0)
  if (Math.abs(value) < 1) return Number(value.toPrecision(3)).toString()
  return Number(value.toFixed(1)).toString()
}

function GoalProgress({ current, goal, label, unit, kind }: GoalProgressProps) {
  const validGoal = goal.enabled
    && goal.value !== null
    && Number.isFinite(goal.value)
    && goal.value > 0

  if (!validGoal || goal.value === null) {
    return (
      <div className={`today-goal-progress ${kind} no-goal`}>
        <span>Goal not set</span>
        <small>Enable a valid {label.toLowerCase()} goal in Settings.</small>
      </div>
    )
  }

  const percentage = (current / goal.value) * 100
  const difference = current - goal.value
  const achieved = Math.abs(difference) < 0.05
  const formatValue = kind === 'protein'
    ? (value: number) => value.toFixed(1)
    : formatCalories
  const helper = difference < 0
    ? `${formatValue(Math.abs(difference))} ${unit} remaining`
    : achieved
      ? `${label} goal achieved`
      : `${formatValue(Math.abs(difference))} ${unit} over goal`
  const state = difference > 0.05 ? 'over' : achieved ? 'achieved' : 'under'

  return (
    <div className={`today-goal-progress ${kind} ${state}`}>
      <div className="today-goal-numbers">
        <span>{formatValue(current)} / {formatValue(goal.value)} {unit}</span>
        <strong>{percentage.toFixed(0)}%</strong>
      </div>
      <div
        className="today-goal-track"
        role="progressbar"
        aria-label={`${label}: ${percentage.toFixed(0)} percent of goal`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, Math.max(0, percentage))}
      >
        <span style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }} />
      </div>
      <small className={kind === 'calories' && state === 'over' ? 'status-warning' : ''}>
        {helper}
      </small>
    </div>
  )
}

function DailySummaryCard({
  totals,
  proteinTrend,
  proteinGoal,
  caloriesGoal,
}: DailySummaryCardProps) {
  const maxProtein = Math.max(...proteinTrend.map((point) => point.protein), 1)

  return (
    <section className="today-dashboard-cards" aria-labelledby="daily-summary-title">
      <h2 className="sr-only" id="daily-summary-title">Today dashboard</h2>

      <article className="today-protein-hero">
        <div>
          <p className="eyebrow">Today&apos;s Protein</p>
          <strong>{totals.p.toFixed(1)}<span>g</span></strong>
        </div>
        <GoalProgress current={totals.p} goal={proteinGoal} label="Protein" unit="g" kind="protein" />
      </article>

      <div className="today-supporting-cards">
        <article className="today-dashboard-stat calories">
          <span>Today&apos;s Calories</span>
          <strong>{formatCalories(totals.k)} <small>kcal</small></strong>
          <GoalProgress current={totals.k} goal={caloriesGoal} label="Calories" unit="kcal" kind="calories" />
        </article>
        <article className="today-dashboard-stat cost">
          <span>Today&apos;s Cost</span>
          <strong>₹{totals.c.toFixed(0)}</strong>
        </article>
      </div>

      <article className="today-trend-card">
        <div className="today-trend-heading">
          <div>
            <p className="eyebrow">History preview</p>
            <h3>7-Day Protein Trend</h3>
          </div>
          <span>{proteinTrend.length}/7 days</span>
        </div>
        {proteinTrend.length < 2 ? (
          <p className="today-trend-empty">
            Save at least two days to History to start seeing your protein trend.
          </p>
        ) : (
          <div className="today-trend-bars" aria-label="Recent protein totals by saved day">
            {proteinTrend.map((point) => (
              <div key={point.id}>
                <span className="today-trend-value">{point.protein.toFixed(0)}g</span>
                <span className="today-trend-track">
                  <span style={{ height: `${Math.max(8, (point.protein / maxProtein) * 100)}%` }} />
                </span>
                <span className="today-trend-date">{point.date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  )
}

export default DailySummaryCard
