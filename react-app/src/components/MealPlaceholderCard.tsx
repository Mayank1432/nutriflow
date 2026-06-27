import type { CSSProperties } from 'react'

type MealPlaceholderCardProps = {
  color: string
  label: string
  note: string
}

function MealPlaceholderCard({ color, label, note }: MealPlaceholderCardProps) {
  return (
    <article className="meal-card" style={{ '--meal-color': color } as CSSProperties}>
      <div className="meal-icon" aria-hidden="true">
        {label.slice(0, 1)}
      </div>
      <div>
        <h4>{label}</h4>
        <p>{note}</p>
      </div>
      <span aria-hidden="true">›</span>
    </article>
  )
}

export default MealPlaceholderCard
