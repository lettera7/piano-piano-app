'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Leaf, ChevronRight, ShoppingCart } from 'lucide-react'
import AppShell from '@/components/AppShell'
import MealCard from '@/components/MealCard'
import { useAppStore } from '@/lib/store'
import { getCurrentCycleInfo, getDayPlan, capitalizeFirst, normalizeIngredientName } from '@/lib/utils'
import planData from '@/data/plan.json'
import type { Meal, MealStatus } from '@/types'
import { NutritionPlan } from '@/types'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const defaultPlan = planData as unknown as NutritionPlan

export default function TodayPage() {
  const {
    settings, completedMeals, setMealStatus,
    customShoppingItems, addCustomShoppingItem, customPlan
  } = useAppStore()

  const plan = customPlan ?? defaultPlan
  const today = format(new Date(), 'yyyy-MM-dd')
  const [toast, setToast] = useState<string | null>(null)

  const cycleInfo = useMemo(
    () => getCurrentCycleInfo(settings.planStartDate),
    [settings.planStartDate]
  )

  const dayPlan = useMemo(
    () => getDayPlan(plan.weeks, cycleInfo.weekIndex, cycleInfo.dayIndex),
    [cycleInfo, plan]
  )

  const profile      = settings.activeProfile
  const dayCompletions = completedMeals[profile]?.[today] || {}

  const doneCount  = Object.values(dayCompletions).filter(c => c.status === 'done').length
  const totalMeals = dayPlan?.meals.length || 0
  const progressPct = totalMeals > 0 ? (doneCount / totalMeals) * 100 : 0

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
    const existingNormalized = new Set(customShoppingItems.map(i => normalizeIngredientName(i.name)))
    let added = 0
    for (const ing of meal.ingredients) {
      const key = normalizeIngredientName(ing.name)
      if (!existingNormalized.has(key)) {
        addCustomShoppingItem(ing.name, ing.category)
        added++
      }
    }
    showToast(added === 0
      ? 'Già in lista'
      : `${added} ingredient${added === 1 ? 'e aggiunto' : 'i aggiunti'} ✓`
    )
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  const quantityScale = useAppStore(s => s.profileSettings[profile]?.quantityScale ?? 1)
  const todayLabel = capitalizeFirst(format(new Date(), 'EEEE d MMMM', { locale: it }))

  return (
    <AppShell>
      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up pointer-events-none">
          <div className="flex items-center gap-2 bg-warmgray-800 text-white text-sm font-medium px-4 py-2.5 rounded-2xl shadow-lg whitespace-nowrap">
            <ShoppingCart className="w-3.5 h-3.5 text-sage-300" />
            {toast}
          </div>
        </div>
      )}

      <div className="px-4 pt-5 pb-6 space-y-4 stagger-children">

        {/* ── Day header card ── */}
        <div className="card border border-warmgray-100/60 p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              {/* Week badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-sage-100 text-sage-700 px-3 py-1 rounded-full tracking-wide">
                  <Leaf className="w-3 h-3" />
                  {cycleInfo.weekLabel} · Giorno {cycleInfo.cycleDay}
                </span>
              </div>
              <h2 className="heading-display text-2xl font-bold text-warmgray-900 leading-tight">
                {todayLabel}
              </h2>
              <p className="text-sm text-warmgray-400 mt-1.5 font-medium">
                {doneCount === totalMeals && totalMeals > 0
                  ? '🌿 Tutti i pasti completati!'
                  : `${totalMeals - doneCount} pasti ancora da completare`
                }
              </p>
            </div>

            {/* Progress ring */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="#daeee2" strokeWidth="5" />
                <circle
                  cx="32" cy="32" r="26"
                  fill="none"
                  stroke="#4a8b5c"
                  strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - progressPct / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-sage leading-none">{doneCount}</span>
                <span className="text-[10px] text-warmgray-400 font-medium">/{totalMeals}</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-1.5 bg-sage-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sage rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Quick nav ── */}
        <Link
          href="/plan"
          className="flex items-center justify-between bg-sage-50 border border-sage-100 rounded-2xl px-4 py-3 hover:bg-sage-100 transition-colors"
        >
          <span className="text-sm font-semibold text-sage-700">Vedi il piano completo</span>
          <ChevronRight className="w-4 h-4 text-sage-400" />
        </Link>

        {/* ── Meals ── */}
        {!dayPlan ? (
          <div className="card border border-warmgray-100 p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-warmgray-50 flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-6 h-6 text-warmgray-300" />
            </div>
            <p className="text-warmgray-600 font-semibold mb-1">Piano non configurato</p>
            <p className="text-warmgray-400 text-sm mb-4">
              Imposta la data di inizio piano per vedere i tuoi pasti di oggi.
            </p>
            <Link href="/settings" className="btn-primary text-sm px-5 py-2.5">
              Vai alle impostazioni
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="label-micro px-1">I pasti di oggi</h3>
            {dayPlan.meals.map(meal => (
              <MealCard
                key={meal.id}
                meal={meal}
                date={today}
                completion={dayCompletions[meal.id]}
                onComplete={handleComplete}
                onAddToShopping={handleAddToShopping}
                quantityScale={quantityScale}
              />
            ))}
          </div>
        )}

        {/* ── Disclaimer ── */}
        <div className="rounded-2xl border border-warmgray-100 bg-warmgray-50/60 px-4 py-3.5">
          <p className="text-xs text-warmgray-400 leading-relaxed text-center">
            🌿 Questo piano è stato assegnato dal tuo nutrizionista.
            L'app ti aiuta solo a seguirlo — non sostituisce il consiglio professionale.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
