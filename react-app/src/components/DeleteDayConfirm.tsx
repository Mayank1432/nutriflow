import { useEffect, useRef } from 'react'

type DeleteDayConfirmProps = {
  title: string
  body: string
  confirmLabel: string
  pendingLabel: string
  onCancel: () => void
  onConfirm: () => void
  submitting: boolean
  error: string
}

function DeleteDayConfirm({
  title,
  body,
  confirmLabel,
  pendingLabel,
  onCancel,
  onConfirm,
  submitting,
  error,
}: DeleteDayConfirmProps) {
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
      <section ref={dialogRef} className="clear-day-confirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-day-title">
        <h2 id="delete-day-title">{title}</h2>
        <p>{body}</p>
        {error && <p className="planner-inline-error" role="alert">{error}</p>}
        <div className="confirm-actions">
          <button className="secondary-action" type="button" disabled={submitting} onClick={onCancel}>Cancel</button>
          <button className="danger-action" type="button" disabled={submitting} onClick={onConfirm}>{submitting ? pendingLabel : confirmLabel}</button>
        </div>
      </section>
    </div>
  )
}

export default DeleteDayConfirm