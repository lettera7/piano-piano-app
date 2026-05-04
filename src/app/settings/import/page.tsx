'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileUp, CheckCircle, AlertCircle, FileText, FileJson, Trash2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { NutritionPlan, ShoppingCategory, MealType, MealPrepTag } from '@/types'
import { cn } from '@/lib/utils'

// ─── Parser: converte il JSON con "segments" nel formato NutritionPlan ─────────

function slugify(s: string) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 50)
}

function categorize(name: string): ShoppingCategory {
  const n = name.toLowerCase()
  if (/pasta|riso|pane|farro|avena|crackers|gallette|grano|quinoa|couscous|amaranto|spaghetti|pizza|piadina|farina|biscotti|fette/.test(n)) return 'cereali_pane'
  if (/pollo|tacchino|manzo|vitello|pesce|orata|trota|tonno|gamberi|acciughe|uova|frittata|hamburger|prosciutto|mozzarella|parmigiano|ricotta|filetti|tagliata/.test(n)) return 'proteine'
  if (/lenticchie|ceci|fagioli|legumi|polpette di ceci|piselli/.test(n)) return 'legumi'
  if (/banana|mela|pera|kiwi|arancia|uva|avocado|olive|frutto/.test(n)) return 'frutta'
  if (/mandorle|nocciole|anacardi|noci|semi|frutta secca/.test(n)) return 'frutta_secca_semi'
  if (/latte|cappuccino|soia|yogurt|kefir/.test(n)) return 'latticini_vegetali'
  if (/zucchine|broccoli|spinaci|carote|cavolfiore|fagiolini|pomodor|asparagi|piselli|patate|verdure|cipolla|broccoletti|insalata|sedano|finocchio/.test(n)) return 'verdura'
  if (/olio|sale|marmellata|miele|hummus|pesto|basilico|curry|limone|aceto|dado|spezie|salsa/.test(n)) return 'dispensa'
  return 'altro'
}

const DAY_NAMES_UPPER = ['LUNEDÌ', 'MARTEDÌ', 'MERCOLEDÌ', 'GIOVEDÌ', 'VENERDÌ', 'SABATO', 'DOMENICA']
const DAY_LABELS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']
const MEAL_TYPE_MAP: Record<string, string> = {
  'Colazione': 'colazione',
  'Spuntino1': 'spuntino_mattina',
  'Pranzo': 'pranzo',
  'Spuntino2': 'spuntino_pomeriggio',
  'Cena': 'cena',
}

function parseMealText(rawText: string, mealType: MealType, weekIdx: number, dayIdx: number) {
  const parts = rawText.split(/\s*\+\s*/)
  const ingredients = parts.map((part, i) => {
    const qtyMatch = part.match(/\(([^)]+)\)/)
    const qty = qtyMatch ? qtyMatch[1] : ''
    const name = part.replace(/\([^)]*\)/g, '').trim().replace(/\s+/g, ' ').replace(/[,.]$/, '').trim()
    if (name.length < 2) return null
    return {
      id: `ing-${slugify(name)}-${i}`,
      name,
      quantity: qty,
      category: categorize(name),
    }
  }).filter(Boolean) as NutritionPlan['weeks'][0][0]['meals'][0]['ingredients']

  const titleRaw = parts[0] || rawText
  const title = titleRaw.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim().slice(0, 80)

  return {
    id: `w${weekIdx + 1}-d${dayIdx + 1}-${mealType}`,
    type: mealType,
    title,
    description: '',
    quantity: '',
    mealPrepTags: [] as MealPrepTag[],
    ingredients,
    alternatives: [],
  }
}

function parseSegmentsJson(raw: unknown): NutritionPlan {
  // Accept both {segments:[...]} and a raw string array
  const segments: string[] = Array.isArray(raw)
    ? raw
    : (raw as { segments?: string[] }).segments ?? []

  if (segments.length === 0) throw new Error('Nessun segmento trovato nel file')

  const text = segments.join(' ')

  // Split by SETTIMANA
  const weekParts = text.split(/SETTIMANA\s+(\d+)/i)
  const weeksRaw: Record<number, string> = {}
  for (let i = 1; i < weekParts.length - 1; i += 2) {
    weeksRaw[parseInt(weekParts[i])] = weekParts[i + 1] || ''
  }
  if (Object.keys(weeksRaw).length === 0) throw new Error('Struttura del piano non riconosciuta. Assicurati che il file contenga "SETTIMANA 1" e "SETTIMANA 2".')

  const planWeeks: NutritionPlan['weeks'] = []

  for (const weekNum of [1, 2]) {
    const wtext = weeksRaw[weekNum] || weeksRaw[1] || ''
    const dayPattern = new RegExp(`(${DAY_NAMES_UPPER.join('|')})`, 'g')
    const dayParts = wtext.split(dayPattern)

    const daysMap: Record<string, string> = {}
    for (let i = 1; i < dayParts.length - 1; i += 2) {
      daysMap[dayParts[i]] = dayParts[i + 1] || ''
    }

    const weekDays: NutritionPlan['weeks'][0] = []
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const dayName = DAY_NAMES_UPPER[dayIdx]
      const dayText = daysMap[dayName] || ''

      const mealParts = dayText.split(/(Colazione:|Spuntino:|Pranzo:|Cena:)/g)
      const meals: NutritionPlan['weeks'][0][0]['meals'] = []
      let spuntinoCount = 0
      let pendingMealKey: string | null = null

      for (const part of mealParts) {
        const p = part.trim()
        if (p === 'Colazione:') { pendingMealKey = 'Colazione'; continue }
        if (p === 'Pranzo:')    { pendingMealKey = 'Pranzo'; continue }
        if (p === 'Cena:')      { pendingMealKey = 'Cena'; continue }
        if (p === 'Spuntino:')  { spuntinoCount++; pendingMealKey = `Spuntino${spuntinoCount}`; continue }
        if (pendingMealKey && p) {
          const mealType = (MEAL_TYPE_MAP[pendingMealKey] || 'colazione') as MealType
          meals.push(parseMealText(p, mealType, weekNum - 1, dayIdx))
          pendingMealKey = null
        }
      }

      // Fill missing meal slots
      const existing = new Set(meals.map(m => m.type))
      for (const t of ['colazione', 'spuntino_mattina', 'pranzo', 'spuntino_pomeriggio', 'cena'] as MealType[]) {
        if (!existing.has(t)) meals.push({ id: `w${weekNum}-d${dayIdx + 1}-${t}`, type: t, title: '', description: '', quantity: '', mealPrepTags: [], ingredients: [], alternatives: [] })
      }
      const order = ['colazione', 'spuntino_mattina', 'pranzo', 'spuntino_pomeriggio', 'cena']
      meals.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))

      weekDays.push({ dayIndex: dayIdx, weekIndex: weekNum - 1, label: DAY_LABELS[dayIdx], meals })
    }
    planWeeks.push(weekDays)
  }

  const totalMeals = planWeeks.flat().flatMap(d => d.meals).filter(m => m.title).length
  if (totalMeals === 0) throw new Error('Nessun pasto riconosciuto. Controlla che il file sia il JSON del piano nutrizionale.')

  return {
    id: 'piano-nutrizionista',
    name: 'Piano Nutrizionale',
    description: '',
    weeks: planWeeks,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

type Stage = 'upload' | 'parsing' | 'preview' | 'error'

export default function ImportPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setCustomPlan, customPlan } = useAppStore()

  const [stage, setStage] = useState<Stage>('upload')
  const [errorMsg, setErrorMsg] = useState('')
  const [parsedPlan, setParsedPlan] = useState<NutritionPlan | null>(null)
  const [fileName, setFileName] = useState('')
  const [dragOver, setDragOver] = useState(false)

  async function handleFile(file: File) {
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setErrorMsg('Il file deve essere un JSON (estensione .json).')
      setStage('error')
      return
    }
    setFileName(file.name)
    setStage('parsing')
    setErrorMsg('')

    try {
      const text = await file.text()
      const raw = JSON.parse(text)
      const plan = parseSegmentsJson(raw)
      setParsedPlan(plan)
      setStage('preview')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Errore nel parsing del file.')
      setStage('error')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function confirmPlan() {
    if (parsedPlan) { setCustomPlan(parsedPlan); router.push('/') }
  }

  const countMeals = (p: NutritionPlan) => p.weeks.flat().flatMap(d => d.meals).filter(m => m.title).length
  const countIngredients = (p: NutritionPlan) => p.weeks.flat().flatMap(d => d.meals).flatMap(m => m.ingredients).length

  return (
    <div className="min-h-screen bg-cream">
      <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur border-b border-warmgray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => stage === 'parsing' ? null : stage !== 'upload' ? setStage('upload') : router.back()}
          disabled={stage === 'parsing'}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-warmgray-100 disabled:opacity-40"
        >
          <ArrowLeft className="w-5 h-5 text-warmgray-700" />
        </button>
        <h1 className="font-display font-semibold text-warmgray-900">Importa piano</h1>
      </div>

      <div className="p-4 pb-12 space-y-4">

        {/* Piano attivo */}
        {customPlan && stage === 'upload' && (
          <div className="card border border-sage/40 bg-sage/5 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-sage mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-warmgray-900">{customPlan.name}</p>
                <p className="text-xs text-warmgray-500 mt-0.5">
                  {countMeals(customPlan)} pasti · {countIngredients(customPlan)} ingredienti
                </p>
              </div>
              <button onClick={() => setCustomPlan(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-warmgray-300 hover:text-red-400 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* UPLOAD */}
        {stage === 'upload' && (
          <>
            <div className="card border border-amber-200 bg-amber-50/60 p-4">
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Come ottenere il file JSON:</strong> il tuo nutrizionista ti invia il piano come PDF.
                Puoi estrarne il testo con uno strumento come <strong>Adobe Acrobat</strong> o <strong>Smallpdf</strong> esportando in formato JSON,
                oppure usa l&apos;app <strong>ChatGPT</strong> / <strong>Claude</strong> per convertire il PDF e salvare il risultato come <code className="bg-amber-100 px-1 rounded">.json</code> con la struttura <code className="bg-amber-100 px-1 rounded">{`{"segments":["testo..."]}`}</code>.
              </p>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-3xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-all",
                dragOver ? "border-sage bg-sage/10" : "border-warmgray-200 bg-white hover:border-sage/60 hover:bg-sage/5"
              )}
            >
              <div className="w-14 h-14 rounded-2xl bg-sage/10 flex items-center justify-center">
                <FileJson className="w-7 h-7 text-sage" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-warmgray-900">Trascina il file JSON qui</p>
                <p className="text-sm text-warmgray-400 mt-1">oppure tocca per selezionare</p>
              </div>
              <span className="text-xs text-warmgray-300">Solo file .json</span>
            </div>
            <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleInputChange} className="hidden" />
          </>
        )}

        {/* PARSING */}
        {stage === 'parsing' && (
          <div className="card p-10 flex flex-col items-center gap-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-sage/10 flex items-center justify-center">
              <FileText className="w-7 h-7 text-sage animate-pulse" />
            </div>
            <div>
              <p className="font-semibold text-warmgray-900">Leggo il piano…</p>
              <p className="text-sm text-warmgray-500 mt-1">{fileName}</p>
            </div>
          </div>
        )}

        {/* ERROR */}
        {stage === 'error' && (
          <div className="space-y-4">
            <div className="card border border-red-100 p-5 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">Qualcosa è andato storto</p>
                <p className="text-sm text-red-600 mt-1 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
            <button onClick={() => { setStage('upload'); fileInputRef.current?.click() }}
              className="w-full py-3 bg-sage text-white rounded-2xl font-semibold text-sm hover:bg-sage/90">
              Riprova con un altro file
            </button>
          </div>
        )}

        {/* PREVIEW */}
        {stage === 'preview' && parsedPlan && (
          <div className="space-y-4">
            <div className="card border border-sage/30 bg-sage/5 p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-sage" />
                <p className="font-semibold text-warmgray-900 text-sm">Piano letto correttamente</p>
              </div>
              <p className="text-xs text-warmgray-500 ml-7">
                {countMeals(parsedPlan)} pasti · {countIngredients(parsedPlan)} ingredienti
              </p>
            </div>

            {parsedPlan.weeks.map((week, wi) => (
              <div key={wi}>
                <h3 className="text-sm font-semibold text-warmgray-700 mb-2 px-1">Settimana {wi + 1}</h3>
                <div className="card border border-warmgray-100 divide-y divide-warmgray-50 overflow-hidden">
                  {week.map(day => {
                    const filled = day.meals.filter(m => m.title)
                    return (
                      <div key={day.dayIndex} className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-medium text-warmgray-900 w-24 flex-shrink-0">{day.label}</span>
                          <div className="flex-1 space-y-0.5">
                            {filled.length === 0
                              ? <span className="text-xs text-warmgray-300 italic">nessun pasto</span>
                              : filled.map(m => (
                                <div key={m.id} className="flex items-baseline gap-2">
                                  <span className="text-xs text-warmgray-400 w-20 flex-shrink-0">
                                    {m.type === 'spuntino_mattina' ? 'spuntino' : m.type === 'spuntino_pomeriggio' ? 'merenda' : m.type}
                                  </span>
                                  <span className="text-xs text-warmgray-700">{m.title}</span>
                                  {m.ingredients.length > 0 && <span className="text-xs text-warmgray-300">({m.ingredients.length})</span>}
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            <div className="pt-2 space-y-2">
              <button onClick={confirmPlan}
                className="w-full py-3.5 bg-sage text-white rounded-2xl font-semibold text-sm hover:bg-sage/90 shadow-sm">
                ✓ Usa questo piano
              </button>
              <button onClick={() => setStage('upload')}
                className="w-full py-3 bg-warmgray-100 text-warmgray-600 rounded-2xl font-semibold text-sm hover:bg-warmgray-200">
                Carica un altro file
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
