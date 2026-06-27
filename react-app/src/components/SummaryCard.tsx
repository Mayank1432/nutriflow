import type { ReactNode } from 'react'

type SummaryCardProps = {
  children: ReactNode
  label: string
  value: string
}

function SummaryCard({ children, label, value }: SummaryCardProps) {
  return (
    <article className="summary-card">
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
      {children}
    </article>
  )
}

export default SummaryCard
