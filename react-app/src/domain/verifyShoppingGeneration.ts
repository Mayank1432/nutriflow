import { createDefaultReactShoppingStore, createDefaultReactWeeklyStore } from '../storage/storageDefaults'
import { isShoppingGeneratedSnapshot, isShoppingItem } from '../storage/storageHelpers'
import type { DailyStapleDefinition, PantryItem, ShoppingItem } from '../storage/storageTypes'
import { buildDailyStapleShoppingCandidates, buildPantryShoppingCandidates, buildShoppingGenerationPreview, buildWeeklyShoppingCandidates, classifyGeneratedCandidate, generatedSnapshotsMatch, planShoppingGeneration } from './shoppingGeneration'

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message) }
const time = '2026-08-12T00:00:00.000Z'
const weekly = createDefaultReactWeeklyStore()
const breakfast = weekly.days[0].meals.Breakfast.entries
breakfast.push({ id: 'a', ingredientId: 'protein', name: ' Tofu ', quantity: 100, unit: 'g', basisType: 'per_100', nutritionSnapshot: { protein: 10, calories: 100, carbs: 2, fat: 2, fibre: 1 }, createdAt: time, updatedAt: time })
weekly.days[1].meals.Lunch.entries.push({ ...breakfast[0], id: 'b', name: 'Later name', quantity: 50 })
weekly.days[2].meals.Dinner.entries.push({ ...breakfast[0], id: 'c', ingredientId: undefined, name: 'Loose item', quantity: 2, unit: 'piece' })
const weeklyCopy = structuredClone(weekly)
const weeklyCandidates = buildWeeklyShoppingCandidates(weekly)
assert(JSON.stringify(weekly) === JSON.stringify(weeklyCopy), 'Weekly extraction must not mutate input')
assert(weeklyCandidates.length === 2, 'Weekly candidates must aggregate only ingredient identity and unit')
assert(weeklyCandidates[0].name === 'Tofu' && weeklyCandidates[0].generated.weekly?.quantity === 150, 'Weekly aggregation/name/order failed')
assert(weeklyCandidates[1].generated.weekly?.occurrenceIds?.[0] === JSON.stringify(['wed', 'Dinner', 'c']), 'Reliable identityless occurrence missing')
weekly.days[3].meals.Snacks.entries.push({ ...breakfast[0], id: '', ingredientId: undefined, name: 'No id' })
assert(buildWeeklyShoppingCandidates(weekly).at(-1)?.generated.weekly?.occurrenceIds === undefined, 'Unreliable occurrence must not persist identity')

const stapleBase: DailyStapleDefinition = { id: 's1', ingredientId: 'protein', name: 'Yogurt', defaultQuantity: 1, defaultMeal: 'Breakfast', unit: 'serving', basisType: 'per_unit', nutrition: { protein: 10, calories: 80, carbs: 4, fat: 1, fibre: 0 }, createdAt: time, updatedAt: time }
const staples = [stapleBase, { ...stapleBase, id: 'archived', isArchived: true }, { ...stapleBase, id: 'dup', name: 'One' }, { ...stapleBase, id: 'dup', name: 'Two' }]
const stapleCopy = structuredClone(staples)
const stapleCandidates = buildDailyStapleShoppingCandidates(staples)
assert(stapleCandidates.length === 1 && stapleCandidates[0].generated.dailyStaple?.quantity === 1, 'Staple extraction/conflict/archive failed')
assert(JSON.stringify(staples) === JSON.stringify(stapleCopy), 'Staple extraction mutated input')

const pantry: PantryItem[] = [{ id: 'p1', ingredientId: 'protein', name: 'Tofu stock', unit: 'g', quantityInStock: 0, inStock: false, lowStock: true, usedOften: false, createdAt: time, updatedAt: time }, { id: 'p2', ingredientId: 'other', name: 'Not low', unit: 'g', quantityInStock: 2, inStock: true, lowStock: false, usedOften: true, createdAt: time, updatedAt: time }]
const pantryCandidates = buildPantryShoppingCandidates(pantry)
assert(pantryCandidates.length === 1 && pantryCandidates[0].generated.pantry?.quantityInStock === 0, 'Pantry must use lowStock and preserve stock-left quantity')

assert(isShoppingGeneratedSnapshot({ weekly: { quantity: 1, unit: 'g', occurrenceIds: ['x'] } }), 'Valid Weekly snapshot rejected')
assert(isShoppingGeneratedSnapshot({ dailyStaple: { stapleId: 's', quantity: 1, unit: 'piece' } }), 'Valid Staple snapshot rejected')
assert(isShoppingGeneratedSnapshot({ pantry: { pantryItemId: 'p', quantityInStock: 0, unit: 'ml' } }), 'Valid Pantry snapshot rejected')
assert(!isShoppingGeneratedSnapshot({ ingredientId: 'only' }) && !isShoppingGeneratedSnapshot({ weekly: { quantity: 0, unit: 'g' } }) && !isShoppingGeneratedSnapshot({ weekly: { quantity: 1, unit: 'g', occurrenceIds: [] } }), 'Invalid generated snapshots accepted')

const active: ShoppingItem = { id: 'active', name: 'Old label', completed: false, createdAt: time, updatedAt: time, generated: { ingredientId: 'protein', weekly: { quantity: 999, unit: 'g' } } }
const completed: ShoppingItem = { ...active, id: 'done', completed: true }
assert(generatedSnapshotsMatch(weeklyCandidates[0].generated, active.generated!), 'Ingredient Weekly match must ignore quantity/name')
assert(classifyGeneratedCandidate(weeklyCandidates[0].generated, [completed, active]) === 'active', 'Active precedence failed')
assert(!generatedSnapshotsMatch({ weekly: { quantity: 2, unit: 'piece' } }, { weekly: { quantity: 2, unit: 'piece' } }), 'Identityless match must not use name/quantity')
assert(generatedSnapshotsMatch({ weekly: { quantity: 1, unit: 'g', occurrenceIds: ['b', 'a'] } }, { weekly: { quantity: 9, unit: 'g', occurrenceIds: ['a', 'b'] } }), 'Occurrence set matching failed')
assert(!generatedSnapshotsMatch({ dailyStaple: { stapleId: 's1', quantity: 1, unit: 'g' } }, { dailyStaple: { stapleId: 's2', quantity: 1, unit: 'g' } }), 'Staples must match by staple ID')
assert(!generatedSnapshotsMatch({ pantry: { pantryItemId: 'p1', quantityInStock: 0, unit: 'g' } }, { pantry: { pantryItemId: 'p2', quantityInStock: 0, unit: 'g' } }), 'Pantry must match by item ID')

const preview = buildShoppingGenerationPreview({ weekly: true, dailyStaple: true, pantry: true }, weeklyCopy, staples, pantry, [completed])
assert(preview.length === 4 && preview[0].source === 'weekly' && preview.at(-1)?.source === 'pantry', 'Source separation/order failed')
assert(preview[0].match === 'completed', 'Completed preview state failed')
const latest = createDefaultReactShoppingStore()
let id = 0
const selectedCopy = structuredClone(preview)
const planned = planShoppingGeneration(latest, preview, time, () => `generated-${++id}`)
assert(planned.added.length === preview.length && planned.store.shoppingItems.every(isShoppingItem), 'Generation plan add failed')
assert(planned.store.shoppingItems.map((item) => item.name).join('|') === preview.map((item) => item.name).join('|'), 'Selected preview order changed')
assert(JSON.stringify(preview) === JSON.stringify(selectedCopy) && latest.shoppingItems.length === 0, 'Planning mutated input')
planned.added[0].generated!.weekly!.quantity = 999
assert(preview[0].generated.weekly!.quantity !== 999, 'Generated snapshot was not deep copied')

const staleNew = { ...preview[0], match: 'new' as const }
const completedLatest = { ...completed, generated: structuredClone(staleNew.generated) }
assert(planShoppingGeneration({ ...latest, shoppingItems: [completedLatest] }, [staleNew], time, () => 'x').added.length === 0, 'Preview-new/latest-completed must skip')
assert(planShoppingGeneration({ ...latest, shoppingItems: [active] }, [preview[0]], time, () => 'x').added.length === 0, 'Latest active must skip')
assert(planShoppingGeneration({ ...latest, shoppingItems: [completedLatest] }, [{ ...staleNew, match: 'completed' }], time, () => 'repeat').added.length === 1, 'Explicit completed opt-in must re-add')
assert(planShoppingGeneration(latest, [], time, () => 'x').store === latest, 'No accepted candidates must preserve store identity')

console.log('Shopping generation verifier: all Task 8.3 assertions passed.')
