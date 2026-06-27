export type NumericLike = number | string | null | undefined

export type MacroTotals = {
  p: number
  k: number
  carb: number
  fat: number
  fibre: number
  c: number
}

export type Ingredient = {
  [key: string]: unknown
  libId?: string | null
  name?: string
  qty?: NumericLike
  unit?: string
  pr100?: NumericLike
  kc100?: NumericLike
  carb100?: NumericLike
  fat100?: NumericLike
  fibre100?: NumericLike
  pp100?: NumericLike
  pr?: NumericLike
  kc?: NumericLike
  carb?: NumericLike
  fat?: NumericLike
  fibre?: NumericLike
  pp?: NumericLike
}

export type PerUnitFood = {
  [key: string]: unknown
  n?: string
  u?: string
  pr?: NumericLike
  kc?: NumericLike
  carb?: NumericLike
  fat?: NumericLike
  fibre?: NumericLike
  pp?: NumericLike
}

export type FoodLibrary = Record<string, PerUnitFood>

export type Dish = {
  [key: string]: unknown
  id?: string
  name?: string
  ingredients?: Ingredient[] | null
}

export type Meal = {
  [key: string]: unknown
  collapsed?: boolean
  dishes?: Dish[] | null
}

export type MealId = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

export type TodayData = {
  [key: string]: unknown
  dateKey?: string
  meals?: Partial<Record<MealId, Meal>> | null
}

export type LegacyStaple = Ingredient & {
  checked?: boolean
  mealId?: MealId | string
}

export type HistoryEntry = {
  [key: string]: unknown
  meals?: Partial<Record<MealId, Meal>> | null
  staples?: LegacyStaple[] | null
  savedAt?: string | number | null
}

export type PlanDay = Partial<Record<MealId, Ingredient[] | null>>

export type WeekPlan = Record<string, PlanDay | null | undefined>
