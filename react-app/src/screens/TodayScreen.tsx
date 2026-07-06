import { useEffect, useState } from 'react'
import DailySummaryCard from '../components/DailySummaryCard'
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

function TodayScreen() {
  const [todayStore, setTodayStore] = useState<ReactTodayStore>(
    () => normalizeTodayStore(readReactTodayStore()),
  )
  const [isQuickAddOpen, setQuickAddOpen] = useState(false)
  const [quickAddDraft, setQuickAddDraft] = useState<QuickAddDraft>(() => blankDraft())
  const [quickAddError, setQuickAddError] = useState('')
  const [quickAddSources, setQuickAddSources] = useState<QuickAddSource[]>([])
  const [toastMessage, setToastMessage] = useState('')
  const totals = calculateTodayTotals(todayStore)
  const todayData = toDisplayTodayData(todayStore)
  const proteinTrend = [...readReactHistoryStore().savedDays]
    .sort((left, right) => right.savedAt.localeCompare(left.savedAt))
    .slice(0, 7)
    .reverse()
    .map((day) => ({ id: day.id, date: day.date, protein: day.totals.protein }))
  const macroGoals = readReactSettingsStore().macroGoals

  useEffect(() => {
    writeReactTodayStore(todayStore)
  }, [todayStore])

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

    persistUpdate(
      quickAddDraft.meal,
      (entries) => [...entries, createFoodEntry(source, quantity)],
    )
    setToastMessage(`Added ${source.item.name} to ${quickAddDraft.meal}.`)
    setQuickAddError('')
    if (action === 'return') {
      setQuickAddOpen(false)
      setQuickAddDraft(blankDraft())
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
        />
        <button className="today-quick-add-button" type="button" onClick={() => openQuickAdd('breakfast')}>
          <span aria-hidden="true">+</span>
          Quick Add
        </button>
        <button className="secondary-action today-history-button" type="button" onClick={saveTodayToHistory}>
          Save Today to History
        </button>
        <ActiveDailyStaples onAdd={addStapleToToday} />
        <div className="today-section-heading">
          <div>
            <p className="eyebrow">Your day</p>
            <h2>Meals</h2>
          </div>
          <span>4 meal groups</span>
        </div>
        <div className="today-meals">
          {meals.map((meal) => (
            <MealCard
              key={meal.id}
              mealId={meal.id}
              mealName={meal.name}
              todayData={todayData}
              emptyMessage="Start building this meal with Quick Add."
              onAdd={() => openQuickAdd(meal.id)}
              onQuantityChange={(entryId, qty) => updateQuantity(meal.name, entryId, qty)}
              onRemove={(entryId) => removeIngredient(meal.name, entryId)}
            />
          ))}
        </div>
        <TodayIngredients
          todayStore={todayStore}
          onQuantityCommit={updateQuantity}
          onRemove={removeIngredient}
        />
      </div>
      {isQuickAddOpen && (
        <QuickAddSheet
          draft={quickAddDraft}
          sources={quickAddSources}
          error={quickAddError}
          onChange={setQuickAddDraft}
          onClose={() => setQuickAddOpen(false)}
          onSubmit={addIngredient}
        />
      )}
      <SuccessToast message={toastMessage} onDismiss={() => setToastMessage('')} />
    </ScreenContainer>
  )
}

export default TodayScreen
