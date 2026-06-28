type StatusBadgeProps = {
  children: string
  variant?: 'success' | 'info' | 'warning' | 'muted' | 'placeholder'
}

function StatusBadge({ children, variant = 'muted' }: StatusBadgeProps) {
  return <span className={`status-badge status-${variant}`}>{children}</span>
}

export default StatusBadge
