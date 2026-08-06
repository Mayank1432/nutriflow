import { forwardRef } from 'react'
import type { KeyboardEvent } from 'react'

type DayChipProps = {
  dayId: string
  active: boolean
  label: string
  protein: number
  planned: boolean
  onSelect: () => void
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
}

const DayChip = forwardRef<HTMLButtonElement, DayChipProps>(function DayChip({ dayId, active, label, protein, planned, onSelect, onKeyDown }, ref) {
  return (
    <button
      ref={ref}
      className={`week-day-chip${active ? ' selected' : ''}`}
      type="button"
      role="tab"
      id={`weekly-tab-${dayId}`}
      aria-selected={active}
      aria-controls={`weekly-panel-${dayId}`}
      tabIndex={active ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
    >
      <strong>{label}</strong>
      <span>{planned ? `${protein.toFixed(0)}g` : 'Empty'}</span>
    </button>
  )
})

export default DayChip
