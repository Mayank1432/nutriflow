import { useEffect, useState } from 'react'
import DailySummaryCard from '../components/DailySummaryCard'
import MealCard from '../components/MealCard'
import QuickAddSheet from '../components/QuickAddSheet'
import type { QuickAddDraft } from '../components/QuickAddForm'
import ScreenContainer from '../components/ScreenContainer'
import SuccessToast from '../components/SuccessToast'
import PrototypeNotice from '../components/PrototypeNotice'
import TodayIngredients from '../components/TodayIngredients'
import type { Ingredient, MacroTotals, MealId, TodayData } from '../domain/types'
import {
  readReactHistoryStore,
  readReactTodayStore,
  writeReactHistoryStore,
  writeReactTodayStore,
  type DailyTotals,
  type FoodEntry,
  type HistoryDay,
  type MealName,
  type NutritionBasisType,
  type ReactTodayStore,
  type ServingUnit,
} from '../storage'

const meals: Array<{ id: MealId; name: MealName }> = [
  { id: 'breakfast', name: 'Breakfast' },
  { id: 'lunch', name: 'Lunch' },
  { id: 'dinner', name: 'Dinner' },
  { id: 'snacks', name: 'Snacks' },
]

const blankDraft = (mealId: MealId = 'breakfast'): QuickAddDraft => ({
  mealId,
  name: '',
  qty: '100',
  unit: 'g',
  protein: '',
  calories: '',
  carbs: '',
  fat: '',
  fibre: '',
  cost: '',
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

const createFoodEntry = (draft: QuickAddDraft): FoodEntry => {
  const quantity = Math.max(0, safeNumber(draft.qty))
  const unit = draft.unit as ServingUnit
  const basisType: NutritionBasisType =
    unit === 'g' || unit === 'ml' ? 'per_100' : 'per_unit'
  const quantityFactor = basisType === 'per_100' ? quantity / 100 : quantity
  const snapshotDivisor = quantityFactor > 0 ? quantityFactor : 1
  const timestamp = new Date().toISOString()

  return {
    id: globalThis.crypto?.randomUUID?.() ?? `today-${Date.now()}`,
    name: draft.name.trim() || 'Unnamed food',
    quantity,
    unit,
    basisType,
    nutritionSnapshot: {
      protein: safeNumber(draft.protein) / snapshotDivisor,
      calories: safeNumber(draft.calories) / snapshotDivisor,
      carbs: safeNumber(draft.carbs) / snapshotDivisor,
      fat: safeNumber(draft.fat) / snapshotDivisor,
      fibre: safeNumber(draft.fibre) / snapshotDivisor,
    },
    costSnapshot: {
      amount: safeNumber(draft.cost) / snapshotDivisor,
      currency: 'INR',
    },
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
  const [toastMessage, setToastMessage] = useState('')
  const totals = calculateTodayTotals(todayStore)
  const todayData = toDisplayTodayData(todayStore)

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
    setQuickAddDraft(blankDraft(mealId))
    setQuickAddOpen(true)
    setToastMessage('')
  }

  const addIngredient = () => {
    const entry = createFoodEntry(quickAddDraft)
    const meal = meals.find(({ id }) => id === quickAddDraft.mealId)
    if (!meal) return

    persistUpdate(meal.name, (entries) => [...entries, entry])
    setToastMessage(`Added to ${meal.name}.`)
    setQuickAddOpen(false)
    setQuickAddDraft(blankDraft())
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
    <ScreenContainer title="Today" subtitle="Track your meals and hit your protein goal.">
      <PrototypeNotice>React Today data is stored locally on this device.</PrototypeNotice>
      <button className="today-quick-add-button" type="button" onClick={() => openQuickAdd('breakfast')}>
        <span aria-hidden="true">+</span>
        Quick Add
      </button>
      <button className="secondary-action" type="button" onClick={saveTodayToHistory}>
        Save Today to History
      </button>
      <DailySummaryCard totals={toMacroTotals(totals)} />
      <div className="today-meals">
        {meals.map((meal) => (
          <MealCard
            key={meal.id}
            mealId={meal.id}
            mealName={meal.name}
            todayData={todayData}
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
      {isQuickAddOpen && (
        <QuickAddSheet
          draft={quickAddDraft}
          onChange={setQuickAddDraft}
          onClose={() => setQuickAddOpen(false)}
          onSubmit={addIngredient}
        />
      )}
      <SuccessToast message={toastMessage} />
    </ScreenContainer>
  )
}

export default TodayScreen
