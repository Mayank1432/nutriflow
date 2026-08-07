import { useEffect, useRef, useState, type ReactNode } from 'react'
import DailySummaryCard from '../components/DailySummaryCard'
import AddIngredientSheet, { type SaveAndAddResult } from '../components/AddIngredientSheet'
import { buildIngredientDefinition, type IngredientDefinitionDraft } from '../components/IngredientDefinitionForm'
import MealCard from '../components/MealCard'
import QuickAddSheet from '../components/QuickAddSheet'
import {
  sourceKey,
  type QuickAddDraft,
  type QuickAddSource,
} from '../components/QuickAddForm'
import ScreenContainer from '../components/ScreenContainer'
import SuccessToast from '../components/SuccessToast'
import MoveFoodEntrySheet from '../components/MoveFoodEntrySheet'
import PrototypeNotice from '../components/PrototypeNotice'
import TodayIngredients from '../components/TodayIngredients'
import { ActiveDailyStaples } from '../components/DailyStaples'
import type { Ingredient, MacroTotals, MealId, TodayData } from '../domain/types'
import {
  calculateFoodEntryTotals,
  calculateTodayTotals,
  createFreshTodayStore,
  getCanonicalValidHistoryDays,
  getLocalDateKey,
  parseStrictLocalDateKey,
  planTodayRollover,
  resolveLatestTodayForOperation,
  upsertTodayIntoHistory,
} from '../domain/historyIntegrity'

export { calculateTodayTotals } from '../domain/historyIntegrity'
import {
  readReactHistoryStore,
  readReactIngredientsStore,
  readReactDailyStaplesStore,
  readReactSettingsStore,
  readReactTodayStore,
  writeReactHistoryStore,
  writeReactIngredientsStore,
  writeReactTodayStore,
  type DailyStapleDefinition,
  type FoodEntry,
  type MealName,
  type ReactTodayStore,
} from '../storage'

const meals: Array<{ id: MealId; name: MealName }> = [
  { id: 'breakfast', name: 'Breakfast' },
  { id: 'lunch', name: 'Lunch' },
  { id: 'dinner', name: 'Dinner' },
  { id: 'snacks', name: 'Snacks' },
]

type MoveTarget = { sourceMealId: MealId; entryId: string; displayName: string }

const blankDraft = (mealId: MealId = 'breakfast'): QuickAddDraft => ({
  sourceKey: '',
  quantity: '',
  meal: meals.find((meal) => meal.id === mealId)?.name ?? 'Breakfast',
})

const safeNumber = (value: string | number | undefined): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const toMacroTotals = (totals: ReturnType<typeof calculateTodayTotals>): MacroTotals => ({
  p: totals.protein,
  k: totals.calories,
  carb: totals.carbs,
  fat: totals.fat,
  fibre: totals.fibre,
  c: totals.cost,
})

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

const toDisplayTodayData = (store: ReactTodayStore): TodayData => ({
  dateKey: store.date,
  meals: Object.fromEntries(meals.map(({ id, name }) => [
    id,
    {
      dishes: [{
        id: `react-today-${id}`,
        ingredients: store.meals[name].entries.map(toDisplayIngredient),
      }],
    },
  ])),
})

const createFoodEntry = (source: QuickAddSource, quantity: number): FoodEntry => {
  const timestamp = new Date().toISOString()

  return {
    id: globalThis.crypto?.randomUUID?.() ?? `today-${Date.now()}`,
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

const updateTodayStore = (
  current: ReactTodayStore,
  mealName: MealName,
  updateEntries: (entries: FoodEntry[]) => FoodEntry[],
): ReactTodayStore => {
  const updatedAt = new Date().toISOString()
  const nextStore: ReactTodayStore = {
    ...current,
    updatedAt,
    meals: {
      ...current.meals,
      [mealName]: {
        ...current.meals[mealName],
        entries: updateEntries(current.meals[mealName].entries),
      },
    },
  }

  return {
    ...nextStore,
    totals: calculateTodayTotals(nextStore),
  }
}

const normalizeTodayStore = (store: ReactTodayStore): ReactTodayStore => {
  const mealsChanged = meals.some(({ name }) => (
    store.meals[name].entries.some((entry) => (
      !Number.isFinite(entry.quantity) || entry.quantity <= 0
    ))
  ))
  if (!mealsChanged) return store

  const normalized: ReactTodayStore = {
    ...store,
    updatedAt: new Date().toISOString(),
    meals: Object.fromEntries(meals.map(({ name }) => [
      name,
      {
        ...store.meals[name],
        entries: store.meals[name].entries.filter((entry) => (
          Number.isFinite(entry.quantity) && entry.quantity > 0
        )),
      },
    ])) as ReactTodayStore['meals'],
  }
  return { ...normalized, totals: calculateTodayTotals(normalized) }
}

const deriveCurrentWeekCosts = (
  todayDateKey: string,
  liveTodayCost: number,
  savedDays: ReturnType<typeof getCanonicalValidHistoryDays>,
) => {
  const localToday = parseStrictLocalDateKey(todayDateKey) ?? new Date()
  const canonicalTodayKey = getLocalDateKey(localToday)
  const weekStart = new Date(localToday.getFullYear(), localToday.getMonth(), localToday.getDate())
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekStartKey = getLocalDateKey(weekStart)
  const pastHistoryCost = savedDays.filter((day) => (
    day.date >= weekStartKey && day.date < canonicalTodayKey
  )).reduce((sum, day) => (
    sum + (Number.isFinite(day.totals.cost) ? day.totals.cost : 0)
  ), 0)
  const safeTodayCost = Number.isFinite(liveTodayCost) ? liveTodayCost : 0
  const weeklyCost = safeTodayCost + pastHistoryCost

  return {
    todayCost: safeTodayCost,
    weeklyCost,
    averageDailyCost: weeklyCost / (localToday.getDay() + 1),
  }
}

type TodayScreenProps = {
  intent?: { type: 'quick-add' | 'today-ingredients'; token: number } | null
  onIntentConsumed?: (token: number) => void
  onOpenDailyStaples?: () => void
  onOpenIngredientLibrary?: () => void
  onQuickAddVisibilityChange?: (visible: boolean) => void
}

type RolloverRunResult = {
  outcome: 'current' | 'rolled' | 'reset' | 'blocked' | 'busy'
}

function TodayScreen({
  intent,
  onIntentConsumed,
  onOpenDailyStaples,
  onOpenIngredientLibrary,
  onQuickAddVisibilityChange,
}: TodayScreenProps) {
  const [todayStore, setTodayStore] = useState<ReactTodayStore | null>(null)
  const [todayInitialized, setTodayInitialized] = useState(false)
  const [isQuickAddOpen, setQuickAddOpen] = useState(false)
  const [isAddIngredientOpen, setAddIngredientOpen] = useState(false)
  const [selectedMealId, setSelectedMealId] = useState<MealId>('breakfast')
  const [quickAddDraft, setQuickAddDraft] = useState<QuickAddDraft>(() => blankDraft())
  const [quickAddError, setQuickAddError] = useState('')
  const [quickAddSources, setQuickAddSources] = useState<QuickAddSource[]>([])
  const [toastMessage, setToastMessage] = useState<ReactNode>(null)
  const [moveTarget, setMoveTarget] = useState<MoveTarget | null>(null)
  const [moveSubmitting, setMoveSubmitting] = useState(false)
  const todayIngredientsRef = useRef<HTMLDivElement>(null)
  const todayStoreRef = useRef<ReactTodayStore | null>(null)
  const initializationStartedRef = useRef(false)
  const rolloverSubmittingRef = useRef(false)
  const manualHistorySubmittingRef = useRef(false)
  const rolloverWarningRef = useRef('')
  const rolloverRunnerRef = useRef<() => RolloverRunResult>(() => ({ outcome: 'busy' }))
  const moveSubmittingRef = useRef(false)
  const moveOriginRef = useRef<HTMLButtonElement | null>(null)
  const mealTabRefs = useRef<Partial<Record<MealId, HTMLButtonElement | null>>>({})
  const saveAndAddSubmittingRef = useRef(false)
  const saveCostSubmittingRef = useRef(false)
  const skipNextTodayPersistenceRef = useRef(false)

  const adoptTodayStore = (nextToday: ReactTodayStore, skipPersistence = false) => {
    const stateChanged = todayStoreRef.current !== nextToday
    todayStoreRef.current = nextToday

    if (!stateChanged) {
      if (!skipPersistence) skipNextTodayPersistenceRef.current = false
      return
    }

    skipNextTodayPersistenceRef.current = skipPersistence
    setTodayStore(nextToday)
  }

  const showRolloverWarning = (key: string, message: string) => {
    if (rolloverWarningRef.current === key) return
    rolloverWarningRef.current = key
    setToastMessage(message)
  }

  const runRollover = (): RolloverRunResult => {
    if (rolloverSubmittingRef.current) return { outcome: 'busy' }
    rolloverSubmittingRef.current = true
    try {
      const persistedToday = normalizeTodayStore(readReactTodayStore())
      const inTabToday = todayStoreRef.current ?? persistedToday
      const authoritativeToday = resolveLatestTodayForOperation(persistedToday, inTabToday)
      const currentDateKey = getLocalDateKey()
      const plan = planTodayRollover(authoritativeToday, currentDateKey)

      if (plan.outcome === 'no_action_current') {
        if (todayStoreRef.current !== authoritativeToday) adoptTodayStore(authoritativeToday)
        return { outcome: 'current' }
      }

      if (plan.outcome === 'invalid_today_date') {
        adoptTodayStore(authoritativeToday)
        showRolloverWarning(
          `invalid:${authoritativeToday.date}:${authoritativeToday.updatedAt}`,
          'Today’s saved date could not be verified. Your data was not changed.',
        )
        return { outcome: 'blocked' }
      }

      if (plan.outcome === 'future_today_date') {
        adoptTodayStore(authoritativeToday)
        showRolloverWarning(
          `future:${authoritativeToday.date}:${authoritativeToday.updatedAt}`,
          'Today’s saved date is ahead of the device date. Your data was not changed.',
        )
        return { outcome: 'blocked' }
      }

      const operationTimestamp = new Date().toISOString()
      if (plan.outcome === 'reset_empty') {
        const freshToday = createFreshTodayStore(currentDateKey, operationTimestamp)
        if (!writeReactTodayStore(freshToday)) {
          adoptTodayStore(authoritativeToday)
          return { outcome: 'blocked' }
        }
        rolloverWarningRef.current = ''
        adoptTodayStore(freshToday, true)
        return { outcome: 'reset' }
      }

      const latestHistory = readReactHistoryStore()
      const upsert = upsertTodayIntoHistory(latestHistory, authoritativeToday, {
        savedAt: operationTimestamp,
        createId: () => globalThis.crypto?.randomUUID?.() ?? `history-${Date.now()}`,
      })
      if (!upsert.ok || !writeReactHistoryStore(upsert.store)) {
        adoptTodayStore(authoritativeToday)
        setToastMessage('Previous day could not be saved. Today was not reset.')
        return { outcome: 'blocked' }
      }

      const freshToday = createFreshTodayStore(currentDateKey, operationTimestamp)
      if (!writeReactTodayStore(freshToday)) {
        adoptTodayStore(authoritativeToday)
        setToastMessage('Previous day was saved, but Today could not be reset. Your entries are still available.')
        return { outcome: 'blocked' }
      }

      rolloverWarningRef.current = ''
      adoptTodayStore(freshToday, true)
      setToastMessage('Previous day saved to History.')
      return { outcome: 'rolled' }
    } finally {
      rolloverSubmittingRef.current = false
    }
  }

  rolloverRunnerRef.current = runRollover

  useEffect(() => {
    if (!todayInitialized || !todayStore) return
    if (skipNextTodayPersistenceRef.current) {
      skipNextTodayPersistenceRef.current = false
      return
    }
    writeReactTodayStore(todayStore)
  }, [todayInitialized, todayStore])

  useEffect(() => {
    if (initializationStartedRef.current) return
    initializationStartedRef.current = true
    rolloverRunnerRef.current()
    setTodayInitialized(true)
  }, [])

  useEffect(() => {
    if (!todayInitialized) return
    const onVisible = () => { if (document.visibilityState === 'visible') rolloverRunnerRef.current() }
    const onFocus = () => { rolloverRunnerRef.current() }
    let midnightTimeout = 0
    const scheduleMidnightCheck = () => {
      const now = new Date()
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      midnightTimeout = window.setTimeout(() => {
        rolloverRunnerRef.current()
        scheduleMidnightCheck()
      }, Math.max(1_000, nextMidnight.getTime() - now.getTime() + 1_000))
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onFocus)
    scheduleMidnightCheck()
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onFocus)
      window.clearTimeout(midnightTimeout)
    }
  }, [todayInitialized])

  useEffect(() => {
    onQuickAddVisibilityChange?.(isQuickAddOpen || isAddIngredientOpen || Boolean(moveTarget))
    return () => onQuickAddVisibilityChange?.(false)
  }, [isAddIngredientOpen, isQuickAddOpen, moveTarget, onQuickAddVisibilityChange])

  const persistUpdate = (
    mealName: MealName,
    updateEntries: (entries: FoodEntry[]) => FoodEntry[],
  ) => {
    const current = todayStoreRef.current
    if (!current) return
    const next = updateTodayStore(current, mealName, updateEntries)
    rolloverWarningRef.current = ''
    todayStoreRef.current = next
    setTodayStore(next)
  }

  const closeMoveSheet = (restoreFocus = true) => {
    setMoveTarget(null)
    if (restoreFocus) window.requestAnimationFrame(() => moveOriginRef.current?.focus())
  }

  const moveFoodEntry = (destinationMealId: MealId) => {
    if (!moveTarget || moveSubmittingRef.current) return { ok: false }
    moveSubmittingRef.current = true
    setMoveSubmitting(true)
    try {
      const sourceMeal = meals.find((meal) => meal.id === moveTarget.sourceMealId)
      const destinationMeal = meals.find((meal) => meal.id === destinationMealId)
      if (!sourceMeal || !destinationMeal) return { ok: false, message: 'This food could not be moved safely.', definitive: true }
      if (sourceMeal.id === destinationMeal.id) { closeMoveSheet(); return { ok: true } }

      const current = todayStoreRef.current
      if (!current) return { ok: false, message: 'Today data is still loading.' }
      const matches = meals.flatMap((meal) => current.meals[meal.name].entries.map((entry, index) => ({ meal, entry, index }))).filter(({ entry }) => entry.id === moveTarget.entryId)
      if (matches.length === 0) return { ok: false, message: `This food is no longer available in ${sourceMeal.name}.`, definitive: true }
      if (matches.length > 1) return { ok: false, message: 'This food could not be moved safely.', definitive: true }
      const match = matches[0]
      if (match.meal.id !== sourceMeal.id) return { ok: false, message: `This food is no longer available in ${sourceMeal.name}.`, definitive: true }

      const timestamp = new Date().toISOString()
      const sourceEntries = current.meals[sourceMeal.name].entries
      const nextBase: ReactTodayStore = {
        ...current,
        updatedAt: timestamp,
        meals: {
          ...current.meals,
          [sourceMeal.name]: { ...current.meals[sourceMeal.name], entries: sourceEntries.filter((_, index) => index !== match.index) },
          [destinationMeal.name]: { ...current.meals[destinationMeal.name], entries: [...current.meals[destinationMeal.name].entries, match.entry] },
        },
      }
      const nextToday = { ...nextBase, totals: calculateTodayTotals(nextBase) }
      if (!writeReactTodayStore(nextToday)) return { ok: false, message: 'The move could not be saved. Try again.' }

      skipNextTodayPersistenceRef.current = true
      rolloverWarningRef.current = ''
      todayStoreRef.current = nextToday
      setTodayStore(nextToday)
      setSelectedMealId(destinationMealId)
      setMoveTarget(null)
      const entryTotals = calculateFoodEntryTotals(match.entry)
      setToastMessage(<span className="success-toast-content"><strong>{match.entry.name} moved to {destinationMeal.name}</strong><small>{match.entry.quantity} {match.entry.unit} · {entryTotals.protein.toFixed(1)}g Protein · {entryTotals.calories.toFixed(0)} kcal · ₹{entryTotals.cost.toFixed(0)}</small></span>)
      window.requestAnimationFrame(() => mealTabRefs.current[destinationMealId]?.focus())
      return { ok: true }
    } finally {
      moveSubmittingRef.current = false
      setMoveSubmitting(false)
    }
  }

  const openQuickAdd = (mealId: MealId) => {
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
    setToastMessage('')
  }

  useEffect(() => {
    if (!intent) return
    if (intent.type === 'quick-add') openQuickAdd(selectedMealId)
    if (intent.type === 'today-ingredients') {
      todayIngredientsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      todayIngredientsRef.current?.focus({ preventScroll: true })
    }
    onIntentConsumed?.(intent.token)
  }, [intent, onIntentConsumed, selectedMealId])

  const addIngredient = (action: 'more' | 'return') => {
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

    if (source.kind === 'ingredient') {
      const currentIngredient = readReactIngredientsStore().ingredients.find((item) => (
        item.id === source.item.id && !item.archived
      ))
      if (!currentIngredient) {
        setQuickAddError('This ingredient is no longer available. Select another food.')
        return
      }
    }

    const entry = createFoodEntry(source, quantity)
    const entryTotals = calculateFoodEntryTotals(entry)
    persistUpdate(
      quickAddDraft.meal,
      (entries) => [...entries, entry],
    )
    setToastMessage(
      <span className="success-toast-content">
        <strong>✓ {entry.name} added</strong>
        <span>to {quickAddDraft.meal}</span>
        <small>{entryTotals.protein.toFixed(1)}g Protein · {entryTotals.calories.toFixed(0)} kcal · ₹{entryTotals.cost.toFixed(0)}</small>
      </span>,
    )
    setQuickAddError('')
    if (action === 'return') {
      setQuickAddOpen(false)
      setQuickAddDraft(blankDraft())
    }
  }

  const saveQuickAddCost = (ingredientId: string, amount: number) => {
    if (saveCostSubmittingRef.current) {
      return { ok: false, message: 'Cost save is already in progress.' }
    }
    if (!Number.isFinite(amount) || amount < 0) {
      return { ok: false, message: 'Price must be a finite, non-negative number.' }
    }
    saveCostSubmittingRef.current = true
    try {
      const latestStore = readReactIngredientsStore()
      const latestDefinition = latestStore.ingredients.find((item) => (
        item.id === ingredientId && !item.archived
      ))
      if (!latestDefinition) {
        return { ok: false, message: 'This ingredient is no longer available.' }
      }
      const timestamp = new Date().toISOString()
      const updatedDefinition = {
        ...latestDefinition,
        cost: {
          amount,
          currency: latestDefinition.cost?.currency ?? 'INR',
        },
        updatedAt: timestamp,
      }
      const nextStore = {
        ...latestStore,
        updatedAt: timestamp,
        ingredients: latestStore.ingredients.map((item) => (
          item.id === ingredientId ? updatedDefinition : item
        )),
      }
      if (!writeReactIngredientsStore(nextStore)) {
        return { ok: false, message: 'Cost could not be saved.' }
      }
      setQuickAddSources((current) => current.map((source) => (
        source.kind === 'ingredient' && source.item.id === ingredientId
          ? { kind: 'ingredient', item: updatedDefinition }
          : source
      )))
      return { ok: true, message: 'Cost updated.' }
    } finally {
      saveCostSubmittingRef.current = false
    }
  }

  const saveAndAddIngredient = (draft: IngredientDefinitionDraft): SaveAndAddResult => {
    if (saveAndAddSubmittingRef.current) {
      return { status: 'failure', message: 'Save & Add is already in progress.' }
    }
    saveAndAddSubmittingRef.current = true
    const targetMealId = selectedMealId
    const targetMeal = meals.find((meal) => meal.id === targetMealId) ?? meals[0]

    try {
      const timestamp = new Date().toISOString()
      const result = buildIngredientDefinition(draft, {
        timestamp,
        createId: () => globalThis.crypto?.randomUUID?.() ?? `ingredient-${Date.now()}`,
      })
      if (!result.ok) return { status: 'failure', message: result.error }

      const definition = result.definition
      const entry = createFoodEntry({ kind: 'ingredient', item: definition }, definition.defaultQuantity)
      const currentIngredients = readReactIngredientsStore()
      const nextIngredients = {
        ...currentIngredients,
        updatedAt: timestamp,
        ingredients: [...currentIngredients.ingredients, definition],
      }
      if (!writeReactIngredientsStore(nextIngredients)) {
        return { status: 'failure', message: 'Ingredient could not be saved.' }
      }

      const currentToday = todayStoreRef.current
      if (!currentToday) return { status: 'failure', message: 'Today data is still loading.' }
      const nextToday = updateTodayStore(
        currentToday,
        targetMeal.name,
        (entries) => [...entries, entry],
      )
      if (!writeReactTodayStore(nextToday)) {
        return {
          status: 'partial',
          message: `${definition.name} was saved to Ingredient Library, but could not be added to ${targetMeal.name}.`,
        }
      }

      skipNextTodayPersistenceRef.current = true
      rolloverWarningRef.current = ''
      todayStoreRef.current = nextToday
      setTodayStore(nextToday)
      setAddIngredientOpen(false)
      const entryTotals = calculateFoodEntryTotals(entry)
      setToastMessage(
        <span className="success-toast-content">
          <strong>✓ {entry.name} created and added</strong>
          <span>to {targetMeal.name}</span>
          <small>{entryTotals.protein.toFixed(1)}g Protein · {entryTotals.calories.toFixed(0)} kcal · ₹{entryTotals.cost.toFixed(0)}</small>
        </span>,
      )
      return { status: 'success', message: `${definition.name} saved and added.` }
    } finally {
      saveAndAddSubmittingRef.current = false
    }
  }

  const updateQuantity = (mealName: MealName, entryId: string, quantity: number) => {
    if (!Number.isFinite(quantity) || quantity <= 0) return
    const updatedAt = new Date().toISOString()
    persistUpdate(mealName, (entries) => entries.map((entry) => (
      entry.id === entryId
        ? { ...entry, quantity, updatedAt }
        : entry
    )))
  }

  const removeIngredient = (mealName: MealName, entryId: string) => {
    persistUpdate(
      mealName,
      (entries) => entries.filter((entry) => entry.id !== entryId),
    )
    setToastMessage('Item removed.')
  }

  const addStapleToToday = (staple: DailyStapleDefinition) => {
    const timestamp = new Date().toISOString()
    persistUpdate(staple.defaultMeal, (entries) => [...entries, {
      id: globalThis.crypto?.randomUUID?.() ?? `today-${Date.now()}`,
      ingredientId: staple.ingredientId,
      stapleId: staple.id,
      name: staple.name,
      quantity: staple.defaultQuantity,
      unit: staple.unit,
      basisType: staple.basisType,
      nutritionSnapshot: structuredClone(staple.nutrition),
      costSnapshot: staple.cost ? structuredClone(staple.cost) : undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    }])
    setToastMessage(`Added ${staple.name} to ${staple.defaultMeal}.`)
  }

  const saveTodayToHistory = () => {
    if (manualHistorySubmittingRef.current) return
    manualHistorySubmittingRef.current = true
    try {
      const rolloverResult = rolloverRunnerRef.current()
      if (rolloverResult.outcome !== 'current') return

      const persistedToday = normalizeTodayStore(readReactTodayStore())
      const inTabToday = todayStoreRef.current ?? persistedToday
      const authoritativeToday = resolveLatestTodayForOperation(persistedToday, inTabToday)
      if (planTodayRollover(authoritativeToday, getLocalDateKey()).outcome !== 'no_action_current') return

      const savedAt = new Date().toISOString()
      const upsert = upsertTodayIntoHistory(readReactHistoryStore(), authoritativeToday, {
        savedAt,
        createId: () => globalThis.crypto?.randomUUID?.() ?? `history-${Date.now()}`,
      })
      if (!upsert.ok || !writeReactHistoryStore(upsert.store)) {
        setToastMessage('Could not save Today to History.')
        return
      }
      setToastMessage(upsert.outcome === 'created'
        ? 'Today saved to History.'
        : 'Today’s History record was updated.')
    } finally {
      manualHistorySubmittingRef.current = false
    }
  }

  if (!todayInitialized || !todayStore) {
    return <ScreenContainer title="Today" subtitle="Track your meals and hit your protein goal."><p>Checking Today data…</p></ScreenContainer>
  }

  const totals = calculateTodayTotals(todayStore)
  const todayData = toDisplayTodayData(todayStore)
  const selectedMeal = meals.find((meal) => meal.id === selectedMealId) ?? meals[0]
  const historyDays = getCanonicalValidHistoryDays(readReactHistoryStore().savedDays)
  const proteinTrend = [...historyDays]
    .slice(0, 7)
    .reverse()
    .map((day) => ({ id: day.id, date: day.date, protein: day.totals.protein }))
  const currentWeekCosts = deriveCurrentWeekCosts(todayStore.date, totals.cost, historyDays)
  const macroGoals = readReactSettingsStore().macroGoals

  return (
    <ScreenContainer
      title="Today"
      subtitle="Track your meals and hit your protein goal."
      showDateRow
      dateLabel={todayStore.date}
    >
      <div className="today-dashboard">
        <PrototypeNotice>React Today data is stored locally on this device.</PrototypeNotice>
        <DailySummaryCard
          totals={toMacroTotals(totals)}
          proteinTrend={proteinTrend}
          proteinGoal={macroGoals.protein}
          caloriesGoal={macroGoals.calories}
          todayCost={currentWeekCosts.todayCost}
          weeklyCost={currentWeekCosts.weeklyCost}
          averageDailyCost={currentWeekCosts.averageDailyCost}
        />
        <button className="secondary-action today-history-button" type="button" onClick={saveTodayToHistory}>
          Save Today to History
        </button>
        <ActiveDailyStaples onAdd={addStapleToToday} />
        <div className="today-section-heading">
          <div>
            <p className="eyebrow">Your day</p>
            <h2>Meals</h2>
          </div>
          <span>Choose one meal</span>
        </div>
        <div className="meal-selector" role="tablist" aria-label="Today meals">
          {meals.map((meal) => (
            <button
              key={meal.id}
              type="button"
              role="tab"
              ref={(node) => { mealTabRefs.current[meal.id] = node }}
              aria-selected={selectedMealId === meal.id}
              className={selectedMealId === meal.id ? `selected ${meal.id}` : meal.id}
              onClick={() => setSelectedMealId(meal.id)}
            >
              <span aria-hidden="true">{selectedMealId === meal.id ? '✓' : '•'}</span>
              {meal.name}
            </button>
          ))}
        </div>
        <div className="today-meals">
          <MealCard
            key={selectedMeal.id}
            mealId={selectedMeal.id}
            mealName={selectedMeal.name}
            todayData={todayData}
            variant="selected"
            emptyMessage={`Create something new or choose an existing food for ${selectedMeal.name}.`}
            onAddIngredient={() => setAddIngredientOpen(true)}
            onQuickAdd={() => openQuickAdd(selectedMeal.id)}
            onQuantityChange={(entryId, qty) => updateQuantity(selectedMeal.name, entryId, qty)}
            onRemove={(entryId) => removeIngredient(selectedMeal.name, entryId)}
            onMove={(entryId, trigger) => { moveOriginRef.current = trigger; setMoveTarget({ sourceMealId: selectedMeal.id, entryId, displayName: trigger.getAttribute('aria-label')?.replace('More actions for ', '') || 'Food' }) }}
          />
        </div>
        <div ref={todayIngredientsRef} tabIndex={-1} className="today-ingredients-target">
          <TodayIngredients
            todayStore={todayStore}
            onQuantityCommit={updateQuantity}
            onRemove={removeIngredient}
          />
        </div>
      </div>
      {isQuickAddOpen && (
        <QuickAddSheet
          draft={quickAddDraft}
          sources={quickAddSources}
          error={quickAddError}
          onChange={setQuickAddDraft}
          onClose={() => setQuickAddOpen(false)}
          onOpenDailyStaples={onOpenDailyStaples ? () => {
            setQuickAddOpen(false)
            onOpenDailyStaples()
          } : undefined}
          onOpenIngredientLibrary={onOpenIngredientLibrary ? () => {
            setQuickAddOpen(false)
            onOpenIngredientLibrary()
          } : undefined}
          onSubmit={addIngredient}
          onSaveCost={saveQuickAddCost}
        />
      )}
      {isAddIngredientOpen && (
        <AddIngredientSheet
          mealName={selectedMeal.name}
          onClose={() => setAddIngredientOpen(false)}
          onSaveAndAdd={saveAndAddIngredient}
        />
      )}
      {moveTarget && (() => {
        const sourceMeal = meals.find((meal) => meal.id === moveTarget.sourceMealId)!
        const entry = todayStore.meals[sourceMeal.name].entries.find((item) => item.id === moveTarget.entryId)
        return <MoveFoodEntrySheet foodName={entry?.name ?? moveTarget.displayName} quantity={entry?.quantity ?? 0} unit={entry?.unit ?? ''} sourceMealName={sourceMeal.name} destinations={meals.filter((meal) => meal.id !== sourceMeal.id)} submitting={moveSubmitting} onCancel={() => closeMoveSheet(true)} onMove={moveFoodEntry} />
      })()}
      <SuccessToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </ScreenContainer>
  )
}

export default TodayScreen
