import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type { MealProteinSplitDatum } from '../../domain/analyticsCharts'

const grams = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })
const colors = { Breakfast: 'var(--protein)', Lunch: 'var(--green-dark)', Dinner: 'var(--orange)', Snacks: 'var(--purple)' } as const

type Props = { data: MealProteinSplitDatum[]; totalProteinGrams: number; completeDays: number; mode: 'average' | 'date'; labelledBy: string; describedBy: string }

export default function MealProteinSplitChart({ data, totalProteinGrams, completeDays, mode, labelledBy, describedBy }: Props) {
  return <div className="meal-protein-split" role="group" aria-labelledby={labelledBy} aria-describedby={describedBy}>
    <div className="meal-protein-split-chart"><ResponsiveContainer width="100%" height="100%"><PieChart accessibilityLayer><Pie data={data} dataKey="proteinGrams" nameKey="meal" cx="50%" cy="50%" innerRadius="56%" outerRadius="82%" paddingAngle={2} isAnimationActive={false}>{data.map((item) => <Cell key={item.meal} fill={colors[item.meal]} />)}</Pie><text x="50%" y="48%" textAnchor="middle" className="meal-donut-total">{grams.format(totalProteinGrams)}g</text><text x="50%" y="59%" textAnchor="middle" className="meal-donut-label">{mode === 'average' ? 'avg protein' : 'total protein'}</text></PieChart></ResponsiveContainer></div>
    <ul className="meal-protein-details">{data.map((item) => <li key={item.meal}><span><i aria-hidden="true" style={{ background: colors[item.meal] }} />{item.meal}</span><strong>{item.proteinGrams === null ? 'Unavailable' : `${grams.format(item.proteinGrams)}g${mode === 'average' ? ' average' : ''}`}</strong>{mode === 'average' && <small>{completeDays} complete saved {completeDays === 1 ? 'day' : 'days'}</small>}</li>)}</ul>
  </div>
}
