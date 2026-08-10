import { useState, type CSSProperties } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MacroSplitDatum } from '../../domain/analyticsCharts'

const grams = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })
const percent = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 })
const colors = { protein: 'var(--protein)', carbs: 'var(--orange)', fat: 'var(--purple)', fibre: 'var(--green-dark)' } as const

function SplitTooltip({ active, payload, coordinate }: { active?: boolean; payload?: readonly { dataKey?: unknown; value?: unknown }[]; coordinate?: { x?: number } }) {
  const item = payload?.[0]
  if (!active || typeof item?.dataKey !== 'string' || typeof item.value !== 'number' || !Number.isFinite(item.value)) return null
  const metric = item.dataKey as keyof typeof colors
  const label = metric === 'protein' ? 'Protein' : metric === 'carbs' ? 'Carbs' : metric === 'fat' ? 'Fat' : metric === 'fibre' ? 'Fibre' : null
  if (!label) return null
  const datum = Reflect.get(item, 'payload') as Record<string, unknown> | undefined
  const exact = datum?.[`${metric}Grams`]
  const tooltipX = typeof coordinate?.x === 'number' && Number.isFinite(coordinate.x) ? coordinate.x : 0
  return <div className="protein-tooltip macro-split-tooltip" style={{ '--macro-split-tooltip-x': `${tooltipX}px` } as CSSProperties}><strong>{label}</strong><span>{typeof exact === 'number' ? grams.format(exact) : '0'}g</span><span>{percent.format(item.value)}%</span></div>
}

export default function MacroSplitChart({ data, labelledBy, describedBy }: { data: MacroSplitDatum[]; labelledBy: string; describedBy: string }) {
  const [portalTarget, setPortalTarget] = useState<HTMLDivElement | null>(null)
  const row = { name: 'Macro split', ...Object.fromEntries(data.flatMap((item) => [[item.metric, item.percentage ?? 0], [`${item.metric}Grams`, item.grams]])) }
  return <div className="macro-split-chart" role="group" aria-labelledby={labelledBy} aria-describedby={describedBy}><div className="macro-split-visual"><div className="macro-split-bar"><ResponsiveContainer width="100%" height="100%"><BarChart data={[row]} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}><XAxis type="number" domain={[0, 100]} hide /><YAxis type="category" dataKey="name" hide /><Tooltip shared={false} portal={portalTarget} content={(props) => <SplitTooltip active={props.active} payload={props.payload} coordinate={props.coordinate} />} />{data.map((item) => <Bar key={item.metric} dataKey={item.metric} stackId="macro-split" fill={colors[item.metric]} isAnimationActive={false} />)}</BarChart></ResponsiveContainer></div><div ref={setPortalTarget} className="macro-split-tooltip-portal" /></div><div className="macro-split-details">{data.map((item) => <div key={item.metric}><span><i aria-hidden="true" style={{ background: colors[item.metric] }} />{item.label}</span><strong>{percent.format(item.percentage ?? 0)}%</strong><small>{grams.format(item.grams)}g</small></div>)}</div></div>
}
