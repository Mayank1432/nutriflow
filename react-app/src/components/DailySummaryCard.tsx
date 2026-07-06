import type { MacroTotals } from '../domain/types'

export type ProteinTrendPoint = {
  id: string
  date: string
  protein: number
}

type DailySummaryCardProps = {
  totals: MacroTotals
  proteinTrend: ProteinTrendPoint[]
}

function DailySummaryCard({ totals, proteinTrend }: DailySummaryCardProps) {
  const maxProtein = Math.max(...proteinTrend.map((point) => point.protein), 1)

  return (
    <section className="today-dashboard-cards" aria-labelledby="daily-summary-title">
      <h2 className="sr-only" id="daily-summary-title">Today dashboard</h2>

      <article className="today-protein-hero">
        <div>
          <p className="eyebrow">Today&apos;s Protein</p>
          <strong>{totals.p.toFixed(1)}<span>g</span></strong>
        </div>
        <p>Your live total from today&apos;s meals.</p>
      </article>

      <div className="today-supporting-cards">
        <article className="today-dashboard-stat calories">
          <span>Today&apos;s Calories</span>
          <strong>{totals.k.toFixed(0)} <small>kcal</small></strong>
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
