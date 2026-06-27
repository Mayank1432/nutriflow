import type {
  Dish,
  FoodLibrary,
  HistoryEntry,
  Ingredient,
  MacroTotals,
  MealId,
  NumericLike,
  PerUnitFood,
  PlanDay,
  TodayData,
} from './types'

export const MEAL_IDS: MealId[] = ['breakfast', 'lunch', 'dinner', 'snacks']

export function safeNumber(value: NumericLike): number {
  if (value === null || value === undefined || value === '') return 0
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? number : 0
}

export function emptyTotals(): MacroTotals {
  return { p: 0, k: 0, carb: 0, fat: 0, fibre: 0, c: 0 }
}

export function addTotals(a: MacroTotals, b: MacroTotals): MacroTotals {
  return {
    p: safeNumber(a.p) + safeNumber(b.p),
    k: safeNumber(a.k) + safeNumber(b.k),
    carb: safeNumber(a.carb) + safeNumber(b.carb),
    fat: safeNumber(a.fat) + safeNumber(b.fat),
    fibre: safeNumber(a.fibre) + safeNumber(b.fibre),
    c: safeNumber(a.c) + safeNumber(b.c),
  }
}

export function round1(value: NumericLike): number {
  return Math.round(safeNumber(value) * 10) / 10
}

export function round0(value: NumericLike): number {
  return Math.round(safeNumber(value))
}

export function qtyFactor(unit: string | undefined, qty: NumericLike): number {
  const quantity = safeNumber(qty)
  return unit === 'piece' ? quantity : quantity / 100
}

export function calcFromP100(item: Ingredient): MacroTotals {
  const factor = qtyFactor(item.unit, item.qty)
  return {
    p: safeNumber(item.pr100) * factor,
    k: safeNumber(item.kc100) * factor,
    carb: safeNumber(item.carb100) * factor,
    fat: safeNumber(item.fat100) * factor,
    fibre: safeNumber(item.fibre100) * factor,
    c: safeNumber(item.pp100) * factor,
  }
}

export function calcFromPerUnit(food: PerUnitFood | Ingredient, qty: NumericLike): MacroTotals {
  const quantity = safeNumber(qty)
  return {
    p: safeNumber(food.pr) * quantity,
    k: safeNumber(food.kc) * quantity,
    carb: safeNumber(food.carb) * quantity,
    fat: safeNumber(food.fat) * quantity,
    fibre: safeNumber(food.fibre) * quantity,
    c: safeNumber(food.pp) * quantity,
  }
}

export function calcIngr(
  ingredient: Ingredient,
  library: FoodLibrary = {},
): MacroTotals {
  if (ingredient.libId) {
    const food = library[ingredient.libId]
    return food ? calcFromPerUnit(food, ingredient.qty) : emptyTotals()
  }
  return calcFromP100(ingredient)
}

export function calcDish(dish: Dish | null | undefined, library: FoodLibrary = {}): MacroTotals {
  return (dish?.ingredients ?? []).reduce(
    (totals, ingredient) => addTotals(totals, calcIngr(ingredient, library)),
    emptyTotals(),
  )
}

export function calcMealToday(
  today: TodayData,
  mealId: MealId,
  library: FoodLibrary = {},
): MacroTotals {
  return (today.meals?.[mealId]?.dishes ?? []).reduce(
    (totals, dish) => addTotals(totals, calcDish(dish, library)),
    emptyTotals(),
  )
}

export function calcAll(today: TodayData, library: FoodLibrary = {}): MacroTotals {
  return MEAL_IDS.reduce(
    (totals, mealId) => addTotals(totals, calcMealToday(today, mealId, library)),
    emptyTotals(),
  )
}

export function calcDayLog(
  entry: HistoryEntry,
  library: FoodLibrary = {},
): MacroTotals {
  let totals = emptyTotals()

  for (const staple of entry.staples ?? []) {
    if (staple.checked) totals = addTotals(totals, calcFromPerUnit(staple, staple.qty))
  }

  const todayShape: TodayData = { meals: entry.meals }
  return addTotals(totals, calcAll(todayShape, library))
}

export function calcPlanDay(planDay: PlanDay | null | undefined, library: FoodLibrary = {}): MacroTotals {
  return MEAL_IDS.reduce((totals, mealId) => {
    const mealTotals = (planDay?.[mealId] ?? []).reduce(
      (mealTotal, ingredient) => addTotals(mealTotal, calcIngr(ingredient, library)),
      emptyTotals(),
    )
    return addTotals(totals, mealTotals)
  }, emptyTotals())
}

export function pu2p100(value: NumericLike, unit: string | undefined): number {
  return unit === 'piece' ? round1(value) : round1(safeNumber(value) * 100)
}

export function p100pu(value: NumericLike, unit: string | undefined): number {
  const number = safeNumber(value)
  return unit === 'piece' ? number : number / 100
}
