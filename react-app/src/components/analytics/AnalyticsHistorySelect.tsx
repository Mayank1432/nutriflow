import type { AnalyticsSavedDateOption } from '../../domain/analyticsCharts'

type Props = { id: string; label: string; value: string; options: AnalyticsSavedDateOption[]; onChange: (value: string) => void }

export default function AnalyticsHistorySelect({ id, label, value, options, onChange }: Props) {
  return <label className="analytics-history-select" htmlFor={id}><span>{label}</span><select id={id} value={value} onChange={(event) => onChange(event.target.value)}><option value="average">7-day Average</option>{options.map((option) => <option key={option.date} value={option.date}>{option.dateLabel}</option>)}</select></label>
}
