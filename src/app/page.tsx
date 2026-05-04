'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Leaf, ChevronRight, ShoppingCart } from 'lucide-react'
import AppShell from '@/components/AppShell'
import MealCard from '@/components/MealCard'
import { useAppStore } from '@/lib/store'
import { getCurrentCycleInfo, getDayPlan, capitalizeFirst } from '@/lib/utils'
import planData from '@/data/plan.json'
import type { Meal, MealStatus } from '@/types'
import { NutritionPlan } from '@/types'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const defaultPlan = planData as unknown as NutritionPlan

export default function TodayPage() {
  const { settings, completedMeals, setMealStatus, customShoppingItems, addCustomShoppingItem, customPlan } = useAppStore()
  const plan = customPlan ?? defaultPlan
  const today = format(new Date(), 'yyyy-MM-dd')
  const [toast, setToast] = useState<string | null>(null)

  const cycleInfo = useMemo(
    () => getCurrentCycleInfo(settings.planStartDate),
    [settings.planStartDate]
  )

  const dayPlan = useMemo(
    () => getDayPlan(plan.weeks, cycleInfo.weekIndex, cycleInfo.dayIndex),
    [cycleInfo]
  )

  const profile = settings.activeProfile
  const dayCompletions = completedMeals[profile]?.[today] || {}

  const doneCount = Object.values(dayCompletions).filter(c => c.status === 'done').length
  const totalMeals = dayPlan?.meals.length || 0

  const handleComplete = (mealId: string, status: MealStatus, note?: string) => {
    setMealStatus(profile, today, mealId, {
      status,
      note,
      timestamp: new Date().toISOString(),
    })
  }

  const handleAddToShopping = (meal: Meal) => {
    if (meal.ingredients.length === 0) {
      showToast('Nessun ingrediente da aggiungere')
      return
    }
    // Deduplicate: skip ingredients already in custom list
    const existingNames = new Set(customShoppingItems.map(i => i.name.toLowerCase()))
    let added = 0
    for (const ing of meal.ingredients) {
      const label = ing.quantity ? `${ing.name} — ${ing.quantity}` : ing.name
      if (!existingNames.has(label.toLowerCase())) {
        addCustomShoppingItem(label, ing.category)
        added++
      }
    }
    if (added === 0) {
      showToast('Ingredienti già in lista')
    } else {
      showToast(`${added} ingredient${added === 1 ? 'e aggiunto' : 'i aggiunti'} alla spesa ✓`)
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const todayLabel = capitalizeFirst(format(new Date(), 'EEEE d MMMM', { locale: it }))
  const progressPct = totalMeals > 0 ? (doneCount / totalMeals) * 100 : 0

  return (
    <AppShell>
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="flex items-center gap-2 bg-warmgray-900 text-white text-sm font-medium px-4 py-2.5 rounded-2xl shadow-lg whitespace-nowrap">
            <ShoppingCart className="w-4 h-4 text-sage" />
            {toast}
          </div>
        </div>
      )}
      <div className="px-4 pt-4 pb-2 space-y-5 stagger-children">
        {/* Day header */}
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-sage-100 text-sage-700 px-2.5 py-1 rounded-full">
                  <Leaf className="w-3 h-3" />
                  {cycleInfo.weekLabel} · Giorno {cycleInfo.cycleDay}
                </span>
              </div>
              <h2 className="heading-display text-2xl font-bold text-warmgray-900 leading-tight">
                {todayLabel}
              </h2>
              <p className="text-sm text-warmgray-500 mt-1">
                Oggi il piano prevede {totalMeals} pasti
              </p>
            </div>

            {/* Progress circle */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="#e0ece0" strokeWidth="5" />
                <circle
                  cx="32" cy="32" r="26"
                  fill="none"
                  stroke="#5e9e5e"
                  strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - progressPct / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-sage-600 leading-none">{doneCount}</span>
                <span className="text-[10px] text-warmgray-400">/{totalMeals}</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-1.5 bg-sage-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sage-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {doneCount === totalMeals && totalMeals > 0 ? (
              <p className="text-xs text-sage-600 font-medium mt-1.5">🌿 Tutti i pasti completati, ottimo lavoro!</p>
            ) : (
              <p className="text-xs text-warmgray-400 mt-1.5">
                {totalMeals - doneCount} pasti ancora da fare
              </p>
            )}
          </div>
        </div>

        {/* Quick nav to plan */}
        <div className="flex gap-2">
          <Link href="/plan" className="flex-1 flex items-center justify-between bg-sage-50 border border-sage-100 rounded-2xl px-4 py-3 hover:bg-sage-100 transition-colors">
            <span className="text-sm font-medium text-sage-700">Vedi il piano completo</span>
            <ChevronRight className="w-4 h-4 text-sage-500" />
          </Link>
        </div>

        {/* Meals */}
        {!dayPlan ? (
          <div className="card p-8 text-center">
            <p className="text-warmgray-500 text-sm">
              Imposta la data di inizio piano nelle impostazioni per vedere il tuo piano di oggi.
            </p>
            <Link href="/settings" className="mt-3 inline-block text-sage-600 font-medium text-sm underline underline-offset-2">
              Vai alle impostazioni
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-warmgray-500 uppercase tracking-wide px-1">
              I pasti di oggi
            </h3>
            {dayPlan.meals.map(meal => (
              <MealCard
                key={meal.id}
                meal={meal}
                date={today}
                completion={dayCompletions[meal.id]}
                onComplete={handleComplete}
                onAddToShopping={handleAddToShopping}
              />
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-warmgray-50 border border-warmgray-100 rounded-2xl p-4">
          <p className="text-xs text-warmgray-400 leading-relaxed text-center">
            🌿 Questo piano è stato assegnato dal tuo nutrizionista. L'app ti aiuta solo a seguirlo — non sostituisce il consiglio professionale.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
