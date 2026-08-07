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
  onAddIngredient?: () => void
  onQuickAdd?: () => void
  onQuantityChange?: (ingredientId: string, qty: number) => void
  onRemove?: (ingredientId: string) => void
  onMove?: (ingredientId: string, trigger: HTMLButtonElement) => void
  mode?: 'editable' | 'readonly'
  readOnly?: boolean
  variant?: 'default' | 'selected' | 'weekly' | 'history'
}

function MealCard({
  mealId,
  mealName,
  todayData,
  emptyMessage = 'Nothing here yet. Add your first item.',
  onAdd,
  onAddIngredient,
  onQuickAdd,
  onQuantityChange,
  onRemove,
  onMove,
  mode,
  readOnly = false,
  variant = 'default',
}: MealCardProps) {
  const isReadOnly = mode === 'readonly' || readOnly
  const isSelectedVariant = variant === 'selected'
  const isWeeklyVariant = variant === 'weekly'
  const isHistoryVariant = variant === 'history'
  const totals = calcMealToday(todayData, mealId)
  const ingredients = (todayData.meals?.[mealId]?.dishes ?? []).flatMap(
    (dish) => dish.ingredients ?? [],
  ) as Ingredient[]

  return (
    <section className={`today-meal-card${isSelectedVariant ? ' selected-meal-card' : ''}${isWeeklyVariant ? ' weekly-meal-card' : ''}${isHistoryVariant ? ' history-meal-card' : ''}`} aria-labelledby={`${mealId}-meal-title`}>
      <div className="today-meal-heading">
        <div>
          <h3 id={`${mealId}-meal-title`}>{mealName}</h3>
          <p>
            {totals.p.toFixed(1)}g protein · {totals.k.toFixed(0)} kcal · ₹{totals.c.toFixed(0)}
          </p>
        </div>
        {!isReadOnly && !isSelectedVariant && (
          <button className="meal-add-button" type="button" onClick={onAdd}>
            + Add
          </button>
        )}
      </div>
      <div className="today-meal-body">
        {ingredients.length === 0 ? (
          isSelectedVariant ? (
            <div className="selected-meal-empty">
              <strong>No foods added to {mealName} yet.</strong>
              <span>{emptyMessage}</span>
            </div>
          ) : isWeeklyVariant ? <p className="weekly-meal-empty">No foods planned for {mealName}.</p> : isHistoryVariant ? <p className="history-meal-empty">No foods saved for {mealName}.</p> : <EmptyState title="No foods yet" description={emptyMessage} icon="+" />
        ) : (
          ingredients.filter((ingredient) => typeof ingredient.id === 'string').map((ingredient) => (
            <IngredientRow
              key={ingredient.id}
              ingredient={ingredient}
              mode={isReadOnly ? 'readonly' : 'editable'}
              compact={isSelectedVariant || isWeeklyVariant || isHistoryVariant}
              onQuantityCommit={(qty) => onQuantityChange?.(ingredient.id as string, qty)}
              onRemove={() => onRemove?.(ingredient.id as string)}
              onMove={(trigger) => onMove?.(ingredient.id as string, trigger)}
            />
          ))
        )}
      </div>
      {!isReadOnly && isSelectedVariant && (
        <div className="selected-meal-actions">
          <button className="secondary-action" type="button" onClick={onAddIngredient}>+ Add Ingredient</button>
          <button className="primary-action" type="button" onClick={onQuickAdd}>⚡ Quick Add</button>
        </div>
      )}
    </section>
  )
}

export default MealCard
