'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarDays, Leaf, User2, Trash2, ExternalLink, ChevronRight } from 'lucide-react'
import AppShell from '@/components/AppShell'
import ProfileSwitcher from '@/components/ProfileSwitcher'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function SettingsPage() {
  const { settings, updateSettings, setPlanStartDate } = useAppStore()
  const [saved, setSaved] = useState(false)

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlanStartDate(e.target.value)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleReset = () => {
    if (confirm('Sei sicuro di voler resettare tutti i dati salvati? Non potrai recuperarli.')) {
      localStorage.removeItem('piano-piano-storage')
      window.location.reload()
    }
  }

  return (
    <AppShell>
      <div className="px-4 pt-4 pb-8 space-y-6">
        {/* Header */}
        <div>
          <h2 className="heading-display text-2xl font-bold text-warmgray-900">Impostazioni</h2>
          <p className="text-sm text-warmgray-500 mt-1">Personalizza la tua esperienza</p>
        </div>

        {/* Profile section */}
        <Section title="Profilo attivo" icon={<User2 className="w-4 h-4" />}>
          <div className="p-4">
            <p className="text-sm text-warmgray-500 mb-3">
              Seleziona il profilo per cui stai registrando i pasti
            </p>
            <ProfileSwitcher />
          </div>
        </Section>

        {/* Plan start date */}
        <Section title="Inizio del piano" icon={<CalendarDays className="w-4 h-4" />}>
          <div className="p-4 space-y-3">
            <p className="text-sm text-warmgray-500">
              L'app calcolerà automaticamente in che giorno del ciclo ti trovi in base a questa data.
            </p>
            <div>
              <label className="text-xs font-semibold text-warmgray-500 uppercase tracking-wide block mb-1.5">
                Data di inizio
              </label>
              <input
                type="date"
                value={settings.planStartDate}
                onChange={handleDateChange}
                className="w-full bg-warmgray-50 border border-warmgray-200 rounded-2xl px-4 py-3 text-sm text-warmgray-800 focus:outline-none focus:border-sage-300"
              />
            </div>
            {saved && (
              <p className="text-sm text-sage-600 font-medium animate-fade-in">✓ Salvato</p>
            )}

            {/* Current cycle info */}
            <div className="bg-sage-50 border border-sage-100 rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-sage-500" />
                <span className="text-sm font-medium text-sage-700">
                  Oggi: {format(new Date(), 'dd/MM/yyyy')}
                </span>
              </div>
              <p className="text-xs text-sage-600 mt-1">
                Data di inizio impostata: {format(new Date(settings.planStartDate + 'T12:00:00'), 'dd MMMM yyyy')}
              </p>
            </div>
          </div>
        </Section>

        {/* About */}
        <Section title="Piano Piano" icon={<Leaf className="w-4 h-4" />}>
          <div className="p-4 space-y-3">
            <p className="text-sm text-warmgray-600 leading-relaxed">
              <strong>Piano Piano</strong> è un'app per seguire il piano nutrizionale assegnato dal tuo nutrizionista.
            </p>
            <p className="text-sm text-warmgray-500 leading-relaxed">
              Non fornisce consigli nutrizionali, non sostituisce il professionista e non genera diete autonomamente.
            </p>
            <div className="bg-warmgray-50 rounded-2xl p-3">
              <p className="text-xs text-warmgray-400">
                📱 Versione MVP · Dati salvati localmente nel browser
              </p>
            </div>
          </div>
        </Section>

        {/* Import plan */}
        <Section title="Importa piano" icon={<ExternalLink className="w-4 h-4" />}>
          <div className="p-4 space-y-3">
            <p className="text-sm text-warmgray-500 leading-relaxed">
              Carica il PDF del piano assegnato dalla tua nutrizionista. L&apos;app leggerà pasti e ingredienti <strong>esattamente come scritti</strong> nel documento.
            </p>
            <Link
              href="/settings/import"
              className="flex items-center justify-between w-full bg-sage text-white px-4 py-3 rounded-2xl font-semibold text-sm hover:bg-sage/90 transition-colors"
            >
              <span>📄 Carica il PDF del piano</span>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </Link>
          </div>
        </Section>

        {/* Danger zone */}
        <Section title="Zona pericolosa" icon={<Trash2 className="w-4 h-4 text-red-400" />}>
          <div className="p-4">
            <p className="text-sm text-warmgray-500 mb-3">
              Resetta tutti i dati salvati (completamenti, diario, lista spesa). Questa azione non può essere annullata.
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

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card border border-warmgray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-warmgray-100 bg-warmgray-50">
        <span className="text-warmgray-500">{icon}</span>
        <h3 className="text-sm font-semibold text-warmgray-700">{title}</h3>
      </div>
      {children}
    </div>
  )
}
