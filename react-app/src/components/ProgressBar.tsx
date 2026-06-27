type ProgressBarProps = {
  label: string
  target: number
  unit: string
  value: number
}

function ProgressBar({ label, target, unit, value }: ProgressBarProps) {
  const percent = target > 0 ? Math.min(100, Math.max(0, (value / target) * 100)) : 0

  return (
    <div className="today-progress">
      <div className="progress-label">
        <span>{label}</span>
        <strong>{Math.round(value)} / {target} {unit}</strong>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={Math.round(value)}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export default ProgressBar
