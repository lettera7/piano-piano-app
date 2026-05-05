'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Copy, Check } from 'lucide-react'
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

        {/* ── HERO ── */}
        <div
          className="rounded-[28px] p-5 relative overflow-hidden"
          style={{ background: 'var(--color-ink)', minHeight: 100 }}
        >
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 select-none pointer-events-none leading-none"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '8rem',
              color: 'rgba(255,255,255,0.04)',
              letterSpacing: '-0.05em',
            }}
          >
            ✍
          </div>
          <p className="label-micro mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Note personali</p>
          <h2 className="heading-display text-white" style={{ fontSize: '2.6rem' }}>Diario</h2>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Solo per te</p>
        </div>

        {/* ── Tab selector ── */}
        <div
          className="flex gap-1.5 p-1.5 rounded-2xl"
          style={{ background: 'var(--color-cream-dark)' }}
        >
          {(['oggi', 'report'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
              style={tab === t
                ? { background: '#fff', color: 'var(--color-ink)', boxShadow: '0 1px 4px rgba(26,23,20,0.1)' }
                : { color: 'var(--color-ink-light)' }
              }
            >
              {t === 'oggi' ? '📅 Oggi' : '📊 Settimana'}
            </button>
          ))}
        </div>

        {tab === 'oggi' ? (
          <div className="space-y-4 stagger-children">
            {/* Date label */}
            <p className="text-sm font-medium px-1" style={{ color: 'var(--color-ink-light)' }}>
              {todayLabel}
            </p>

            <SegmentField
              label="Hai seguito il piano?"
              value={entry.adherence}
              options={[
                { value: 'si', label: '✅ Sì', activeStyle: { background: 'var(--color-sage)', color: '#fff', border: 'none' } },
                { value: 'parzialmente', label: '🔶 Parz.', activeStyle: { background: 'var(--color-gold)', color: '#fff', border: 'none' } },
                { value: 'no', label: '⬜ No', activeStyle: { background: 'var(--color-ink-mid)', color: '#fff', border: 'none' } },
              ]}
              onChange={v => update('adherence', v)}
            />

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

            <div>
              <label className="text-sm font-bold block mb-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
                Note libere
              </label>
              <textarea
                value={entry.notes || ''}
                onChange={e => update('notes', e.target.value)}
                placeholder="Com'è andata oggi?"
                className="w-full rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none"
                style={{
                  background: '#fff',
                  border: '1.5px solid var(--color-cream-dark)',
                  color: 'var(--color-ink)',
                }}
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-bold block mb-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
                Domande per il nutrizionista
              </label>
              <textarea
                value={entry.nutritionistQuestions || ''}
                onChange={e => update('nutritionistQuestions', e.target.value)}
                placeholder="Dubbi per la prossima visita?"
                className="w-full rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none"
                style={{
                  background: '#fff',
                  border: '1.5px solid var(--color-cream-dark)',
                  color: 'var(--color-ink)',
                }}
                rows={3}
              />
            </div>

            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--color-cream-dark)' }}
            >
              <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--color-ink-light)' }}>
                ℹ️ Note personali — non sostituiscono il confronto col nutrizionista.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 stagger-children">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard emoji="✅" label="Giorni completati" value={`${report.completedDays}/7`} orange />
              <StatCard emoji="🔶" label="Giorni parziali" value={`${report.partialDays}/7`} />
              <StatCard emoji="🍽️" label="Pasti completati" value={report.doneMeals.toString()} />
              <StatCard emoji="✏️" label="Pasti modificati" value={report.modifiedMeals.toString()} />
            </div>

            {report.topQuestions.length > 0 && (
              <div
                className="rounded-2xl p-5"
                style={{ background: 'var(--color-gold-pale)', border: '1.5px solid #f0d88a' }}
              >
                <h3 className="font-bold text-sm mb-3" style={{ color: '#a07010', fontFamily: 'var(--font-display)' }}>
                  ❓ Domande per il nutrizionista
                </h3>
                <div className="space-y-2">
                  {report.topQuestions.map((q, i) => (
                    <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.6)' }}>
                      <p className="text-sm" style={{ color: '#a07010' }}>{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleCopyReport}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
              style={{
                background: copied ? 'var(--color-sage)' : 'var(--color-ink)',
                color: '#fff',
              }}
            >
              {copied ? (
                <><Check className="w-4 h-4" /> Copiato!</>
              ) : (
                <><Copy className="w-4 h-4" /> Copia riepilogo</>
              )}
            </button>

            <p className="text-xs text-center" style={{ color: 'var(--color-ink-faint)' }}>
              Incolla in WhatsApp o email per condividerlo col nutrizionista
            </p>
          </div>
        )}
      </div>
    </AppShell>
  )
}

// ─── Helper components ────────────────────────────────────────────────────────

interface Option {
  value: string
  label: string
  activeStyle?: React.CSSProperties
}

function SegmentField({ label, value, options, onChange }: {
  label: string
  value?: string
  options: Option[]
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label
        className="text-sm font-bold block mb-2"
        style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
      >
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value === value ? '' : opt.value)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95"
            style={
              value === opt.value
                ? (opt.activeStyle || { background: 'var(--color-orange)', color: '#fff', border: '1.5px solid transparent' })
                : {
                    background: '#fff',
                    color: 'var(--color-ink-mid)',
                    border: '1.5px solid var(--color-cream-dark)',
                  }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function StatCard({ emoji, label, value, orange }: {
  emoji: string; label: string; value: string; orange?: boolean
}) {
  return (
    <div
      className="rounded-2xl p-4 text-center"
      style={{
        background: orange ? 'var(--color-orange)' : '#fff',
        border: orange ? 'none' : '1.5px solid var(--color-cream-dark)',
      }}
    >
      <span className="text-2xl">{emoji}</span>
      <div
        className="text-2xl font-bold mt-1"
        style={{ fontFamily: 'var(--font-display)', color: orange ? '#fff' : 'var(--color-ink)' }}
      >
        {value}
      </div>
      <div className="text-xs mt-0.5" style={{ color: orange ? 'rgba(255,255,255,0.7)' : 'var(--color-ink-light)' }}>
        {label}
      </div>
    </div>
  )
}
