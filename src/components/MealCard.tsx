'use client'

import { useState } from 'react'
import { Check, ChevronRight, RotateCcw, ShoppingCart, StickyNote, Shuffle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Meal, MealCompletion, MealStatus } from '@/types'
import { MEAL_LABELS, MEAL_ICONS } from '@/types'
import MealDetailDrawer from './MealDetailDrawer'

interface MealCardProps {
  meal: Meal
  date: string
  completion?: MealCompletion
  onComplete: (mealId: string, status: MealStatus, note?: string) => void
  onAddToShopping: (meal: Meal) => void
}

const STATUS_CONFIG: Record<MealStatus, { label: string; classes: string; dotClass: string }> = {
  pending:  { label: 'Da fare',    classes: 'bg-warmgray-50  border-warmgray-200',  dotClass: 'bg-warmgray-300'  },
  done:     { label: 'Fatto ✓',    classes: 'bg-sage-50      border-sage-200',      dotClass: 'bg-sage-500'      },
  modified: { label: 'Modificato', classes: 'bg-golden-100   border-golden-200',    dotClass: 'bg-amber-400'     },
  skipped:  { label: 'Saltato',    classes: 'bg-warmgray-100 border-warmgray-200',  dotClass: 'bg-warmgray-400'  },
}

export default function MealCard({ meal, date, completion, onComplete, onAddToShopping }: MealCardProps) {
  const [open, setOpen] = useState(false)
  const status: MealStatus = completion?.status || 'pending'
  const cfg = STATUS_CONFIG[status]

  return (
    <>
      <div className={cn(
        "card border transition-all duration-300 overflow-hidden",
        cfg.classes,
        status === 'done' && "opacity-80"
      )}>
        {/* Header row */}
        <div className="flex items-start gap-3 p-4">
          {/* Meal type icon */}
          <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/70 text-xl flex-shrink-0 shadow-sm">
            {MEAL_ICONS[meal.type]}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-warmgray-400 uppercase tracking-wide">
                {MEAL_LABELS[meal.type]}
              </span>
              <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dotClass)} />
              <span className="text-xs text-warmgray-400">{cfg.label}</span>
            </div>

            <h3 className="font-semibold text-warmgray-800 mt-0.5 leading-snug">
              {meal.title}
            </h3>

            {meal.quantity && (
              <p className="text-xs text-warmgray-500 mt-0.5">{meal.quantity}</p>
            )}

            {completion?.note && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <StickyNote className="w-3 h-3" />
                {completion.note}
              </p>
            )}
          </div>

          {/* Open detail */}
          <button
            onClick={() => setOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-warmgray-400 hover:bg-white/60 transition-colors flex-shrink-0 mt-0.5"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick alternatives preview */}
        {meal.alternatives.length > 0 && status === 'pending' && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Shuffle className="w-3 h-3 text-warmgray-400" />
              <span className="text-xs text-warmgray-400">Alternativa:</span>
              <span className="text-xs text-warmgray-600">{meal.alternatives[0].title}</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex border-t border-white/40 divide-x divide-white/40">
          {status !== 'done' ? (
            <button
              onClick={() => onComplete(meal.id, 'done')}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-sage-600 hover:bg-sage-50/60 transition-colors"
            >
              <Check className="w-4 h-4" />
              Segna come fatto
            </button>
          ) : (
            <button
              onClick={() => onComplete(meal.id, 'pending')}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-warmgray-500 hover:bg-warmgray-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Annulla
            </button>
          )}

          <button
            onClick={() => onAddToShopping(meal)}
            className="px-4 flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-warmgray-500 hover:bg-white/60 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Spesa
          </button>
        </div>
      </div>

      <MealDetailDrawer
        meal={meal}
        date={date}
        completion={completion}
        open={open}
        onClose={() => setOpen(false)}
        onComplete={onComplete}
        onAddToShopping={onAddToShopping}
      />
    </>
  )
}
