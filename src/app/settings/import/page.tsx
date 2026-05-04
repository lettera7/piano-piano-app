'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileUp, Loader2, CheckCircle, AlertCircle, FileText, Trash2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { NutritionPlan } from '@/types'
import { cn } from '@/lib/utils'

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
    if (file.type !== 'application/pdf') {
      setErrorMsg('Il file deve essere un PDF.')
      setStage('error')
      return
    }
    setFileName(file.name)
    setStage('parsing')
    setErrorMsg('')

    try {
      const formData = new FormData()
      formData.append('pdf', file)

      const res = await fetch('/api/parse-plan', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Errore durante l\'analisi del PDF.')
        setStage('error')
        return
      }

      setParsedPlan(data.plan)
      setStage('preview')
    } catch (err) {
      setErrorMsg('Errore di rete. Controlla la connessione e riprova.')
      setStage('error')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function confirmPlan() {
    if (parsedPlan) {
      setCustomPlan(parsedPlan)
      router.push('/')
    }
  }

  function removePlan() {
    setCustomPlan(null)
    setStage('upload')
    setParsedPlan(null)
    setFileName('')
  }

  // Count meals with actual content
  const countMeals = (plan: NutritionPlan) =>
    plan.weeks.flat().flatMap(d => d.meals).filter(m => m.title).length
  const countIngredients = (plan: NutritionPlan) =>
    plan.weeks.flat().flatMap(d => d.meals).flatMap(m => m.ingredients).length

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur border-b border-warmgray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => stage === 'parsing' ? null : (stage === 'preview' || stage === 'error' ? setStage('upload') : router.back())}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-warmgray-100 disabled:opacity-40"
          disabled={stage === 'parsing'}
        >
          <ArrowLeft className="w-5 h-5 text-warmgray-700" />
        </button>
        <h1 className="font-display font-semibold text-warmgray-900">Importa piano dal PDF</h1>
      </div>

      <div className="p-4 pb-12 space-y-4">

        {/* Piano attivo */}
        {customPlan && stage === 'upload' && (
          <div className="card border border-sage/40 bg-sage/5 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-sage mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-warmgray-900">Piano attivo: {customPlan.name}</p>
                <p className="text-xs text-warmgray-500 mt-0.5">
                  {countMeals(customPlan)} pasti · {countIngredients(customPlan)} ingredienti
                </p>
              </div>
              <button
                onClick={removePlan}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-warmgray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                title="Rimuovi piano"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STAGE: UPLOAD ── */}
        {stage === 'upload' && (
          <>
            <div className="card border border-warmgray-100 p-4 bg-amber-50/50">
              <p className="text-sm text-amber-800 leading-relaxed">
                📄 Carica il PDF del piano nutrizionale assegnato dalla tua nutrizionista.
                Claude leggerà <strong>solo quello che c&apos;è scritto</strong> nel documento — nessun ingrediente inventato.
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-3xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-all",
                dragOver
                  ? "border-sage bg-sage/10"
                  : "border-warmgray-200 bg-white hover:border-sage/60 hover:bg-sage/5"
              )}
            >
              <div className="w-14 h-14 rounded-2xl bg-sage/10 flex items-center justify-center">
                <FileUp className="w-7 h-7 text-sage" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-warmgray-900">Trascina il PDF qui</p>
                <p className="text-sm text-warmgray-400 mt-1">oppure tocca per selezionare il file</p>
              </div>
              <span className="text-xs text-warmgray-300">PDF · max 20MB</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleInputChange}
              className="hidden"
            />
          </>
        )}

        {/* ── STAGE: PARSING ── */}
        {stage === 'parsing' && (
          <div className="card p-10 flex flex-col items-center gap-5 text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-sage/10 flex items-center justify-center">
                <FileText className="w-8 h-8 text-sage" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow">
                <Loader2 className="w-4 h-4 text-sage animate-spin" />
              </div>
            </div>
            <div>
              <p className="font-semibold text-warmgray-900">Sto leggendo il piano…</p>
              <p className="text-sm text-warmgray-500 mt-1 max-w-xs leading-relaxed">
                Claude sta estraendo pasti e ingredienti dal tuo PDF. Può richiedere 20–40 secondi.
              </p>
            </div>
            <div className="text-xs text-warmgray-400 bg-warmgray-50 px-3 py-2 rounded-xl">
              📄 {fileName}
            </div>
          </div>
        )}

        {/* ── STAGE: ERROR ── */}
        {stage === 'error' && (
          <div className="space-y-4">
            <div className="card border border-red-100 p-5 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">Qualcosa è andato storto</p>
                <p className="text-sm text-red-600 mt-1 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
            <button
              onClick={() => { setStage('upload'); fileInputRef.current?.click() }}
              className="w-full py-3 bg-sage text-white rounded-2xl font-semibold text-sm hover:bg-sage/90 transition-colors"
            >
              Riprova con un altro file
            </button>
          </div>
        )}

        {/* ── STAGE: PREVIEW ── */}
        {stage === 'preview' && parsedPlan && (
          <div className="space-y-4">
            <div className="card border border-sage/30 bg-sage/5 p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-sage" />
                <p className="font-semibold text-warmgray-900 text-sm">Piano estratto con successo</p>
              </div>
              <p className="text-xs text-warmgray-500 ml-7">
                {countMeals(parsedPlan)} pasti trovati · {countIngredients(parsedPlan)} ingredienti
              </p>
            </div>

            {/* Preview weeks */}
            {parsedPlan.weeks.map((week, wi) => (
              <div key={wi}>
                <h3 className="text-sm font-semibold text-warmgray-700 mb-2 px-1">
                  Settimana {wi + 1}
                </h3>
                <div className="card border border-warmgray-100 divide-y divide-warmgray-50 overflow-hidden">
                  {week.map(day => {
                    const filledMeals = day.meals.filter(m => m.title)
                    return (
                      <div key={day.dayIndex} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium text-warmgray-900 w-24 flex-shrink-0">
                            {day.label}
                          </span>
                          <div className="flex-1 space-y-1">
                            {filledMeals.length === 0 ? (
                              <span className="text-xs text-warmgray-300 italic">nessun pasto</span>
                            ) : filledMeals.map(meal => (
                              <div key={meal.id} className="flex items-baseline gap-2">
                                <span className="text-xs text-warmgray-400 w-14 flex-shrink-0 capitalize">
                                  {meal.type === 'spuntino_mattina' ? 'spuntino' :
                                   meal.type === 'spuntino_pomeriggio' ? 'merenda' : meal.type}
                                </span>
                                <span className="text-xs text-warmgray-700">{meal.title}</span>
                                {meal.ingredients.length > 0 && (
                                  <span className="text-xs text-warmgray-300">({meal.ingredients.length} ing.)</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            <div className="pt-2 space-y-2">
              <button
                onClick={confirmPlan}
                className="w-full py-3.5 bg-sage text-white rounded-2xl font-semibold text-sm hover:bg-sage/90 transition-colors shadow-sm"
              >
                ✓ Usa questo piano
              </button>
              <button
                onClick={() => setStage('upload')}
                className="w-full py-3 bg-warmgray-100 text-warmgray-600 rounded-2xl font-semibold text-sm hover:bg-warmgray-200 transition-colors"
              >
                Carica un altro PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
