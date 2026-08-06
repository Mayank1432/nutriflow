import { useEffect, useRef } from 'react'

type ClearDayConfirmProps = {
  dayName: string
  onCancel: () => void
  onConfirm: () => void
  submitting: boolean
  error: string
}

function ClearDayConfirm({ dayName, onCancel, onConfirm, submitting, error }: ClearDayConfirmProps) {
  const dialogRef = useRef<HTMLElement>(null)
  useEffect(() => {
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onCancel()
      if (event.key !== 'Tab') return
      const focusable = [...(dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])]
      if (!focusable.length) return
      const first = focusable[0]; const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancel, submitting])
  return (
    <div className="sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onCancel() }}>
      <section ref={dialogRef} className="clear-day-confirm" role="alertdialog" aria-modal="true" aria-labelledby="clear-day-title">
        <h2 id="clear-day-title">Clear {dayName}?</h2>
        <p>This removes every planned food from {dayName}.<br />Existing reusable ingredients and saved History are not changed.</p>
        {error && <p className="planner-inline-error" role="alert">{error}</p>}
        <div className="confirm-actions">
          <button className="secondary-action" type="button" disabled={submitting} onClick={onCancel}>Cancel</button>
          <button className="danger-action" type="button" disabled={submitting} onClick={onConfirm}>{submitting ? 'Clearing…' : 'Clear Day'}</button>
        </div>
      </section>
    </div>
  )
}

export default ClearDayConfirm
