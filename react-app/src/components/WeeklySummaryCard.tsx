import type { WeeklySummary } from '../domain/types'

type WeeklySummaryCardProps = {
  summary: WeeklySummary
}

function WeeklySummaryCard({ summary }: WeeklySummaryCardProps) {
  const stats = [
    ['Total protein', `${summary.p.toFixed(0)} g`],
    ['Avg protein/day', `${summary.averageProtein.toFixed(1)} g`],
    ['Total calories', `${summary.k.toFixed(0)} kcal`],
    ['Avg calories/day', `${summary.averageCalories.toFixed(0)} kcal`],
    ['Total cost', `₹${summary.c.toFixed(0)}`],
    ['Planned days', `${summary.plannedDays} / 7`],
  ]

  return (
    <section className="weekly-summary-card" aria-labelledby="weekly-summary-title">
      <div>
        <p className="eyebrow">Mock week totals</p>
        <h3 id="weekly-summary-title">Week at a glance</h3>
      </div>
      <div className="weekly-summary-grid">
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

export default WeeklySummaryCard
