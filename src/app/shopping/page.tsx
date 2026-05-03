'use client'

import { useState, useMemo } from 'react'
import { Plus, Trash2, CheckCheck, ShoppingCart, RotateCcw } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { useAppStore } from '@/lib/store'
import { generateShoppingList, type ShoppingPeriod } from '@/lib/utils'
import planData from '@/data/plan.json'
import type { NutritionPlan, ShoppingCategory } from '@/types'
import { SHOPPING_CATEGORY_LABELS } from '@/types'
import { cn } from '@/lib/utils'

const plan = planData as unknown as NutritionPlan

const PERIOD_LABELS: Record<ShoppingPeriod, string> = {
  today:  'Oggi',
  next3:  '3 giorni',
  week:   'Settimana',
  cycle:  'Ciclo (14 gg)',
}

const CATEGORY_ICONS: Record<ShoppingCategory, string> = {
  frutta: '🍎',
  verdura: '🥦',
  cereali_pane: '🌾',
  proteine: '🐟',
  legumi: '🫘',
  frutta_secca_semi: '🌰',
  latticini_vegetali: '🥛',
  dispensa: '🧂',
  altro: '📦',
}

export default function ShoppingPage() {
  const { settings, customShoppingItems, toggleShoppingItem, addCustomShoppingItem, removeShoppingItem } = useAppStore()
  const [period, setPeriod] = useState<ShoppingPeriod>('week')
  const [newItemName, setNewItemName] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())

  const generatedItems = useMemo(() => {
    return generateShoppingList(plan.weeks, settings.planStartDate, period)
  }, [period, settings.planStartDate])

  const shoppingItems = useMemo(() =>
    generatedItems.map(item => ({ ...item, checked: checkedIds.has(item.ingredientId) })),
    [generatedItems, checkedIds]
  )

  const allItems = useMemo(() => [
    ...shoppingItems,
    ...customShoppingItems
  ], [shoppingItems, customShoppingItems])

  const grouped = useMemo(() => {
    const map = new Map<ShoppingCategory, typeof allItems>()
    for (const item of allItems) {
      if (!map.has(item.category)) map.set(item.category, [])
      map.get(item.category)!.push(item)
    }
    return map
  }, [allItems])

  const checkedCount = allItems.filter(i => i.checked).length
  const totalCount = allItems.length

  function handleToggle(item: typeof allItems[0]) {
    if (item.custom) {
      toggleShoppingItem(item.id)
    } else {
      setCheckedIds(prev => {
        const next = new Set(prev)
        if (next.has(item.ingredientId)) next.delete(item.ingredientId)
        else next.add(item.ingredientId)
        return next
      })
    }
  }

  function handleClearChecked() {
    setCheckedIds(new Set())
    customShoppingItems.filter(i => i.checked).forEach(i => toggleShoppingItem(i.id))
  }

  function handlePeriodChange(p: ShoppingPeriod) {
    setPeriod(p)
    setCheckedIds(new Set())
  }

  const handleAddCustom = () => {
    if (newItemName.trim()) {
      addCustomShoppingItem(newItemName.trim(), 'altro')
      setNewItemName('')
      setShowAddForm(false)
    }
  }

  return (
    <AppShell>
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="heading-display text-2xl font-bold text-warmgray-900">Lista della spesa</h2>
            <p className="text-sm text-warmgray-500 mt-1">
              {checkedCount > 0 ? `${checkedCount}/${totalCount} segnati` : `${totalCount} ingredienti`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {checkedCount > 0 && (
              <button
                onClick={handleClearChecked}
                className="w-9 h-9 flex items-center justify-center rounded-2xl bg-warmgray-100 text-warmgray-500 hover:bg-warmgray-200 transition-colors"
                title="Azzera selezione"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowAddForm(v => !v)}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-2xl transition-colors shadow-sm",
                showAddForm ? "bg-warmgray-200 text-warmgray-600" : "bg-sage text-white hover:bg-sage/90"
              )}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {(Object.keys(PERIOD_LABELS) as ShoppingPeriod[]).map(p => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={cn(
                "flex-shrink-0 text-sm font-medium px-4 py-2 rounded-2xl border transition-all",
                period === p
                  ? "bg-sage text-white border-sage shadow-sm"
                  : "bg-white text-warmgray-600 border-warmgray-200 hover:border-sage/50"
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {totalCount > 0 && checkedCount > 0 && (
          <div>
            <div className="h-1.5 bg-warmgray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sage rounded-full transition-all duration-500"
                style={{ width: `${(checkedCount / totalCount) * 100}%` }}
              />
            </div>
            {checkedCount === totalCount && (
              <p className="text-center text-sm text-sage font-medium mt-2">✅ Lista completata!</p>
            )}
          </div>
        )}

        {showAddForm && (
          <div className="card border border-sage/30 p-4 animate-slide-up">
            <p className="text-sm font-medium text-warmgray-700 mb-2">Aggiungi voce manuale</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                placeholder="es. Limoni, Sale integrale…"
                className="flex-1 bg-warmgray-50 border border-warmgray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sage"
                autoFocus
              />
              <button
                onClick={handleAddCustom}
                disabled={!newItemName.trim()}
                className="px-4 py-2 bg-sage text-white rounded-xl text-sm font-medium hover:bg-sage/90 transition-colors disabled:opacity-40"
              >
                Aggiungi
              </button>
            </div>
          </div>
        )}

        {totalCount === 0 && (
          <div className="card p-10 text-center">
            <ShoppingCart className="w-10 h-10 text-warmgray-300 mx-auto mb-3" />
            <p className="text-warmgray-500 text-sm font-medium">Nessun ingrediente trovato</p>
            <p className="text-warmgray-400 text-xs mt-1">Controlla che la data di inizio piano sia impostata correttamente nelle Impostazioni.</p>
          </div>
        )}

        {(Object.keys(SHOPPING_CATEGORY_LABELS) as ShoppingCategory[]).map(cat => {
          const items = grouped.get(cat)
          if (!items || items.length === 0) return null
          const catChecked = items.filter(i => i.checked).length
          const allCatChecked = catChecked === items.length

          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span>{CATEGORY_ICONS[cat]}</span>
                <h3 className={cn(
                  "text-sm font-semibold transition-colors",
                  allCatChecked ? "text-warmgray-400" : "text-warmgray-700"
                )}>
                  {SHOPPING_CATEGORY_LABELS[cat]}
                </h3>
                {catChecked > 0 && (
                  <span className="text-xs text-warmgray-400 ml-auto">{catChecked}/{items.length}</span>
                )}
              </div>
              <div className="card border border-warmgray-100 overflow-hidden divide-y divide-warmgray-50">
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleToggle(item)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left",
                      item.checked ? "bg-warmgray-50/70" : "hover:bg-warmgray-50/50"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                      item.checked ? "bg-sage border-sage" : "border-warmgray-300 bg-white"
                    )}>
                      {item.checked && <CheckCheck className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "text-sm block transition-all",
                        item.checked ? "line-through text-warmgray-400" : "text-warmgray-800"
                      )}>
                        {item.name}
                      </span>
                      {item.quantity && !item.custom && (
                        <span className="text-xs text-warmgray-400">{item.quantity}</span>
                      )}
                    </div>
                    {item.custom && (
                      <div
                        onClick={e => { e.stopPropagation(); removeShoppingItem(item.id) }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-warmgray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </AppShell>
  )
}
