import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, differenceInDays, parseISO, startOfDay, addDays } from 'date-fns'
import { it } from 'date-fns/locale'
import type { CurrentCycleInfo, DayPlan, Meal, ShoppingItem, ShoppingCategory } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Cycle Calculation ────────────────────────────────────────────────────────

export function getCurrentCycleInfo(planStartDate: string, targetDate?: string): CurrentCycleInfo {
  const start = startOfDay(parseISO(planStartDate))
  const target = targetDate ? startOfDay(parseISO(targetDate)) : startOfDay(new Date())
  
  const diffDays = differenceInDays(target, start)
  const cycleDayRaw = ((diffDays % 14) + 14) % 14  // always 0-13
  const cycleDay = cycleDayRaw + 1                  // 1-14

  const weekIndex = cycleDayRaw < 7 ? 0 : 1
  const dayIndex = cycleDayRaw % 7

  return {
    weekIndex,
    dayIndex,
    weekLabel: `Settimana ${weekIndex + 1}`,
    dayLabel: format(target, 'EEEE', { locale: it }),
    cycleDay,
    date: format(target, 'yyyy-MM-dd'),
  }
}

export function getDayPlan(weeks: DayPlan[][], weekIndex: number, dayIndex: number): DayPlan | undefined {
  return weeks[weekIndex]?.[dayIndex]
}

export function getDateCycleInfo(planStartDate: string, date: Date): CurrentCycleInfo {
  return getCurrentCycleInfo(planStartDate, format(date, 'yyyy-MM-dd'))
}

export function getCycleDatesForPeriod(planStartDate: string, daysFromToday: number): CurrentCycleInfo[] {
  const today = new Date()
  return Array.from({ length: daysFromToday }, (_, i) => {
    const d = addDays(today, i)
    return getDateCycleInfo(planStartDate, d)
  })
}

// ─── Shopping List Generation ─────────────────────────────────────────────────

export type ShoppingPeriod = 'today' | 'next3' | 'week' | 'cycle'

export function generateShoppingList(
  weeks: DayPlan[][],
  planStartDate: string,
  period: ShoppingPeriod,
): ShoppingItem[] {
  const today = new Date()
  let days: CurrentCycleInfo[] = []

  switch (period) {
    case 'today':
      days = [getDateCycleInfo(planStartDate, today)]
      break
    case 'next3':
      days = getCycleDatesForPeriod(planStartDate, 3)
      break
    case 'week':
      days = getCycleDatesForPeriod(planStartDate, 7)
      break
    case 'cycle':
      // All 14 days
      days = Array.from({ length: 14 }, (_, i) => {
        const weekIdx = i < 7 ? 0 : 1
        const dayIdx = i % 7
        return {
          weekIndex: weekIdx,
          dayIndex: dayIdx,
          weekLabel: `Settimana ${weekIdx + 1}`,
          dayLabel: '',
          cycleDay: i + 1,
          date: format(addDays(today, i), 'yyyy-MM-dd'),
        }
      })
      break
  }

  // Aggregate ingredients — key by normalised name so the same ingredient
  // is merged even if it appears at different positions across meals
  const ingredientMap = new Map<string, { id: string; name: string; quantities: string[]; category: ShoppingCategory }>()

  for (const dayInfo of days) {
    const dayPlan = getDayPlan(weeks, dayInfo.weekIndex, dayInfo.dayIndex)
    if (!dayPlan) continue

    for (const meal of dayPlan.meals) {
      for (const ingredient of meal.ingredients) {
        const key = ingredient.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
        const existing = ingredientMap.get(key)
        if (existing) {
          existing.quantities.push(ingredient.quantity)
        } else {
          ingredientMap.set(key, {
            id: key,
            name: ingredient.name,
            quantities: [ingredient.quantity],
            category: ingredient.category,
          })
        }
      }
    }
  }

  const items: ShoppingItem[] = []
  ingredientMap.forEach((value, key) => {
    items.push({
      id: `shop-${key}`,
      ingredientId: key,
      name: value.name,
      quantity: value.quantities.filter(Boolean).filter((q, i, arr) => arr.indexOf(q) === i).join(' + '),
      category: value.category,
      checked: false,
    })
  })

  // Sort by category
  const categoryOrder: ShoppingCategory[] = [
    'frutta', 'verdura', 'cereali_pane', 'proteine', 'legumi',
    'frutta_secca_semi', 'latticini_vegetali', 'dispensa', 'altro'
  ]
  items.sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category))

  return items
}

// ─── Meal Prep ────────────────────────────────────────────────────────────────

export function getMealPrepItems(weeks: DayPlan[][]): { meal: Meal; dayLabel: string; weekLabel: string }[] {
  const results: { meal: Meal; dayLabel: string; weekLabel: string }[] = []
  
  for (const week of weeks) {
    for (const day of week) {
      for (const meal of day.meals) {
        if (meal.mealPrepTags && meal.mealPrepTags.length > 0) {
          results.push({
            meal,
            dayLabel: day.label,
            weekLabel: `Sett. ${day.weekIndex + 1}`,
          })
        }
      }
    }
  }

  return results
}

// ─── Quantity Scaling ─────────────────────────────────────────────────────────

/**
 * Moltiplica i valori numerici in una stringa di quantità.
 * Es: scaleQuantity("200g", 1.2) → "240g"
 *     scaleQuantity("1 cucchiaio", 1.1) → "1 cucchiaio"  (interi piccoli non scalati)
 *     scaleQuantity("a piacere", 1.2) → "a piacere"
 */
export function scaleQuantity(qty: string, scale: number): string {
  if (!qty || scale === 1) return qty
  // Only scale numbers >= 5 (grams/ml make sense; "1 egg" or "2 tbsp" would be weird)
  return qty.replace(/(\d+(?:[.,]\d+)?)/g, (match, numStr) => {
    const num = parseFloat(numStr.replace(',', '.'))
    if (num < 5) return match // leave small counts (1 uovo, 2 cucchiai) unchanged
    const scaled = Math.round(num * scale)
    return String(scaled)
  })
}



export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "EEEE d MMMM", { locale: it })
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), "d MMM", { locale: it })
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// ─── Weekly Report ────────────────────────────────────────────────────────────

export interface WeeklyReportData {
  totalDays: number
  completedDays: number
  partialDays: number
  missedDays: number
  doneMeals: number
  skippedMeals: number
  modifiedMeals: number
  topQuestions: string[]
}

export function generateWeeklyReport(
  completedMeals: Record<string, Record<string, { status: string; note?: string }>>,
  diary: Record<string, { adherence?: string; nutritionistQuestions?: string }>,
  planStartDate: string
): WeeklyReportData {
  const today = new Date()
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    format(addDays(today, -(6 - i)), 'yyyy-MM-dd')
  )

  let completedDays = 0, partialDays = 0, missedDays = 0
  let doneMeals = 0, skippedMeals = 0, modifiedMeals = 0
  const questions: string[] = []

  for (const date of weekDates) {
    const entry = diary[date]
    if (entry?.adherence === 'si') completedDays++
    else if (entry?.adherence === 'parzialmente') partialDays++
    else if (entry?.adherence === 'no') missedDays++

    if (entry?.nutritionistQuestions) questions.push(entry.nutritionistQuestions)

    const dayMeals = completedMeals[date] || {}
    for (const meal of Object.values(dayMeals)) {
      if (meal.status === 'done') doneMeals++
      else if (meal.status === 'skipped') skippedMeals++
      else if (meal.status === 'modified') modifiedMeals++
    }
  }

  return {
    totalDays: 7,
    completedDays,
    partialDays,
    missedDays,
    doneMeals,
    skippedMeals,
    modifiedMeals,
    topQuestions: questions.filter(Boolean),
  }
}

export function reportToText(report: WeeklyReportData): string {
  return `📊 Piano Piano — Riepilogo Settimanale

✅ Giorni completati: ${report.completedDays}/7
🔶 Giorni parziali: ${report.partialDays}/7
⬜ Giorni non seguiti: ${report.missedDays}/7

🍽️ Pasti completati: ${report.doneMeals}
✏️ Pasti modificati: ${report.modifiedMeals}
⏭️ Pasti saltati: ${report.skippedMeals}

${report.topQuestions.length > 0 ? `\n❓ Domande per il nutrizionista:\n${report.topQuestions.map(q => `• ${q}`).join('\n')}` : ''}

Inviato da Piano Piano 🌿`
}
