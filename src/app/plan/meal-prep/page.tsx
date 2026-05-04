'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCheck } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { getCurrentCycleInfo, getDayPlan } from '@/lib/utils'
import planData from '@/data/plan.json'
import type { NutritionPlan, MealPrepTag, Meal } from '@/types'
import { cn } from '@/lib/utils'

const defaultPlan = planData as unknown as NutritionPlan

const PREP_TAG_CONFIG: Record<MealPrepTag, { label: string; emoji: string; desc: string; bgClass: string }> = {
  batch_cooking: {
    label: 'Batch cooking',
    emoji: '🫙',
    desc: 'Prepara in grande quantità e conserva in frigo/freezer per più giorni',
    bgClass: 'bg-amber-50 border-amber-200',
  },
  preparabile: {
    label: 'Preparabile prima',
    emoji: '🥄',
    desc: 'Puoi prepararlo la sera prima o la mattina per averlo pronto',
    bgClass: 'bg-sage/10 border-sage/30',
  },
  ricorrente: {
    label: 'Ricorrente',
    emoji: '🔄',
    desc: 'Compare spesso nel piano — vale la pena prepararlo in quantità',
    bgClass: 'bg-blue-50 border-blue-200',
  },
  da_scongelare: {
    label: 'Da scongelare',
    emoji: '❄️',
    desc: 'Ricorda di toglierlo dal freezer la sera prima',
    bgClass: 'bg-sky-50 border-sky-200',
  },
}

interface PrepItem {
  meal: Meal
  dayLabel: string
  weekLabel: string
  tags: MealPrepTag[]
}

export default function MealPrepPage() {
  const { settings, customPlan } = useAppStore()
  const plan = customPlan ?? defaultPlan
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'week' | 'all'>('week')

  // Get current week's prep items
  const cycleInfo = useMemo(() => getCurrentCycleInfo(settings.planStartDate), [settings.planStartDate])

  const prepItems = useMemo((): PrepItem[] => {
    const results: PrepItem[] = []
    const weeksToScan = viewMode === 'week' ? [cycleInfo.weekIndex] : [0, 1]

    for (const weekIdx of weeksToScan) {
      const week = plan.weeks[weekIdx]
      if (!week) continue
      for (const day of week) {
        for (const meal of day.meals) {
          const tags = meal.mealPrepTags || []
          if (tags.length > 0) {
            results.push({
              meal,
              dayLabel: day.label,
              weekLabel: `Settimana ${weekIdx + 1}`,
              tags,
            })
          }
        }
      }
    }
    return results
  }, [cycleInfo.weekIndex, viewMode])

  // Group by primary tag
  const grouped = useMemo(() => {
    const map = new Map<MealPrepTag, PrepItem[]>()
    for (const item of prepItems) {
      const primaryTag = item.tags[0]
      if (!map.has(primaryTag)) map.set(primaryTag, [])
      map.get(primaryTag)!.push(item)
    }
    return map
  }, [prepItems])

  const doneCount = doneIds.size
  const totalCount = prepItems.length

  function toggleDone(mealId: string) {
    setDoneIds(prev => {
      const next = new Set(prev)
      if (next.has(mealId)) next.delete(mealId)
      else next.add(mealId)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-cream pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur border-b border-warmgray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/plan"
            className="w-9 h-9 flex items-center justify-center rounded-2xl bg-warmgray-100 text-warmgray-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <h1 className="font-display font-semibold text-warmgray-900">Prepara in anticipo</h1>
            <p className="text-xs text-warmgray-500">
              {doneCount > 0 ? `${doneCount}/${totalCount} pronti` : `${totalCount} preparazioni`}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">

        {/* Explainer */}
        <div className="card border border-golden/40 bg-golden/10 p-4">
          <p className="text-sm text-amber-800 leading-relaxed">
            💡 <strong>Perché preparare prima?</strong> Avere già pronti cereali, legumi e proteine ti permette di assemblare i pasti del piano in pochi minuti, senza stress nei giorni più pieni.
          </p>
        </div>

        {/* Progress */}
        {doneCount > 0 && (
          <div>
            <div className="h-1.5 bg-warmgray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sage rounded-full transition-all duration-500"
                style={{ width: `${(doneCount / totalCount) * 100}%` }}
              />
            </div>
            {doneCount === totalCount && (
              <p className="text-center text-sm text-sage font-medium mt-2">✅ Tutto pronto, ottimo!</p>
            )}
          </div>
        )}

        {/* Week selector */}
        <div className="flex gap-2 p-1 bg-warmgray-100 rounded-2xl">
          <button
            onClick={() => setViewMode('week')}
            className={cn(
              "flex-1 py-2 rounded-xl text-sm font-semibold transition-all",
              viewMode === 'week' ? "bg-white text-sage shadow-sm" : "text-warmgray-500"
            )}
          >
            Sett. {cycleInfo.weekIndex + 1} (questa)
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={cn(
              "flex-1 py-2 rounded-xl text-sm font-semibold transition-all",
              viewMode === 'all' ? "bg-white text-sage shadow-sm" : "text-warmgray-500"
            )}
          >
            Tutto il ciclo
          </button>
        </div>

        {/* Grouped by tag */}
        {(Object.keys(PREP_TAG_CONFIG) as MealPrepTag[]).map(tag => {
          const items = grouped.get(tag)
          if (!items || items.length === 0) return null
          const cfg = PREP_TAG_CONFIG[tag]

          return (
            <div key={tag} className="space-y-2">
              <div className={cn("card border p-4", cfg.bgClass)}>
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-xl">{cfg.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-warmgray-900 text-sm">{cfg.label}</h3>
                    <p className="text-xs text-warmgray-500 mt-0.5 leading-relaxed">{cfg.desc}</p>
                  </div>
                </div>
              </div>

              <div className="card border border-warmgray-100 overflow-hidden divide-y divide-warmgray-50">
                {items.map(({ meal, dayLabel, weekLabel }) => {
                  const isDone = doneIds.has(meal.id)
                  return (
                    <button
                      key={meal.id}
                      onClick={() => toggleDone(meal.id)}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-4 text-left transition-colors",
                        isDone ? "bg-warmgray-50/70" : "hover:bg-warmgray-50/50"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                        isDone ? "bg-sage border-sage" : "border-warmgray-300 bg-white"
                      )}>
                        {isDone && <CheckCheck className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className={cn(
                            "text-sm font-medium transition-all",
                            isDone ? "line-through text-warmgray-400" : "text-warmgray-800"
                          )}>
                            {meal.title}
                          </span>
                          <span className="text-xs text-warmgray-400 flex-shrink-0">{dayLabel}</span>
                        </div>
                        {meal.quantity && (
                          <p className={cn("text-xs mt-0.5", isDone ? "text-warmgray-300" : "text-warmgray-500")}>
                            {meal.quantity}
                          </p>
                        )}
                        {meal.ingredients.length > 0 && !isDone && (
                          <div className="flex flex-wrap gap-x-3 mt-1.5">
                            {meal.ingredients.map(ing => (
                              <span key={ing.id} className="text-xs text-warmgray-500">
                                {ing.name} <span className="text-warmgray-300">{ing.quantity}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        {viewMode === 'all' && (
                          <span className="text-xs text-warmgray-400 mt-1 block">{weekLabel}</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {prepItems.length === 0 && (
          <div className="card p-10 text-center">
            <p className="text-warmgray-400 text-sm">Nessuna preparazione trovata per questa settimana.</p>
          </div>
        )}
      </div>
    </div>
  )
}
