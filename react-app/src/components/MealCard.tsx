import { calcMealToday } from '../domain/nutrition'
import type { Ingredient, MealId, TodayData } from '../domain/types'
import IngredientRow from './IngredientRow'

type MealCardProps = {
  mealId: MealId
  mealName: string
  todayData: TodayData
  onAdd: () => void
  onQuantityChange: (ingredientId: string, qty: string) => void
  onRemove: (ingredientId: string) => void
}

function MealCard({
  mealId,
  mealName,
  todayData,
  onAdd,
  onQuantityChange,
  onRemove,
}: MealCardProps) {
  const totals = calcMealToday(todayData, mealId)
  const ingredients = (todayData.meals?.[mealId]?.dishes ?? []).flatMap(
    (dish) => dish.ingredients ?? [],
  ) as Ingredient[]

  return (
    <section className="today-meal-card" aria-labelledby={`${mealId}-meal-title`}>
      <div className="today-meal-heading">
        <div>
          <h3 id={`${mealId}-meal-title`}>{mealName}</h3>
          <p>
            {totals.p.toFixed(1)}g protein · {totals.k.toFixed(0)} kcal · ₹{totals.c.toFixed(0)}
          </p>
        </div>
        <button className="meal-add-button" type="button" onClick={onAdd}>
          + Add
        </button>
      </div>
      <div className="today-meal-body">
        {ingredients.length === 0 ? (
          <p className="meal-empty">Nothing here yet. Add your first item.</p>
        ) : (
          ingredients.map((ingredient, index) => (
            <IngredientRow
              key={ingredient.id || `${mealId}-${index}`}
              ingredient={ingredient}
              onQuantityChange={(qty) => onQuantityChange(String(ingredient.id), qty)}
              onRemove={() => onRemove(String(ingredient.id))}
            />
          ))
        )}
      </div>
    </section>
  )
}

export default MealCard
