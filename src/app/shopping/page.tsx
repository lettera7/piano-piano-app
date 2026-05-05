'use client'

import { useState, useMemo } from 'react'
import { Plus, X, RotateCcw, ShoppingCart, CheckCheck } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { useAppStore } from '@/lib/store'
import { getShoppingListFromPlan, normalizeIngredientName, type ShoppingPeriod } from '@/lib/utils'
import planData from '@/data/plan.json'
import type { NutritionPlan, ShoppingCategory } from '@/types'
import { SHOPPING_CATEGORY_LABELS } from '@/types'
import { cn } from '@/lib/utils'

const defaultPlan = planData as unknown as NutritionPlan

const PERIOD_LABELS: Record<ShoppingPeriod, string> = {
  today:  'Oggi',
  next3:  '3 giorni',
  week:   'Settimana',
  cycle:  '14 giorni',
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
  const [period, setPeriod] = useState<ShoppingPeriod>('week')
  const [newItemName, setNewItemName] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const generatedItems = useMemo(
    () => getShoppingListFromPlan(plan.weeks, settings.planStartDate, period),
    [period, settings.planStartDate, plan]
  )

  const checkedSet = useMemo(() => new Set(checkedShoppingIds), [checkedShoppingIds])
  const shoppingItems = useMemo(
    () => generatedItems.map(item => ({ ...item, checked: checkedSet.has(item.ingredientId) })),
    [generatedItems, checkedSet]
  )

  const generatedKeys = useMemo(
    () => new Set(shoppingItems.map(i => normalizeIngredientName(i.name))),
    [shoppingItems]
  )
  const filteredCustom = useMemo(
    () => customShoppingItems.filter(m => !generatedKeys.has(normalizeIngredientName(m.name))),
    [customShoppingItems, generatedKeys]
  )

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

  function handleToggle(item: typeof allItems[0]) {
    if (item.custom) toggleShoppingItem(item.id)
    else toggleGeneratedShoppingItem(item.ingredientId)
  }

  function handleAddCustom() {
    const name = newItemName.trim()
    if (!name) return
    addCustomShoppingItem(name, 'altro')
    setNewItemName('')
    setShowAddForm(false)
  }

  return (
    <AppShell>
      <div className="px-4 pt-4 pb-8 space-y-5">

        {/* ── HERO HEADER ── */}
        <div
          className="rounded-[28px] p-5 flex items-end justify-between relative overflow-hidden"
          style={{ background: 'var(--color-ink)', minHeight: 110 }}
        >
          {/* Big background text */}
          <div
            className="absolute right-4 bottom-0 select-none pointer-events-none leading-none"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '7rem',
              color: 'rgba(255,255,255,0.04)',
              letterSpacing: '-0.05em',
            }}
          >
            {totalCount}
          </div>

          <div className="relative z-10">
            <p className="label-micro mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Lista della spesa
            </p>
            <h2
              className="heading-display text-white"
              style={{ fontSize: '2.6rem' }}
            >
              {totalCount === 0
                ? 'Vuota'
                : checkedCount > 0
                ? `${checkedCount}/${totalCount}`
                : `${totalCount} voci`}
            </h2>
          </div>

          <div className="relative z-10 flex gap-2">
            {checkedCount > 0 && (
              <button
                onClick={clearAllShoppingChecked}
                className="w-10 h-10 flex items-center justify-center rounded-2xl transition-all active:scale-95"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowAddForm(v => !v)}
              className="w-10 h-10 flex items-center justify-center rounded-2xl transition-all active:scale-95"
              style={{
                background: showAddForm ? 'rgba(255,255,255,0.15)' : 'var(--color-orange)',
                color: '#fff',
              }}
            >
              <Plus className={cn('w-4 h-4 transition-transform', showAddForm && 'rotate-45')} />
            </button>
          </div>
        </div>

        {/* ── Period selector ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
          {(Object.keys(PERIOD_LABELS) as ShoppingPeriod[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="flex-shrink-0 text-sm font-bold px-5 py-2.5 rounded-2xl transition-all active:scale-95"
              style={period === p
                ? { background: 'var(--color-orange)', color: '#fff' }
                : { background: '#fff', color: 'var(--color-ink-mid)', border: '1.5px solid var(--color-cream-dark)' }
              }
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* ── Progress bar ── */}
        {totalCount > 0 && (
          <div className="space-y-1.5">
            <div
              className="h-[3px] rounded-full overflow-hidden"
              style={{ background: 'var(--color-cream-dark)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, background: 'var(--color-orange)' }}
              />
            </div>
            {checkedCount === totalCount && totalCount > 0 && (
              <p className="text-center text-xs font-bold animate-fade-in" style={{ color: 'var(--color-sage)' }}>
                ✓ Lista completata!
              </p>
            )}
          </div>
        )}

        {/* ── Add form ── */}
        {showAddForm && (
          <div
            className="rounded-2xl p-4 space-y-3 animate-slide-up"
            style={{ background: '#fff', border: '1.5px solid var(--color-cream-dark)' }}
          >
            <p className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
              Aggiungi voce manuale
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                placeholder="es. Sale integrale, Limoni…"
                className="flex-1 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                style={{
                  background: 'var(--color-cream)',
                  border: '1.5px solid var(--color-cream-dark)',
                  color: 'var(--color-ink)',
                }}
                autoFocus
              />
              <button
                onClick={handleAddCustom}
                disabled={!newItemName.trim()}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40"
                style={{ background: 'var(--color-orange)' }}
              >
                Aggiungi
              </button>
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {totalCount === 0 && (
          <div className="card p-12 text-center space-y-3">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto text-3xl"
              style={{ background: 'var(--color-cream)' }}
            >
              🛒
            </div>
            <div>
              <p className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
                Lista vuota
              </p>
              <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--color-ink-light)' }}>
                Controlla la data di inizio piano nelle Impostazioni.
              </p>
            </div>
          </div>
        )}

        {/* ── Grouped items ── */}
        {(Object.keys(SHOPPING_CATEGORY_LABELS) as ShoppingCategory[]).map(cat => {
          const items = grouped.get(cat)
          if (!items || items.length === 0) return null
          const catChecked = items.filter(i => i.checked).length
          const allCatDone = catChecked === items.length

          return (
            <div key={cat} className="animate-fade-in">
              {/* Category header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-base">{CATEGORY_ICONS[cat]}</span>
                <h3
                  className="text-sm font-bold transition-colors"
                  style={{
                    color: allCatDone ? 'var(--color-ink-faint)' : 'var(--color-ink)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {SHOPPING_CATEGORY_LABELS[cat].replace(/^[^\s]+\s/, '')}
                </h3>
                {catChecked > 0 && (
                  <span className="text-xs ml-auto tabular-nums" style={{ color: 'var(--color-ink-faint)' }}>
                    {catChecked}/{items.length}
                  </span>
                )}
              </div>

              <div
                className="rounded-[20px] overflow-hidden"
                style={{ border: '1.5px solid var(--color-cream-dark)' }}
              >
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3 transition-colors"
                    style={{
                      background: item.checked ? 'var(--color-cream)' : '#fff',
                      borderBottom: idx < items.length - 1 ? '1px solid var(--color-cream-dark)' : 'none',
                    }}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggle(item)}
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200"
                      style={{
                        background: item.checked ? 'var(--color-orange)' : '#fff',
                        border: item.checked ? '2px solid var(--color-orange)' : '2px solid var(--color-ink-faint)',
                        transform: item.checked ? 'scale(0.95)' : 'scale(1)',
                      }}
                    >
                      {item.checked && <CheckCheck className="w-3 h-3 text-white" strokeWidth={3} />}
                    </button>

                    {/* Name + qty */}
                    <button
                      onClick={() => handleToggle(item)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <span
                        className="text-sm block leading-snug transition-all"
                        style={{
                          color: item.checked ? 'var(--color-ink-faint)' : 'var(--color-ink)',
                          textDecoration: item.checked ? 'line-through' : 'none',
                        }}
                      >
                        {item.name}
                        {item.custom && (
                          <span
                            className="text-[10px] font-bold ml-2 px-1.5 py-0.5 rounded-full"
                            style={{ background: 'var(--color-orange-pale)', color: 'var(--color-orange)' }}
                          >
                            custom
                          </span>
                        )}
                      </span>
                      {item.quantity && (
                        <span
                          className="text-xs"
                          style={{ color: item.checked ? 'var(--color-ink-faint)' : 'var(--color-ink-light)' }}
                        >
                          {item.quantity}
                        </span>
                      )}
                    </button>

                    {item.custom && (
                      <button
                        onClick={e => { e.stopPropagation(); removeShoppingItem(item.id) }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                        style={{ color: 'var(--color-ink-faint)' }}
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

        {totalCount > 0 && (
          <p className="text-xs text-center leading-relaxed pt-2" style={{ color: 'var(--color-ink-faint)' }}>
            Lista generata automaticamente dal piano nutrizionale
          </p>
        )}
      </div>
    </AppShell>
  )
}
