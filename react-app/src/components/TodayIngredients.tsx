import type { Ingredient } from '../domain/types'
import type { FoodEntry, MealName, ReactTodayStore } from '../storage'
import IngredientRow from './IngredientRow'

const mealNames: readonly MealName[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
]

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

type TodayIngredientsProps = {
  todayStore: ReactTodayStore
  onQuantityCommit: (mealName: MealName, entryId: string, quantity: number) => void
  onRemove: (mealName: MealName, entryId: string) => void
}

function TodayIngredients({
  todayStore,
  onQuantityCommit,
  onRemove,
}: TodayIngredientsProps) {
  const rows = mealNames.flatMap((mealName) => (
    todayStore.meals[mealName].entries.map((entry) => ({ mealName, entry }))
  ))

  return (
    <section className="today-meal-card" aria-labelledby="today-ingredients-title">
      <div className="today-meal-heading">
        <div>
          <h3 id="today-ingredients-title">Today Ingredients</h3>
          <p>Derived from Breakfast, Lunch, Dinner, and Snacks.</p>
        </div>
      </div>
      <div className="today-meal-body">
        {rows.length === 0 ? (
          <p>No ingredients tracked today.</p>
        ) : rows.map(({ mealName, entry }) => (
          <div key={entry.id}>
            <p className="eyebrow">{mealName}</p>
            <IngredientRow
              ingredient={toDisplayIngredient(entry)}
              onQuantityCommit={(quantity) => onQuantityCommit(
                mealName,
                entry.id,
                quantity,
              )}
              onRemove={() => onRemove(mealName, entry.id)}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

export default TodayIngredients
