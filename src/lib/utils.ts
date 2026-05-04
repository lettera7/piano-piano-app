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
  const cycleDayRaw = ((diffDays % 14) + 14) % 14
  const cycleDay = cycleDayRaw + 1

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

// ─── Shopping List — Core Functions ──────────────────────────────────────────

/**
 * Normalizza il nome di un ingrediente per il confronto/deduplicazione.
 * Rimuove: quantità iniziali, unità di misura, note parentetiche,
 * alternative ("o", "/o"), testo dopo virgola.
 *
 * Esempi:
 *  "10 g di mandorle"          → "mandorle"
 *  "15-20 g di mandorle"       → "mandorle"
 *  "1 banana"                  → "banana"
 *  "Cappuccino di soia"        → "cappuccino di soia"
 *  "verdure cotte"             → "verdure cotte"
 *  "Pane integrale , o fette"  → "pane integrale"
 */
export function normalizeIngredientName(name: string): string {
  let n = name.toLowerCase().trim()

  // Rimuovi contenuto tra parentesi
  n = n.replace(/\(.*?\)/g, '').trim()

  // Rimuovi quantità iniziali con unità: "10 g di", "15-20 ml di", "1-2 "
  // Pattern: numero (opzionalmente trattino-numero) + spazio + unità? + "di "?
  n = n.replace(/^\d+(?:[,.]?\d+)?(?:\s*[-–]\s*\d+(?:[,.]?\d+)?)?\s*(?:g|gr|ml|kg|cl|l|dl|oz|mg)?\s*(?:di\s+)?/i, '').trim()

  // Rimuovi "di " residuo all'inizio
  n = n.replace(/^di\s+/i, '').trim()

  // Tronca alle alternative: " , o ", " /o ", " o " (preceduta da spazio)
  n = n.split(/\s*[,;]\s*(?:o\s+|oppure\s+)?|\s+\/o\s+/)[0].trim()

  // Rimuovi " con " e tutto il resto (es. "1-2 carote piccole con hummus")
  n = n.split(/\s+con\s+/)[0].trim()

  // Normalizza accenti, spazi multipli
  n = n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim()

  return n || name.toLowerCase().trim()
}

/**
 * Aggrega gli ingredienti, sommando quantità dove possibile.
 * Restituisce una chiave stabile e il nome canonico (primo trovato, titolizzato).
 */
export function aggregateIngredients(
  items: Array<{ name: string; quantity: string; category: ShoppingCategory }>
): Array<{ key: string; name: string; quantity: string; category: ShoppingCategory; occurrences: number }> {
  const map = new Map<string, {
    name: string
    quantities: string[]
    category: ShoppingCategory
    occurrences: number
  }>()

  for (const item of items) {
    const key = normalizeIngredientName(item.name)

    if (map.has(key)) {
      const entry = map.get(key)!
      entry.occurrences++
      if (item.quantity && !entry.quantities.includes(item.quantity)) {
        entry.quantities.push(item.quantity)
      }
    } else {
      map.set(key, {
        // Usa il nome più corto come nome canonico (senza "N g di" prefix)
        name: item.name,
        quantities: item.quantity ? [item.quantity] : [],
        category: item.category,
        occurrences: 1,
      })
    }
  }

  return Array.from(map.entries()).map(([key, val]) => ({
    key,
    name: val.name,
    quantity: val.quantities.filter(Boolean).join(' + '),
    category: val.category,
    occurrences: val.occurrences,
  }))
}

export type ShoppingPeriod = 'today' | 'next3' | 'week' | 'cycle'

/**
 * Genera la lista della spesa dal piano nutrizionale per il periodo scelto.
 * Nessuna lista hardcoded — tutto viene dai dati reali del piano.
 */
export function getShoppingListFromPlan(
  weeks: DayPlan[][],
  planStartDate: string,
  period: ShoppingPeriod,
): ShoppingItem[] {
  let days: CurrentCycleInfo[] = []

  switch (period) {
    case 'today':
      days = [getDateCycleInfo(planStartDate, new Date())]
      break
    case 'next3':
      days = getCycleDatesForPeriod(planStartDate, 3)
      break
    case 'week':
      days = getCycleDatesForPeriod(planStartDate, 7)
      break
    case 'cycle':
      // Tutti i 14 giorni del ciclo — usa gli indici, non le date
      days = Array.from({ length: 14 }, (_, i) => ({
        weekIndex: i < 7 ? 0 : 1,
        dayIndex: i % 7,
        weekLabel: `Settimana ${i < 7 ? 1 : 2}`,
        dayLabel: '',
        cycleDay: i + 1,
        date: format(addDays(new Date(), i), 'yyyy-MM-dd'),
      }))
      break
  }

  // Raccoglie tutti gli ingredienti del periodo
  const rawIngredients: Array<{ name: string; quantity: string; category: ShoppingCategory }> = []

  for (const dayInfo of days) {
    const dayPlan = getDayPlan(weeks, dayInfo.weekIndex, dayInfo.dayIndex)
    if (!dayPlan) continue

    for (const meal of dayPlan.meals) {
      for (const ingredient of meal.ingredients) {
        if (ingredient.name?.trim()) {
          rawIngredients.push({
            name: ingredient.name.trim(),
            quantity: ingredient.quantity?.trim() || '',
            category: ingredient.category,
          })
        }
      }
    }
  }

  const aggregated = aggregateIngredients(rawIngredients)

  // Ordine categorie
  const categoryOrder: ShoppingCategory[] = [
    'frutta', 'verdura', 'cereali_pane', 'proteine', 'legumi',
    'frutta_secca_semi', 'latticini_vegetali', 'dispensa', 'altro'
  ]

  const items: ShoppingItem[] = aggregated.map(a => ({
    id: `shop-${a.key}`,
    ingredientId: a.key,
    name: a.name,
    quantity: a.quantity,
    category: a.category,
    checked: false,
  }))

  items.sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category))

  return items
}

// Alias per retrocompatibilità
export function generateShoppingList(
  weeks: DayPlan[][],
  planStartDate: string,
  period: ShoppingPeriod,
): ShoppingItem[] {
  return getShoppingListFromPlan(weeks, planStartDate, period)
}

// Unisce lista generata con elementi manuali, evitando duplicati per nome normalizzato
export function mergeManualItems(
  generated: ShoppingItem[],
  manual: ShoppingItem[]
): ShoppingItem[] {
  const generatedKeys = new Set(generated.map(i => normalizeIngredientName(i.name)))
  const uniqueManual = manual.filter(m => {
    const key = normalizeIngredientName(m.name)
    return !generatedKeys.has(key)
  })
  return [...generated, ...uniqueManual]
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

export function scaleQuantity(qty: string, scale: number): string {
  if (!qty || scale === 1) return qty
  return qty.replace(/(\d+(?:[.,]\d+)?)/g, (match, numStr) => {
    const num = parseFloat(numStr.replace(',', '.'))
    if (num < 5) return match
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
