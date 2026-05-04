'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarDays, Leaf, User2, Trash2, FileUp, Check, ChevronRight, Sliders } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { ProfileId } from '@/types'

const PROFILE_EMOJIS: Record<ProfileId, string> = {
  marina: '🌸',
  luca:   '🌿',
}

const SCALE_OPTIONS = [
  { value: 1.0,  label: '100%', desc: 'Quantità originali' },
  { value: 1.10, label: '+10%', desc: 'Aumento leggero' },
  { value: 1.15, label: '+15%', desc: 'Aumento moderato' },
  { value: 1.20, label: '+20%', desc: 'Aumento significativo' },
]

export default function SettingsPage() {
  const { settings, setPlanStartDate, profileSettings, updateProfileSettings, customPlan, setCustomPlan } = useAppStore()
  const [dateSaved, setDateSaved] = useState(false)
  const [nameSaved, setNameSaved] = useState<ProfileId | null>(null)
  const [editingName, setEditingName] = useState<Record<ProfileId, string>>({
    marina: profileSettings.marina.name,
    luca:   profileSettings.luca.name,
  })

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPlanStartDate(e.target.value)
    setDateSaved(true)
    setTimeout(() => setDateSaved(false), 1500)
  }

  function handleNameSave(profile: ProfileId) {
    const name = editingName[profile].trim()
    if (!name) return
    updateProfileSettings(profile, { name })
    setNameSaved(profile)
    setTimeout(() => setNameSaved(null), 1500)
  }

  function handleReset() {
    if (confirm('Sei sicuro di voler resettare tutti i dati salvati? Non potrai recuperarli.')) {
      localStorage.removeItem('piano-piano-storage')
      window.location.reload()
    }
  }

  return (
    <AppShell>
      <div className="px-4 pt-4 pb-8 space-y-5">
        <div>
          <h2 className="heading-display text-2xl font-bold text-warmgray-900">Impostazioni</h2>
          <p className="text-sm text-warmgray-500 mt-1">Personalizza la tua esperienza</p>
        </div>

        {/* ── IMPORTA PIANO (primo, visibile subito) ── */}
        <Section title="Piano nutrizionale" icon={<FileUp className="w-4 h-4" />}>
          <div className="p-4 space-y-3">
            {customPlan ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-sage/5 border border-sage/30 rounded-2xl p-3">
                  <Check className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-warmgray-900 truncate">{customPlan.name}</p>
                    <p className="text-xs text-warmgray-400 mt-0.5">
                      {customPlan.weeks.flat().flatMap(d => d.meals).filter(m => m.title).length} pasti ·{' '}
                      {customPlan.weeks.flat().flatMap(d => d.meals).flatMap(m => m.ingredients).length} ingredienti
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/settings/import"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sage text-white rounded-2xl text-sm font-semibold hover:bg-sage/90 transition-colors"
                  >
                    <FileUp className="w-4 h-4" />
                    Aggiorna piano
                  </Link>
                  <button
                    onClick={() => setCustomPlan(null)}
                    className="px-4 py-2.5 border border-warmgray-200 text-warmgray-500 rounded-2xl text-sm font-medium hover:bg-warmgray-50 transition-colors"
                  >
                    Rimuovi
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-warmgray-500 leading-relaxed">
                  Carica il PDF del piano assegnato dalla tua nutrizionista. L&apos;app leggerà pasti e ingredienti{' '}
                  <strong>esattamente come scritti</strong> nel documento, senza inventare nulla.
                </p>
                <Link
                  href="/settings/import"
                  className="flex items-center justify-between w-full bg-sage text-white px-4 py-3.5 rounded-2xl font-semibold text-sm hover:bg-sage/90 transition-colors shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <FileUp className="w-4 h-4" />
                    Carica il PDF del piano
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </Link>
              </div>
            )}
          </div>
        </Section>

        {/* ── PROFILI ── */}
        {(['marina', 'luca'] as ProfileId[]).map(profile => {
          const ps = profileSettings[profile]
          const isActive = settings.activeProfile === profile
          return (
            <Section
              key={profile}
              title={`${PROFILE_EMOJIS[profile]} ${ps.name}`}
              icon={<User2 className="w-4 h-4" />}
              badge={isActive ? 'attivo' : undefined}
            >
              <div className="p-4 space-y-5">

                {/* Nome */}
                <div>
                  <label className="text-xs font-semibold text-warmgray-500 uppercase tracking-wide block mb-1.5">
                    Nome
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingName[profile]}
                      onChange={e => setEditingName(prev => ({ ...prev, [profile]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleNameSave(profile)}
                      className="flex-1 bg-warmgray-50 border border-warmgray-200 rounded-2xl px-4 py-2.5 text-sm text-warmgray-800 focus:outline-none focus:border-sage"
                      placeholder="Nome profilo"
                    />
                    <button
                      onClick={() => handleNameSave(profile)}
                      disabled={!editingName[profile].trim() || editingName[profile].trim() === ps.name}
                      className={cn(
                        "px-4 py-2.5 rounded-2xl text-sm font-semibold transition-colors",
                        nameSaved === profile
                          ? "bg-sage text-white"
                          : "bg-warmgray-100 text-warmgray-600 hover:bg-warmgray-200 disabled:opacity-40"
                      )}
                    >
                      {nameSaved === profile ? '✓' : 'Salva'}
                    </button>
                  </div>
                </div>

                {/* Scala quantità */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sliders className="w-3.5 h-3.5 text-warmgray-400" />
                    <label className="text-xs font-semibold text-warmgray-500 uppercase tracking-wide">
                      Quantità ingredienti
                    </label>
                  </div>
                  <p className="text-xs text-warmgray-400 mb-3 leading-relaxed">
                    Aumenta le quantità di tutti gli ingredienti per questo profilo. Utile se il piano base è calibrato su un fabbisogno diverso.
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {SCALE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updateProfileSettings(profile, { quantityScale: opt.value })}
                        className={cn(
                          "flex flex-col items-center gap-0.5 py-3 rounded-2xl border-2 transition-all text-center",
                          ps.quantityScale === opt.value
                            ? "border-sage bg-sage/10 text-sage"
                            : "border-warmgray-150 bg-white text-warmgray-600 hover:border-sage/40"
                        )}
                      >
                        <span className="text-sm font-bold">{opt.label}</span>
                        <span className="text-[10px] leading-tight text-warmgray-400 px-1">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                  {ps.quantityScale !== 1 && (
                    <p className="text-xs text-sage mt-2.5 font-medium">
                      ✓ Le quantità per {ps.name} sono aumentate del {Math.round((ps.quantityScale - 1) * 100)}%
                    </p>
                  )}
                </div>

              </div>
            </Section>
          )
        })}

        {/* ── DATA INIZIO PIANO ── */}
        <Section title="Inizio del piano" icon={<CalendarDays className="w-4 h-4" />}>
          <div className="p-4 space-y-3">
            <p className="text-sm text-warmgray-500">
              L&apos;app calcola automaticamente in che giorno del ciclo ti trovi in base a questa data.
            </p>
            <input
              type="date"
              value={settings.planStartDate}
              onChange={handleDateChange}
              className="w-full bg-warmgray-50 border border-warmgray-200 rounded-2xl px-4 py-3 text-sm text-warmgray-800 focus:outline-none focus:border-sage"
            />
            {dateSaved && <p className="text-sm text-sage font-medium animate-fade-in">✓ Salvato</p>}
            <div className="bg-sage/5 border border-sage/20 rounded-2xl p-3 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-sage flex-shrink-0" />
              <p className="text-xs text-warmgray-600">
                Data inizio: <strong>{format(new Date(settings.planStartDate + 'T12:00:00'), 'dd/MM/yyyy')}</strong>
                {' · '}Oggi: <strong>{format(new Date(), 'dd/MM/yyyy')}</strong>
              </p>
            </div>
          </div>
        </Section>

        {/* ── ABOUT ── */}
        <Section title="Piano Piano" icon={<Leaf className="w-4 h-4" />}>
          <div className="p-4 space-y-2">
            <p className="text-sm text-warmgray-600 leading-relaxed">
              <strong>Piano Piano</strong> è uno strumento per seguire il piano nutrizionale assegnato dal tuo nutrizionista.
            </p>
            <p className="text-sm text-warmgray-400 leading-relaxed">
              Non fornisce consigli nutrizionali e non sostituisce il professionista.
            </p>
            <p className="text-xs text-warmgray-300 pt-1">📱 Versione MVP · Dati salvati localmente</p>
          </div>
        </Section>

        {/* ── DANGER ZONE ── */}
        <Section title="Zona pericolosa" icon={<Trash2 className="w-4 h-4 text-red-400" />}>
          <div className="p-4">
            <p className="text-sm text-warmgray-500 mb-3">
              Resetta tutti i dati (completamenti, diario, lista spesa, piano caricato). Azione irreversibile.
            </p>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-500 rounded-2xl text-sm font-medium hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Resetta tutti i dati
            </button>
          </div>
        </Section>

      </div>
    </AppShell>
  )
}

function Section({
  title, icon, children, badge
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  badge?: string
}) {
  return (
    <div className="card border border-warmgray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-warmgray-100 bg-warmgray-50">
        <span className="text-warmgray-500">{icon}</span>
        <h3 className="text-sm font-semibold text-warmgray-700 flex-1">{title}</h3>
        {badge && (
          <span className="text-xs bg-sage/20 text-sage px-2 py-0.5 rounded-full font-medium">{badge}</span>
        )}
      </div>
      {children}
    </div>
  )
}
