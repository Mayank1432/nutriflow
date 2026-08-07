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
}

function TodayIngredients({ todayStore }: TodayIngredientsProps) {
  const populatedMeals = mealNames.filter((mealName) => (
    todayStore.meals[mealName].entries.length > 0
  ))

  return (
    <section className="today-meal-card today-ingredients-card" aria-labelledby="today-ingredients-title">
      <div className="today-meal-heading">
        <div>
          <h3 id="today-ingredients-title">Today Ingredients</h3>
          <p>Read-only summary of foods added today.</p>
        </div>
      </div>
      <div className="today-meal-body today-ingredients-body">
        {populatedMeals.length === 0 ? (
          <p className="today-ingredients-empty">No ingredients added today.</p>
        ) : populatedMeals.map((mealName) => (
          <section
            className="today-ingredients-meal"
            aria-labelledby={`today-ingredients-${mealName.toLowerCase()}`}
            key={mealName}
          >
            <h4
              className="today-ingredients-meal-heading"
              id={`today-ingredients-${mealName.toLowerCase()}`}
            >
              {mealName}
            </h4>
            <div className="today-ingredients-list">
              {todayStore.meals[mealName].entries.map((entry) => (
                <IngredientRow
                  key={entry.id}
                  ingredient={toDisplayIngredient(entry)}
                  readOnly
                  compact
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}

export default TodayIngredients
