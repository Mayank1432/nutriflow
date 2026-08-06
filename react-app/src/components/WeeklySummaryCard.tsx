import type { WeeklySummary } from '../domain/types'

type WeeklySummaryCardProps = {
  summary: WeeklySummary
}

function WeeklySummaryCard({ summary }: WeeklySummaryCardProps) {
  const safe = (value: number) => Number.isFinite(value) ? value : 0
  const stats = [
    ['Total protein', `${safe(summary.p).toFixed(0)} g`, 'protein'],
    ['Total calories', `${safe(summary.k).toFixed(0)} kcal`, 'calories'],
    ['Total cost', `₹${safe(summary.c).toFixed(0)}`, 'cost'],
    ['Average protein per day', `${safe(summary.averageProtein).toFixed(1)} g`, 'secondary'],
    ['Average calories per day', `${safe(summary.averageCalories).toFixed(0)} kcal`, 'secondary'],
    ['Planned days out of 7', `${safe(summary.plannedDays).toFixed(0)} / 7`, 'secondary'],
  ]

  return (
    <section className="weekly-summary-card" aria-labelledby="weekly-summary-title">
      <div>
        <p className="eyebrow">Weekly plan</p>
        <h2 id="weekly-summary-title">Week at a glance</h2>
      </div>
      <div className="weekly-summary-grid">
        {stats.map(([label, value, tone]) => (
          <div className={`weekly-summary-stat ${tone}`} key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

export default WeeklySummaryCard
