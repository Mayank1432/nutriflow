type DayChipProps = {
  active: boolean
  label: string
  protein: number
  planned: boolean
  onSelect: () => void
}

function DayChip({ active, label, protein, planned, onSelect }: DayChipProps) {
  return (
    <button
      className={`week-day-chip${active ? ' selected' : ''}`}
      type="button"
      aria-current={active ? 'date' : undefined}
      onClick={onSelect}
    >
      <strong>{label}</strong>
      <span>{planned ? `${protein.toFixed(0)}g` : 'Empty'}</span>
    </button>
  )
}

export default DayChip
