import ScreenContainer from '../components/ScreenContainer'
import {
  readReactHistoryStore,
  readReactSettingsStore,
  readReactTodayStore,
  readReactWeeklyStore,
  type DailyTotals,
  type FoodEntry,
  type MacroGoals,
  type MealsByName,
} from '../storage'

const emptyTotals = (): DailyTotals => ({
  protein: 0,
  calories: 0,
  carbs: 0,
  fat: 0,
  fibre: 0,
  cost: 0,
})

const addTotals = (left: DailyTotals, right: DailyTotals): DailyTotals => ({
  protein: left.protein + right.protein,
  calories: left.calories + right.calories,
  carbs: left.carbs + right.carbs,
  fat: left.fat + right.fat,
  fibre: left.fibre + right.fibre,
  cost: left.cost + right.cost,
})

const entryTotals = (entry: FoodEntry): DailyTotals => {
  const multiplier = entry.basisType === 'per_100'
    ? entry.quantity / 100
    : entry.quantity

  return {
    protein: entry.nutritionSnapshot.protein * multiplier,
    calories: entry.nutritionSnapshot.calories * multiplier,
    carbs: entry.nutritionSnapshot.carbs * multiplier,
    fat: entry.nutritionSnapshot.fat * multiplier,
    fibre: entry.nutritionSnapshot.fibre * multiplier,
    cost: (entry.costSnapshot?.amount ?? 0) * multiplier,
  }
}

const mealTotals = (meals: MealsByName): DailyTotals =>
  Object.values(meals).flatMap((meal) => meal.entries)
    .reduce((totals, entry) => addTotals(totals, entryTotals(entry)), emptyTotals())

const averageTotals = (totals: DailyTotals, count: number): DailyTotals => {
  if (count === 0) return emptyTotals()
  return Object.fromEntries(
    Object.entries(totals).map(([key, value]) => [key, value / count]),
  ) as unknown as DailyTotals
}

const metrics: Array<{
  key: keyof DailyTotals
  label: string
  unit: string
}> = [
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'fibre', label: 'Fibre', unit: 'g' },
  { key: 'cost', label: 'Cost', unit: '₹' },
]

const formatMetric = (value: number, unit: string) =>
  unit === '₹' ? `₹${value.toFixed(0)}` : `${value.toFixed(1)} ${unit}`

function TotalsGrid({ totals }: { totals: DailyTotals }) {
  return (
    <div className="analytics-metric-grid">
      {metrics.map(({ key, label, unit }) => (
        <div className="analytics-metric" key={key}>
          <span>{label}</span>
          <strong>{formatMetric(totals[key], unit)}</strong>
        </div>
      ))}
    </div>
  )
}

function GoalComparison({
  goals,
  today,
}: {
  goals: MacroGoals
  today: DailyTotals
}) {
  return (
    <div className="analytics-goals">
      {metrics.map(({ key, label, unit }) => {
        const goal = goals[key]
        if (!goal.enabled || goal.value === null) {
          return (
            <div className="analytics-goal-row is-disabled" key={key}>
              <span>{label}</span>
              <strong>Not set</strong>
            </div>
          )
        }
        const progress = Math.min(100, Math.max(0, (today[key] / goal.value) * 100))
        return (
          <div className="analytics-goal-row" key={key}>
            <div>
              <span>{label}</span>
              <strong>
                {formatMetric(today[key], unit)} / {formatMetric(goal.value, unit)}
              </strong>
            </div>
            <div className="analytics-progress" aria-label={`${label} goal ${progress.toFixed(0)} percent`}>
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AnalyticsScreen() {
  const todayStore = readReactTodayStore()
  const weeklyStore = readReactWeeklyStore()
  const historyStore = readReactHistoryStore()
  const settingsStore = readReactSettingsStore()

  const today = mealTotals(todayStore.meals)
  const weekly = weeklyStore.days.reduce(
    (totals, day) => addTotals(totals, mealTotals(day.meals)),
    emptyTotals(),
  )
  const historyDays = [...historyStore.savedDays]
    .sort((left, right) => right.savedAt.localeCompare(left.savedAt))
  const recentHistory = historyDays.slice(0, 7)
  const historyTotal = recentHistory.reduce(
    (totals, day) => addTotals(totals, mealTotals(day.meals)),
    emptyTotals(),
  )
  const historyAverage = averageTotals(historyTotal, recentHistory.length)
  const hasTodayEntries = Object.values(todayStore.meals)
    .some((meal) => meal.entries.length > 0)
  const plannedDays = weeklyStore.days
    .filter((day) => Object.values(day.meals).some((meal) => meal.entries.length > 0))
    .length

  return (
    <ScreenContainer
      title="Analytics"
      subtitle="Read-only insights from your saved nutrition data."
    >
      <div className="analytics-dashboard">
        <section className="analytics-highlight-grid" aria-label="Analytics highlights">
          <article className="analytics-highlight protein">
            <span>Average Protein</span>
            <strong>{historyAverage.protein.toFixed(1)}g</strong>
            <small>Last {recentHistory.length} saved {recentHistory.length === 1 ? 'day' : 'days'}</small>
          </article>
          <article className="analytics-highlight spend">
            <span>Weekly Spend</span>
            <strong>₹{weekly.cost.toFixed(0)}</strong>
            <small>Current planned week</small>
          </article>
        </section>
        <section className="analytics-card analytics-hero" aria-labelledby="analytics-today-title">
          <div className="analytics-card-heading">
            <div>
              <p className="eyebrow">Live today</p>
              <h2 id="analytics-today-title">Today at a glance</h2>
            </div>
            <span className="status-badge status-success">Read only</span>
          </div>
          {hasTodayEntries ? (
            <TotalsGrid totals={today} />
          ) : (
            <p className="analytics-empty">Add foods to Today to see live nutrition insights here.</p>
          )}
        </section>

        <section className="analytics-card analytics-weekly" aria-labelledby="analytics-weekly-title">
          <div className="analytics-card-heading">
            <div>
              <p className="eyebrow">Planned week</p>
              <h2 id="analytics-weekly-title">Weekly totals</h2>
            </div>
            <span>{plannedDays} of 7 days planned</span>
          </div>
          {plannedDays > 0 ? (
            <TotalsGrid totals={weekly} />
          ) : (
            <p className="analytics-empty">Your Weekly planner is empty. Planned meals will roll up here.</p>
          )}
        </section>

        <section className="analytics-card analytics-history" aria-labelledby="analytics-history-title">
          <div className="analytics-card-heading">
            <div>
              <p className="eyebrow">Recent trend</p>
              <h2 id="analytics-history-title">History daily average</h2>
            </div>
            <span>Last {recentHistory.length} saved {recentHistory.length === 1 ? 'day' : 'days'}</span>
          </div>
          {recentHistory.length > 0 ? (
            <>
              <TotalsGrid totals={historyAverage} />
              <div className="analytics-history-strip" aria-label="Recent saved history days">
                {recentHistory.map((day) => {
                  const totals = mealTotals(day.meals)
                  return (
                    <div key={day.id}>
                      <span>{day.date}</span>
                      <strong>{totals.protein.toFixed(1)}g protein</strong>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <p className="analytics-empty">Save a Today entry to History to begin seeing trends.</p>
          )}
        </section>

        <section className="analytics-card analytics-goal-card" aria-labelledby="analytics-goals-title">
          <div className="analytics-card-heading">
            <div>
              <p className="eyebrow">Macro Goals</p>
              <h2 id="analytics-goals-title">Today compared with goals</h2>
            </div>
          </div>
          <GoalComparison goals={settingsStore.macroGoals} today={today} />
        </section>
      </div>
    </ScreenContainer>
  )
}

export default AnalyticsScreen
