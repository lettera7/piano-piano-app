import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  AppState, AppSettings, ProfileId, MealCompletion,
  DiaryEntry, ShoppingItem, ShoppingCategory
} from '@/types'
import { format } from 'date-fns'

interface AppStore extends AppState {
  // Settings
  updateSettings: (s: Partial<AppSettings>) => void
  setActiveProfile: (p: ProfileId) => void
  setPlanStartDate: (d: string) => void

  // Meals
  setMealStatus: (profile: ProfileId, date: string, mealId: string, completion: MealCompletion) => void
  getMealStatus: (profile: ProfileId, date: string, mealId: string) => MealCompletion | undefined
  resetDayMeals: (profile: ProfileId, date: string) => void

  // Diary
  saveDiaryEntry: (date: string, entry: Partial<DiaryEntry>) => void
  getDiaryEntry: (date: string) => DiaryEntry | undefined

  // Plan
  setCustomPlan: (plan: import('@/types').NutritionPlan | null) => void

  // Shopping
  setShoppingList: (items: ShoppingItem[]) => void
  toggleShoppingItem: (itemId: string) => void
  addCustomShoppingItem: (name: string, category: ShoppingCategory) => void
  removeShoppingItem: (itemId: string) => void
  clearShoppingChecked: () => void
}

const today = format(new Date(), 'yyyy-MM-dd')

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ─── Initial State ──────────────────────────────────────────────────
      settings: {
        planStartDate: today,
        activeProfile: 'marina',
        planId: 'piano-2sett-001',
      },
      completedMeals: {
        marina: {},
        luca: {},
      },
      diary: {},
      shoppingList: [],
      customShoppingItems: [],
      customPlan: null,

      // ─── Settings ──────────────────────────────────────────────────────
      updateSettings: (s) =>
        set((state) => ({ settings: { ...state.settings, ...s } })),

      setActiveProfile: (profile) =>
        set((state) => ({ settings: { ...state.settings, activeProfile: profile } })),

      setPlanStartDate: (date) =>
        set((state) => ({ settings: { ...state.settings, planStartDate: date } })),

      // ─── Meals ─────────────────────────────────────────────────────────
      setMealStatus: (profile, date, mealId, completion) =>
        set((state) => ({
          completedMeals: {
            ...state.completedMeals,
            [profile]: {
              ...state.completedMeals[profile],
              [date]: {
                ...(state.completedMeals[profile][date] || {}),
                [mealId]: completion,
              },
            },
          },
        })),

      getMealStatus: (profile, date, mealId) => {
        const state = get()
        return state.completedMeals[profile]?.[date]?.[mealId]
      },

      resetDayMeals: (profile, date) =>
        set((state) => {
          const profileMeals = { ...state.completedMeals[profile] }
          delete profileMeals[date]
          return {
            completedMeals: {
              ...state.completedMeals,
              [profile]: profileMeals,
            },
          }
        }),

      // ─── Diary ─────────────────────────────────────────────────────────
      saveDiaryEntry: (date, entry) =>
        set((state) => ({
          diary: {
            ...state.diary,
            [date]: {
              ...(state.diary[date] || { date }),
              ...entry,
            },
          },
        })),

      getDiaryEntry: (date) => get().diary[date],

      // ─── Plan ──────────────────────────────────────────────────────────
      setCustomPlan: (plan) => set({ customPlan: plan }),

      // ─── Shopping ──────────────────────────────────────────────────────
      setShoppingList: (items) => set({ shoppingList: items }),

      toggleShoppingItem: (itemId) =>
        set((state) => ({
          shoppingList: state.shoppingList.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
          ),
          customShoppingItems: state.customShoppingItems.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
          ),
        })),

      addCustomShoppingItem: (name, category) => {
        const id = `custom-${Date.now()}`
        set((state) => ({
          customShoppingItems: [
            ...state.customShoppingItems,
            { id, ingredientId: id, name, quantity: '', category, checked: false, custom: true },
          ],
        }))
      },

      removeShoppingItem: (itemId) =>
        set((state) => ({
          shoppingList: state.shoppingList.filter((i) => i.id !== itemId),
          customShoppingItems: state.customShoppingItems.filter((i) => i.id !== itemId),
        })),

      clearShoppingChecked: () =>
        set((state) => ({
          shoppingList: state.shoppingList.map((i) => ({ ...i, checked: false })),
          customShoppingItems: state.customShoppingItems.map((i) => ({ ...i, checked: false })),
        })),
    }),
    {
      name: 'piano-piano-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
