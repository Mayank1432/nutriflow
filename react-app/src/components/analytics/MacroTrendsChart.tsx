import { useEffect, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MacroTrendDay } from '../../domain/analyticsCharts'

const grams = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })
const series = [
  { key: 'proteinGrams', label: 'Protein', color: 'var(--protein)', dash: undefined },
  { key: 'carbsGrams', label: 'Carbs', color: 'var(--orange)', dash: '10 5' },
  { key: 'fatGrams', label: 'Fat', color: 'var(--purple)', dash: '6 4' },
  { key: 'fibreGrams', label: 'Fibre', color: 'var(--green-dark)', dash: '2 3' },
] as const

function MacroTooltip({ active, payload }: { active?: boolean; payload?: readonly { payload?: unknown }[] }) {
  const candidate = payload?.[0]?.payload
  if (!active || typeof candidate !== 'object' || candidate === null) return null
  const day = candidate as Partial<MacroTrendDay>
  if (typeof day.dateLabel !== 'string') return null
  const display = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? `${grams.format(value)}g` : 'unavailable'
  return <div className="protein-tooltip macro-trends-tooltip"><strong>{day.dateLabel}</strong>{series.map((item) => <span key={item.key}>{item.label}: {display(day[item.key])}</span>)}</div>
}

export default function MacroTrendsChart({ days, domain, tickLabels, labelledBy, describedBy }: { days: MacroTrendDay[]; domain: [number, number]; tickLabels: string[]; labelledBy: string; describedBy: string }) {
  const [width, setWidth] = useState(() => window.innerWidth)
  useEffect(() => { const update = () => setWidth(window.innerWidth); window.addEventListener('resize', update); return () => window.removeEventListener('resize', update) }, [])
  const ticks = width <= 340 ? [0, 3, 6] : width < 600 ? [0, 2, 4, 6] : [0, 1, 2, 3, 4, 5, 6]
  return <div className="macro-trends-visual" role="group" aria-labelledby={labelledBy} aria-describedby={describedBy}><div className="macro-trends-legend" aria-label="Macro trend series">{series.map((item) => <span key={item.key}><svg aria-hidden="true" viewBox="0 0 32 8"><line x1="1" y1="4" x2="31" y2="4" stroke={item.color} strokeWidth="2.5" strokeDasharray={item.dash} /></svg>{item.label}</span>)}</div><div className="protein-trend-chart macro-trends-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={days} margin={{ top: 20, right: 52, bottom: 8, left: 0 }} accessibilityLayer><CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} /><XAxis type="number" dataKey="dayIndex" domain={[0, 6]} padding={{ left: 0, right: 12 }} ticks={ticks} tickFormatter={(index) => tickLabels[index] ?? ''} allowDecimals={false} stroke="var(--muted)" /><YAxis type="number" domain={domain} allowDataOverflow stroke="var(--muted)" width={84} tickFormatter={(value) => `${grams.format(value)}g`} /><Tooltip content={(props) => <MacroTooltip active={props.active} payload={props.payload} />} />{series.map((item) => <Line key={item.key} type="linear" dataKey={item.key} name={item.label} stroke={item.color} strokeDasharray={item.dash} strokeWidth={2.5} dot={{ r: 4, fill: 'var(--surface)', strokeWidth: 2 }} activeDot={{ r: 5 }} isAnimationActive={false} connectNulls={false} />)}</LineChart></ResponsiveContainer></div></div>
}
