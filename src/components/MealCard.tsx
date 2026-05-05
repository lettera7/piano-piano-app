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

type StatusConfig = {
  label: string
  cardBg: string
  cardBorder: string
  badgeBg: string
  badgeColor: string
  dotBg: string
}

const STATUS_CONFIG: Record<MealStatus, StatusConfig> = {
  pending: {
    label: 'Da fare',
    cardBg: '#ffffff',
    cardBorder: 'rgba(26,23,20,0.07)',
    badgeBg: 'var(--color-cream)',
    badgeColor: 'var(--color-ink-mid)',
    dotBg: 'var(--color-ink-faint)',
  },
  done: {
    label: 'Fatto',
    cardBg: '#f0f9f4',
    cardBorder: '#b8e0c8',
    badgeBg: '#dceee3',
    badgeColor: 'var(--color-sage)',
    dotBg: 'var(--color-sage)',
  },
  modified: {
    label: 'Modificato',
    cardBg: 'var(--color-gold-pale)',
    cardBorder: '#f0d88a',
    badgeBg: '#fce9aa',
    badgeColor: '#a07010',
    dotBg: 'var(--color-gold)',
  },
  skipped: {
    label: 'Saltato',
    cardBg: 'var(--color-cream)',
    cardBorder: 'var(--color-ink-faint)',
    badgeBg: 'var(--color-cream-dark)',
    badgeColor: 'var(--color-ink-light)',
    dotBg: 'var(--color-ink-faint)',
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
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          status === 'done' && 'opacity-80',
          justCompleted && 'animate-meal-done',
        )}
        style={{
          background: cfg.cardBg,
          border: `1.5px solid ${cfg.cardBorder}`,
          borderRadius: 'var(--radius-lg)',
          boxShadow: status === 'pending' ? '0 1px 3px rgba(26,23,20,0.05), 0 4px 20px rgba(26,23,20,0.04)' : 'none',
        }}
      >
        {/* ── Card body ── */}
        <div className="flex items-start gap-3 p-4">
          {/* Meal type icon */}
          <div
            className="w-11 h-11 flex items-center justify-center rounded-2xl text-xl flex-shrink-0"
            style={{ background: status === 'done' ? '#dceee3' : 'var(--color-cream)' }}
          >
            {MEAL_ICONS[meal.type]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            {/* Type + status row */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="label-micro">{MEAL_LABELS[meal.type]}</span>
              <span
                className="meal-badge"
                style={{ background: cfg.badgeBg, color: cfg.badgeColor }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: cfg.dotBg }}
                />
                {cfg.label}
              </span>
            </div>

            {/* Meal title */}
            <h3
              className={cn('font-bold leading-snug text-[15px]')}
              style={{
                color: status === 'done' ? 'var(--color-ink-light)' : 'var(--color-ink)',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.01em',
              }}
            >
              {meal.title}
            </h3>

            {/* Ingredients preview */}
            {meal.ingredients.length > 0 && (
              <p className="text-xs mt-1.5 leading-relaxed line-clamp-2" style={{ color: 'var(--color-ink-faint)' }}>
                {meal.ingredients.slice(0, 4).map(i => i.name).join(' · ')}
                {meal.ingredients.length > 4 && ` +${meal.ingredients.length - 4}`}
              </p>
            )}

            {/* Portion */}
            {meal.quantity && (
              <p className="text-xs mt-1 font-medium" style={{ color: 'var(--color-ink-light)' }}>
                {meal.quantity}
              </p>
            )}

            {/* Note */}
            {completion?.note && (
              <p className="text-xs mt-1.5 flex items-center gap-1 font-medium" style={{ color: 'var(--color-gold)' }}>
                <StickyNote className="w-3 h-3 flex-shrink-0" />
                {completion.note}
              </p>
            )}

            {/* Alternative */}
            {meal.alternatives.length > 0 && status === 'pending' && (
              <div className="flex items-center gap-1.5 mt-2">
                <Shuffle className="w-3 h-3" style={{ color: 'var(--color-ink-faint)' }} />
                <span className="text-xs" style={{ color: 'var(--color-ink-light)' }}>
                  Alt: <span style={{ color: 'var(--color-ink-mid)' }}>{meal.alternatives[0].title}</span>
                </span>
              </div>
            )}
          </div>

          {/* Detail button */}
          <button
            onClick={() => setOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors flex-shrink-0 mt-0.5"
            style={{ color: 'var(--color-ink-faint)' }}
            aria-label="Dettagli"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Action bar ── */}
        <div
          className="flex divide-x"
          style={{
            borderTop: `1px solid ${cfg.cardBorder}`,
            ['--tw-divide-opacity' as string]: 1,
          }}
        >
          {status !== 'done' ? (
            <button
              onClick={() => handleComplete('done')}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all active:scale-95"
              style={{ color: 'var(--color-orange)' }}
            >
              <Check className="w-4 h-4" />
              Fatto
            </button>
          ) : (
            <button
              onClick={() => handleComplete('pending')}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all"
              style={{ color: 'var(--color-ink-light)' }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Annulla
            </button>
          )}

          <button
            onClick={() => onAddToShopping(meal)}
            className="px-5 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all"
            style={{ color: 'var(--color-ink-light)', borderColor: cfg.cardBorder }}
          >
            <ShoppingCart className="w-4 h-4" />
          </button>

          <button
            onClick={() => setOpen(true)}
            className="px-4 flex items-center justify-center py-3 transition-all"
            style={{ color: 'var(--color-ink-faint)', borderColor: cfg.cardBorder }}
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
