// ─── Plan Types ─────────────────────────────────────────────────────────────

export type MealPrepTag = 'preparabile' | 'ricorrente' | 'da_scongelare' | 'batch_cooking'
export type ShoppingCategory =
  | 'frutta'
  | 'verdura'
  | 'cereali_pane'
  | 'proteine'
  | 'legumi'
  | 'frutta_secca_semi'
  | 'latticini_vegetali'
  | 'dispensa'
  | 'altro'

export type MealType = 'colazione' | 'spuntino_mattina' | 'pranzo' | 'spuntino_pomeriggio' | 'cena'

export interface Ingredient {
  id: string
  name: string
  quantity: string
  category: ShoppingCategory
}

export interface MealAlternative {
  id: string
  title: string
  description?: string
  ingredients?: Ingredient[]
}

export interface Meal {
  id: string
  type: MealType
  title: string
  description: string
  quantity: string
  ingredients: Ingredient[]
  alternatives: MealAlternative[]
  mealPrepTags?: MealPrepTag[]
  note?: string
}

export interface DayPlan {
  dayIndex: number   // 0-6 (lunedì-domenica)
  weekIndex: number  // 0 or 1
  label: string      // "Lunedì"
  meals: Meal[]
}

export interface NutritionPlan {
  id: string
  name: string
  description: string
  weeks: DayPlan[][] // [week0[7 days], week1[7 days]]
}

// ─── App State Types ─────────────────────────────────────────────────────────

export type ProfileId = 'marina' | 'luca'

export interface Profile {
  id: ProfileId
  name: string
  emoji: string
  portionNotes: Record<string, string> // mealId → note porzione
}

export type MealStatus = 'pending' | 'done' | 'modified' | 'skipped'

export interface MealCompletion {
  status: MealStatus
  note?: string
  modifiedDescription?: string
  timestamp?: string
}

export type DiaryAdherence = 'si' | 'parzialmente' | 'no'
export type DiaryHunger = 'bassa' | 'media' | 'alta'
export type DiaryEnergy = 'bassa' | 'normale' | 'buona'
export type DiaryDigestion = 'ok' | 'pesantezza' | 'gonfiore' | 'nausea' | 'altro'

export interface DiaryEntry {
  date: string // ISO yyyy-MM-dd
  adherence?: DiaryAdherence
  hunger?: DiaryHunger
  energy?: DiaryEnergy
  digestion?: DiaryDigestion
  notes?: string
  nutritionistQuestions?: string
}

export interface ShoppingItem {
  id: string
  ingredientId: string
  name: string
  quantity: string
  category: ShoppingCategory
  checked: boolean
  custom?: boolean
}

export interface AppSettings {
  planStartDate: string   // ISO yyyy-MM-dd
  activeProfile: ProfileId
  planId: string
}

export interface AppState {
  settings: AppSettings
  // completedMeals[profileId][date][mealId] = MealCompletion
  completedMeals: Record<ProfileId, Record<string, Record<string, MealCompletion>>>
  diary: Record<string, DiaryEntry>           // date → entry
  shoppingList: ShoppingItem[]
  customShoppingItems: ShoppingItem[]
}

// ─── Utility Types ────────────────────────────────────────────────────────────

export interface CurrentCycleInfo {
  weekIndex: number
  dayIndex: number
  weekLabel: string
  dayLabel: string
  cycleDay: number   // 1-14
  date: string
}

export const MEAL_LABELS: Record<MealType, string> = {
  colazione: 'Colazione',
  spuntino_mattina: 'Spuntino mattina',
  pranzo: 'Pranzo',
  spuntino_pomeriggio: 'Spuntino pomeriggio',
  cena: 'Cena',
}

export const MEAL_ICONS: Record<MealType, string> = {
  colazione: '☀️',
  spuntino_mattina: '🍎',
  pranzo: '🫙',
  spuntino_pomeriggio: '🌿',
  cena: '🌙',
}

export const SHOPPING_CATEGORY_LABELS: Record<ShoppingCategory, string> = {
  frutta: '🍊 Frutta',
  verdura: '🥦 Verdura',
  cereali_pane: '🌾 Cereali e pane',
  proteine: '🐟 Proteine',
  legumi: '🫘 Legumi',
  frutta_secca_semi: '🌰 Frutta secca e semi',
  latticini_vegetali: '🥛 Latticini / Alt. vegetali',
  dispensa: '🧂 Dispensa',
  altro: '📦 Altro',
}

export const DAY_LABELS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']
