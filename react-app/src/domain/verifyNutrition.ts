import {
  blankNumericFields,
  chickenPer100,
  decimalQuantity,
  eggPerUnit,
  emptyPlannerDay,
  invalidNumericFields,
  legacyHistoryEntry,
  missingArraysToday,
  missingOptionalMacros,
  mockLibrary,
  mockWeekPrototype,
  populatedToday,
  weeklyPlannerDay,
  zeroQuantity,
} from './fixtures'
import {
  calcAll,
  calcDayLog,
  calcEnteredQuantityIngredient,
  calcFromP100,
  calcIngr,
  calcPlanDay,
  createEnteredQuantityIngredient,
  emptyTotals,
  p100pu,
  pu2p100,
  round0,
  round1,
  safeNumber,
  updateEnteredQuantityIngredientQty,
} from './nutrition'
import {
  calcWeeklySummary,
  clearWeekDay,
  copyWeekDay,
  createEmptyWeekDay,
  isPlannedDay,
  WEEK_DAY_IDS,
} from './weeklyMock'
import type { MacroTotals, WeekData } from './types'

const EPSILON = 1e-9

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function assertClose(actual: number, expected: number, label: string): void {
  assert(Math.abs(actual - expected) < EPSILON, `${label}: expected ${expected}, got ${actual}`)
}

function assertTotals(actual: MacroTotals, expected: Partial<MacroTotals>, label: string): void {
  for (const key of Object.keys(expected) as Array<keyof MacroTotals>) {
    assertClose(actual[key], expected[key]!, `${label}.${key}`)
  }
  assert(
    Object.values(actual).every(Number.isFinite),
    `${label}: totals must not contain NaN or Infinity`,
  )
}

const fixtureSnapshot = JSON.stringify({
  chickenPer100,
  eggPerUnit,
  populatedToday,
  weeklyPlannerDay,
  legacyHistoryEntry,
})

assertTotals(calcFromP100(chickenPer100), {
  p: 33.75,
  k: 180,
  carb: 0,
  fat: 4.65,
  fibre: 0,
  c: 78,
}, 'per-100 chicken')

assertTotals(calcIngr(eggPerUnit, mockLibrary), {
  p: 12,
  k: 156,
  carb: 1.2,
  fat: 10,
  fibre: 0,
  c: 16,
}, 'per-unit egg')

assertTotals(calcFromP100(decimalQuantity), {
  p: 4.5,
  k: 142.5,
  carb: 25.5,
  fat: 2.625,
  fibre: 3.75,
  c: 6.75,
}, 'decimal quantity')

assertTotals(calcAll(populatedToday, mockLibrary), {
  p: 53.75,
  k: 486,
  carb: 13.2,
  fat: 22.15,
  fibre: 0,
  c: 109,
}, 'today total')

assertTotals(calcPlanDay(weeklyPlannerDay, mockLibrary), {
  p: 47.5,
  k: 362.25,
  carb: 9.45,
  fat: 13.225,
  fibre: 3.25,
  c: 73.5,
}, 'weekly planner day')

assertTotals(calcDayLog(legacyHistoryEntry, mockLibrary), {
  p: 59.75,
  k: 564,
  carb: 13.8,
  fat: 27.15,
  fibre: 0,
  c: 117,
}, 'legacy history')

for (const [label, totals] of [
  ['blank values', calcFromP100(blankNumericFields)],
  ['invalid values', calcFromP100(invalidNumericFields)],
  ['zero quantity', calcFromP100(zeroQuantity)],
  ['empty planner', calcPlanDay(emptyPlannerDay, mockLibrary)],
  ['missing arrays', calcAll(missingArraysToday, mockLibrary)],
] as const) {
  assertTotals(totals, emptyTotals(), label)
}

assertTotals(calcFromP100(missingOptionalMacros), {
  p: 10,
  k: 90,
  carb: 0,
  fat: 0,
  fibre: 0,
  c: 0,
}, 'missing optional macros')

const enteredQuantityIngredient = createEnteredQuantityIngredient({
  id: 'verify-entered',
  name: 'Mock entered item',
  qty: 100,
  unit: 'g',
  protein: 20,
  calories: 200,
  carbs: 10,
  fat: 5,
  fibre: 3,
  cost: 50,
})
const scaledEnteredIngredient = updateEnteredQuantityIngredientQty(
  enteredQuantityIngredient,
  150,
)

assertTotals(calcEnteredQuantityIngredient(scaledEnteredIngredient), {
  p: 30,
  k: 300,
  carb: 15,
  fat: 7.5,
  fibre: 4.5,
  c: 75,
}, 'entered quantity scaling')
assert(enteredQuantityIngredient.qty === 100, 'quantity updates must not mutate the source')
assertTotals(calcEnteredQuantityIngredient({
  ...enteredQuantityIngredient,
  baseQty: 'invalid',
  qty: 'invalid',
}), emptyTotals(), 'invalid entered quantity')

const weeklySummary = calcWeeklySummary(mockWeekPrototype)
assertTotals(weeklySummary, {
  p: 143,
  k: 2172,
  carb: 219.2,
  fat: 77,
  fibre: 35,
  c: 445,
}, 'weekly summary')
assert(weeklySummary.plannedDays === 3, 'weekly summary should count planned days only')
assertClose(weeklySummary.averageProtein, 143 / 3, 'weekly average protein')
assertClose(weeklySummary.averageCalories, 724, 'weekly average calories')
assertClose(weeklySummary.averageCost, 445 / 3, 'weekly average cost')

const emptyWeek: WeekData = {
  days: Object.fromEntries(
    WEEK_DAY_IDS.map((dayId) => [dayId, createEmptyWeekDay(dayId)]),
  ) as WeekData['days'],
}
const emptyWeekSummary = calcWeeklySummary(emptyWeek)
assertTotals(emptyWeekSummary, emptyTotals(), 'empty weekly summary')
assert(emptyWeekSummary.plannedDays === 0, 'empty week should have no planned days')
assert(emptyWeekSummary.averageProtein === 0, 'empty week average should be zero')

const copiedWeek = copyWeekDay(structuredClone(mockWeekPrototype), 'mon', 'wed')
assert(isPlannedDay(copiedWeek.days.wed), 'copied target day should become planned')
assert(copiedWeek.days.mon !== copiedWeek.days.wed, 'copied days must not share references')
const copiedIngredient = copiedWeek.days.wed.meals?.breakfast?.dishes?.[0].ingredients?.[0]
if (copiedIngredient) copiedIngredient.name = 'Changed copied mock'
assert(
  copiedWeek.days.mon.meals?.breakfast?.dishes?.[0].ingredients?.[0].name === 'Whole eggs',
  'editing a copied day must not mutate its source',
)

const clearedWeek = clearWeekDay(copiedWeek, 'wed')
assert(!isPlannedDay(clearedWeek.days.wed), 'cleared target day should be empty')

assert(safeNumber('invalid') === 0, 'invalid numeric strings should become zero')
assert(safeNumber(null) === 0, 'null should become zero')
assert(round1(1.26) === 1.3, 'round1 should match vanilla display rounding')
assert(round0(1.6) === 2, 'round0 should match vanilla display rounding')
assert(pu2p100(0.225, 'g') === 22.5, 'g per-unit should convert to per-100')
assert(pu2p100(6, 'piece') === 6, 'piece values should remain per-piece')
assertClose(p100pu(22.5, 'g'), 0.225, 'g per-100 should convert to per-unit')
assert(p100pu(6, 'piece') === 6, 'piece values should remain per-piece')
assert(
  JSON.stringify({
    chickenPer100,
    eggPerUnit,
    populatedToday,
    weeklyPlannerDay,
    legacyHistoryEntry,
  }) === fixtureSnapshot,
  'calculation helpers must not mutate fixture inputs',
)

console.log('Nutrition verification passed.')
