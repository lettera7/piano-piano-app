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
  quantityScale?: number
}

const STATUS_CONFIG: Record<MealStatus, {
  label: string
  cardClass: string
  badgeClass: string
  dotClass: string
}> = {
  pending: {
    label: 'Da fare',
    cardClass: 'bg-white border-warmgray-100',
    badgeClass: 'bg-warmgray-100 text-warmgray-500',
    dotClass: 'bg-warmgray-300',
  },
  done: {
    label: 'Fatto',
    cardClass: 'bg-sage-50 border-sage-100',
    badgeClass: 'bg-sage-100 text-sage-700',
    dotClass: 'bg-sage',
  },
  modified: {
    label: 'Modificato',
    cardClass: 'bg-golden-100 border-golden-200',
    badgeClass: 'bg-golden-200 text-amber-700',
    dotClass: 'bg-golden-300',
  },
  skipped: {
    label: 'Saltato',
    cardClass: 'bg-warmgray-50 border-warmgray-200',
    badgeClass: 'bg-warmgray-200 text-warmgray-400',
    dotClass: 'bg-warmgray-300',
  },
}

export default function MealCard({ meal, date, completion, onComplete, onAddToShopping, quantityScale = 1 }: MealCardProps) {
  const [open, setOpen] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)
  const status: MealStatus = completion?.status || 'pending'
  const cfg = STATUS_CONFIG[status]

  function handleComplete(newStatus: MealStatus) {
    if (newStatus === 'done') {
      setJustCompleted(true)
      setTimeout(() => setJustCompleted(false), 400)
    }
    onComplete(meal.id, newStatus)
  }

  return (
    <>
      <div className={cn(
        'card border overflow-hidden transition-all duration-300',
        cfg.cardClass,
        status === 'done' && 'opacity-75',
        justCompleted && 'animate-meal-done',
      )}>

        {/* ── Card body ─────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 p-4">

          {/* Meal type icon */}
          <div className={cn(
            'w-11 h-11 flex items-center justify-center rounded-2xl text-xl flex-shrink-0',
            status === 'done' ? 'bg-sage-100' : 'bg-warmgray-50'
          )}>
            {MEAL_ICONS[meal.type]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            {/* Type + status row */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="label-micro">
                {MEAL_LABELS[meal.type]}
              </span>
              <span className={cn('meal-badge', cfg.badgeClass)}>
                <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dotClass)} />
                {cfg.label}
              </span>
            </div>

            {/* Meal title */}
            <h3 className={cn(
              'font-semibold leading-snug text-[15px]',
              status === 'done' ? 'text-warmgray-600' : 'text-warmgray-900'
            )}>
              {meal.title}
            </h3>

            {/* Ingredients preview */}
            {meal.ingredients.length > 0 && (
              <p className="text-xs text-warmgray-400 mt-1.5 leading-relaxed line-clamp-2">
                {meal.ingredients
                  .slice(0, 4)
                  .map(i => i.name)
                  .join(' · ')}
                {meal.ingredients.length > 4 && ` +${meal.ingredients.length - 4}`}
              </p>
            )}

            {/* Portion quantity */}
            {meal.quantity && (
              <p className="text-xs text-warmgray-500 mt-1 font-medium">{meal.quantity}</p>
            )}

            {/* Note */}
            {completion?.note && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1 font-medium">
                <StickyNote className="w-3 h-3 flex-shrink-0" />
                {completion.note}
              </p>
            )}

            {/* Alternative pill */}
            {meal.alternatives.length > 0 && status === 'pending' && (
              <div className="flex items-center gap-1.5 mt-2">
                <Shuffle className="w-3 h-3 text-warmgray-300" />
                <span className="text-xs text-warmgray-400">
                  Alt: <span className="text-warmgray-600">{meal.alternatives[0].title}</span>
                </span>
              </div>
            )}
          </div>

          {/* Detail button */}
          <button
            onClick={() => setOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-warmgray-300 hover:text-warmgray-600 hover:bg-warmgray-100 transition-colors flex-shrink-0 mt-0.5"
            aria-label="Dettagli"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Action bar ────────────────────────────────────────────── */}
        <div className="flex border-t border-warmgray-100/60 divide-x divide-warmgray-100/60">
          {status !== 'done' ? (
            <button
              onClick={() => handleComplete('done')}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-sage-600 hover:bg-sage-50 transition-colors active:scale-95"
            >
              <Check className="w-4 h-4" />
              Fatto
            </button>
          ) : (
            <button
              onClick={() => handleComplete('pending')}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-warmgray-400 hover:bg-warmgray-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Annulla
            </button>
          )}

          <button
            onClick={() => onAddToShopping(meal)}
            className="px-5 flex items-center justify-center gap-2 py-3 text-sm font-medium text-warmgray-500 hover:bg-warmgray-50 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden xs:inline">Spesa</span>
          </button>

          <button
            onClick={() => setOpen(true)}
            className="px-4 flex items-center justify-center py-3 text-sm font-medium text-warmgray-400 hover:bg-warmgray-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
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
        quantityScale={quantityScale}
      />
    </>
  )
}
