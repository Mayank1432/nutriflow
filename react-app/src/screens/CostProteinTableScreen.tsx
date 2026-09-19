import { useState } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import { deriveCostProteinRows, deriveVisibleCostProteinRows, type CostProteinBasisFilter, type CostProteinComparisonRow, type CostProteinSort, type NumericAvailability } from '../domain/costProteinComparison'
import { readReactIngredientsStore } from '../storage'
import { formatPriceAmount } from '../utils/priceDisplay'

const sortOptions: { value: CostProteinSort; label: string }[] = [
  { value: 'protein_desc', label: 'Protein — High to low' },
  { value: 'protein_asc', label: 'Protein — Low to high' },
  { value: 'cost_asc', label: 'Cost — Low to high' },
  { value: 'cost_desc', label: 'Cost — High to low' },
  { value: 'cost_per_protein_asc', label: 'Cost / g protein — Low to high' },
  { value: 'cost_per_protein_desc', label: 'Cost / g protein — High to low' },
]

const numberText = (metric: NumericAvailability, suffix: string) => metric.status === 'available' ? `${Number.isInteger(metric.value) ? metric.value : Number(metric.value.toFixed(1))} ${suffix}` : 'Unavailable'
const costText = (metric: NumericAvailability) => metric.status === 'available' ? formatPriceAmount(metric.value) : 'Unavailable'
const costPerGram = (metric: NumericAvailability) => metric.status === 'available' ? `${formatPriceAmount(metric.value)}/g` : 'Unavailable'
const accessibleCostPerGram = (metric: NumericAvailability) => metric.status === 'available' ? `${formatPriceAmount(metric.value).slice(1)} rupees per gram of protein` : 'Unavailable'
const basisText = (row: CostProteinComparisonRow) => row.basis.status === 'available' ? row.basis.label : 'Unavailable'

function CostProteinTableScreen() {
  const [ingredients] = useState(() => readReactIngredientsStore().ingredients)
  const [query, setQuery] = useState('')
  const [basisFilter, setBasisFilter] = useState<CostProteinBasisFilter>('all')
  const [sort, setSort] = useState<CostProteinSort>('cost_per_protein_asc')
  const allRows = deriveCostProteinRows(ingredients)
  const rows = deriveVisibleCostProteinRows(ingredients, query, basisFilter, sort)
  const empty = allRows.length === 0
    ? { title: 'No ingredients to compare', copy: 'Add ingredients in Ingredient Library to compare protein and cost.' }
    : query.trim() && rows.length === 0
      ? { title: 'No matching ingredients', copy: 'Try another search or clear your search.' }
      : rows.length === 0
        ? { title: 'No ingredients match these filters.', copy: 'Clear filters to see all comparable ingredients.' }
        : null

  const rowCells = (row: CostProteinComparisonRow) => <>
    <div><span>Basis</span><strong aria-label={row.basis.status === 'available' ? row.basis.accessibleLabel : 'Unavailable'}>{basisText(row)}</strong></div>
    <div><span>Protein</span><strong>{numberText(row.protein, 'g')}</strong></div>
    <div><span>Calories</span><strong>{numberText(row.calories, 'kcal')}</strong></div>
    <div><span>Cost</span><strong>{costText(row.cost)}</strong></div>
    <div className="cost-protein-emphasis"><span>Cost / g protein</span><strong aria-label={accessibleCostPerGram(row.costPerGramProtein)}>{costPerGram(row.costPerGramProtein)}</strong></div>
  </>

  return <ScreenContainer title="Cost / Protein Table" subtitle="Compare protein, calories and cost using each ingredient's saved basis.">
    <div className="cost-protein-screen">
      <div className="cost-protein-controls">
        <label className="cost-protein-search"><span>Search ingredients</span><input type="search" value={query} placeholder="Search ingredients" onChange={(event) => setQuery(event.target.value)} /></label>
        <label><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value as CostProteinSort)}>{sortOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
        <label><span>Basis</span><select value={basisFilter} onChange={(event) => setBasisFilter(event.target.value as CostProteinBasisFilter)}><option value="all">All</option><option value="per_100">Per 100</option><option value="per_unit">Per unit</option></select></label>
      </div>
      <p className="cost-protein-copy">Values use each ingredient's saved nutrition and price basis. Per-100 and per-unit entries are not normalized to the same quantity.</p>
      {empty ? <section className="cost-protein-empty"><h2>{empty.title}</h2><p>{empty.copy}</p></section> : <div className="cost-protein-results">
        <table className="cost-protein-table"><thead><tr><th>Ingredient</th><th>Basis</th><th>Protein</th><th>Calories</th><th>Cost</th><th>Cost / g protein</th></tr></thead><tbody>{rows.map((row) => <tr key={row.recordKey}><th scope="row">{row.name}</th><td aria-label={row.basis.status === 'available' ? row.basis.accessibleLabel : 'Unavailable'}>{basisText(row)}</td><td>{numberText(row.protein, 'g')}</td><td>{numberText(row.calories, 'kcal')}</td><td>{costText(row.cost)}</td><td className="cost-protein-emphasis" aria-label={accessibleCostPerGram(row.costPerGramProtein)}>{costPerGram(row.costPerGramProtein)}</td></tr>)}</tbody></table>
        <div className="cost-protein-mobile-list">{rows.map((row) => <article key={row.recordKey}><h2>{row.name}</h2><div className="cost-protein-mobile-metrics">{rowCells(row)}</div></article>)}</div>
      </div>}
    </div>
  </ScreenContainer>
}
export default CostProteinTableScreen
