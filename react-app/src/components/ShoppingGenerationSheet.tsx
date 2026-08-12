import { useEffect, useMemo, useRef, useState } from 'react'
import { buildShoppingGenerationPreview, type ShoppingGenerationCandidate, type ShoppingGenerationSources } from '../domain/shoppingGeneration'
import type { ReactDailyStaplesStore, ReactPantryStore, ReactShoppingStore, ReactWeeklyStore, ShoppingGeneratedSnapshot } from '../storage'

type Props = {
  weekly: ReactWeeklyStore
  staples: ReactDailyStaplesStore
  pantry: ReactPantryStore
  shopping: ReactShoppingStore
  onConfirm: (selected: readonly ShoppingGenerationCandidate[]) => { ok: boolean; message: string }
  onCancel: () => void
}

const labels = { weekly: 'Weekly Planner', dailyStaple: 'Daily Staples', pantry: 'Low-stock Pantry' } as const
const context = (generated: ShoppingGeneratedSnapshot) => {
  if (generated.weekly) return `${generated.weekly.quantity} ${generated.weekly.unit} · Weekly Planner`
  if (generated.dailyStaple) return `${generated.dailyStaple.quantity} ${generated.dailyStaple.unit} · Daily Staples`
  if (generated.pantry) return `${generated.pantry.quantityInStock} ${generated.pantry.unit} left · Low-stock Pantry`
  return ''
}

function ShoppingGenerationSheet({ weekly, staples, pantry, shopping, onConfirm, onCancel }: Props) {
  const [phase, setPhase] = useState<'sources' | 'preview'>('sources')
  const [sources, setSources] = useState<ShoppingGenerationSources>({ weekly: true, dailyStaple: true, pantry: true })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const dialogRef = useRef<HTMLElement>(null)
  const candidates = useMemo(() => buildShoppingGenerationPreview(sources, weekly, staples.staples, pantry.pantryItems, shopping.shoppingItems), [sources, weekly, staples, pantry, shopping])
  const selectedCandidates = candidates.filter((candidate) => selected.has(candidate.key) && candidate.match !== 'active')

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>('input:not(:disabled), button:not(:disabled)')?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onCancel(); return }
      if (event.key !== 'Tab') return
      const controls = [...(dialogRef.current?.querySelectorAll<HTMLElement>('input:not(:disabled), button:not(:disabled)') ?? [])]
      if (!controls.length) return
      const first = controls[0]; const last = controls.at(-1)!
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [onCancel, phase])

  const beginPreview = () => {
    if (!Object.values(sources).some(Boolean)) { setError('Choose at least one source.'); return }
    const initial = new Set(candidates.filter((candidate) => candidate.match === 'new').map((candidate) => candidate.key))
    setSelected(initial); setError(''); setPhase('preview')
  }
  const toggleSource = (source: keyof ShoppingGenerationSources) => setSources({ ...sources, [source]: !sources[source] })
  const toggleCandidate = (candidate: ShoppingGenerationCandidate) => setSelected((current) => {
    const next = new Set(current); if (next.has(candidate.key)) next.delete(candidate.key); else next.add(candidate.key); return next
  })
  const selectNew = () => setSelected((current) => new Set([...current].filter((key) => candidates.some((candidate) => candidate.key === key && candidate.match === 'completed')).concat(candidates.filter((candidate) => candidate.match === 'new').map((candidate) => candidate.key))))
  const noResultMessage = () => {
    const enabled = Object.entries(sources).filter(([, enabled]) => enabled).map(([source]) => source)
    if (enabled.length === 1 && enabled[0] === 'weekly') return 'No Weekly Planner items available to add.'
    if (enabled.length === 1 && enabled[0] === 'dailyStaple') return 'No Daily Staples available to add.'
    if (enabled.length === 1 && enabled[0] === 'pantry') return 'No Pantry items are marked Low stock.'
    return 'Nothing to generate'
  }
  const allActive = candidates.length > 0 && candidates.every((candidate) => candidate.match === 'active')
  const allCompleted = candidates.length > 0 && candidates.every((candidate) => candidate.match === 'completed')

  return <div className="shopping-generation-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
    <section ref={dialogRef} className="shopping-generation-sheet" role="dialog" aria-modal="true" aria-labelledby="shopping-generation-title">
      <header className="shopping-generation-heading"><div><p className="eyebrow">Generate Shopping List</p><h2 id="shopping-generation-title">{phase === 'sources' ? 'Choose sources' : 'Review items'}</h2></div><button type="button" className="sheet-close" aria-label="Close Generate Shopping List" onClick={onCancel}>×</button></header>
      {phase === 'sources' ? <>
        <p>Select one or more places to generate suggestions from.</p>
        <fieldset className="shopping-generation-sources"><legend>Sources</legend>{(Object.keys(labels) as (keyof typeof labels)[]).map((source) => <label key={source}><input type="checkbox" checked={sources[source]} onChange={() => toggleSource(source)} /><span><strong>{labels[source]}</strong><small>{source === 'weekly' ? 'Planned meal entries' : source === 'dailyStaple' ? 'Active reusable staples' : 'Items marked Low stock'}</small></span></label>)}</fieldset>
        {error && <p className="shopping-generation-error" role="alert">{error}</p>}
        <div className="shopping-generation-actions"><button type="button" className="secondary-action" onClick={onCancel}>Cancel</button><button type="button" className="primary-action" onClick={beginPreview}>Preview items</button></div>
      </> : <>
        <div className="shopping-generation-toolbar"><button type="button" className="text-action" onClick={selectNew}>Select all available</button><button type="button" className="text-action" onClick={() => setSelected(new Set())}>Deselect all</button></div>
        {candidates.length === 0 ? <div className="shopping-generation-empty"><strong>{noResultMessage()}</strong></div> : allActive ? <div className="shopping-generation-empty"><strong>Everything is already on your Shopping List.</strong></div> : <>
          {allCompleted && <p className="shopping-generation-note">These items were previously marked Bought. Select any you want to add again.</p>}
          <div className="shopping-generation-list">{candidates.map((candidate) => <label className={`shopping-generation-row is-${candidate.match}`} key={candidate.key}><input type="checkbox" disabled={candidate.match === 'active'} checked={selected.has(candidate.key)} onChange={() => toggleCandidate(candidate)} /><span><strong>{candidate.name}</strong><small>{context(candidate.generated)}</small><em>{candidate.match === 'active' ? 'Already on list' : candidate.match === 'completed' ? 'Previously bought' : 'New'}</em></span></label>)}</div>
        </>}
        {error && <p className="shopping-generation-error" role="alert">{error}</p>}
        <div className="shopping-generation-actions"><button type="button" className="secondary-action" onClick={() => { setPhase('sources'); setError('') }}>Back</button><button type="button" className="primary-action" disabled={selectedCandidates.length === 0} onClick={() => { const result = onConfirm(selectedCandidates); if (!result.ok) setError(result.message) }}>Add {selectedCandidates.length} item{selectedCandidates.length === 1 ? '' : 's'}</button></div>
      </>}
    </section>
  </div>
}
export default ShoppingGenerationSheet
