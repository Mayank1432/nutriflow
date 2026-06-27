type EmptyStateCardProps = {
  text: string
  title: string
}

function EmptyStateCard({ text, title }: EmptyStateCardProps) {
  return (
    <div className="empty-state">
      <div className="empty-symbol" aria-hidden="true">
        ◌
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

export default EmptyStateCard
