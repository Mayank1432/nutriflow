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
  todayCost: number
  weeklyCost: number
  averageDailyCost: number
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

const trendChart = {
  width: 320,
  height: 112,
  left: 18,
  right: 18,
  top: 16,
  bottom: 24,
} as const

const formatProtein = (value: number): string => Number(value.toFixed(1)).toString()

const formatCost = (value: number): string => {
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
  todayCost,
  weeklyCost,
  averageDailyCost,
}: DailySummaryCardProps) {
  const trendPoints = proteinTrend.filter((point) => Number.isFinite(point.protein))
  const usableWidth = trendChart.width - trendChart.left - trendChart.right
  const chartBottom = trendChart.height - trendChart.bottom
  const usableHeight = chartBottom - trendChart.top
  const minProtein = trendPoints.length
    ? Math.min(...trendPoints.map((point) => point.protein))
    : 0
  const maxProtein = trendPoints.length
    ? Math.max(...trendPoints.map((point) => point.protein))
    : 0
  const plottedPoints = trendPoints.map((point, index) => {
    const x = trendPoints.length === 1
      ? trendChart.left + usableWidth / 2
      : trendChart.left + (index * usableWidth) / (trendPoints.length - 1)
    const y = maxProtein === minProtein
      ? trendChart.top + usableHeight / 2
      : chartBottom - ((point.protein - minProtein) / (maxProtein - minProtein)) * usableHeight
    return { ...point, x, y }
  })
  const trendPath = plottedPoints.length > 1
    ? plottedPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
    : ''
  const latestPoint = plottedPoints.at(-1)
  const chartLabel = `7-Day Protein Trend. ${plottedPoints.length} saved ${plottedPoints.length === 1 ? 'day' : 'days'}.${latestPoint ? ` Latest value: ${formatProtein(latestPoint.protein)} grams.` : ''}`

  return (
    <section className="today-dashboard-cards" aria-labelledby="daily-summary-title">
      <h2 className="sr-only" id="daily-summary-title">Today dashboard</h2>

      <div className="today-metric-cards">
        <article className="today-dashboard-stat cost">
          <span>Today&apos;s Cost</span>
          <strong>₹{formatCost(todayCost)}</strong>
        </article>
        <article className="today-dashboard-stat weekly-cost">
          <span>This Week&apos;s Cost</span>
          <strong>₹{formatCost(weeklyCost)}</strong>
        </article>
        <article className="today-dashboard-stat average-cost">
          <span>Avg Daily Cost</span>
          <strong>₹{formatCost(averageDailyCost)}</strong>
        </article>
      </div>

      <div className="today-progress-panels">
        <article className="today-progress-panel protein">
          <div className="today-progress-heading">
            <span>Protein Progress</span>
            <strong>Daily goal</strong>
          </div>
          <GoalProgress current={totals.p} goal={proteinGoal} label="Protein" unit="g" kind="protein" />
        </article>
        <article className="today-progress-panel calories">
          <div className="today-progress-heading">
            <span>Calories Progress</span>
            <strong>Daily goal</strong>
          </div>
          <GoalProgress current={totals.k} goal={caloriesGoal} label="Calories" unit="kcal" kind="calories" />
        </article>
      </div>

      <article className="today-trend-card">
        <div className="today-trend-heading">
          <div>
            <p className="eyebrow">History preview</p>
            <h3>7-Day Protein Trend</h3>
          </div>
          <span>{plottedPoints.length}/7 days</span>
        </div>
        {plottedPoints.length === 0 ? (
          <p className="today-trend-empty">
            Save a day to History to start seeing your protein trend.
          </p>
        ) : (
          <div className="today-trend-chart">
            <svg
              viewBox={`0 0 ${trendChart.width} ${trendChart.height}`}
              role="img"
              aria-label={chartLabel}
            >
              <line className="today-trend-baseline" x1={trendChart.left} x2={trendChart.width - trendChart.right} y1={chartBottom} y2={chartBottom} />
              {trendPath && <path className="today-trend-line" d={trendPath} />}
              {plottedPoints.map((point, index) => (
                <g key={point.id} className="today-trend-point">
                  <circle cx={point.x} cy={point.y} r="3.5">
                    <title>{point.date}: {formatProtein(point.protein)} grams protein</title>
                  </circle>
                  {(index === 0 || index === plottedPoints.length - 1) && (
                    <text
                      className="today-trend-date"
                      x={point.x}
                      y={trendChart.height - 5}
                      textAnchor={index === 0 ? 'start' : 'end'}
                    >
                      {point.date.slice(5)}
                    </text>
                  )}
                </g>
              ))}
              {latestPoint && (
                <text
                  className="today-trend-latest"
                  x={latestPoint.x}
                  y={Math.max(trendChart.top + 8, latestPoint.y - 8)}
                  textAnchor={latestPoint.x > trendChart.width / 2 ? 'end' : 'start'}
                >
                  {formatProtein(latestPoint.protein)}g
                </text>
              )}
            </svg>
            {plottedPoints.length === 1 && <p>One saved day so far. Add another day to reveal the trend.</p>}
          </div>
        )}
      </article>
    </section>
  )
}

export default DailySummaryCard
