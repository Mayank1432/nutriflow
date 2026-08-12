import { useEffect, useRef, useState, type FormEvent } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import { clearCompletedShoppingItems, createShoppingItem, deriveShoppingSections, normalizeShoppingName, toggleShoppingItemCompleted } from '../domain/shopping'
import { readReactShoppingStore, writeReactShoppingStore, type ShoppingItem } from '../storage'

function ShoppingScreen() {
  const [shopping, setShopping] = useState(() => readReactShoppingStore())
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const checkboxRefs = useRef(new Map<string, HTMLInputElement>())
  const pendingFocusItemId = useRef<string | null>(null)
  const pendingClearFocus = useRef<'active' | 'empty' | null>(null)
  const activeHeadingRef = useRef<HTMLHeadingElement>(null)
  const emptyHeadingRef = useRef<HTMLHeadingElement>(null)
  const { activeItems, completedItems } = deriveShoppingSections(shopping.shoppingItems)

  useEffect(() => {
    if (pendingFocusItemId.current) {
      checkboxRefs.current.get(pendingFocusItemId.current)?.focus()
      pendingFocusItemId.current = null
    }
    if (pendingClearFocus.current === 'active') activeHeadingRef.current?.focus()
    if (pendingClearFocus.current === 'empty') emptyHeadingRef.current?.focus()
    pendingClearFocus.current = null
  }, [shopping])

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

  const renderRow = (item: ShoppingItem) => <article className={`shopping-row${item.completed ? ' is-completed' : ''}`} key={item.id}>
    <label><input ref={(node) => { if (node) checkboxRefs.current.set(item.id, node); else checkboxRefs.current.delete(item.id) }} type="checkbox" checked={item.completed} onChange={(event) => toggleItem(item.id, event.target.checked)} aria-label={`${item.completed ? 'Bought' : 'To buy'}: ${item.name}`} /><span><strong>{item.name}</strong><small>{item.completed ? 'Bought' : 'To buy'}</small></span></label>
    <span className="shopping-dots" aria-hidden="true">•••</span>
  </article>

  return <ScreenContainer title="Shopping List" subtitle="Keep a simple list of things you need to buy.">
    <div className="shopping-screen">
      <form className="shopping-add" noValidate onSubmit={addItem}>
        <label htmlFor="shopping-name">Shopping item</label>
        <div><input ref={inputRef} id="shopping-name" value={draft} placeholder="What do you need?" aria-invalid={!!error} aria-describedby={error ? 'shopping-name-error' : undefined} onChange={(event) => { setDraft(event.target.value); setError('') }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} /><button className="primary-action" type="submit" aria-label="Add Shopping item">+</button></div>
        {error && <p className="shopping-error" id="shopping-name-error" role="alert">{error}</p>}
      </form>
      <p className="shopping-feedback" role="status" aria-live="polite">{feedback}</p>
      {shopping.shoppingItems.length === 0 ? <section className="shopping-empty"><h2 ref={emptyHeadingRef} tabIndex={-1}>Shopping List is empty</h2><p>Add something you need to buy.</p></section> : <>
        <section className="shopping-section" aria-labelledby="shopping-active-title"><div className="shopping-section-heading"><h2 ref={activeHeadingRef} tabIndex={-1} id="shopping-active-title">TO BUY</h2></div>{activeItems.length ? <div className="shopping-list">{activeItems.map(renderRow)}</div> : <div className="shopping-empty compact"><strong>Everything is checked off</strong><p>You have no items left to buy.</p></div>}</section>
        {completedItems.length > 0 && <section className="shopping-section" aria-labelledby="shopping-completed-title"><div className="shopping-section-heading"><h2 id="shopping-completed-title">COMPLETED</h2><button type="button" className="secondary-action" onClick={clearCompleted}>Clear completed</button></div><div className="shopping-list">{completedItems.map(renderRow)}</div></section>}
      </>}
    </div>
  </ScreenContainer>
}
export default ShoppingScreen
