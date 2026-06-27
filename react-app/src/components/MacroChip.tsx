type MacroChipProps = {
  label: string
  value: string
}

function MacroChip({ label, value }: MacroChipProps) {
  return (
    <div className="macro-chip">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default MacroChip
