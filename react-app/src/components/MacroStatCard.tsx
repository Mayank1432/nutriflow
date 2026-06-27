import type { CSSProperties } from 'react'

type MacroStatCardProps = {
  accent: string
  label: string
  value: string
}

function MacroStatCard({ accent, label, value }: MacroStatCardProps) {
  return (
    <article className="macro-card" style={{ '--accent': accent } as CSSProperties}>
      <span className="macro-dot" aria-hidden="true" />
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  )
}

export default MacroStatCard
