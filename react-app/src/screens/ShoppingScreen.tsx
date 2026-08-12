import { useEffect, useRef, useState, type FormEvent } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import ShoppingGenerationSheet from '../components/ShoppingGenerationSheet'
import { clearCompletedShoppingItems, createShoppingItem, deriveShoppingSections, normalizeShoppingName, toggleShoppingItemCompleted } from '../domain/shopping'
import { planShoppingGeneration, type ShoppingGenerationCandidate } from '../domain/shoppingGeneration'
import { deriveShoppingActiveSubset, deriveShoppingCostRows, shoppingCostReasonLabel, summarizeShoppingEstimate, type ShoppingCostResult, type ShoppingFilter } from '../domain/shoppingCostEstimate'
import { readReactDailyStaplesStore, readReactIngredientsStore, readReactPantryStore, readReactShoppingStore, readReactWeeklyStore, writeReactShoppingStore, type ShoppingGeneratedSnapshot, type ShoppingItem } from '../storage'
import { formatPriceAmount } from '../utils/priceDisplay'

function ShoppingScreen() {
  const [shopping, setShopping] = useState(() => readReactShoppingStore())
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [generatorOpen, setGeneratorOpen] = useState(false)
  const [generationSources, setGenerationSources] = useState<null | { weekly: ReturnType<typeof readReactWeeklyStore>; staples: ReturnType<typeof readReactDailyStaplesStore>; pantry: ReturnType<typeof readReactPantryStore>; shopping: ReturnType<typeof readReactShoppingStore> }>(null)
  const [ingredients] = useState(() => readReactIngredientsStore().ingredients)
  const [filter, setFilter] = useState<ShoppingFilter>('all')
  const [unpricedOpen, setUnpricedOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const checkboxRefs = useRef(new Map<string, HTMLInputElement>())
  const pendingFocusItemId = useRef<string | null>(null)
  const pendingClearFocus = useRef<'active' | 'empty' | null>(null)
  const activeHeadingRef = useRef<HTMLHeadingElement>(null)
  const emptyHeadingRef = useRef<HTMLHeadingElement>(null)
  const generateButtonRef = useRef<HTMLButtonElement>(null)
  const proteinFilterRef = useRef<HTMLInputElement>(null)
  const { activeItems, completedItems } = deriveShoppingSections(shopping.shoppingItems)
  const visibleActiveItems = deriveShoppingActiveSubset(activeItems, ingredients, filter)
  const costRows = deriveShoppingCostRows(visibleActiveItems, ingredients)
  const costById = new Map(costRows.map((row) => [row.item.id, row.cost]))
  const estimate = summarizeShoppingEstimate(costRows)
  const unpricedRows = costRows.filter((row) => row.cost.status === 'unpriced')

  useEffect(() => {
    if (pendingFocusItemId.current) {
      const checkbox = checkboxRefs.current.get(pendingFocusItemId.current)
      if (checkbox) checkbox.focus()
      else if (filter === 'protein') (visibleActiveItems.length ? activeHeadingRef.current : proteinFilterRef.current)?.focus()
      pendingFocusItemId.current = null
    }
    if (pendingClearFocus.current === 'active') activeHeadingRef.current?.focus()
    if (pendingClearFocus.current === 'empty') emptyHeadingRef.current?.focus()
    pendingClearFocus.current = null
  }, [shopping, filter, visibleActiveItems.length])

  const addItem = (event: FormEvent) => {
    event.preventDefault()
    const name = normalizeShoppingName(draft)
    if (!name) { setError('Enter an item to add.'); setFeedback(''); return }
    const latest = readReactShoppingStore()
    const timestamp = new Date().toISOString()
    const item = createShoppingItem(name, timestamp, () => globalThis.crypto?.randomUUID?.() ?? `shopping-${Date.now()}`)
    const updated = { ...latest, updatedAt: timestamp, shoppingItems: [...latest.shoppingItems, item] }
    if (!writeReactShoppingStore(updated)) { setError('Shopping List could not be saved. Try again.'); return }
    setShopping(updated); setDraft(''); setError(''); setFeedback(`${name} added.`)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const toggleItem = (id: string, completed: boolean) => {
    const latest = readReactShoppingStore()
    const current = latest.shoppingItems.find((item) => item.id === id)
    if (!current) { setShopping(latest); setFeedback('That Shopping item is no longer available.'); return }
    if (current.completed === completed) { setShopping(latest); return }
    const timestamp = new Date().toISOString()
    const items = toggleShoppingItemCompleted(latest.shoppingItems, id, completed, timestamp)
    const updated = { ...latest, updatedAt: timestamp, shoppingItems: [...items] }
    if (!writeReactShoppingStore(updated)) { setFeedback('Shopping List could not be updated.'); return }
    pendingFocusItemId.current = id
    setShopping(updated); setFeedback(`${current.name} marked ${completed ? 'Bought' : 'To buy'}.`)
  }

  const clearCompleted = () => {
    const latest = readReactShoppingStore()
    const items = clearCompletedShoppingItems(latest.shoppingItems)
    if (items === latest.shoppingItems) { setShopping(latest); return }
    const updated = { ...latest, updatedAt: new Date().toISOString(), shoppingItems: [...items] }
    if (!writeReactShoppingStore(updated)) { setFeedback('Completed items could not be cleared.'); return }
    pendingClearFocus.current = updated.shoppingItems.length ? 'active' : 'empty'
    setShopping(updated); setFeedback('Completed items cleared.')
  }

  const openGenerator = () => {
    setFeedback('')
    setGenerationSources({ weekly: readReactWeeklyStore(), staples: readReactDailyStaplesStore(), pantry: readReactPantryStore(), shopping: readReactShoppingStore() })
    setGeneratorOpen(true)
  }
  const closeGenerator = () => {
    setGeneratorOpen(false); setGenerationSources(null)
    requestAnimationFrame(() => generateButtonRef.current?.focus())
  }
  const confirmGeneration = (selected: readonly ShoppingGenerationCandidate[]) => {
    const latest = readReactShoppingStore()
    const timestamp = new Date().toISOString()
    const plan = planShoppingGeneration(latest, selected, timestamp, () => globalThis.crypto?.randomUUID?.() ?? `shopping-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    if (!plan.added.length) {
      setShopping(latest); setGeneratorOpen(false); setGenerationSources(null); setFeedback('No items were added because the Shopping List changed.')
      requestAnimationFrame(() => (latest.shoppingItems.some((item) => !item.completed) ? activeHeadingRef.current : emptyHeadingRef.current)?.focus())
      return { ok: true, message: '' }
    }
    if (!writeReactShoppingStore(plan.store)) return { ok: false, message: 'Generated items could not be saved. Try again.' }
    pendingClearFocus.current = 'active'
    setShopping(plan.store); setGeneratorOpen(false); setGenerationSources(null)
    setFeedback(`${plan.added.length} generated item${plan.added.length === 1 ? '' : 's'} added${plan.skipped.length ? `; ${plan.skipped.length} skipped because the list changed` : ''}.`)
    return { ok: true, message: '' }
  }

  const generatedContext = (generated: ShoppingGeneratedSnapshot) => generated.weekly ? `${generated.weekly.quantity} ${generated.weekly.unit} · Weekly Planner` : generated.dailyStaple ? `${generated.dailyStaple.quantity} ${generated.dailyStaple.unit} · Daily Staples` : generated.pantry ? `${generated.pantry.quantityInStock} ${generated.pantry.unit} left · Low-stock Pantry` : ''

  const renderRow = (item: ShoppingItem) => {
    const cost: ShoppingCostResult | undefined = item.completed ? undefined : costById.get(item.id)
    return <article className={`shopping-row${item.completed ? ' is-completed' : ''}`} key={item.id}>
    <label><input ref={(node) => { if (node) checkboxRefs.current.set(item.id, node); else checkboxRefs.current.delete(item.id) }} type="checkbox" checked={item.completed} onChange={(event) => toggleItem(item.id, event.target.checked)} aria-label={`${item.completed ? 'Bought' : 'To buy'}: ${item.name}`} /><span><strong>{item.name}</strong>{item.generated && <small>{generatedContext(item.generated)}</small>}{cost && (cost.status === 'priced' ? <small className="shopping-row-cost" aria-label={`Estimated ${formatPriceAmount(cost.estimatedCost).slice(1)} rupees`}>{formatPriceAmount(cost.estimatedCost)} est.</small> : <small className="shopping-row-cost is-unavailable">Cost unavailable · {shoppingCostReasonLabel(cost.reason)}</small>)}<small>{item.completed ? 'Bought' : 'To buy'}</small></span></label>
    <span className="shopping-dots" aria-hidden="true">•••</span>
  </article> }

  return <ScreenContainer title="Shopping List" subtitle="Keep a simple list of things you need to buy.">
    <div className="shopping-screen">
      <form className="shopping-add" noValidate onSubmit={addItem}>
        <label htmlFor="shopping-name">Shopping item</label>
        <div><input ref={inputRef} id="shopping-name" value={draft} placeholder="What do you need?" aria-invalid={!!error} aria-describedby={error ? 'shopping-name-error' : undefined} onChange={(event) => { setDraft(event.target.value); setError('') }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} /><button className="primary-action" type="submit" aria-label="Add Shopping item">+</button></div>
        {error && <p className="shopping-error" id="shopping-name-error" role="alert">{error}</p>}
      </form>
      <button ref={generateButtonRef} type="button" className="secondary-action shopping-generate" onClick={openGenerator}>Generate Shopping List</button>
      <p className="shopping-feedback" role="status" aria-live="polite">{feedback}</p>
      {estimate.totalActiveCount > 0 && <section className="shopping-estimate" aria-labelledby="shopping-estimate-title">
        <div><h2 id="shopping-estimate-title">{estimate.pricedActiveCount ? 'Shopping estimate' : 'Shopping cost unavailable'}</h2>{estimate.pricedActiveCount > 0 && <strong aria-label={`Estimated ${formatPriceAmount(estimate.estimatedTotal).slice(1)} rupees`}>{formatPriceAmount(estimate.estimatedTotal)} est.</strong>}</div>
        {estimate.pricedActiveCount ? <p>{estimate.pricedActiveCount} of {estimate.totalActiveCount} items priced</p> : <p>No active items have enough quantity and price data to estimate cost.</p>}
        {estimate.unpricedActiveCount > 0 && estimate.pricedActiveCount > 0 && <p>{estimate.unpricedActiveCount} item{estimate.unpricedActiveCount === 1 ? '' : 's'} not included in estimate</p>}
        {unpricedRows.length > 0 && <><button type="button" className="shopping-unpriced-toggle" aria-expanded={unpricedOpen} aria-controls="shopping-unpriced-list" onClick={() => setUnpricedOpen(!unpricedOpen)}>Why are some items unpriced?</button>{unpricedOpen && <ul id="shopping-unpriced-list">{unpricedRows.map((row) => <li key={row.item.id}><strong>{row.item.name}</strong> — {row.cost.status === 'unpriced' && shoppingCostReasonLabel(row.cost.reason)}</li>)}</ul>}</>}
      </section>}
      <fieldset className="shopping-filter"><legend>Shopping view</legend><label><input type="radio" name="shopping-filter" value="all" checked={filter === 'all'} onChange={() => { setFilter('all'); setUnpricedOpen(false) }} /><span>All Shopping</span></label><label><input ref={proteinFilterRef} type="radio" name="shopping-filter" value="protein" checked={filter === 'protein'} onChange={() => { setFilter('protein'); setUnpricedOpen(false) }} /><span>Protein-focused</span></label></fieldset>
      {shopping.shoppingItems.length === 0 ? <section className="shopping-empty"><h2 ref={emptyHeadingRef} tabIndex={-1}>Shopping List is empty</h2><p>Add something you need to buy.</p></section> : <>
        <section className="shopping-section" aria-labelledby="shopping-active-title"><div className="shopping-section-heading"><h2 ref={activeHeadingRef} tabIndex={-1} id="shopping-active-title">TO BUY</h2></div>{visibleActiveItems.length ? <div className="shopping-list">{visibleActiveItems.map(renderRow)}</div> : <div className="shopping-empty compact"><strong>{activeItems.length ? 'No protein-focused items to buy' : 'Everything is checked off'}</strong><p>{activeItems.length ? 'Switch to All Shopping to see every active item.' : 'You have no items left to buy.'}</p></div>}</section>
        {completedItems.length > 0 && <section className="shopping-section" aria-labelledby="shopping-completed-title"><div className="shopping-section-heading"><h2 id="shopping-completed-title">COMPLETED</h2><button type="button" className="secondary-action" onClick={clearCompleted}>Clear completed</button></div><div className="shopping-list">{completedItems.map(renderRow)}</div></section>}
      </>}
    </div>
    {generatorOpen && generationSources && <ShoppingGenerationSheet {...generationSources} onConfirm={confirmGeneration} onCancel={closeGenerator} />}
  </ScreenContainer>
}
export default ShoppingScreen
