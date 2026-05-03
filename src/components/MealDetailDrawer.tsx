'use client'

import { useState } from 'react'
import { X, Check, Shuffle, ShoppingCart, StickyNote, Tag, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
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
}

const MEAL_PREP_LABELS: Record<string, string> = {
  preparabile:   '🥄 Preparabile in anticipo',
  ricorrente:    '🔄 Ricorrente nel piano',
  da_scongelare: '❄️ Da scongelare',
  batch_cooking: '🫙 Ideale per batch cooking',
}

export default function MealDetailDrawer({
  meal, completion, open, onClose, onComplete, onAddToShopping
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
      <div className="fixed inset-x-0 bottom-0 z-50 bg-cream rounded-t-4xl shadow-[0_-8px_40px_rgba(0,0,0,0.12)] animate-slide-up max-h-[92dvh] flex flex-col"
           style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
        
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-warmgray-200" />
        </div>

        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-3 border-b border-warmgray-100">
          <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-sage-50 text-2xl flex-shrink-0">
            {MEAL_ICONS[meal.type]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-warmgray-400 uppercase tracking-wide">
              {MEAL_LABELS[meal.type]}
            </p>
            <h2 className="heading-display font-semibold text-warmgray-900 text-lg leading-snug">
              {meal.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-warmgray-400 hover:bg-warmgray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Description + quantity */}
          <div>
            <p className="text-warmgray-700 leading-relaxed">{meal.description}</p>
            {meal.quantity && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-sage-50 border border-sage-200 rounded-xl px-3 py-1.5">
                <Tag className="w-3.5 h-3.5 text-sage-500" />
                <span className="text-sm font-medium text-sage-700">{meal.quantity}</span>
              </div>
            )}
          </div>

          {/* Ingredients */}
          {meal.ingredients.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-warmgray-600 mb-2">Ingredienti</h3>
              <div className="space-y-1.5">
                {meal.ingredients.map(ing => (
                  <div key={ing.id} className="flex items-center justify-between py-1.5 border-b border-warmgray-100 last:border-0">
                    <span className="text-sm text-warmgray-700">{ing.name}</span>
                    <span className="text-xs text-warmgray-400 ml-4">{ing.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 text-xs text-warmgray-400">
                {SHOPPING_CATEGORY_LABELS[meal.ingredients[0]?.category] || ''}
              </div>
            </div>
          )}

          {/* Meal prep tags */}
          {meal.mealPrepTags && meal.mealPrepTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {meal.mealPrepTags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 text-xs bg-golden-100 text-amber-700 border border-golden-200 rounded-xl px-3 py-1.5 font-medium">
                  {MEAL_PREP_LABELS[tag] || tag}
                </span>
              ))}
            </div>
          )}

          {/* Alternatives */}
          {meal.alternatives.length > 0 && (
            <div className="bg-white rounded-2xl border border-warmgray-100 overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3"
                onClick={() => setShowAlts(!showAlts)}
              >
                <div className="flex items-center gap-2">
                  <Shuffle className="w-4 h-4 text-sage-500" />
                  <span className="text-sm font-semibold text-warmgray-700">
                    Alternative previste dal piano
                  </span>
                  <span className="w-5 h-5 bg-sage-100 text-sage-600 rounded-full text-xs flex items-center justify-center font-medium">
                    {meal.alternatives.length}
                  </span>
                </div>
                {showAlts ? <ChevronUp className="w-4 h-4 text-warmgray-400" /> : <ChevronDown className="w-4 h-4 text-warmgray-400" />}
              </button>
              {showAlts && (
                <div className="border-t border-warmgray-100 divide-y divide-warmgray-50">
                  {meal.alternatives.map(alt => (
                    <div key={alt.id} className="px-4 py-3">
                      <p className="text-sm font-medium text-warmgray-700">{alt.title}</p>
                      {alt.description && (
                        <p className="text-xs text-warmgray-500 mt-0.5">{alt.description}</p>
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
              className="flex items-center gap-2 text-sm font-medium text-warmgray-500 hover:text-warmgray-700 transition-colors"
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
                  className="w-full bg-white border border-warmgray-200 rounded-2xl px-4 py-3 text-sm text-warmgray-700 placeholder-warmgray-300 focus:outline-none focus:border-sage-300 resize-none"
                  rows={3}
                />
              </div>
            )}
          </div>
        </div>

        {/* Action footer */}
        <div className="px-5 pb-4 pt-3 border-t border-warmgray-100 flex gap-3">
          <button
            onClick={() => onAddToShopping(meal)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-warmgray-100 text-warmgray-600 rounded-2xl font-medium text-sm hover:bg-warmgray-200 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Aggiungi alla spesa
          </button>

          {status !== 'done' ? (
            <button
              onClick={() => { handleComplete('done'); onClose() }}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-sage-500 text-white rounded-2xl font-medium text-sm hover:bg-sage-600 active:scale-[0.98] transition-all shadow-sm"
            >
              <Check className="w-4 h-4" />
              Segna come fatto
            </button>
          ) : (
            <button
              onClick={() => { handleComplete('pending'); onClose() }}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-warmgray-200 text-warmgray-600 rounded-2xl font-medium text-sm hover:bg-warmgray-300 transition-colors"
            >
              Annulla completamento
            </button>
          )}
        </div>
      </div>
    </>
  )
}
