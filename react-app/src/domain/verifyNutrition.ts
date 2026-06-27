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
import type { MacroTotals } from './types'

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
