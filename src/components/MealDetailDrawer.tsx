'use client'

import { useState } from 'react'
import { X, Check, Shuffle, ShoppingCart, StickyNote, Tag, ChevronDown, ChevronUp } from 'lucide-react'
import { scaleQuantity } from '@/lib/utils'
import type { Meal, MealCompletion, MealStatus } from '@/types'
import { MEAL_LABELS, MEAL_ICONS, SHOPPING_CATEGORY_LABELS } from '@/types'

interface MealDetailDrawerProps {
  meal: Meal
  date: string
  completion?: MealCompletion
  open: boolean
  onClose: () => void
  onComplete: (mealId: string, status: MealStatus, note?: string) => void
  onAddToShopping: (meal: Meal) => void
  quantityScale?: number
}

const MEAL_PREP_LABELS: Record<string, string> = {
  preparabile:   '🥄 Preparabile in anticipo',
  ricorrente:    '🔄 Ricorrente nel piano',
  da_scongelare: '❄️ Da scongelare',
  batch_cooking: '🫙 Ideale per batch cooking',
}

export default function MealDetailDrawer({
  meal, completion, open, onClose, onComplete, onAddToShopping, quantityScale = 1
}: MealDetailDrawerProps) {
  const [noteText, setNoteText] = useState(completion?.note || '')
  const [showNote, setShowNote] = useState(false)
  const [showAlts, setShowAlts] = useState(false)

  if (!open) return null

  const status: MealStatus = completion?.status || 'pending'

  const handleComplete = (s: MealStatus) => {
    onComplete(meal.id, s, noteText || undefined)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 drawer-overlay animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 animate-slide-up max-h-[92dvh] flex flex-col"
        style={{
          background: 'var(--color-cream)',
          borderRadius: '28px 28px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.14)',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-ink-faint)' }} />
        </div>

        {/* Header — dark band */}
        <div
          className="mx-4 mt-2 mb-0 rounded-2xl p-4 flex items-start gap-3"
          style={{ background: 'var(--color-ink)' }}
        >
          <div
            className="w-12 h-12 flex items-center justify-center rounded-xl text-2xl flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            {MEAL_ICONS[meal.type]}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.12em] mb-1"
              style={{ color: 'var(--color-orange)' }}
            >
              {MEAL_LABELS[meal.type]}
            </p>
            <h2
              className="text-white text-xl font-bold leading-snug"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
            >
              {meal.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.08)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {/* Description + quantity */}
          <div>
            <p className="leading-relaxed text-sm" style={{ color: 'var(--color-ink-mid)' }}>
              {meal.description}
            </p>
            {meal.quantity && (
              <div
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5"
                style={{ background: 'var(--color-orange-pale)' }}
              >
                <Tag className="w-3.5 h-3.5" style={{ color: 'var(--color-orange)' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--color-orange-dark)' }}>
                  {scaleQuantity(meal.quantity, quantityScale)}
                </span>
              </div>
            )}
          </div>

          {/* Ingredients */}
          {meal.ingredients.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
                Ingredienti
              </h3>
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: '1.5px solid var(--color-cream-dark)' }}
              >
                {meal.ingredients.map((ing, idx) => (
                  <div
                    key={ing.id}
                    className="flex items-center justify-between px-4 py-3"
                    style={{
                      borderBottom: idx < meal.ingredients.length - 1 ? '1px solid var(--color-cream-dark)' : 'none',
                      background: '#fff',
                    }}
                  >
                    <span className="text-sm" style={{ color: 'var(--color-ink-mid)' }}>{ing.name}</span>
                    <span
                      className="text-xs font-medium ml-4 px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--color-cream)', color: 'var(--color-ink-light)' }}
                    >
                      {scaleQuantity(ing.quantity, quantityScale)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meal prep tags */}
          {meal.mealPrepTags && meal.mealPrepTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {meal.mealPrepTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs rounded-xl px-3 py-1.5 font-medium"
                  style={{ background: 'var(--color-gold-pale)', color: '#a07010' }}
                >
                  {MEAL_PREP_LABELS[tag] || tag}
                </span>
              ))}
            </div>
          )}

          {/* Alternatives */}
          {meal.alternatives.length > 0 && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: '1.5px solid var(--color-cream-dark)', background: '#fff' }}
            >
              <button
                className="w-full flex items-center justify-between px-4 py-3"
                onClick={() => setShowAlts(!showAlts)}
              >
                <div className="flex items-center gap-2">
                  <Shuffle className="w-4 h-4" style={{ color: 'var(--color-orange)' }} />
                  <span className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
                    Alternative previste
                  </span>
                  <span
                    className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
                    style={{ background: 'var(--color-orange-pale)', color: 'var(--color-orange)' }}
                  >
                    {meal.alternatives.length}
                  </span>
                </div>
                {showAlts
                  ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--color-ink-faint)' }} />
                  : <ChevronDown className="w-4 h-4" style={{ color: 'var(--color-ink-faint)' }} />
                }
              </button>
              {showAlts && (
                <div style={{ borderTop: '1px solid var(--color-cream-dark)' }}>
                  {meal.alternatives.map((alt, idx) => (
                    <div
                      key={alt.id}
                      className="px-4 py-3"
                      style={{ borderBottom: idx < meal.alternatives.length - 1 ? '1px solid var(--color-cream-dark)' : 'none' }}
                    >
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>{alt.title}</p>
                      {alt.description && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-ink-light)' }}>{alt.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Note */}
          <div>
            <button
              className="flex items-center gap-2 text-sm font-medium transition-colors"
              style={{ color: 'var(--color-ink-light)' }}
              onClick={() => setShowNote(!showNote)}
            >
              <StickyNote className="w-4 h-4" />
              {completion?.note ? 'Modifica nota' : 'Aggiungi nota'}
            </button>
            {showNote && (
              <div className="mt-2">
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Come è andata? Hai modificato qualcosa?"
                  className="w-full rounded-2xl px-4 py-3 text-sm placeholder-opacity-40 resize-none focus:outline-none"
                  style={{
                    background: '#fff',
                    border: '1.5px solid var(--color-cream-dark)',
                    color: 'var(--color-ink)',
                  }}
                  rows={3}
                />
              </div>
            )}
          </div>
        </div>

        {/* Action footer */}
        <div
          className="px-4 pb-4 pt-3 flex gap-3"
          style={{ borderTop: '1px solid var(--color-cream-dark)' }}
        >
          <button
            onClick={() => onAddToShopping(meal)}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-medium text-sm transition-all active:scale-95"
            style={{ background: 'var(--color-cream-dark)', color: 'var(--color-ink-mid)' }}
          >
            <ShoppingCart className="w-4 h-4" />
            Spesa
          </button>

          {status !== 'done' ? (
            <button
              onClick={() => { handleComplete('done'); onClose() }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white transition-all active:scale-[0.98]"
              style={{ background: 'var(--color-orange)' }}
            >
              <Check className="w-4 h-4" />
              Segna come fatto
            </button>
          ) : (
            <button
              onClick={() => { handleComplete('pending'); onClose() }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-medium text-sm transition-all"
              style={{ background: 'var(--color-cream-dark)', color: 'var(--color-ink-mid)' }}
            >
              Annulla completamento
            </button>
          )}
        </div>
      </div>
    </>
  )
}
