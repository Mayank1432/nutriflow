import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import EmptyHistoryState from '../components/EmptyHistoryState'
import HistorySummaryCard from '../components/HistorySummaryCard'
import SavedDayList from '../components/SavedDayList'
import ScreenContainer from '../components/ScreenContainer'
import SelectedHistoryDetail from '../components/SelectedHistoryDetail'
import SuccessToast from '../components/SuccessToast'
import QuickAddSheet from '../components/QuickAddSheet'
import DeleteDayConfirm from '../components/DeleteDayConfirm'
import {
  sourceKey,
  type QuickAddDraft,
  type QuickAddSource,
} from '../components/QuickAddForm'
import { calcHistorySummary } from '../domain/historyMock'
import {
  addHistoryEntry,
  changeHistoryEntryQuantity,
  permanentlyDeleteHistoryDay,
  removeHistoryEntry,
  restoreHistoryDay,
  softDeleteHistoryDay,
} from '../domain/historyEdit'
import { calculateFoodEntryTotals } from '../domain/historyIntegrity'
import type {
  Ingredient,
  MealId,
  MockHistoryData,
  MockSavedDay,
  TodayData,
} from '../domain/types'
import PrototypeNotice from '../components/PrototypeNotice'
import {
  readReactDailyStaplesStore,
  readReactHistoryStore,
  readReactIngredientsStore,
  writeReactHistoryStore,
  type FoodEntry,
  type HistoryDay,
  type MealName,
  type ReactHistoryStore,
} from '../storage'

const meals: Array<{ id: MealId; name: MealName }> = [
  { id: 'breakfast', name: 'Breakfast' },
  { id: 'lunch', name: 'Lunch' },
  { id: 'dinner', name: 'Dinner' },
  { id: 'snacks', name: 'Snacks' },
]

const blankDraft = (mealId: MealId = 'breakfast'): QuickAddDraft => ({
  sourceKey: '',
  quantity: '',
  meal: meals.find((meal) => meal.id === mealId)?.name ?? 'Breakfast',
})

const createFoodEntry = (source: QuickAddSource, quantity: number): FoodEntry => {
  const timestamp = new Date().toISOString()

  return {
    id: globalThis.crypto?.randomUUID?.() ?? `history-${Date.now()}`,
    ingredientId: source.kind === 'ingredient'
      ? source.item.id
      : source.item.ingredientId,
    stapleId: source.kind === 'staple' ? source.item.id : undefined,
    name: source.item.name,
    quantity,
    unit: source.kind === 'ingredient' ? source.item.defaultUnit : source.item.unit,
    basisType: source.item.basisType,
    nutritionSnapshot: structuredClone(source.item.nutrition),
    costSnapshot: source.item.cost ? structuredClone(source.item.cost) : undefined,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

const toDisplayIngredient = (entry: FoodEntry): Ingredient => {
  if (entry.basisType === 'per_unit') {
    return {
      id: entry.id,
      name: entry.name,
      qty: entry.quantity,
      unit: entry.unit,
      entryMode: 'enteredQuantity',
      baseQty: 1,
      baseProtein: entry.nutritionSnapshot.protein,
      baseCalories: entry.nutritionSnapshot.calories,
      baseCarbs: entry.nutritionSnapshot.carbs,
      baseFat: entry.nutritionSnapshot.fat,
      baseFibre: entry.nutritionSnapshot.fibre,
      baseCost: entry.costSnapshot?.amount ?? 0,
    }
  }

  return {
    id: entry.id,
    name: entry.name,
    qty: entry.quantity,
    unit: entry.unit,
    pr100: entry.nutritionSnapshot.protein,
    kc100: entry.nutritionSnapshot.calories,
    carb100: entry.nutritionSnapshot.carbs,
    fat100: entry.nutritionSnapshot.fat,
    fibre100: entry.nutritionSnapshot.fibre,
    pp100: entry.costSnapshot?.amount ?? 0,
  }
}

const toTodayData = (day: HistoryDay): TodayData => ({
  dateKey: day.date,
  meals: Object.fromEntries(meals.map(({ id, name }) => [
    id,
    {
      dishes: [{
        id: `react-history-${day.id}-${id}`,
        ingredients: day.meals[name].entries.map(toDisplayIngredient),
      }],
    },
  ])),
})

const formatDate = (date: string): string => {
  const parsed = new Date(`${date}T00:00:00`)
  return Number.isNaN(parsed.getTime())
    ? date
    : new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(parsed)
}

const formatDayName = (date: string): string => {
  const parsed = new Date(`${date}T00:00:00`)
  return Number.isNaN(parsed.getTime())
    ? 'Saved day'
    : new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(parsed)
}

const formatSavedAt = (savedAt: string): string => {
  const parsed = new Date(savedAt)
  return Number.isNaN(parsed.getTime())
    ? savedAt
    : `Saved ${new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(parsed)}`
}

const toMockSavedDay = (day: HistoryDay): MockSavedDay => {
  const todayData = toTodayData(day)
  return {
    id: day.id,
    dateLabel: formatDate(day.date),
    dayName: formatDayName(day.date),
    savedAtLabel: formatSavedAt(day.savedAt),
    statusBadge: day.totals.protein >= 120 ? 'High protein' : 'Partial day',
    meals: todayData.meals,
  }
}

function HistoryScreen() {
  const [historyStore, setHistoryStore] = useState<ReactHistoryStore>(() => readReactHistoryStore())
  const [historyView, setHistoryView] = useState<'list' | 'detail'>('list')
  const [selectedHistoryId, setSelectedHistoryId] = useState('')
  const [editError, setEditError] = useState('')
  const [restoreError, setRestoreError] = useState('')
  const [toastMessage, setToastMessage] = useState<ReactNode>(null)
  const [isQuickAddOpen, setQuickAddOpen] = useState(false)
  const [quickAddDraft, setQuickAddDraft] = useState<QuickAddDraft>(() => blankDraft())
  const [quickAddError, setQuickAddError] = useState('')
  const [quickAddSources, setQuickAddSources] = useState<QuickAddSource[]>([])
  const [permanentDeleteTargetId, setPermanentDeleteTargetId] = useState('')
  const [permanentDeleteSubmitting, setPermanentDeleteSubmitting] = useState(false)
  const [permanentDeleteError, setPermanentDeleteError] = useState('')
  const listScrollYRef = useRef(0)
  const originDayIdRef = useRef('')
  const detailHeadingRef = useRef<HTMLHeadingElement>(null)

  const historyData: MockHistoryData = useMemo(() => ({
    savedDays: [...historyStore.savedDays]
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
      .map(toMockSavedDay),
  }), [historyStore])

  const deletedDays: MockSavedDay[] = useMemo(() => (
    [...(historyStore.deletedDays ?? [])]
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
      .map(toMockSavedDay)
  ), [historyStore])

  const permanentDeleteTarget = deletedDays.find((day) => day.id === permanentDeleteTargetId)
  const selectedDay = historyData.savedDays.find((day) => day.id === selectedHistoryId)
  const summary = calcHistorySummary(historyData)

  useEffect(() => {
    if (historyView === 'detail' && !selectedDay) {
      setSelectedHistoryId('')
      setHistoryView('list')
    }
  }, [historyView, selectedDay])

  const openSavedDay = (dayId: string) => {
    listScrollYRef.current = window.scrollY
    originDayIdRef.current = dayId
    setSelectedHistoryId(dayId)
    setHistoryView('detail')
    setEditError('')
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
      detailHeadingRef.current?.focus({ preventScroll: true })
    })
  }

  const returnToHistory = () => {
    setHistoryView('list')
    setSelectedHistoryId('')
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      document.getElementById(`saved-day-card-${originDayIdRef.current}`)?.focus({ preventScroll: true })
      window.scrollTo({ top: listScrollYRef.current, behavior: 'auto' })
    }))
  }

  const handleQuantityChange = (mealId: MealId, entryId: string, quantity: number) => {
    const mealName = meals.find((meal) => meal.id === mealId)?.name
    if (!mealName) return
    const result = changeHistoryEntryQuantity(
      historyStore,
      selectedHistoryId,
      mealName,
      entryId,
      quantity,
      new Date().toISOString(),
    )
    if (!result.ok || !writeReactHistoryStore(result.store)) {
      setEditError('That change could not be saved. Try again.')
      return
    }
    setEditError('')
    setHistoryStore(result.store)
  }

  const handleRemove = (mealId: MealId, entryId: string) => {
    const mealName = meals.find((meal) => meal.id === mealId)?.name
    if (!mealName) return
    const result = removeHistoryEntry(
      historyStore,
      selectedHistoryId,
      mealName,
      entryId,
      new Date().toISOString(),
    )
    if (!result.ok || !writeReactHistoryStore(result.store)) {
      setEditError('That change could not be saved. Try again.')
      return
    }
    setEditError('')
    setHistoryStore(result.store)
    setToastMessage('Item removed.')
  }

  const handleDeleteDay = (): { ok: boolean; message?: string } => {
    const result = softDeleteHistoryDay(historyStore, selectedHistoryId, new Date().toISOString())
    if (!result.ok || !writeReactHistoryStore(result.store)) {
      return { ok: false, message: 'That day could not be deleted. Try again.' }
    }
    setHistoryStore(result.store)
    setToastMessage('Day deleted. Restore it from Recently deleted if needed.')
    return { ok: true }
  }

  const handleRestoreDay = (dayId: string) => {
    const result = restoreHistoryDay(historyStore, dayId, new Date().toISOString())
    if (!result.ok) {
      setRestoreError(
        result.reason === 'date_conflict'
          ? 'A day is already saved for that date. Remove or edit it before restoring this one.'
          : 'That day could not be restored. Try again.',
      )
      return
    }
    if (!writeReactHistoryStore(result.store)) {
      setRestoreError('That day could not be restored. Try again.')
      return
    }
    setRestoreError('')
    setHistoryStore(result.store)
    setToastMessage('Day restored.')
  }

  const confirmPermanentDelete = () => {
    setPermanentDeleteSubmitting(true)
    const result = permanentlyDeleteHistoryDay(historyStore, permanentDeleteTargetId, new Date().toISOString())
    setPermanentDeleteSubmitting(false)
    if (!result.ok || !writeReactHistoryStore(result.store)) {
      setPermanentDeleteError('That day could not be deleted. Try again.')
      return
    }
    setHistoryStore(result.store)
    setPermanentDeleteError('')
    setPermanentDeleteTargetId('')
    setToastMessage('Day permanently deleted.')
  }

  const openHistoryQuickAdd = (mealId: MealId) => {
    setQuickAddSources([
      ...readReactIngredientsStore().ingredients
        .filter((ingredient) => !ingredient.archived)
        .map((item): QuickAddSource => ({ kind: 'ingredient', item })),
      ...readReactDailyStaplesStore().staples
        .filter((staple) => !staple.isArchived)
        .map((item): QuickAddSource => ({ kind: 'staple', item })),
    ])
    setQuickAddDraft(blankDraft(mealId))
    setQuickAddOpen(true)
    setQuickAddError('')
  }

  const submitHistoryQuickAdd = (action: 'more' | 'return') => {
    const source = quickAddSources.find((candidate) => (
      sourceKey(candidate) === quickAddDraft.sourceKey
    ))
    const quantity = Number(quickAddDraft.quantity)
    if (!source) {
      setQuickAddError('Select an item to add.')
      return
    }
    if (
      quickAddDraft.quantity.trim() === ''
      || !Number.isFinite(quantity)
      || quantity <= 0
    ) {
      setQuickAddError('Quantity must be a positive finite number.')
      return
    }
    if (!meals.some(({ name }) => name === quickAddDraft.meal)) {
      setQuickAddError('Select a valid meal.')
      return
    }

    const entry = createFoodEntry(source, quantity)
    const entryTotals = calculateFoodEntryTotals(entry)
    const result = addHistoryEntry(
      historyStore,
      selectedHistoryId,
      quickAddDraft.meal,
      entry,
      new Date().toISOString(),
    )
    if (!result.ok || !writeReactHistoryStore(result.store)) {
      setQuickAddError('That item could not be saved. Try again.')
      return
    }
    setHistoryStore(result.store)
    setQuickAddError('')
    setToastMessage(
      <span className="success-toast-content">
        <strong>✓ {entry.name} added</strong>
        <span>to {quickAddDraft.meal}</span>
        <small>{entryTotals.protein.toFixed(1)}g Protein · {entryTotals.calories.toFixed(0)} kcal · ₹{entryTotals.cost.toFixed(0)}</small>
      </span>,
    )
    if (action === 'return') {
      setQuickAddOpen(false)
      setQuickAddDraft(blankDraft())
    }
  }

  return (
    <ScreenContainer title="History" subtitle="Review your saved days and nutrition snapshots.">
      <PrototypeNotice>Saved days can now be corrected: use Edit day to fix a quantity, add a missing item, remove one, or delete the whole day.</PrototypeNotice>
      {historyData.savedDays.length === 0 && deletedDays.length === 0 ? (
        <EmptyHistoryState />
      ) : historyView === 'detail' && selectedDay ? (
        <>
          {editError && <p className="history-edit-error" role="alert">{editError}</p>}
          <SelectedHistoryDetail
            day={selectedDay}
            headingRef={detailHeadingRef}
            onBack={returnToHistory}
            onQuantityChange={handleQuantityChange}
            onRemove={handleRemove}
            onOpenQuickAdd={openHistoryQuickAdd}
            onDeleteDay={handleDeleteDay}
          />
        </>
      ) : (
        <>
          <HistorySummaryCard summary={summary} />
          {historyData.savedDays.length > 0 && (
            <SavedDayList days={historyData.savedDays} onSelect={openSavedDay} />
          )}
          {deletedDays.length > 0 && (
            <section className="deleted-day-list" aria-labelledby="deleted-days-title">
              <div className="history-section-heading">
                <h2 id="deleted-days-title">Recently deleted</h2>
                <span>{deletedDays.length} {deletedDays.length === 1 ? 'day' : 'days'}</span>
              </div>
              {restoreError && <p className="history-edit-error" role="alert">{restoreError}</p>}
              <ul className="deleted-day-cards">
                {deletedDays.map((day) => (
                  <li key={day.id} className="deleted-day-card">
                    <div>
                      <strong>{day.dateLabel}</strong>
                      <span>{day.dayName}</span>
                    </div>
                    <div className="deleted-day-actions">
                      <button className="secondary-action" type="button" onClick={() => handleRestoreDay(day.id)}>Restore</button>
                      <button
                        className="danger-action"
                        type="button"
                        onClick={() => { setPermanentDeleteError(''); setPermanentDeleteTargetId(day.id) }}
                      >
                        Delete permanently
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
      {isQuickAddOpen && (
        <QuickAddSheet
          draft={quickAddDraft}
          sources={quickAddSources}
          error={quickAddError}
          onChange={setQuickAddDraft}
          onClose={() => setQuickAddOpen(false)}
          onSubmit={submitHistoryQuickAdd}
          onSaveCost={() => ({ ok: false, message: 'Edit ingredient cost from the Ingredient Library.' })}
        />
      )}
      {permanentDeleteTarget && (
        <DeleteDayConfirm
          title={`Permanently delete ${permanentDeleteTarget.dayName}, ${permanentDeleteTarget.dateLabel}?`}
          body="This cannot be undone. The saved day and its foods will be removed for good."
          confirmLabel="Delete Permanently"
          pendingLabel="Deleting…"
          submitting={permanentDeleteSubmitting}
          error={permanentDeleteError}
          onCancel={() => { setPermanentDeleteTargetId(''); setPermanentDeleteError('') }}
          onConfirm={confirmPermanentDelete}
        />
      )}
      <SuccessToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </ScreenContainer>
  )
}

export default HistoryScreen