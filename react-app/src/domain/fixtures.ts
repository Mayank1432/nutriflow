import type {
  FoodLibrary,
  HistoryEntry,
  Ingredient,
  PlanDay,
  TodayData,
  WeekData,
} from './types'

export const mockLibrary: FoodLibrary = {
  egg: {
    n: 'Mock whole egg',
    u: 'piece',
    pr: 6,
    kc: 78,
    carb: 0.6,
    fat: 5,
    fibre: 0,
    pp: 8,
  },
  milk: {
    n: 'Mock milk',
    u: 'ml',
    pr: 0.032,
    kc: 0.6,
    carb: 0.048,
    fat: 0.03,
    fibre: 0,
    pp: 0.06,
  },
  custom_soya: {
    n: 'Mock custom soya',
    u: 'g',
    pr: 0.52,
    kc: 3.45,
    carb: 0.33,
    fat: 0.005,
    fibre: 0.13,
    pp: 0.22,
    customFlag: true,
  },
}

export const chickenPer100: Ingredient = {
  name: 'Mock chicken',
  qty: 150,
  unit: 'g',
  pr100: 22.5,
  kc100: 120,
  carb100: 0,
  fat100: 3.1,
  fibre100: 0,
  pp100: 52,
}

export const soyaPer100: Ingredient = {
  name: 'Mock soya chunks',
  qty: 50,
  unit: 'g',
  pr100: 52,
  kc100: 345,
  carb100: 33,
  fat100: 0.5,
  fibre100: 13,
  pp100: 22,
}

export const eggPerUnit: Ingredient = {
  libId: 'egg',
  name: 'Mock whole egg',
  qty: 2,
  unit: 'piece',
}

export const milkPerUnit: Ingredient = {
  libId: 'milk',
  name: 'Mock milk',
  qty: 250,
  unit: 'ml',
}

export const decimalQuantity: Ingredient = {
  name: 'Mock decimal oats',
  qty: 37.5,
  unit: 'g',
  pr100: 12,
  kc100: 380,
  carb100: 68,
  fat100: 7,
  fibre100: 10,
  pp100: 18,
}

export const zeroQuantity: Ingredient = {
  ...chickenPer100,
  name: 'Mock zero quantity',
  qty: 0,
}

export const blankNumericFields: Ingredient = {
  name: 'Mock blank values',
  qty: '',
  unit: 'g',
  pr100: '',
  kc100: null,
  carb100: undefined,
  fat100: '',
  fibre100: null,
  pp100: '',
}

export const invalidNumericFields: Ingredient = {
  name: 'Mock invalid values',
  qty: 'not-a-number',
  unit: 'g',
  pr100: 'invalid',
  kc100: 'NaN',
  carb100: 'bad',
  fat100: 'bad',
  fibre100: 'bad',
  pp100: 'bad',
}

export const missingOptionalMacros: Ingredient = {
  name: 'Mock missing optional macros',
  qty: 100,
  unit: 'g',
  pr100: 10,
  kc100: 90,
}

export const customLibraryIngredient: Ingredient = {
  libId: 'custom_soya',
  name: 'Mock custom soya',
  qty: 25,
  unit: 'g',
  copiedFromCustomLibrary: true,
}

export const copiedPlannerIngredient: Ingredient = {
  ...chickenPer100,
  name: 'Mock copied planner chicken',
  source: 'weekly-planner',
}

export const emptyToday: TodayData = {
  dateKey: '2099-01-01',
  meals: {
    breakfast: { dishes: [] },
    lunch: { dishes: [] },
    dinner: { dishes: [] },
    snacks: { dishes: [] },
  },
}

export const populatedToday: TodayData = {
  dateKey: '2099-01-02',
  meals: {
    breakfast: {
      dishes: [
        {
          id: 'mock-breakfast',
          name: 'Mock breakfast',
          ingredients: [eggPerUnit, milkPerUnit],
        },
      ],
    },
    lunch: {
      dishes: [
        {
          id: 'mock-lunch',
          name: 'Mock lunch',
          ingredients: [chickenPer100],
          unknownDishField: 'preserved',
        },
      ],
    },
    dinner: { dishes: [{ name: 'Empty mock dish', ingredients: [] }] },
    snacks: { dishes: null },
  },
  unknownTodayField: { compatible: true },
}

export const weeklyPlannerDay: PlanDay = {
  breakfast: [eggPerUnit],
  lunch: [{ ...chickenPer100, qty: 100 }],
  dinner: [customLibraryIngredient],
  snacks: [],
}

export const emptyPlannerDay: PlanDay = {}

export const legacyHistoryEntry: HistoryEntry = {
  savedAt: '2099-01-02T12:00:00.000Z',
  staples: [
    {
      name: 'Mock legacy egg',
      qty: 1,
      unit: 'piece',
      checked: true,
      mealId: 'breakfast',
      pr: 6,
      kc: 78,
      carb: 0.6,
      fat: 5,
      fibre: 0,
      pp: 8,
    },
    {
      name: 'Unchecked mock staple',
      qty: 10,
      checked: false,
      pr: 99,
    },
  ],
  meals: populatedToday.meals,
  legacyExtra: 'accepted',
}

export const missingArraysToday: TodayData = {
  meals: {
    breakfast: {},
    lunch: { dishes: null },
  },
}

export const mockTodayPrototype: TodayData = {
  dateKey: '2099-02-01',
  meals: {
    breakfast: {
      dishes: [{
        id: 'prototype-breakfast',
        ingredients: [{
          id: 'mock-eggs',
          name: 'Whole eggs',
          qty: 2,
          unit: 'piece',
          entryMode: 'enteredQuantity',
          baseQty: 2,
          baseProtein: 12,
          baseCalories: 156,
          baseCarbs: 1.2,
          baseFat: 10,
          baseFibre: 0,
          baseCost: 16,
        }],
      }],
    },
    lunch: {
      dishes: [{
        id: 'prototype-lunch',
        ingredients: [{
          id: 'mock-chicken-rice',
          name: 'Chicken rice bowl',
          qty: 350,
          unit: 'g',
          entryMode: 'enteredQuantity',
          baseQty: 350,
          baseProtein: 42,
          baseCalories: 540,
          baseCarbs: 58,
          baseFat: 14,
          baseFibre: 5,
          baseCost: 118,
        }],
      }],
    },
    dinner: {
      dishes: [{ id: 'prototype-dinner', ingredients: [] }],
    },
    snacks: {
      dishes: [{
        id: 'prototype-snacks',
        ingredients: [{
          id: 'mock-yogurt',
          name: 'Greek yogurt',
          qty: 200,
          unit: 'g',
          entryMode: 'enteredQuantity',
          baseQty: 200,
          baseProtein: 18,
          baseCalories: 146,
          baseCarbs: 8,
          baseFat: 4,
          baseFibre: 0,
          baseCost: 64,
        }],
      }],
    },
  },
}

export const mockWeekPrototype: WeekData = {
  days: {
    mon: mockTodayPrototype,
    tue: {
      dateKey: 'mock-tue',
      meals: {
        breakfast: {
          dishes: [{
            id: 'tue-breakfast',
            ingredients: [{
              id: 'tue-oats',
              name: 'Fruit oats bowl',
              qty: 320,
              unit: 'g',
              entryMode: 'enteredQuantity',
              baseQty: 320,
              baseProtein: 15,
              baseCalories: 380,
              baseCarbs: 62,
              baseFat: 8,
              baseFibre: 9,
              baseCost: 35,
            }],
          }],
        },
        lunch: { dishes: [{ id: 'tue-lunch', ingredients: [] }] },
        dinner: {
          dishes: [{
            id: 'tue-dinner',
            ingredients: [{
              id: 'tue-paneer',
              name: 'Paneer dinner plate',
              qty: 420,
              unit: 'g',
              entryMode: 'enteredQuantity',
              baseQty: 420,
              baseProtein: 32,
              baseCalories: 520,
              baseCarbs: 24,
              baseFat: 32,
              baseFibre: 5,
              baseCost: 140,
            }],
          }],
        },
        snacks: { dishes: [{ id: 'tue-snacks', ingredients: [] }] },
      },
    },
    wed: {
      dateKey: 'mock-wed',
      meals: {
        breakfast: { dishes: [{ id: 'wed-breakfast', ingredients: [] }] },
        lunch: { dishes: [{ id: 'wed-lunch', ingredients: [] }] },
        dinner: { dishes: [{ id: 'wed-dinner', ingredients: [] }] },
        snacks: { dishes: [{ id: 'wed-snacks', ingredients: [] }] },
      },
    },
    thu: {
      dateKey: 'mock-thu',
      meals: {
        breakfast: { dishes: [{ id: 'thu-breakfast', ingredients: [] }] },
        lunch: {
          dishes: [{
            id: 'thu-lunch',
            ingredients: [{
              id: 'thu-lentils',
              name: 'Lentil grain bowl',
              qty: 410,
              unit: 'g',
              entryMode: 'enteredQuantity',
              baseQty: 410,
              baseProtein: 24,
              baseCalories: 430,
              baseCarbs: 66,
              baseFat: 9,
              baseFibre: 16,
              baseCost: 72,
            }],
          }],
        },
        dinner: { dishes: [{ id: 'thu-dinner', ingredients: [] }] },
        snacks: { dishes: [{ id: 'thu-snacks', ingredients: [] }] },
      },
    },
    fri: {
      dateKey: 'mock-fri',
      meals: {
        breakfast: { dishes: [] },
        lunch: { dishes: [] },
        dinner: { dishes: [] },
        snacks: { dishes: [] },
      },
    },
    sat: {
      dateKey: 'mock-sat',
      meals: {
        breakfast: { dishes: [] },
        lunch: { dishes: [] },
        dinner: { dishes: [] },
        snacks: { dishes: [] },
      },
    },
    sun: {
      dateKey: 'mock-sun',
      meals: {
        breakfast: { dishes: [] },
        lunch: { dishes: [] },
        dinner: { dishes: [] },
        snacks: { dishes: [] },
      },
    },
  },
}
