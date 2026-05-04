'use client'

import { useState, useMemo } from 'react'
import { Plus, Trash2, CheckCheck, ShoppingCart, RotateCcw, Pencil, X } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { useAppStore } from '@/lib/store'
import { getShoppingListFromPlan, normalizeIngredientName, type ShoppingPeriod } from '@/lib/utils'
import planData from '@/data/plan.json'
import type { NutritionPlan, ShoppingCategory } from '@/types'
import { SHOPPING_CATEGORY_LABELS } from '@/types'
import { cn } from '@/lib/utils'

const defaultPlan = planData as unknown as NutritionPlan

const PERIOD_LABELS: Record<ShoppingPeriod, string> = {
  today: 'Oggi',
  next3: '3 giorni',
  week:  'Settimana',
  cycle: 'Ciclo 14gg',
}

const CATEGORY_ICONS: Record<ShoppingCategory, string> = {
  frutta:              '🍎',
  verdura:             '🥦',
  cereali_pane:        '🌾',
  proteine:            '🐟',
  legumi:              '🫘',
  frutta_secca_semi:   '🌰',
  latticini_vegetali:  '🥛',
  dispensa:            '🧂',
  altro:               '📦',
}

type EditState = { id: string; value: string } | null

export default function ShoppingPage() {
  const {
    settings, customShoppingItems, customPlan,
    checkedShoppingIds,
    toggleGeneratedShoppingItem,
    clearAllShoppingChecked,
    toggleShoppingItem,
    addCustomShoppingItem,
    removeShoppingItem,
  } = useAppStore()

  const plan = customPlan ?? defaultPlan

  const [period, setPeriod]         = useState<ShoppingPeriod>('week')
  const [newItemName, setNewItemName] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editState, setEditState]   = useState<EditState>(null)
  const [addedFeedback, setAddedFeedback] = useState(false)

  // ── 1. Genera la lista dal piano (solo dati reali, niente hardcoded) ──────
  const generatedItems = useMemo(
    () => getShoppingListFromPlan(plan.weeks, settings.planStartDate, period),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [period, settings.planStartDate, plan]
  )

  // ── 2. Applica lo stato "spuntato" persistito ─────────────────────────────
  const checkedSet = useMemo(() => new Set(checkedShoppingIds), [checkedShoppingIds])

  const shoppingItems = useMemo(
    () => generatedItems.map(item => ({ ...item, checked: checkedSet.has(item.ingredientId) })),
    [generatedItems, checkedSet]
  )

  // ── 3. Deduplicazione item custom rispetto a lista generata ───────────────
  const generatedKeys = useMemo(
    () => new Set(shoppingItems.map(i => normalizeIngredientName(i.name))),
    [shoppingItems]
  )

  const filteredCustom = useMemo(
    () => customShoppingItems.filter(m => {
      const key = normalizeIngredientName(m.name)
      return !generatedKeys.has(key)
    }),
    [customShoppingItems, generatedKeys]
  )

  // ── 4. Lista completa per conteggi e raggruppamento ───────────────────────
  const allItems = useMemo(
    () => [...shoppingItems, ...filteredCustom],
    [shoppingItems, filteredCustom]
  )

  const grouped = useMemo(() => {
    const map = new Map<ShoppingCategory, typeof allItems>()
    for (const item of allItems) {
      if (!map.has(item.category)) map.set(item.category, [])
      map.get(item.category)!.push(item)
    }
    return map
  }, [allItems])

  const checkedCount = allItems.filter(i => i.checked).length
  const totalCount   = allItems.length
  const progressPct  = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleToggle(item: typeof allItems[0]) {
    if (item.custom) {
      toggleShoppingItem(item.id)
    } else {
      toggleGeneratedShoppingItem(item.ingredientId)
    }
  }

  function handleAddCustom() {
    const name = newItemName.trim()
    if (!name) return
    addCustomShoppingItem(name, 'altro')
    setNewItemName('')
    setShowAddForm(false)
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 1500)
  }

  function handleEditSave(id: string) {
    // Per ora solo UI — in una versione futura useAppStore.updateCustomItem
    setEditState(null)
  }

  return (
    <AppShell>
      <div className="px-4 pt-5 pb-8 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="heading-display text-2xl font-bold text-warmgray-900 leading-tight">
              Lista della spesa
            </h2>
            <p className="text-sm text-warmgray-400 mt-1">
              {totalCount === 0
                ? 'Nessun ingrediente'
                : checkedCount > 0
                ? `${checkedCount} di ${totalCount} acquistati`
                : `${totalCount} ingredienti`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {checkedCount > 0 && (
              <button
                onClick={clearAllShoppingChecked}
                className="w-9 h-9 flex items-center justify-center rounded-2xl bg-warmgray-100 text-warmgray-500 hover:bg-warmgray-200 transition-colors"
                title="Azzera tutto"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowAddForm(v => !v)}
              className={cn(
                'w-9 h-9 flex items-center justify-center rounded-2xl transition-all shadow-sm',
                showAddForm
                  ? 'bg-warmgray-200 text-warmgray-600 rotate-45'
                  : addedFeedback
                  ? 'bg-sage text-white scale-110'
                  : 'bg-sage text-white hover:bg-sage-500'
              )}
            >
              <Plus className="w-4 h-4 transition-transform" />
            </button>
          </div>
        </div>

        {/* ── Selettore periodo ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
          {(Object.keys(PERIOD_LABELS) as ShoppingPeriod[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'flex-shrink-0 text-sm font-medium px-4 py-2 rounded-2xl border transition-all',
                period === p
                  ? 'bg-sage text-white border-sage shadow-sm'
                  : 'bg-white text-warmgray-600 border-warmgray-200 hover:border-sage/40'
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* ── Progress bar ── */}
        {totalCount > 0 && (
          <div className="space-y-1">
            <div className="h-1.5 bg-warmgray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sage rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {checkedCount === totalCount && totalCount > 0 && (
              <p className="text-center text-xs text-sage-600 font-semibold animate-fade-in">
                🌿 Lista completata!
              </p>
            )}
          </div>
        )}

        {/* ── Form aggiunta manuale ── */}
        {showAddForm && (
          <div className="card border border-sage/20 p-4 space-y-3 animate-slide-up">
            <p className="text-sm font-semibold text-warmgray-800">Aggiungi voce</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                placeholder="es. Sale integrale, Limoni…"
                className="flex-1 bg-warmgray-50 border border-warmgray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sage transition-colors"
                autoFocus
              />
              <button
                onClick={handleAddCustom}
                disabled={!newItemName.trim()}
                className="px-4 py-2.5 bg-sage text-white rounded-xl text-sm font-semibold hover:bg-sage-500 transition-colors disabled:opacity-40"
              >
                Aggiungi
              </button>
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {totalCount === 0 && (
          <div className="card p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-sage-50 flex items-center justify-center mx-auto">
              <ShoppingCart className="w-7 h-7 text-sage-300" />
            </div>
            <div>
              <p className="font-semibold text-warmgray-700">Nessun ingrediente trovato</p>
              <p className="text-warmgray-400 text-sm mt-1 leading-relaxed max-w-[240px] mx-auto">
                Controlla la data di inizio piano nelle Impostazioni.
              </p>
            </div>
          </div>
        )}

        {/* ── Liste per categoria ── */}
        {(Object.keys(SHOPPING_CATEGORY_LABELS) as ShoppingCategory[]).map(cat => {
          const items = grouped.get(cat)
          if (!items || items.length === 0) return null

          const catChecked   = items.filter(i => i.checked).length
          const allCatDone   = catChecked === items.length

          return (
            <div key={cat} className="animate-fade-in">
              {/* Category header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-base">{CATEGORY_ICONS[cat]}</span>
                <h3 className={cn(
                  'text-sm font-semibold transition-colors',
                  allCatDone ? 'text-warmgray-300' : 'text-warmgray-700'
                )}>
                  {SHOPPING_CATEGORY_LABELS[cat].replace(/^[^\s]+\s/, '')}
                </h3>
                {catChecked > 0 && (
                  <span className="text-xs text-warmgray-300 ml-auto tabular-nums">
                    {catChecked}/{items.length}
                  </span>
                )}
              </div>

              {/* Items card */}
              <div className="card border border-warmgray-100/80 overflow-hidden divide-y divide-warmgray-50">
                {items.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 transition-colors',
                      item.checked ? 'bg-warmgray-50/60' : 'hover:bg-sage-50/30'
                    )}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggle(item)}
                      className={cn(
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200',
                        item.checked
                          ? 'bg-sage border-sage scale-95'
                          : 'border-warmgray-300 bg-white hover:border-sage'
                      )}
                    >
                      {item.checked && <CheckCheck className="w-3 h-3 text-white" strokeWidth={3} />}
                    </button>

                    {/* Item name + quantity */}
                    <button
                      onClick={() => handleToggle(item)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <span className={cn(
                        'text-sm block transition-all leading-snug',
                        item.checked ? 'line-through text-warmgray-300' : 'text-warmgray-800'
                      )}>
                        {item.name}
                      </span>
                      {item.quantity && (
                        <span className={cn(
                          'text-xs transition-colors',
                          item.checked ? 'text-warmgray-300' : 'text-warmgray-400'
                        )}>
                          {item.quantity}
                        </span>
                      )}
                      {item.custom && (
                        <span className="text-[10px] text-sage-400 font-medium ml-1">aggiunto</span>
                      )}
                    </button>

                    {/* Actions per item custom */}
                    {item.custom && (
                      <button
                        onClick={e => { e.stopPropagation(); removeShoppingItem(item.id) }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-warmgray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Disclaimer */}
        {totalCount > 0 && (
          <p className="text-xs text-warmgray-300 text-center leading-relaxed pt-2">
            Lista generata automaticamente dal piano nutrizionale
          </p>
        )}
      </div>
    </AppShell>
  )
}
