import { calcMealToday } from '../domain/nutrition'
import type { Ingredient, MealId, TodayData } from '../domain/types'
import IngredientRow from './IngredientRow'
import EmptyState from './EmptyState'

type MealCardProps = {
  mealId: MealId
  mealName: string
  todayData: TodayData
  emptyMessage?: string
  onAdd?: () => void
  onQuantityChange?: (ingredientId: string, qty: string) => void
  onRemove?: (ingredientId: string) => void
  mode?: 'editable' | 'readonly'
  readOnly?: boolean
}

function MealCard({
  mealId,
  mealName,
  todayData,
  emptyMessage = 'Nothing here yet. Add your first item.',
  onAdd,
  onQuantityChange,
  onRemove,
  mode,
  readOnly = false,
}: MealCardProps) {
  const isReadOnly = mode === 'readonly' || readOnly
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
        {!isReadOnly && (
          <button className="meal-add-button" type="button" onClick={onAdd}>
            + Add
          </button>
        )}
      </div>
      <div className="today-meal-body">
        {ingredients.length === 0 ? (
          <EmptyState title="No foods yet" description={emptyMessage} icon="+" />
        ) : (
          ingredients.map((ingredient, index) => (
            <IngredientRow
              key={ingredient.id || `${mealId}-${index}`}
              ingredient={ingredient}
              mode={isReadOnly ? 'readonly' : 'editable'}
              onQuantityChange={(qty) => onQuantityChange?.(String(ingredient.id), qty)}
              onRemove={() => onRemove?.(String(ingredient.id))}
            />
          ))
        )}
      </div>
    </section>
  )
}

export default MealCard
