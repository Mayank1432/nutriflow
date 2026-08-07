import type { HistorySummary } from '../domain/types'

type HistorySummaryCardProps = {
  summary: HistorySummary
}

function HistorySummaryCard({ summary }: HistorySummaryCardProps) {
  const finite = (value: number) => Number.isFinite(value) ? value : 0
  const stats = [
    ['Saved days', String(summary.savedDays)],
    ['Average protein per day', `${finite(summary.averageProtein).toFixed(1)} g`],
    ['Average calories per day', `${finite(summary.averageCalories).toFixed(0)} kcal`],
    ['Average cost per day', `₹${finite(summary.averageCost).toFixed(0)}`],
    ['High-protein days', String(summary.highProteinDays)],
  ]

  return (
    <section className="history-summary-card" aria-labelledby="history-summary-title">
      <div>
        <h2 id="history-summary-title">Your recent consistency</h2>
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
