import { useEffect, useRef } from 'react'
import type { WeekDayId } from '../domain/types'
import { WEEK_DAY_IDS, WEEK_DAY_LABELS } from '../domain/weeklyMock'

type CopyDaySheetProps = {
  sourceDay: WeekDayId
  targetDay: WeekDayId
  onTargetChange: (dayId: WeekDayId) => void
  onClose: () => void
  onCopy: () => void
  submitting: boolean
  error: string
}

function CopyDaySheet({
  sourceDay,
  targetDay,
  onTargetChange,
  onClose,
  onCopy,
  submitting,
  error,
}: CopyDaySheetProps) {
  const dialogRef = useRef<HTMLElement>(null)
  useEffect(() => {
    dialogRef.current?.querySelector<HTMLSelectElement>('select')?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose()
      if (event.key !== 'Tab') return
      const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>('select:not(:disabled), button:not(:disabled)') ?? [])]
      if (!focusable.length) return
      const first = focusable[0]; const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, submitting])
  return (
    <div className="sheet-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !submitting) onClose()
    }}>
      <section ref={dialogRef} className="planner-action-sheet" role="dialog" aria-modal="true" aria-labelledby="copy-day-title">
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-heading">
          <div>
            <h2 id="copy-day-title">Copy {WEEK_DAY_LABELS[sourceDay]}</h2>
            <p>Copy {WEEK_DAY_LABELS[sourceDay]}’s meals to another day.</p>
          </div>
          <button className="sheet-close" type="button" disabled={submitting} onClick={onClose} aria-label="Close Copy Day">×</button>
        </div>
        <label className="copy-day-field">
          <span>Copy to</span>
          <select disabled={submitting} value={targetDay} onChange={(event) => onTargetChange(event.target.value as WeekDayId)}>
            {WEEK_DAY_IDS.filter((dayId) => dayId !== sourceDay).map((dayId) => (
              <option key={dayId} value={dayId}>{WEEK_DAY_LABELS[dayId]}</option>
            ))}
          </select>
        </label>
        <p className="planner-warning">{WEEK_DAY_LABELS[targetDay]}’s current plan will be replaced.</p>
        {error && <p className="planner-inline-error" role="alert">{error}</p>}
        <div className="confirm-actions"><button className="secondary-action" type="button" disabled={submitting} onClick={onClose}>Cancel</button><button className="primary-action" type="button" disabled={submitting} onClick={onCopy}>{submitting ? 'Copying…' : 'Copy Day'}</button></div>
      </section>
    </div>
  )
}

export default CopyDaySheet
