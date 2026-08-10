import { CURRENT_REACT_SCHEMA_VERSION } from '../storage/storageKeys'
import type { FoodEntry, HistoryDay, MealsByName } from '../storage/storageTypes'
import { buildCaloriesTrendPoints, buildContinuousMetricDomain, buildLocalDateRange, buildProteinTrendPoints, countPointsMeetingCurrentGoal, getValidCaloriesGoal, getValidProteinGoal, selectHistoryRange, summarizeCaloriesTrend, summarizeHistoryRange, summarizeProteinTrend } from './analyticsCharts'

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message) }
const emptyMeals = (): MealsByName => ({ Breakfast: { name: 'Breakfast', entries: [] }, Lunch: { name: 'Lunch', entries: [] }, Dinner: { name: 'Dinner', entries: [] }, Snacks: { name: 'Snacks', entries: [] } })
const food = (id: string, protein = 10, calories = 100, cost = 5): FoodEntry => ({ id, name: id, quantity: 1, unit: 'piece', basisType: 'per_unit', nutritionSnapshot: { protein, calories, carbs: 1, fat: 1, fibre: 1 }, costSnapshot: { amount: cost, currency: 'INR' }, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' })
const day = (id: string, date: string, savedAt: string, populated = true): HistoryDay => { const meals = emptyMeals(); if (populated) meals.Breakfast.entries.push(food(id)); return { id, date, savedAt, meals, totals: { protein: 999, calories: 999, carbs: 999, fat: 999, fibre: 999, cost: 999 } } }
const end = new Date(2026, 0, 2, 12)
assert(buildLocalDateRange(end).join(',') === '2025-12-27,2025-12-28,2025-12-29,2025-12-30,2025-12-31,2026-01-01,2026-01-02', '7-day year boundary')
assert(buildLocalDateRange(end).length === 7, 'seven-day capacity')
assert(buildLocalDateRange(new Date(2024, 2, 1))[5] === '2024-02-29', 'leap-day arithmetic')
assert(buildLocalDateRange(new Date(2026, 2, 10)).every((key) => /^\d{4}-\d{2}-\d{2}$/.test(key)), 'DST-safe identities')
const source = [day('old', '2026-01-01', '2026-01-01T08:00:00Z'), day('new', '2026-01-01', '2026-01-01T09:00:00Z'), day('bad', 'bad', '2026-01-02T00:00:00Z'), day('outside', '2025-01-01', '2026-01-02T00:00:00Z')]
const before = structuredClone(source)
const selected = selectHistoryRange(source, end)
assert(selected.length === 1 && selected[0].id === 'new', 'canonical filtering')
assert(JSON.stringify(source) === JSON.stringify(before), 'source not mutated')
const empty = summarizeHistoryRange([], end)
assert(empty.status === 'empty' && empty.averageProtein === null && empty.trackedDays === 0 && empty.rangeCapacity === 7, 'empty summary')
const one = summarizeHistoryRange([day('one', '2026-01-02', '2026-01-02T08:00:00Z')], end)
assert(one.status === 'insufficient' && one.averageProtein === 10 && one.averageCalories === 100 && one.totalSpend === 5, 'one populated day')
const savedEmpty = summarizeHistoryRange([day('empty', '2026-01-02', '2026-01-02T08:00:00Z', false)], end)
assert(savedEmpty.trackedDays === 1 && savedEmpty.averageProtein === 0 && savedEmpty.totalSpend === 0, 'saved empty day')
const two = summarizeHistoryRange([day('a', '2026-01-01', '2026-01-01T08:00:00Z'), day('b', '2026-01-02', '2026-01-02T08:00:00Z')], end)
assert(two.status === 'available' && two.trackedDays === 2 && two.rangeCapacity === 7 && two.averageProtein === 10 && two.averageCalories === 100 && two.totalSpend === 10, 'two-day summary')
assert([two.averageProtein, two.averageCalories, two.totalSpend].every(Number.isFinite), 'finite outputs')
const separated = summarizeHistoryRange(source, end)
const unrelatedToday = { protein: 999 }
const unrelatedWeekly = { protein: 999 }
assert(separated.trackedDays === selected.length && unrelatedToday.protein === unrelatedWeekly.protein, 'Today and Weekly do not affect History summary')
const unsafe = day('unsafe', '2026-01-02', '2026-01-02T10:00:00Z')
unsafe.meals.Breakfast.entries[0].nutritionSnapshot.protein = Number.POSITIVE_INFINITY
assert(summarizeHistoryRange([unsafe], end).averageProtein === 0, 'Infinity is normalized to a finite summary value')
const protein120 = day('p120', '2026-01-01', '2026-01-01T08:00:00Z'); protein120.meals.Breakfast.entries[0] = food('p120', 120, 100, 5); protein120.totals.protein = 999
const protein100 = day('p100', '2026-01-02', '2026-01-02T08:00:00Z'); protein100.meals.Breakfast.entries[0] = food('p100', 100, 100, 5)
const ordered = buildProteinTrendPoints([protein100, protein120], end)
assert(ordered.map((point) => point.date).join(',') === '2026-01-01,2026-01-02', 'oldest-to-newest point order')
assert(ordered[0].proteinGrams === 120 && ordered[0].dayIndex === 5 && ordered[1].dayIndex === 6, 'snapshot authority and calendar offsets')
const gapPoints = buildProteinTrendPoints([day('lead', '2025-12-28', '2025-12-28T08:00:00Z'), day('internal', '2025-12-30', '2025-12-30T08:00:00Z'), protein100], end)
assert(gapPoints.map((point) => point.dayIndex).join(',') === '1,3,6' && gapPoints.length === 3, 'leading internal and ending missing dates are not fabricated')
const missingEnding = buildProteinTrendPoints([day('range-start', '2025-12-27', '2025-12-27T08:00:00Z'), protein120], end)
assert(!missingEnding.some((point) => point.date === '2026-01-02') && missingEnding.map((point) => point.dayIndex).join(',') === '0,5', 'missing ending date has no fake zero point')
assert(missingEnding.every((point) => point.dayIndex >= 0 && point.dayIndex <= 6), 'complete seven-day dayIndex contract remains zero through six')
const emptySaved = day('saved-zero', '2026-01-02', '2026-01-02T09:00:00Z', false)
assert(buildProteinTrendPoints([emptySaved], end)[0].proteinGrams === 0, 'saved empty point retained')
const negativeProtein = day('negative', '2026-01-02', '2026-01-02T10:00:00Z'); negativeProtein.meals.Breakfast.entries[0].nutritionSnapshot.protein = -1
const nanProtein = day('nan', '2026-01-02', '2026-01-02T11:00:00Z'); nanProtein.meals.Breakfast.entries[0].nutritionSnapshot.protein = NaN
const infiniteProtein = day('infinite', '2026-01-02', '2026-01-02T12:00:00Z'); infiniteProtein.meals.Breakfast.entries[0].nutritionSnapshot.protein = Infinity
assert(buildProteinTrendPoints([negativeProtein], end).length === 0, 'negative Protein point omitted')
assert(buildProteinTrendPoints([nanProtein], end).length === 0, 'NaN Protein point omitted')
assert(buildProteinTrendPoints([infiniteProtein], end).length === 0, 'positive Infinity Protein point omitted')
assert([...ordered, ...gapPoints, ...missingEnding].every((point) => typeof point.dateLabel === 'string' && point.dateLabel.length > 0 && Number.isFinite(point.proteinGrams) && point.proteinGrams >= 0), 'prepared points satisfy tooltip-safe contract')
const s0 = summarizeProteinTrend([]); const s1 = summarizeProteinTrend([ordered[0]]); const s2 = summarizeProteinTrend(ordered); const sz = summarizeProteinTrend(buildProteinTrendPoints([day('z1', '2026-01-01', '2026-01-01T08:00:00Z', false), emptySaved], end))
assert(s0.status === 'empty' && s0.averageProtein === null, 'zero point summary')
assert(s1.status === 'insufficient' && s1.averageProtein === 120, 'one point summary')
assert(s2.status === 'available' && s2.averageProtein === 110, '120 plus 100 average')
assert(summarizeProteinTrend(buildProteinTrendPoints([protein120, emptySaved], end)).averageProtein === 60, '120 plus saved empty average')
assert(sz.status === 'available' && sz.averageProtein === 0, 'two zero points available')
assert(getValidProteinGoal({ enabled: true, value: 120 }) === 120, 'valid goal')
for (const goal of [{ enabled: false, value: 120 }, { enabled: true, value: null }, { enabled: true, value: 0 }, { enabled: true, value: -1 }, { enabled: true, value: Infinity }, { enabled: true, value: NaN }]) assert(getValidProteinGoal(goal) === null, 'invalid goal omitted')
assert(countPointsMeetingCurrentGoal(ordered, 120) === 1, 'goal meeting uses greater-than-or-equal')
const beforeGoal = summarizeProteinTrend(ordered); countPointsMeetingCurrentGoal(ordered, getValidProteinGoal({ enabled: true, value: 120 })); const afterGoal = summarizeProteinTrend(ordered)
assert(JSON.stringify(afterGoal.points) === JSON.stringify(beforeGoal.points) && afterGoal.trackedDays === beforeGoal.trackedDays && afterGoal.averageProtein === beforeGoal.averageProtein && afterGoal.status === beforeGoal.status, 'valid current goal does not change Protein trend data or availability')
const domainCases = [[120, 121], [120, 130], [120, 60], [120, 120], [0, 0], [120]]
for (const values of domainCases) { const original = [...values]; const domain = buildContinuousMetricDomain({ values, minimumSpan: 30, paddingRatio: .1, roundingStep: 5, floorAtZero: true }); assert(Number.isFinite(domain[0]) && Number.isFinite(domain[1]) && domain[0] >= 0 && domain[0] < domain[1] && values.every((value) => value >= domain[0] && value <= domain[1]), 'valid continuous domain'); assert(JSON.stringify(values) === JSON.stringify(original), 'domain input not mutated') }
const withGoal = buildContinuousMetricDomain({ values: [120], referenceValues: [200], minimumSpan: 30, paddingRatio: .1, roundingStep: 5, floorAtZero: true }); assert(withGoal[1] >= 200, 'goal outside range included')
const belowGoal = buildContinuousMetricDomain({ values: [120, 130], referenceValues: [50], minimumSpan: 30, paddingRatio: .1, roundingStep: 5, floorAtZero: true }); assert(belowGoal[0] <= 50 && belowGoal[1] >= 130, 'goal below all actual values included')
const movement = (values: number[]) => { const [lo, hi] = buildContinuousMetricDomain({ values, minimumSpan: 30, paddingRatio: .1, roundingStep: 5, floorAtZero: true }); return Math.abs(values.at(-1)! - values[0]) / (hi - lo) }
assert(movement([120, 121]) < movement([120, 130]) && movement([120, 130]) < movement([120, 60]), 'movement hierarchy')

const caloriesDay = (id: string, date: string, savedAt: string, calories: number, populated = true): HistoryDay => {
  const result = day(id, date, savedAt, populated)
  if (populated) result.meals.Breakfast.entries[0] = food(id, 10, calories, 5)
  result.totals.calories = 987654
  return result
}
const caloriesSource = [
  caloriesDay('outside-calories', '2025-12-26', '2025-12-26T08:00:00Z', 500),
  caloriesDay('range-start-calories', '2025-12-27', '2025-12-27T08:00:00Z', 1500),
  caloriesDay('internal-calories', '2025-12-30', '2025-12-30T08:00:00Z', 1700),
  caloriesDay('old-calories-duplicate', '2026-01-01', '2026-01-01T08:00:00Z', 1800),
  caloriesDay('new-calories-duplicate', '2026-01-01', '2026-01-01T09:00:00Z', 2000),
  caloriesDay('ending-calories', '2026-01-02', '2026-01-02T08:00:00Z', 2200),
  caloriesDay('future-calories', '2026-01-03', '2026-01-03T08:00:00Z', 2300),
  caloriesDay('malformed-calories', 'not-a-date', '2026-01-02T08:00:00Z', 2400),
]
const caloriesSourceBefore = structuredClone(caloriesSource)
const caloriesPoints = buildCaloriesTrendPoints(caloriesSource, end)
assert(caloriesPoints.map((point) => point.date).join(',') === '2025-12-27,2025-12-30,2026-01-01,2026-01-02', 'Calories points use canonical current seven-day range in chronological order')
assert(caloriesPoints.map((point) => point.dayIndex).join(',') === '0,3,5,6', 'Calories points preserve missing-date calendar positions from zero through six')
assert(caloriesPoints.every((point) => point.dayIndex >= 0 && point.dayIndex <= 6), 'Calories dayIndex remains within zero through six')
assert(caloriesPoints[2].id === 'new-calories-duplicate' && caloriesPoints[2].caloriesKcal === 2000, 'Calories duplicate date uses canonical survivor and snapshot authority')
assert(!caloriesPoints.some((point) => ['outside-calories', 'future-calories', 'malformed-calories'].includes(point.id)), 'Calories excludes outside-range future and malformed dates')
assert(JSON.stringify(caloriesSource) === JSON.stringify(caloriesSourceBefore), 'Calories point construction does not mutate source History')
const missingLeadingCalories = buildCaloriesTrendPoints([caloriesDay('middle-only', '2025-12-30', '2025-12-30T08:00:00Z', 1600)], end)
assert(missingLeadingCalories.length === 1 && missingLeadingCalories[0].dayIndex === 3, 'Calories missing leading dates are not fabricated')
const missingInternalCalories = buildCaloriesTrendPoints([caloriesDay('cal-start', '2025-12-27', '2025-12-27T08:00:00Z', 1500), caloriesDay('cal-end', '2026-01-02', '2026-01-02T08:00:00Z', 1700)], end)
assert(missingInternalCalories.map((point) => point.dayIndex).join(',') === '0,6', 'Calories missing internal dates remain visual gaps')
const missingEndingCalories = buildCaloriesTrendPoints([caloriesDay('cal-leading', '2025-12-27', '2025-12-27T08:00:00Z', 1500)], end)
assert(missingEndingCalories.length === 1 && missingEndingCalories[0].dayIndex === 0, 'Calories missing ending dates are not fabricated')
const zeroCaloriesDay = caloriesDay('zero-calories', '2026-01-02', '2026-01-02T10:00:00Z', 0, false)
assert(buildCaloriesTrendPoints([zeroCaloriesDay], end)[0].caloriesKcal === 0, 'saved-empty zero Calories point retained')
for (const [label, invalid] of [['negative', -1], ['NaN', NaN], ['Infinity', Infinity], ['negative Infinity', -Infinity]] as const) {
  const invalidDay = caloriesDay(`invalid-${label}`, '2026-01-02', '2026-01-02T11:00:00Z', invalid)
  assert(buildCaloriesTrendPoints([invalidDay], end).length === 0, `${label} Calories point omitted`)
}
const caloriesEmpty = summarizeCaloriesTrend([])
const caloriesOne = summarizeCaloriesTrend([caloriesPoints[0]])
const caloriesTwo = summarizeCaloriesTrend(caloriesPoints.slice(0, 2))
const caloriesZeroAvailable = summarizeCaloriesTrend(buildCaloriesTrendPoints([caloriesDay('zero-one', '2026-01-01', '2026-01-01T08:00:00Z', 0, false), zeroCaloriesDay], end))
assert(caloriesEmpty.status === 'empty' && caloriesEmpty.trackedDays === 0 && caloriesEmpty.averageCalories === null && caloriesEmpty.minimumCalories === null && caloriesEmpty.maximumCalories === null && caloriesEmpty.latestPoint === null, 'zero Calories points produce empty summary')
assert(caloriesOne.status === 'insufficient' && caloriesOne.trackedDays === 1 && caloriesOne.averageCalories === 1500 && caloriesOne.minimumCalories === 1500 && caloriesOne.maximumCalories === 1500 && caloriesOne.latestPoint?.id === caloriesPoints[0].id, 'one Calories point produces complete insufficient summary')
assert(caloriesTwo.status === 'available' && caloriesTwo.averageCalories === 1600 && caloriesTwo.minimumCalories === 1500 && caloriesTwo.maximumCalories === 1700 && caloriesTwo.latestPoint?.caloriesKcal === 1700, 'Calories summary uses valid point count and chronological latest point')
assert(caloriesZeroAvailable.status === 'available' && caloriesZeroAvailable.trackedDays === 2 && caloriesZeroAvailable.averageCalories === 0 && caloriesZeroAvailable.minimumCalories === 0 && caloriesZeroAvailable.maximumCalories === 0, 'two zero Calories points remain an available flat-zero trend')
assert(getValidCaloriesGoal({ enabled: true, value: 2200 }) === 2200, 'valid Calories goal retained')
for (const goal of [{ enabled: false, value: 2200 }, { enabled: true, value: null }, { enabled: true, value: 0 }, { enabled: true, value: -1 }, { enabled: true, value: NaN }, { enabled: true, value: Infinity }, { enabled: true, value: -Infinity }]) assert(getValidCaloriesGoal(goal) === null, 'invalid Calories goal omitted')
const caloriesBeforeGoal = summarizeCaloriesTrend(caloriesPoints)
const validCaloriesGoal = getValidCaloriesGoal({ enabled: true, value: 2400 })
const caloriesAfterGoal = summarizeCaloriesTrend(caloriesPoints)
assert(JSON.stringify(caloriesBeforeGoal) === JSON.stringify(caloriesAfterGoal) && validCaloriesGoal === 2400, 'Calories goal is independent from observations summaries and availability')
assert(summarizeCaloriesTrend([]).status === 'empty' && validCaloriesGoal !== null, 'Calories goal alone does not create chart availability')

const caloriesDomain = (values: number[], referenceValues: number[] = []) => buildContinuousMetricDomain({ values, referenceValues, minimumSpan: 500, paddingRatio: .1, roundingStep: 100, floorAtZero: true })
const caloriesDomainCases: Array<{ values: number[]; references?: number[] }> = [
  { values: [2000, 2010] }, { values: [2000, 2200] }, { values: [2000, 1000] },
  { values: [2000, 2000] }, { values: [0, 0] }, { values: [1800] },
  { values: [1500, 1700], references: [2400] }, { values: [2200, 2400], references: [1600] },
  { values: [1500, 1700] }, { values: [1500, 1700], references: [] },
]
for (const testCase of caloriesDomainCases) {
  const valuesBefore = [...testCase.values]
  const references = testCase.references ?? []
  const referencesBefore = [...references]
  const domain = caloriesDomain(testCase.values, references)
  assert(Number.isFinite(domain[0]) && Number.isFinite(domain[1]) && domain[0] >= 0 && domain[0] < domain[1], 'Calories domain is finite ordered and non-negative')
  assert(testCase.values.every((value) => value >= domain[0] && value <= domain[1]), 'Calories domain includes every actual value')
  assert(references.every((goal) => goal >= domain[0] && goal <= domain[1]), 'Calories domain includes valid current goal')
  assert(JSON.stringify(testCase.values) === JSON.stringify(valuesBefore) && JSON.stringify(references) === JSON.stringify(referencesBefore), 'Calories domain construction does not mutate inputs')
}
const caloriesMovement = (values: number[]) => { const [lower, upper] = caloriesDomain(values); return Math.abs(values.at(-1)! - values[0]) / (upper - lower) }
assert(caloriesMovement([2000, 2010]) < caloriesMovement([2000, 2200]) && caloriesMovement([2000, 2200]) < caloriesMovement([2000, 1000]), 'Calories close moderate and large movement hierarchy')
const flatCaloriesDomain = caloriesDomain([2000, 2000]); assert(flatCaloriesDomain[0] < 2000 && flatCaloriesDomain[1] > 2000, 'flat-positive Calories domain has visible space above and below')
const flatZeroCaloriesDomain = caloriesDomain([0, 0]); assert(flatZeroCaloriesDomain[0] === 0 && flatZeroCaloriesDomain[1] === 500, 'flat-zero Calories domain is zero through 500 kcal')
assert(caloriesDomain([1500, 1700], [2400])[1] >= 2400, 'valid Calories goal above values extends domain')
assert(caloriesDomain([2200, 2400], [1600])[0] <= 1600, 'valid Calories goal below values extends domain')
const invalidCaloriesGoal = getValidCaloriesGoal({ enabled: true, value: Infinity })
const withoutGoalDomain = caloriesDomain([1500, 1700])
const invalidGoalDomain = caloriesDomain([1500, 1700], invalidCaloriesGoal === null ? [] : [invalidCaloriesGoal])
assert(JSON.stringify(invalidGoalDomain) === JSON.stringify(withoutGoalDomain), 'invalid Calories goal is excluded from domain')
assert(CURRENT_REACT_SCHEMA_VERSION === 1, 'schema remains current')
console.log('Analytics charts verification passed.')
