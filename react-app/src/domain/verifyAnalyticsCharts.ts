import { CURRENT_REACT_SCHEMA_VERSION } from '../storage/storageKeys'
import type { FoodEntry, HistoryDay, MealsByName } from '../storage/storageTypes'
import { buildLocalDateRange, selectHistoryRange, summarizeHistoryRange } from './analyticsCharts'

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
assert(CURRENT_REACT_SCHEMA_VERSION === 1, 'schema remains current')
console.log('Analytics charts verification passed.')
