import { useEffect, useState } from 'react'
import { calcIngr } from '../domain/nutrition'
import type { Ingredient } from '../domain/types'

type IngredientRowProps = {
  ingredient: Ingredient
  onQuantityCommit?: (qty: number) => void
  onRemove?: () => void
  mode?: 'editable' | 'readonly'
  readOnly?: boolean
}

function IngredientRow({
  ingredient,
  onQuantityCommit,
  onRemove,
  mode,
  readOnly = false,
}: IngredientRowProps) {
  const isReadOnly = mode === 'readonly' || readOnly
  const totals = calcIngr(ingredient)
  const persistedQuantity = String(ingredient.qty ?? 0)
  const [quantityDraft, setQuantityDraft] = useState(persistedQuantity)

  useEffect(() => {
    setQuantityDraft(persistedQuantity)
  }, [ingredient.id, persistedQuantity])

  const commitQuantity = () => {
    const trimmed = quantityDraft.trim()
    if (trimmed === '') {
      setQuantityDraft(persistedQuantity)
      return
    }

    const quantity = Number(trimmed)
    if (!Number.isFinite(quantity)) {
      setQuantityDraft(persistedQuantity)
      return
    }

    if (quantity <= 0) {
      onRemove?.()
      return
    }

    onQuantityCommit?.(quantity)
    setQuantityDraft(String(quantity))
  }

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
                value={quantityDraft}
                onChange={(event) => setQuantityDraft(event.target.value)}
                onBlur={commitQuantity}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur()
                  if (event.key === 'Escape') {
                    setQuantityDraft(persistedQuantity)
                    event.currentTarget.blur()
                  }
                }}
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
