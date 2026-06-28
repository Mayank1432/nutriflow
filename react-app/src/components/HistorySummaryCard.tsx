import type { HistorySummary } from '../domain/types'

type HistorySummaryCardProps = {
  summary: HistorySummary
}

function HistorySummaryCard({ summary }: HistorySummaryCardProps) {
  const stats = [
    ['Saved days', String(summary.savedDays)],
    ['Avg protein/day', `${summary.averageProtein.toFixed(1)} g`],
    ['Avg calories/day', `${summary.averageCalories.toFixed(0)} kcal`],
    ['Avg cost/day', `₹${summary.averageCost.toFixed(0)}`],
    ['High-protein days', String(summary.highProteinDays)],
  ]

  return (
    <section className="history-summary-card" aria-labelledby="history-summary-title">
      <div>
        <p className="eyebrow">Mock history summary</p>
        <h3 id="history-summary-title">Your recent consistency</h3>
      </div>
      <div className="history-summary-grid">
        {stats.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

export default HistorySummaryCard
