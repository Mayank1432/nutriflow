import type { WeekDayId } from '../domain/types'
import { WEEK_DAY_IDS, WEEK_DAY_LABELS } from '../domain/weeklyMock'

type CopyDaySheetProps = {
  sourceDay: WeekDayId
  targetDay: WeekDayId
  onTargetChange: (dayId: WeekDayId) => void
  onClose: () => void
  onCopy: () => void
}

function CopyDaySheet({
  sourceDay,
  targetDay,
  onTargetChange,
  onClose,
  onCopy,
}: CopyDaySheetProps) {
  return (
    <div className="sheet-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="planner-action-sheet" role="dialog" aria-modal="true" aria-labelledby="copy-day-title">
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-heading">
          <div>
            <p className="eyebrow">Mock planner action</p>
            <h2 id="copy-day-title">Copy {WEEK_DAY_LABELS[sourceDay]}</h2>
          </div>
          <button className="sheet-close" type="button" onClick={onClose} aria-label="Close Copy Day">×</button>
        </div>
        <label className="copy-day-field">
          <span>Copy to</span>
          <select value={targetDay} onChange={(event) => onTargetChange(event.target.value as WeekDayId)}>
            {WEEK_DAY_IDS.filter((dayId) => dayId !== sourceDay).map((dayId) => (
              <option key={dayId} value={dayId}>{WEEK_DAY_LABELS[dayId]}</option>
            ))}
          </select>
        </label>
        <button className="primary-action" type="button" onClick={onCopy}>Copy day</button>
      </section>
    </div>
  )
}

export default CopyDaySheet
