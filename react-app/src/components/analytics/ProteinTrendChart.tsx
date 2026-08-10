import { useEffect, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ProteinTrendPoint } from '../../domain/analyticsCharts'

function ProteinTooltip({ active, payload, goal }: { active?: boolean; payload?: readonly { payload?: unknown }[]; goal: number | null }) {
  const candidate = payload?.[0]?.payload
  if (!active || typeof candidate !== 'object' || candidate === null) return null
  const point = candidate as Partial<ProteinTrendPoint>
  const proteinGrams = point.proteinGrams
  if (typeof point.dateLabel !== 'string' || typeof proteinGrams !== 'number' || !Number.isFinite(proteinGrams) || proteinGrams < 0) return null
  return <div className="protein-tooltip"><strong>{point.dateLabel}</strong><span>Protein: {proteinGrams.toFixed(1)}g</span>{goal !== null && <span>Current goal: {goal.toFixed(1)}g</span>}</div>
}

export default function ProteinTrendChart({ points, domain, tickLabels, average, averageLabel, goal, goalLabel, labelledBy, describedBy }: { points: ProteinTrendPoint[]; domain: [number, number]; tickLabels: string[]; average: number | null; averageLabel: string | null; goal: number | null; goalLabel: string | null; labelledBy: string; describedBy: string }) {
  const [width, setWidth] = useState(() => window.innerWidth)
  useEffect(() => { const update = () => setWidth(window.innerWidth); window.addEventListener('resize', update); return () => window.removeEventListener('resize', update) }, [])
  const ticks = width <= 340 ? [0, 3, 6] : width < 600 ? [0, 2, 4, 6] : [0, 1, 2, 3, 4, 5, 6]
  return <div className="protein-trend-chart" role="group" aria-labelledby={labelledBy} aria-describedby={describedBy}><ResponsiveContainer width="100%" height="100%"><LineChart data={points} margin={{ top: 20, right: 52, bottom: 8, left: 0 }} accessibilityLayer><CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} /><XAxis type="number" dataKey="dayIndex" domain={[0, 6]} padding={{ left: 0, right: 12 }} ticks={ticks} tickFormatter={(index) => tickLabels[index] ?? ''} allowDecimals={false} stroke="var(--muted)" /><YAxis type="number" domain={domain} allowDataOverflow stroke="var(--muted)" width={84} tickFormatter={(value) => `${value}g`} /><Tooltip content={(props) => <ProteinTooltip active={props.active} payload={props.payload} goal={goal} />} />{average !== null && averageLabel !== null && <ReferenceLine y={average} stroke="var(--purple)" strokeDasharray="2 3" label={{ value: `7-day avg · ${averageLabel}g`, position: 'insideTopLeft', fill: 'var(--purple)', fontSize: 11 }} />}{goal !== null && goalLabel !== null && <ReferenceLine y={goal} stroke="var(--orange)" strokeDasharray="5 4" label={{ value: `Goal · ${goalLabel}g`, position: 'insideTopRight', fill: 'var(--orange)', fontSize: 11 }} />}<Line type="linear" dataKey="proteinGrams" stroke="var(--protein)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--surface)', strokeWidth: 2 }} activeDot={{ r: 5 }} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>
}
