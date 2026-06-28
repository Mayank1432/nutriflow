import { useState } from 'react'
import DailySummaryCard from '../components/DailySummaryCard'
import MealCard from '../components/MealCard'
import QuickAddSheet from '../components/QuickAddSheet'
import type { QuickAddDraft } from '../components/QuickAddForm'
import ScreenContainer from '../components/ScreenContainer'
import SuccessToast from '../components/SuccessToast'
import PrototypeNotice from '../components/PrototypeNotice'
import { mockTodayPrototype } from '../domain/fixtures'
import {
  calcAll,
  createEnteredQuantityIngredient,
  updateEnteredQuantityIngredientQty,
} from '../domain/nutrition'
import type { Ingredient, MealId, TodayData } from '../domain/types'

const meals: Array<{ id: MealId; name: string }> = [
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

function updateMealIngredients(
  today: TodayData,
  mealId: MealId,
  updater: (ingredients: Ingredient[]) => Ingredient[],
): TodayData {
  const meal = today.meals?.[mealId]
  const dishes = meal?.dishes ?? []
  const firstDish = dishes[0] ?? { id: `prototype-${mealId}`, ingredients: [] }
  const ingredients = updater([...(firstDish.ingredients ?? [])])

  return {
    ...today,
    meals: {
      ...today.meals,
      [mealId]: {
        ...meal,
        dishes: [{ ...firstDish, ingredients }, ...dishes.slice(1)],
      },
    },
  }
}

function TodayScreen() {
  const [todayData, setTodayData] = useState<TodayData>(() => structuredClone(mockTodayPrototype))
  const [isQuickAddOpen, setQuickAddOpen] = useState(false)
  const [quickAddDraft, setQuickAddDraft] = useState<QuickAddDraft>(() => blankDraft())
  const [toastMessage, setToastMessage] = useState('')
  const totals = calcAll(todayData)

  const openQuickAdd = (mealId: MealId) => {
    setQuickAddDraft(blankDraft(mealId))
    setQuickAddOpen(true)
    setToastMessage('')
  }

  const addIngredient = () => {
    const ingredient = createEnteredQuantityIngredient({
      id: `mock-${Date.now()}`,
      name: quickAddDraft.name,
      qty: quickAddDraft.qty,
      unit: quickAddDraft.unit,
      protein: quickAddDraft.protein,
      calories: quickAddDraft.calories,
      carbs: quickAddDraft.carbs,
      fat: quickAddDraft.fat,
      fibre: quickAddDraft.fibre,
      cost: quickAddDraft.cost,
    })

    setTodayData((current) => updateMealIngredients(
      current,
      quickAddDraft.mealId,
      (ingredients) => [...ingredients, ingredient],
    ))
    const mealName = meals.find((meal) => meal.id === quickAddDraft.mealId)?.name
    setToastMessage(`Added to ${mealName}.`)
    setQuickAddOpen(false)
    setQuickAddDraft(blankDraft())
  }

  const updateQuantity = (mealId: MealId, ingredientId: string, qty: string) => {
    setTodayData((current) => updateMealIngredients(
      current,
      mealId,
      (ingredients) => ingredients.map((ingredient) => (
        ingredient.id === ingredientId
          ? updateEnteredQuantityIngredientQty(ingredient, qty)
          : ingredient
      )),
    ))
  }

  const removeIngredient = (mealId: MealId, ingredientId: string) => {
    setTodayData((current) => updateMealIngredients(
      current,
      mealId,
      (ingredients) => ingredients.filter((ingredient) => ingredient.id !== ingredientId),
    ))
    setToastMessage('Item removed.')
  }

  return (
    <ScreenContainer title="Today" subtitle="Track your meals and hit your protein goal.">
      <PrototypeNotice>Prototype only — today uses mock data. Changes reset on refresh.</PrototypeNotice>
      <button className="today-quick-add-button" type="button" onClick={() => openQuickAdd('breakfast')}>
        <span aria-hidden="true">+</span>
        Quick Add
      </button>
      <DailySummaryCard totals={totals} />
      <div className="today-meals">
        {meals.map((meal) => (
          <MealCard
            key={meal.id}
            mealId={meal.id}
            mealName={meal.name}
            todayData={todayData}
            onAdd={() => openQuickAdd(meal.id)}
            onQuantityChange={(ingredientId, qty) => updateQuantity(meal.id, ingredientId, qty)}
            onRemove={(ingredientId) => removeIngredient(meal.id, ingredientId)}
          />
        ))}
      </div>
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
