import type { ReactNode } from 'react'

type EmptyStateProps = {
  action?: ReactNode
  description: string
  icon?: string
  title: string
}

function EmptyState({ action, description, icon = '○', title }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-symbol" aria-hidden="true">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}

export default EmptyState
