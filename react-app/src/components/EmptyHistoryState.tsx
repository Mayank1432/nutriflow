import EmptyState from './EmptyState'

function EmptyHistoryState() {
  return <div className="empty-history-state"><EmptyState icon="◷" title="No saved days yet" description="Saved days will appear here when they are added to History." /></div>
}

export default EmptyHistoryState
