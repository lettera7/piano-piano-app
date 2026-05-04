'use client'

import { useMemo, useState } from 'react'
import { addDays, format } from 'date-fns'
import { it } from 'date-fns/locale'
import { ChevronRight } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { useAppStore } from '@/lib/store'
import { getDateCycleInfo, getDayPlan, capitalizeFirst } from '@/lib/utils'
import planData from '@/data/plan.json'
import type { NutritionPlan } from '@/types'
import { MEAL_ICONS } from '@/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const defaultPlan = planData as unknown as NutritionPlan

export default function PlanPage() {
  const { settings, completedMeals, customPlan } = useAppStore()
  const plan = customPlan ?? defaultPlan
  const [selectedWeek, setSelectedWeek] = useState<0 | 1>(0)
  const today = format(new Date(), 'yyyy-MM-dd')
  const profile = settings.activeProfile

  const cycleInfo = useMemo(
    () => getDateCycleInfo(settings.planStartDate, new Date()),
    [settings.planStartDate]
  )

  const week = plan.weeks[selectedWeek]

  return (
    <AppShell>
      <div className="px-4 pt-4 pb-6 space-y-5">
        {/* Header */}
        <div>
          <h2 className="heading-display text-2xl font-bold text-warmgray-900">Il tuo piano</h2>
          <p className="text-sm text-warmgray-500 mt-1">Ciclo di 2 settimane · si ripete ogni 14 giorni</p>
        </div>

        {/* Week selector */}
        <div className="flex gap-2 p-1 bg-warmgray-100 rounded-2xl">
          {([0, 1] as const).map(w => (
            <button
              key={w}
              onClick={() => setSelectedWeek(w)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                selectedWeek === w
                  ? "bg-white text-sage-700 shadow-sm"
                  : "text-warmgray-500 hover:text-warmgray-700"
              )}
            >
              Settimana {w + 1}
              {cycleInfo.weekIndex === w && (
                <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-sage-500 align-middle pulse-dot" />
              )}
            </button>
          ))}
        </div>

        {/* Days grid */}
        <div className="space-y-3 stagger-children">
          {week.map((day) => {
            // Find the next occurrence of this day in the cycle
            const mealCompletions = completedMeals[profile] || {}
            const doneCount = Object.values(
              Object.entries(mealCompletions).reduce((acc, [date, meals]) => {
                // Check if any date corresponds to this cycle day
                const info = getDateCycleInfo(settings.planStartDate, new Date(date))
                if (info.weekIndex === day.weekIndex && info.dayIndex === day.dayIndex) {
                  return { ...acc, ...meals }
                }
                return acc
              }, {} as Record<string, { status: string }>)
            ).filter(c => c.status === 'done').length

            const isToday = cycleInfo.weekIndex === day.weekIndex && cycleInfo.dayIndex === day.dayIndex
            const totalMeals = day.meals.length

            return (
              <div
                key={`${day.weekIndex}-${day.dayIndex}`}
                className={cn(
                  "card border overflow-hidden transition-all",
                  isToday ? "border-sage-300 ring-1 ring-sage-300" : "border-warmgray-100"
                )}
              >
                {/* Day header */}
                <div className={cn(
                  "flex items-center justify-between px-4 py-3",
                  isToday ? "bg-sage-50" : "bg-white"
                )}>
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-warmgray-900">{day.label}</span>
                        {isToday && (
                          <span className="text-xs bg-sage-500 text-white px-2 py-0.5 rounded-full font-medium">
                            Oggi
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs text-warmgray-400">
                          Sett. {day.weekIndex + 1} · {totalMeals} pasti
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mini progress */}
                  <div className="flex items-center gap-1">
                    {day.meals.map((meal) => (
                      <div key={meal.id} className="w-2 h-2 rounded-full bg-warmgray-200" title={meal.title} />
                    ))}
                  </div>
                </div>

                {/* Meal preview */}
                <div className="border-t border-warmgray-100 divide-y divide-warmgray-50">
                  {day.meals.map(meal => (
                    <div key={meal.id} className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <span className="text-base w-6 text-center mt-0.5">{MEAL_ICONS[meal.type]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-warmgray-800">{meal.title}</span>
                            {meal.mealPrepTags && meal.mealPrepTags.length > 0 && (
                              <span className="text-xs bg-golden/30 text-amber-700 px-2 py-0.5 rounded-full flex-shrink-0" title="Questo pasto si può preparare in anticipo">
                                🥄 da preparare prima
                              </span>
                            )}
                          </div>
                          {meal.quantity && (
                            <p className="text-xs text-warmgray-500 mt-0.5">{meal.quantity}</p>
                          )}
                          {meal.ingredients.length > 0 && (
                            <div className="flex flex-wrap gap-x-2 mt-1">
                              {meal.ingredients.map(ing => (
                                <span key={ing.id} className="text-xs text-warmgray-400">
                                  {ing.name} <span className="text-warmgray-300">{ing.quantity}</span>
                                </span>
                              ))}
                            </div>
                          )}
                          {meal.alternatives.length > 0 && (
                            <span className="text-xs text-sage/70 mt-0.5 block">↔ {meal.alternatives[0].title}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Meal prep link */}
        <Link href="/plan/meal-prep" className="flex items-center justify-between card border border-golden-200 bg-golden-100 px-4 py-4 hover:bg-golden-200 transition-colors">
          <div>
            <p className="font-semibold text-amber-800 text-sm">🥄 Cosa preparare in anticipo</p>
            <p className="text-xs text-amber-600 mt-0.5">Checklist pasti da cucinare prima per risparmiare tempo</p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-600" />
        </Link>
      </div>
    </AppShell>
  )
}
