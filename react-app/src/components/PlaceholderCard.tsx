import StatusBadge from './StatusBadge'

type PlaceholderCardProps = {
  description: string
  label: string
  tone?: 'green' | 'coral' | 'yellow' | 'blue'
  status?: string
}

function PlaceholderCard({ description, label, status = 'Coming later', tone = 'green' }: PlaceholderCardProps) {
  return (
    <article className={`placeholder-card ${tone}`} aria-disabled="true">
      <span className="placeholder-glyph" aria-hidden="true">
        {label.slice(0, 1)}
      </span>
      <div>
        <div className="placeholder-heading">
          <h3>{label}</h3>
          <StatusBadge variant="placeholder">{status}</StatusBadge>
        </div>
        <p>{description}</p>
      </div>
    </article>
  )
}

export default PlaceholderCard
