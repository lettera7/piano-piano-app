'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Copy, Check, BookOpen } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { useAppStore } from '@/lib/store'
import { generateWeeklyReport, reportToText, capitalizeFirst } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { DiaryAdherence, DiaryHunger, DiaryEnergy, DiaryDigestion } from '@/types'

const today = format(new Date(), 'yyyy-MM-dd')
const todayLabel = capitalizeFirst(format(new Date(), 'EEEE d MMMM', { locale: it }))

export default function DiaryPage() {
  const { diary, saveDiaryEntry, completedMeals, settings } = useAppStore()
  const [tab, setTab] = useState<'oggi' | 'report'>('oggi')
  const [copied, setCopied] = useState(false)

  const entry = diary[today] || {}

  const update = (field: string, value: string) => {
    saveDiaryEntry(today, { [field]: value, date: today })
  }

  const report = useMemo(() => {
    const profileMeals = completedMeals[settings.activeProfile] || {}
    return generateWeeklyReport(
      profileMeals as Record<string, Record<string, { status: string; note?: string }>>,
      diary as Record<string, { adherence?: string; nutritionistQuestions?: string }>,
      settings.planStartDate
    )
  }, [completedMeals, diary, settings])

  const handleCopyReport = () => {
    navigator.clipboard.writeText(reportToText(report))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AppShell>
      <div className="px-4 pt-4 pb-6 space-y-5">
        {/* Header */}
        <div>
          <h2 className="heading-display text-2xl font-bold text-warmgray-900">Diario</h2>
          <p className="text-sm text-warmgray-500 mt-1">Note personali — solo per te</p>
        </div>

        {/* Tab selector */}
        <div className="flex gap-2 p-1 bg-warmgray-100 rounded-2xl">
          {(['oggi', 'report'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                tab === t ? "bg-white text-sage-700 shadow-sm" : "text-warmgray-500"
              )}
            >
              {t === 'oggi' ? '📅 Oggi' : '📊 Settimana'}
            </button>
          ))}
        </div>

        {tab === 'oggi' ? (
          <div className="space-y-4 stagger-children">
            {/* Date */}
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sage-500" />
              <span className="text-sm font-medium text-warmgray-700">{todayLabel}</span>
            </div>

            {/* Adherence */}
            <SegmentField
              label="Hai seguito il piano?"
              value={entry.adherence}
              options={[
                { value: 'si', label: '✅ Sì', activeClass: 'bg-sage-500 text-white' },
                { value: 'parzialmente', label: '🔶 Parzialmente', activeClass: 'bg-amber-400 text-white' },
                { value: 'no', label: '⬜ No', activeClass: 'bg-warmgray-400 text-white' },
              ]}
              onChange={v => update('adherence', v)}
            />

            {/* Hunger */}
            <SegmentField
              label="Livello di fame"
              value={entry.hunger}
              options={[
                { value: 'bassa', label: '😌 Bassa' },
                { value: 'media', label: '😐 Media' },
                { value: 'alta', label: '😮 Alta' },
              ]}
              onChange={v => update('hunger', v)}
            />

            {/* Energy */}
            <SegmentField
              label="Energia"
              value={entry.energy}
              options={[
                { value: 'bassa', label: '🪫 Bassa' },
                { value: 'normale', label: '⚡ Normale' },
                { value: 'buona', label: '🌟 Buona' },
              ]}
              onChange={v => update('energy', v)}
            />

            {/* Digestion */}
            <SegmentField
              label="Digestione"
              value={entry.digestion}
              options={[
                { value: 'ok', label: '🟢 Ok' },
                { value: 'pesantezza', label: 'Pesantezza' },
                { value: 'gonfiore', label: 'Gonfiore' },
                { value: 'nausea', label: 'Nausea' },
              ]}
              onChange={v => update('digestion', v)}
            />

            {/* Free notes */}
            <div>
              <label className="text-sm font-semibold text-warmgray-600 block mb-2">Note libere</label>
              <textarea
                value={entry.notes || ''}
                onChange={e => update('notes', e.target.value)}
                placeholder="Com'è andata oggi? Hai notato qualcosa di particolare?"
                className="w-full bg-white border border-warmgray-200 rounded-2xl px-4 py-3 text-sm text-warmgray-700 placeholder-warmgray-300 focus:outline-none focus:border-sage-300 resize-none"
                rows={3}
              />
            </div>

            {/* Nutritionist questions */}
            <div>
              <label className="text-sm font-semibold text-warmgray-600 block mb-2">
                Domande per il nutrizionista
              </label>
              <textarea
                value={entry.nutritionistQuestions || ''}
                onChange={e => update('nutritionistQuestions', e.target.value)}
                placeholder="Hai dubbi o domande da fare alla prossima visita?"
                className="w-full bg-white border border-warmgray-200 rounded-2xl px-4 py-3 text-sm text-warmgray-700 placeholder-warmgray-300 focus:outline-none focus:border-sage-300 resize-none"
                rows={3}
              />
            </div>

            {/* Disclaimer */}
            <div className="bg-warmgray-50 border border-warmgray-100 rounded-2xl p-4">
              <p className="text-xs text-warmgray-400 leading-relaxed text-center">
                ℹ️ Queste note servono solo come promemoria personale e non sostituiscono il confronto con il nutrizionista.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 stagger-children">
            {/* Weekly summary */}
            <div className="card border border-warmgray-100 p-5">
              <h3 className="heading-display font-semibold text-warmgray-900 mb-4">Riepilogo 7 giorni</h3>

              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  emoji="✅" label="Giorni completati"
                  value={`${report.completedDays}/7`}
                  color="text-sage-600"
                />
                <StatCard
                  emoji="🔶" label="Giorni parziali"
                  value={`${report.partialDays}/7`}
                  color="text-amber-600"
                />
                <StatCard
                  emoji="🍽️" label="Pasti completati"
                  value={report.doneMeals.toString()}
                  color="text-warmgray-700"
                />
                <StatCard
                  emoji="✏️" label="Pasti modificati"
                  value={report.modifiedMeals.toString()}
                  color="text-warmgray-700"
                />
              </div>
            </div>

            {/* Questions */}
            {report.topQuestions.length > 0 && (
              <div className="card border border-golden-200 bg-golden-100 p-5">
                <h3 className="font-semibold text-amber-800 mb-3">❓ Domande per il nutrizionista</h3>
                <div className="space-y-2">
                  {report.topQuestions.map((q, i) => (
                    <div key={i} className="bg-white/60 rounded-xl p-3">
                      <p className="text-sm text-amber-700">{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Copy button */}
            <button
              onClick={handleCopyReport}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm transition-all duration-200 shadow-sm",
                copied
                  ? "bg-sage-500 text-white"
                  : "bg-warmgray-800 text-white hover:bg-warmgray-900"
              )}
            >
              {copied ? (
                <><Check className="w-4 h-4" /> Copiato negli appunti!</>
              ) : (
                <><Copy className="w-4 h-4" /> Copia riepilogo (WhatsApp / Email)</>
              )}
            </button>

            <p className="text-xs text-warmgray-400 text-center">
              Il riepilogo viene copiato come testo — puoi incollarlo in qualunque app
            </p>
          </div>
        )}
      </div>
    </AppShell>
  )
}

// ─── Helper components ────────────────────────────────────────────────────────

interface Option { value: string; label: string; activeClass?: string }

function SegmentField({
  label, value, options, onChange
}: {
  label: string; value?: string; options: Option[]; onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-warmgray-600 block mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value === value ? '' : opt.value)}
            className={cn(
              "px-3 py-2 rounded-xl text-sm border transition-all duration-200",
              value === opt.value
                ? (opt.activeClass || "bg-sage-500 text-white border-sage-500")
                : "bg-white text-warmgray-600 border-warmgray-200 hover:border-sage-300"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function StatCard({ emoji, label, value, color }: { emoji: string; label: string; value: string; color: string }) {
  return (
    <div className="bg-cream rounded-2xl p-3 text-center">
      <span className="text-xl">{emoji}</span>
      <div className={cn("text-xl font-bold mt-1", color)}>{value}</div>
      <div className="text-xs text-warmgray-400 mt-0.5">{label}</div>
    </div>
  )
}
