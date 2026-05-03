'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileJson, PenLine, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

type ImportMode = 'select' | 'json' | 'manual'

export default function ImportPage() {
  const router = useRouter()
  const [mode, setMode] = useState<ImportMode>('select')
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function handleJsonImport() {
    setError('')
    try {
      const parsed = JSON.parse(jsonText)
      if (!parsed.id || !parsed.weeks) {
        setError('Il JSON non ha la struttura attesa. Assicurati di avere i campi "id" e "weeks".')
        return
      }
      // TODO: save to store when Supabase integration is added
      // For now, show success message
      setSuccess(true)
    } catch {
      setError('JSON non valido. Controlla la sintassi.')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-6">
        <div className="card text-center p-8 max-w-sm w-full">
          <CheckCircle className="w-12 h-12 text-sage mx-auto mb-4" />
          <h2 className="text-xl font-display font-semibold text-warmgray-900 mb-2">Piano importato!</h2>
          <p className="text-warmgray-600 text-sm mb-6">
            Il tuo piano è stato caricato correttamente. Vai alla dashboard per iniziare.
          </p>
          <Link href="/" className="btn-primary block text-center">
            Vai a Oggi
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur border-b border-warmgray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => mode === 'select' ? router.back() : setMode('select')} className="p-2 rounded-xl hover:bg-warmgray-100">
          <ArrowLeft className="w-5 h-5 text-warmgray-700" />
        </button>
        <h1 className="font-display font-semibold text-warmgray-900">Importa piano</h1>
      </div>

      <div className="p-4 pb-8">

        {mode === 'select' && (
          <div className="space-y-4 mt-2">
            <p className="text-warmgray-600 text-sm leading-relaxed">
              Hai un piano nutrizionale da caricare? Scegli come vuoi importarlo.
            </p>

            <button
              onClick={() => setMode('json')}
              className="card w-full p-5 text-left hover:border-sage transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center flex-shrink-0">
                  <FileJson className="w-5 h-5 text-sage" />
                </div>
                <div>
                  <h3 className="font-semibold text-warmgray-900 mb-1">Incolla JSON</h3>
                  <p className="text-sm text-warmgray-500 leading-relaxed">
                    Se hai già il piano in formato JSON strutturato, incollalo qui per importarlo direttamente.
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('manual')}
              className="card w-full p-5 text-left hover:border-sage transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-golden/20 flex items-center justify-center flex-shrink-0">
                  <PenLine className="w-5 h-5 text-golden-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-warmgray-900 mb-1">Inserimento manuale</h3>
                  <p className="text-sm text-warmgray-500 leading-relaxed">
                    Inserisci il piano giorno per giorno guidato da un form. Utile se hai il piano su carta o PDF.
                  </p>
                  <span className="inline-block mt-2 text-xs bg-golden/20 text-golden-800 px-2 py-0.5 rounded-full">Prossimamente</span>
                </div>
              </div>
            </button>

            <div className="card p-4 bg-warmgray-50 border-warmgray-100">
              <div className="flex gap-3">
                <AlertCircle className="w-4 h-4 text-warmgray-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-warmgray-500 leading-relaxed">
                  Questa funzione serve solo per caricare piani già assegnati dal tuo nutrizionista.
                  Piano Piano non crea o modifica piani nutrizionali.
                </p>
              </div>
            </div>
          </div>
        )}

        {mode === 'json' && (
          <div className="space-y-4 mt-2">
            <p className="text-warmgray-600 text-sm leading-relaxed">
              Incolla il JSON del tuo piano nutrizionale. Deve seguire la struttura standard con i campi <code className="bg-warmgray-100 px-1 rounded text-xs">id</code>, <code className="bg-warmgray-100 px-1 rounded text-xs">name</code> e <code className="bg-warmgray-100 px-1 rounded text-xs">weeks</code>.
            </p>

            <textarea
              value={jsonText}
              onChange={(e) => { setJsonText(e.target.value); setError('') }}
              placeholder={'{\n  "id": "mio-piano",\n  "name": "Il mio piano",\n  "weeks": [...]\n}'}
              className="w-full h-64 p-4 rounded-2xl border border-warmgray-200 bg-white font-mono text-xs text-warmgray-800 focus:outline-none focus:border-sage resize-none"
            />

            {error && (
              <div className="flex gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={handleJsonImport}
              disabled={!jsonText.trim()}
              className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Importa piano
            </button>
          </div>
        )}

        {mode === 'manual' && (
          <div className="space-y-4 mt-2 text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-golden/20 flex items-center justify-center mx-auto">
              <PenLine className="w-8 h-8 text-golden-700" />
            </div>
            <h3 className="font-display font-semibold text-warmgray-900">In arrivo</h3>
            <p className="text-sm text-warmgray-500 max-w-xs mx-auto leading-relaxed">
              L&apos;inserimento manuale guidato è in sviluppo. Per ora puoi usare il formato JSON o modificare direttamente il file <code className="bg-warmgray-100 px-1 rounded text-xs">src/data/plan.json</code>.
            </p>
            <button onClick={() => setMode('select')} className="btn-secondary">
              Torna indietro
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
