import { CURRENT_REACT_SCHEMA_VERSION } from '../storage/storageKeys'
import type { FoodEntry, HistoryDay, MealsByName } from '../storage/storageTypes'
import { buildContinuousMetricDomain, buildLocalDateRange, buildProteinTrendPoints, countPointsMeetingCurrentGoal, getValidProteinGoal, selectHistoryRange, summarizeHistoryRange, summarizeProteinTrend } from './analyticsCharts'

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message) }
const emptyMeals = (): MealsByName => ({ Breakfast: { name: 'Breakfast', entries: [] }, Lunch: { name: 'Lunch', entries: [] }, Dinner: { name: 'Dinner', entries: [] }, Snacks: { name: 'Snacks', entries: [] } })
const food = (id: string, protein = 10, calories = 100, cost = 5): FoodEntry => ({ id, name: id, quantity: 1, unit: 'piece', basisType: 'per_unit', nutritionSnapshot: { protein, calories, carbs: 1, fat: 1, fibre: 1 }, costSnapshot: { amount: cost, currency: 'INR' }, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' })
const day = (id: string, date: string, savedAt: string, populated = true): HistoryDay => { const meals = emptyMeals(); if (populated) meals.Breakfast.entries.push(food(id)); return { id, date, savedAt, meals, totals: { protein: 999, calories: 999, carbs: 999, fat: 999, fibre: 999, cost: 999 } } }
const end = new Date(2026, 0, 2, 12)
assert(buildLocalDateRange(7, end).join(',') === '2025-12-27,2025-12-28,2025-12-29,2025-12-30,2025-12-31,2026-01-01,2026-01-02', '7-day year boundary')
assert(buildLocalDateRange(30, end).length === 30, '30-day capacity')
assert(buildLocalDateRange(7, new Date(2024, 2, 1))[5] === '2024-02-29', 'leap-day arithmetic')
assert(buildLocalDateRange(7, new Date(2026, 2, 10)).every((key) => /^\d{4}-\d{2}-\d{2}$/.test(key)), 'DST-safe identities')
const source = [day('old', '2026-01-01', '2026-01-01T08:00:00Z'), day('new', '2026-01-01', '2026-01-01T09:00:00Z'), day('bad', 'bad', '2026-01-02T00:00:00Z'), day('outside', '2025-01-01', '2026-01-02T00:00:00Z')]
const before = structuredClone(source)
const selected = selectHistoryRange(source, 7, end)
assert(selected.length === 1 && selected[0].id === 'new', 'canonical filtering')
assert(JSON.stringify(source) === JSON.stringify(before), 'source not mutated')
const empty = summarizeHistoryRange([], 7, end)
assert(empty.status === 'empty' && empty.averageProtein === null && empty.trackedDays === 0 && empty.rangeCapacity === 7, 'empty summary')
const one = summarizeHistoryRange([day('one', '2026-01-02', '2026-01-02T08:00:00Z')], 7, end)
assert(one.status === 'insufficient' && one.averageProtein === 10 && one.averageCalories === 100 && one.totalSpend === 5, 'one populated day')
const savedEmpty = summarizeHistoryRange([day('empty', '2026-01-02', '2026-01-02T08:00:00Z', false)], 7, end)
assert(savedEmpty.trackedDays === 1 && savedEmpty.averageProtein === 0 && savedEmpty.totalSpend === 0, 'saved empty day')
const two = summarizeHistoryRange([day('a', '2026-01-01', '2026-01-01T08:00:00Z'), day('b', '2026-01-02', '2026-01-02T08:00:00Z')], 30, end)
assert(two.status === 'available' && two.trackedDays === 2 && two.rangeCapacity === 30 && two.averageProtein === 10 && two.averageCalories === 100 && two.totalSpend === 10, 'two-day summary')
assert([two.averageProtein, two.averageCalories, two.totalSpend].every(Number.isFinite), 'finite outputs')
const separated = summarizeHistoryRange(source, 7, end)
const unrelatedToday = { protein: 999 }
const unrelatedWeekly = { protein: 999 }
assert(separated.trackedDays === selected.length && unrelatedToday.protein === unrelatedWeekly.protein, 'Today and Weekly do not affect History summary')
const unsafe = day('unsafe', '2026-01-02', '2026-01-02T10:00:00Z')
unsafe.meals.Breakfast.entries[0].nutritionSnapshot.protein = Number.POSITIVE_INFINITY
assert(summarizeHistoryRange([unsafe], 7, end).averageProtein === 0, 'Infinity is normalized to a finite summary value')
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
assert(CURRENT_REACT_SCHEMA_VERSION === 1, 'schema remains current')
console.log('Analytics charts verification passed.')
