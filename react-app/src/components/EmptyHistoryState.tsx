function EmptyHistoryState() {
  return (
    <section className="empty-history-state">
      <div className="empty-symbol" aria-hidden="true">◌</div>
      <h3>No saved days yet</h3>
      <p>Your completed daily logs will appear here.</p>
    </section>
  )
}

export default EmptyHistoryState
