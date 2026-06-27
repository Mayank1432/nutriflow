type PlaceholderCardProps = {
  description: string
  label: string
  tone?: 'green' | 'coral' | 'yellow' | 'blue'
}

function PlaceholderCard({ description, label, tone = 'green' }: PlaceholderCardProps) {
  return (
    <article className={`placeholder-card ${tone}`}>
      <span className="placeholder-glyph" aria-hidden="true">
        {label.slice(0, 1)}
      </span>
      <div>
        <h3>{label}</h3>
        <p>{description}</p>
      </div>
    </article>
  )
}

export default PlaceholderCard
