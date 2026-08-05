import { useEffect, useRef, useState } from 'react'
import type { MealId } from '../domain/types'

type Destination = { id: MealId; name: string }
type MoveResult = { ok: boolean; message?: string; definitive?: boolean }

type MoveFoodEntrySheetProps = {
  foodName: string
  quantity: number
  unit: string
  sourceMealName: string
  destinations: Destination[]
  submitting: boolean
  onCancel: () => void
  onMove: (destinationMealId: MealId) => MoveResult
}

function MoveFoodEntrySheet({ foodName, quantity, unit, sourceMealName, destinations, submitting, onCancel, onMove }: MoveFoodEntrySheetProps) {
  const [destination, setDestination] = useState<MealId | null>(null)
  const [error, setError] = useState('')
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLInputElement>('input[type="radio"]')?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onCancel()
      if (event.key !== 'Tab') return
      const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>('input:not(:disabled), button:not(:disabled)') ?? [])]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel, submitting])

  const submit = () => {
    if (!destination || submitting) return
    const result = onMove(destination)
    if (!result.ok) {
      setError(result.message ?? 'This food could not be moved.')
      if (result.definitive) setDestination(null)
    }
  }

  return (
    <div className="move-food-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !submitting) onCancel()
    }}>
      <section ref={dialogRef} className="move-food-sheet" role="dialog" aria-modal="true" aria-labelledby="move-food-title" aria-describedby="move-food-context">
        <div><p className="eyebrow">Move food</p><h2 id="move-food-title">Move {foodName}</h2></div>
        <p id="move-food-context">{quantity} {unit} · Currently in {sourceMealName}</p>
        <fieldset>
          <legend>Move to</legend>
          {destinations.map((meal) => (
            <label key={meal.id}>
              <input type="radio" name="move-destination" value={meal.id} checked={destination === meal.id} disabled={submitting} onChange={() => { setDestination(meal.id); setError('') }} aria-label={`Move ${foodName} to ${meal.name}`} />
              <span>{meal.name}</span>
            </label>
          ))}
        </fieldset>
        {error && <p className="move-food-error" role="alert">{error}</p>}
        <div className="move-food-actions"><button className="secondary-action" type="button" disabled={submitting} onClick={onCancel}>Cancel</button><button className="primary-action" type="button" disabled={!destination || submitting} onClick={submit}>{submitting ? 'Moving…' : 'Move'}</button></div>
      </section>
    </div>
  )
}

export default MoveFoodEntrySheet
