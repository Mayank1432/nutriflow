import { calcIngr } from '../domain/nutrition'
import type { Ingredient } from '../domain/types'

type IngredientRowProps = {
  ingredient: Ingredient
  onQuantityChange?: (qty: string) => void
  onRemove?: () => void
  mode?: 'editable' | 'readonly'
  readOnly?: boolean
}

function IngredientRow({
  ingredient,
  onQuantityChange,
  onRemove,
  mode,
  readOnly = false,
}: IngredientRowProps) {
  const isReadOnly = mode === 'readonly' || readOnly
  const totals = calcIngr(ingredient)

  return (
    <div className="ingredient-row">
      <div className="ingredient-row-heading">
        <div>
          <strong>{ingredient.name || 'Unnamed food'}</strong>
          <span>{totals.p.toFixed(1)}g protein · {totals.k.toFixed(0)} kcal</span>
        </div>
        {!isReadOnly && (
          <button className="remove-button" type="button" onClick={onRemove}>
            Remove
          </button>
        )}
      </div>
      <div className="ingredient-details">
        <label>
          <span>Quantity</span>
          {isReadOnly ? (
            <strong className="quantity-readonly">
              {String(ingredient.qty ?? 0)} {ingredient.unit || 'g'}
            </strong>
          ) : (
            <span className="quantity-control">
              <input
                type="number"
                min="0"
                step="any"
                value={String(ingredient.qty ?? '')}
                onChange={(event) => onQuantityChange?.(event.target.value)}
                aria-label={`${ingredient.name || 'Ingredient'} quantity`}
              />
              <span>{ingredient.unit || 'g'}</span>
            </span>
          )}
        </label>
        <dl aria-label={`${ingredient.name || 'Ingredient'} nutrition`}>
          <div><dt>Protein</dt><dd>{totals.p.toFixed(1)}g</dd></div>
          <div><dt>kcal</dt><dd>{totals.k.toFixed(0)} kcal</dd></div>
          <div><dt>Carbs</dt><dd>{totals.carb.toFixed(1)}g</dd></div>
          <div><dt>Fat</dt><dd>{totals.fat.toFixed(1)}g</dd></div>
          <div><dt>Fibre</dt><dd>{totals.fibre.toFixed(1)}g</dd></div>
          <div><dt>Cost</dt><dd>₹{totals.c.toFixed(0)}</dd></div>
        </dl>
      </div>
    </div>
  )
}

export default IngredientRow
