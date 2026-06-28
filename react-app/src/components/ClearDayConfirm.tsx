type ClearDayConfirmProps = {
  dayName: string
  onCancel: () => void
  onConfirm: () => void
}

function ClearDayConfirm({ dayName, onCancel, onConfirm }: ClearDayConfirmProps) {
  return (
    <div className="sheet-backdrop">
      <section className="clear-day-confirm" role="alertdialog" aria-modal="true" aria-labelledby="clear-day-title">
        <p className="eyebrow">Confirm mock action</p>
        <h2 id="clear-day-title">Clear {dayName}?</h2>
        <p>This removes every mock ingredient from the selected day.</p>
        <div className="confirm-actions">
          <button className="secondary-action" type="button" onClick={onCancel}>Cancel</button>
          <button className="danger-action" type="button" onClick={onConfirm}>Clear day</button>
        </div>
      </section>
    </div>
  )
}

export default ClearDayConfirm
