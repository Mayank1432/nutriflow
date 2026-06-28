import type { MacroTotals } from '../domain/types'
import MacroChip from './MacroChip'
import ProgressBar from './ProgressBar'

type DailySummaryCardProps = {
  totals: MacroTotals
}

function DailySummaryCard({ totals }: DailySummaryCardProps) {
  return (
    <section className="daily-summary" aria-labelledby="daily-summary-title">
      <div className="daily-summary-heading">
        <div>
          <p className="eyebrow">Mock daily totals</p>
          <h3 id="daily-summary-title">Your nutrition snapshot</h3>
        </div>
        <span>Today</span>
      </div>
      <div className="progress-stack">
        <ProgressBar label="Protein" value={totals.p} target={120} unit="g" />
        <ProgressBar label="kcal" value={totals.k} target={2200} unit="kcal" />
      </div>
      <div className="macro-chip-grid">
        <MacroChip label="Carbs" value={`${totals.carb.toFixed(1)} g`} />
        <MacroChip label="Fat" value={`${totals.fat.toFixed(1)} g`} />
        <MacroChip label="Fibre" value={`${totals.fibre.toFixed(1)} g`} />
        <MacroChip label="Cost" value={`₹${totals.c.toFixed(0)}`} />
      </div>
    </section>
  )
}

export default DailySummaryCard
