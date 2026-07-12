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
import PrototypeNotice from '../components/PrototypeNotice'
import TodayIngredients from '../components/TodayIngredients'
import { ActiveDailyStaples } from '../components/DailyStaples'
import type { Ingredient, MacroTotals, MealId, TodayData } from '../domain/types'
import {
  readReactHistoryStore,
  readReactIngredientsStore,
  readReactDailyStaplesStore,
  readReactSettingsStore,
  readReactTodayStore,
  writeReactHistoryStore,
  writeReactIngredientsStore,
  writeReactTodayStore,
  type DailyTotals,
  type DailyStapleDefinition,
  type FoodEntry,
  type HistoryDay,
  type MealName,
  type ReactTodayStore,
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

const safeNumber = (value: string | number | undefined): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const calculateEntryTotals = (entry: FoodEntry): DailyTotals => {
  const factor = entry.basisType === 'per_100'
    ? entry.quantity / 100
    : entry.quantity

  return {
    protein: entry.nutritionSnapshot.protein * factor,
    calories: entry.nutritionSnapshot.calories * factor,
    carbs: entry.nutritionSnapshot.carbs * factor,
    fat: entry.nutritionSnapshot.fat * factor,
    fibre: entry.nutritionSnapshot.fibre * factor,
    cost: (entry.costSnapshot?.amount ?? 0) * factor,
  }
}

export const calculateTodayTotals = (store: ReactTodayStore): DailyTotals =>
  meals.reduce<DailyTotals>((dayTotals, meal) => (
    store.meals[meal.name].entries.reduce<DailyTotals>((totals, entry) => {
      const entryTotals = calculateEntryTotals(entry)
      return {
        protein: totals.protein + entryTotals.protein,
        calories: totals.calories + entryTotals.calories,
        carbs: totals.carbs + entryTotals.carbs,
        fat: totals.fat + entryTotals.fat,
        fibre: totals.fibre + entryTotals.fibre,
        cost: totals.cost + entryTotals.cost,
      }
    }, dayTotals)
  ), {
    protein: 0,
    calories: 0,
    carbs: 0,
    fat: 0,
    fibre: 0,
    cost: 0,
  })

const toMacroTotals = (totals: DailyTotals): MacroTotals => ({
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

const parseLocalDateKey = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
    ? date
    : null
}

const toLocalDateKey = (date: Date): string => {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const preferredHistoryDay = (current: HistoryDay, candidate: HistoryDay): HistoryDay => {
  const currentSavedAt = Date.parse(current.savedAt)
  const candidateSavedAt = Date.parse(candidate.savedAt)
  const currentIsValid = Number.isFinite(currentSavedAt)
  const candidateIsValid = Number.isFinite(candidateSavedAt)

  if (candidateIsValid !== currentIsValid) return candidateIsValid ? candidate : current
  if (candidateIsValid && currentIsValid && candidateSavedAt !== currentSavedAt) {
    return candidateSavedAt > currentSavedAt ? candidate : current
  }
  return candidate.id > current.id ? candidate : current
}

const deriveCurrentWeekCosts = (
  todayDateKey: string,
  liveTodayCost: number,
  savedDays: HistoryDay[],
) => {
  const localToday = parseLocalDateKey(todayDateKey) ?? new Date()
  const canonicalTodayKey = toLocalDateKey(localToday)
  const weekStart = new Date(localToday.getFullYear(), localToday.getMonth(), localToday.getDate())
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekStartKey = toLocalDateKey(weekStart)
  const selectedByDate = new Map<string, HistoryDay>()

  for (const day of [...savedDays]) {
    if (!parseLocalDateKey(day.date)) continue
    if (day.date < weekStartKey || day.date >= canonicalTodayKey) continue
    const current = selectedByDate.get(day.date)
    selectedByDate.set(day.date, current ? preferredHistoryDay(current, day) : day)
  }

  const pastHistoryCost = [...selectedByDate.values()].reduce((sum, day) => (
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

function TodayScreen({
  intent,
  onIntentConsumed,
  onOpenDailyStaples,
  onOpenIngredientLibrary,
  onQuickAddVisibilityChange,
}: TodayScreenProps) {
  const [todayStore, setTodayStore] = useState<ReactTodayStore>(
    () => normalizeTodayStore(readReactTodayStore()),
  )
  const [isQuickAddOpen, setQuickAddOpen] = useState(false)
  const [isAddIngredientOpen, setAddIngredientOpen] = useState(false)
  const [selectedMealId, setSelectedMealId] = useState<MealId>('breakfast')
  const [quickAddDraft, setQuickAddDraft] = useState<QuickAddDraft>(() => blankDraft())
  const [quickAddError, setQuickAddError] = useState('')
  const [quickAddSources, setQuickAddSources] = useState<QuickAddSource[]>([])
  const [toastMessage, setToastMessage] = useState<ReactNode>(null)
  const todayIngredientsRef = useRef<HTMLDivElement>(null)
  const saveAndAddSubmittingRef = useRef(false)
  const skipNextTodayPersistenceRef = useRef(false)
  const totals = calculateTodayTotals(todayStore)
  const todayData = toDisplayTodayData(todayStore)
  const selectedMeal = meals.find((meal) => meal.id === selectedMealId) ?? meals[0]
  const historyDays = [...readReactHistoryStore().savedDays]
  const proteinTrend = [...historyDays]
    .sort((left, right) => right.savedAt.localeCompare(left.savedAt))
    .slice(0, 7)
    .reverse()
    .map((day) => ({ id: day.id, date: day.date, protein: day.totals.protein }))
  const currentWeekCosts = deriveCurrentWeekCosts(todayStore.date, totals.cost, historyDays)
  const macroGoals = readReactSettingsStore().macroGoals

  useEffect(() => {
    if (skipNextTodayPersistenceRef.current) {
      skipNextTodayPersistenceRef.current = false
      return
    }
    writeReactTodayStore(todayStore)
  }, [todayStore])

  useEffect(() => {
    onQuickAddVisibilityChange?.(isQuickAddOpen || isAddIngredientOpen)
    return () => onQuickAddVisibilityChange?.(false)
  }, [isAddIngredientOpen, isQuickAddOpen, onQuickAddVisibilityChange])

  const persistUpdate = (
    mealName: MealName,
    updateEntries: (entries: FoodEntry[]) => FoodEntry[],
  ) => {
    setTodayStore((current) => updateTodayStore(current, mealName, updateEntries))
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
    const entryTotals = calculateEntryTotals(entry)
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

      const nextToday = updateTodayStore(
        todayStore,
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
      setTodayStore(nextToday)
      setAddIngredientOpen(false)
      const entryTotals = calculateEntryTotals(entry)
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
    const savedAt = new Date().toISOString()
    const historyDay: HistoryDay = {
      id: globalThis.crypto?.randomUUID?.() ?? `history-${Date.now()}`,
      date: todayStore.date,
      savedAt,
      meals: structuredClone(todayStore.meals),
      totals: structuredClone(calculateTodayTotals(todayStore)),
    }
    const currentHistory = readReactHistoryStore()
    const nextHistory = {
      ...currentHistory,
      updatedAt: savedAt,
      savedDays: [...currentHistory.savedDays, historyDay]
        .sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
      deletedDays: currentHistory.deletedDays ?? [],
    }

    setToastMessage(
      writeReactHistoryStore(nextHistory)
        ? 'Today saved to History.'
        : 'Could not save Today to History.',
    )
  }

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
        />
      )}
      {isAddIngredientOpen && (
        <AddIngredientSheet
          mealName={selectedMeal.name}
          onClose={() => setAddIngredientOpen(false)}
          onSaveAndAdd={saveAndAddIngredient}
        />
      )}
      <SuccessToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </ScreenContainer>
  )
}

export default TodayScreen
