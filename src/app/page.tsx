'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { ChevronRight, ShoppingCart } from 'lucide-react'
import AppShell from '@/components/AppShell'
import MealCard from '@/components/MealCard'
import { useAppStore } from '@/lib/store'
import { getCurrentCycleInfo, getDayPlan, capitalizeFirst, normalizeIngredientName } from '@/lib/utils'
import planData from '@/data/plan.json'
import type { Meal, MealStatus } from '@/types'
import { NutritionPlan } from '@/types'
import Link from 'next/link'

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

  // Format day parts for editorial header
  const dayOfWeek = capitalizeFirst(format(new Date(), 'EEEE', { locale: it }))
  const dayNumber = format(new Date(), 'd')
  const monthYear = capitalizeFirst(format(new Date(), 'MMMM', { locale: it }))

  return (
    <AppShell>
      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up pointer-events-none">
          <div
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-lg whitespace-nowrap"
            style={{ background: 'var(--color-ink)' }}
          >
            <ShoppingCart className="w-3.5 h-3.5" style={{ color: 'var(--color-orange)' }} />
            {toast}
          </div>
        </div>
      )}

      <div className="px-4 pt-4 pb-6 space-y-4 stagger-children">

        {/* ── EDITORIAL HERO HEADER ── */}
        <div
          className="rounded-[28px] overflow-hidden relative"
          style={{ background: 'var(--color-ink)' }}
        >
          {/* Big decorative letter in background */}
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 select-none pointer-events-none leading-none"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '9rem',
              color: 'rgba(255,255,255,0.04)',
              letterSpacing: '-0.05em',
            }}
          >
            {dayNumber}
          </div>

          <div className="px-5 py-5 relative z-10">
            {/* Cycle badge */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[10px] font-bold tracking-[0.12em] uppercase px-3 py-1 rounded-full"
                style={{ background: 'var(--color-orange)', color: '#fff' }}
              >
                {cycleInfo.weekLabel} · Giorno {cycleInfo.cycleDay}
              </span>
            </div>

            {/* Day name — big editorial */}
            <div className="flex items-end justify-between">
              <div>
                <p
                  className="text-[11px] font-medium mb-1 tracking-wide"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  {monthYear}
                </p>
                <h2
                  className="heading-display text-[3.2rem] text-white leading-none"
                >
                  {dayOfWeek}
                </h2>
              </div>

              {/* Progress ring */}
              <div className="flex flex-col items-center gap-1">
                <div className="relative w-[68px] h-[68px]">
                  <svg className="w-[68px] h-[68px] -rotate-90" viewBox="0 0 68 68">
                    <circle cx="34" cy="34" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
                    <circle
                      cx="34" cy="34" r="28"
                      fill="none"
                      stroke="var(--color-orange)"
                      strokeWidth="5"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - progressPct / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[22px] font-bold text-white leading-none" style={{ fontFamily: 'var(--font-display)' }}>
                      {doneCount}
                    </span>
                    <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      /{totalMeals}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {doneCount === totalMeals && totalMeals > 0 ? 'Tutto fatto!' : 'pasti'}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%`, background: 'var(--color-orange)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick nav ── */}
        <Link
          href="/plan"
          className="flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-200 active:scale-[0.98]"
          style={{ background: 'var(--color-orange-pale)' }}
        >
          <span className="text-sm font-bold" style={{ color: 'var(--color-orange-dark)' }}>
            Vedi il piano completo
          </span>
          <ChevronRight className="w-4 h-4" style={{ color: 'var(--color-orange)' }} />
        </Link>

        {/* ── Meals ── */}
        {!dayPlan ? (
          <div className="card p-10 text-center">
            <div
              className="w-14 h-14 rounded-3xl flex items-center justify-center mx-auto mb-4 text-2xl"
              style={{ background: 'var(--color-cream)' }}
            >
              🌿
            </div>
            <p className="font-bold text-lg mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              Piano non configurato
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--color-ink-light)' }}>
              Imposta la data di inizio piano per vedere i tuoi pasti.
            </p>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white text-sm font-bold transition-all active:scale-95"
              style={{ background: 'var(--color-orange)' }}
            >
              Vai alle impostazioni
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="label-micro px-1">I pasti di oggi</p>
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
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: 'var(--color-cream-dark)' }}
        >
          <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--color-ink-light)' }}>
            🌿 Questo piano è stato assegnato dal tuo nutrizionista. L'app ti aiuta solo a seguirlo.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
