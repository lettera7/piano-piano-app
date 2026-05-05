'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
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

        {/* ── HERO ── */}
        <div
          className="rounded-[28px] p-5 relative overflow-hidden"
          style={{ background: 'var(--color-ink)', minHeight: 100 }}
        >
          {/* Background decorative text */}
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 select-none pointer-events-none leading-none"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '8rem',
              color: 'rgba(255,255,255,0.04)',
              letterSpacing: '-0.05em',
            }}
          >
            14
          </div>
          <p className="label-micro mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Il tuo piano</p>
          <h2
            className="heading-display text-white"
            style={{ fontSize: '2.6rem' }}
          >
            Ciclo 14gg
          </h2>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Si ripete ogni 2 settimane
          </p>
        </div>

        {/* ── Week selector ── */}
        <div
          className="flex gap-1.5 p-1.5 rounded-2xl"
          style={{ background: 'var(--color-cream-dark)' }}
        >
          {([0, 1] as const).map(w => (
            <button
              key={w}
              onClick={() => setSelectedWeek(w)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 relative"
              style={selectedWeek === w
                ? { background: '#fff', color: 'var(--color-ink)', boxShadow: '0 1px 4px rgba(26,23,20,0.1)' }
                : { color: 'var(--color-ink-light)' }
              }
            >
              Settimana {w + 1}
              {cycleInfo.weekIndex === w && (
                <span
                  className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full align-middle pulse-dot"
                  style={{ background: 'var(--color-orange)' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ── Days ── */}
        <div className="space-y-3 stagger-children">
          {week.map((day) => {
            const isToday = cycleInfo.weekIndex === day.weekIndex && cycleInfo.dayIndex === day.dayIndex
            const totalMeals = day.meals.length

            return (
              <div
                key={`${day.weekIndex}-${day.dayIndex}`}
                className="overflow-hidden transition-all"
                style={{
                  background: isToday ? 'var(--color-ink)' : '#fff',
                  border: isToday ? '2px solid var(--color-orange)' : '1.5px solid var(--color-cream-dark)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                {/* Day header */}
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-bold text-[15px]"
                        style={{
                          fontFamily: 'var(--font-display)',
                          color: isToday ? '#fff' : 'var(--color-ink)',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {day.label}
                      </span>
                      {isToday && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                          style={{ background: 'var(--color-orange)', color: '#fff' }}
                        >
                          Oggi
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: isToday ? 'rgba(255,255,255,0.4)' : 'var(--color-ink-faint)' }}
                    >
                      {totalMeals} pasti
                    </p>
                  </div>

                  {/* Meal dots */}
                  <div className="flex items-center gap-1.5">
                    {day.meals.map((meal) => (
                      <div
                        key={meal.id}
                        className="w-2 h-2 rounded-full"
                        style={{ background: isToday ? 'rgba(255,255,255,0.25)' : 'var(--color-cream-dark)' }}
                      />
                    ))}
                  </div>
                </div>

                {/* Meals */}
                <div
                  style={{
                    borderTop: isToday ? '1px solid rgba(255,255,255,0.08)' : '1px solid var(--color-cream-dark)',
                  }}
                >
                  {day.meals.map((meal, idx) => (
                    <div
                      key={meal.id}
                      className="px-4 py-3 flex items-start gap-3"
                      style={{
                        borderBottom: idx < day.meals.length - 1
                          ? isToday ? '1px solid rgba(255,255,255,0.06)' : '1px solid var(--color-cream-dark)'
                          : 'none',
                      }}
                    >
                      <span className="text-base w-6 text-center mt-0.5 flex-shrink-0">
                        {MEAL_ICONS[meal.type]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-sm font-semibold"
                            style={{ color: isToday ? '#fff' : 'var(--color-ink)' }}
                          >
                            {meal.title}
                          </span>
                          {meal.mealPrepTags && meal.mealPrepTags.length > 0 && (
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                              style={{ background: 'var(--color-gold-pale)', color: '#a07010' }}
                            >
                              🥄 prep
                            </span>
                          )}
                        </div>
                        {meal.quantity && (
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: isToday ? 'rgba(255,255,255,0.4)' : 'var(--color-ink-faint)' }}
                          >
                            {meal.quantity}
                          </p>
                        )}
                        {meal.ingredients.length > 0 && (
                          <p
                            className="text-xs mt-1 line-clamp-1"
                            style={{ color: isToday ? 'rgba(255,255,255,0.3)' : 'var(--color-ink-faint)' }}
                          >
                            {meal.ingredients.slice(0, 3).map(i => i.name).join(' · ')}
                            {meal.ingredients.length > 3 && ` +${meal.ingredients.length - 3}`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Meal prep link */}
        <Link
          href="/plan/meal-prep"
          className="flex items-center justify-between rounded-2xl px-4 py-4 transition-all active:scale-[0.98]"
          style={{ background: 'var(--color-gold-pale)', border: '1.5px solid #f0d88a' }}
        >
          <div>
            <p className="font-bold text-sm" style={{ color: '#a07010' }}>
              🥄 Cosa preparare in anticipo
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#b08020' }}>
              Checklist pasti da cucinare prima
            </p>
          </div>
          <ChevronRight className="w-4 h-4" style={{ color: '#c09030' }} />
        </Link>
      </div>
    </AppShell>
  )
}
