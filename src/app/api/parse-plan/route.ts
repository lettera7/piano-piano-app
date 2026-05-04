import Anthropic from '@anthropic-ai/sdk'
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages'
import { NextRequest } from 'next/server'

export const runtime = 'edge' // Edge runtime: no timeout limit

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Sei un assistente che legge piani nutrizionali in formato PDF e li converte in JSON strutturato.

REGOLE FONDAMENTALI:
- Estrai SOLO quello che trovi scritto nel PDF. Non inventare nulla.
- Se un'informazione non è presente nel PDF, usa stringa vuota "" o array vuoto [].
- I nomi di pasti e ingredienti devono essere esattamente quelli scritti nel documento.
- Le quantità devono essere esattamente quelle scritte (es. "200g", "1 cucchiaio", "a piacere").
- Non aggiungere ingredienti che non sono nel PDF.
- Rispondi SOLO con il JSON, nessun testo prima o dopo, nessun markdown.

STRUTTURA JSON RICHIESTA:
{
  "id": "piano-nutrizionista",
  "name": "nome del piano se presente, altrimenti 'Piano Nutrizionale'",
  "description": "descrizione se presente, altrimenti ''",
  "weeks": [
    [
      {
        "dayIndex": 0,
        "weekIndex": 0,
        "label": "Lunedì",
        "meals": [
          {
            "id": "w1-d1-colazione",
            "type": "colazione",
            "title": "nome pasto esatto dal PDF",
            "description": "descrizione se presente",
            "quantity": "porzione totale se indicata",
            "mealPrepTags": [],
            "ingredients": [
              {
                "id": "ing-nome-slugificato",
                "name": "nome ingrediente esatto",
                "quantity": "quantità esatta",
                "category": "una di: frutta|verdura|cereali_pane|proteine|legumi|frutta_secca_semi|latticini_vegetali|dispensa|altro"
              }
            ],
            "alternatives": []
          }
        ]
      }
    ]
  ]
}

TIPI PASTO (type): colazione, spuntino_mattina, pranzo, spuntino_pomeriggio, cena

CATEGORIE INGREDIENTI:
- frutta: frutta fresca o secca come frutto (non come semi/olio)
- verdura: ortaggi, verdure fresche o surgelate
- cereali_pane: pasta, riso, pane, cereali, fiocchi, farine, crackers, gallette
- proteine: carne, pesce, uova, tofu, affettati, formaggi
- legumi: lenticchie, ceci, fagioli, piselli, edamame, soia in baccello
- frutta_secca_semi: mandorle, noci, semi di chia, semi di lino, burri di frutta secca
- latticini_vegetali: latte, yogurt, bevande vegetali, kefir, ricotta, cottage cheese
- dispensa: olio, sale, spezie, condimenti, salse, aceto, miso, tamari, dado, brodo
- altro: qualsiasi cosa non rientri nelle categorie sopra

GESTIONE SETTIMANE:
- Se il piano ha 2 settimane: weeks[0] = settimana 1, weeks[1] = settimana 2
- Se il piano ha 1 sola settimana: duplica la settimana in weeks[0] e weeks[1]
- Ogni settimana ha 7 giorni (dayIndex 0-6): Lunedì=0, Martedì=1, Mercoledì=2, Giovedì=3, Venerdì=4, Sabato=5, Domenica=6
- Se mancano giorni, crea il giorno con pasti vuoti (meals con title:"" e ingredients:[])

ID FORMAT:
- pasto: w{weekIndex+1}-d{dayIndex+1}-{type} (es. w1-d1-colazione)
- ingrediente: ing-{nome-con-trattini-lowercase} (es. ing-latte-di-soia)`

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('pdf') as File | null

    if (!file) {
      return new Response(JSON.stringify({ error: 'Nessun file ricevuto' }), { status: 400 })
    }
    if (!file.type.includes('pdf')) {
      return new Response(JSON.stringify({ error: 'Il file deve essere un PDF' }), { status: 400 })
    }
    if (file.size > 20 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Il file è troppo grande (max 20MB)' }), { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    // Edge runtime: use btoa on Uint8Array chunks
    const uint8 = new Uint8Array(bytes)
    let binary = ''
    const chunkSize = 8192
    for (let i = 0; i < uint8.length; i += chunkSize) {
      binary += String.fromCharCode(...uint8.subarray(i, i + chunkSize))
    }
    const base64 = btoa(binary)

    const message: MessageParam = {
      role: 'user',
      content: [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        } as Anthropic.DocumentBlockParam,
        {
          type: 'text',
          text: 'Estrai il piano nutrizionale da questo PDF e restituisci il JSON strutturato secondo le istruzioni. Non inventare nulla: usa solo le informazioni presenti nel documento.',
        } as Anthropic.TextBlockParam,
      ],
    }

    // Stream the response — keeps connection alive indefinitely on Edge runtime
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [message],
    })

    const encoder = new TextEncoder()
    let fullText = ''

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const chunk = event.delta.text
              fullText += chunk
              // Send progress chunks so the connection stays alive
              controller.enqueue(encoder.encode(chunk))
            }
          }

          // After streaming ends, validate and send result as a special marker
          let jsonStr = fullText.trim()
            .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
          if (!jsonStr.startsWith('{')) {
            const s = jsonStr.indexOf('{'), e = jsonStr.lastIndexOf('}')
            if (s !== -1 && e > s) jsonStr = jsonStr.slice(s, e + 1)
          }

          try {
            const plan = JSON.parse(jsonStr)
            if (!plan.weeks || !Array.isArray(plan.weeks) || plan.weeks.length === 0) {
              controller.enqueue(encoder.encode('\n__RESULT__' + JSON.stringify({
                error: 'Il piano estratto non ha la struttura corretta. Verifica che il PDF contenga un piano nutrizionale.'
              })))
            } else {
              controller.enqueue(encoder.encode('\n__RESULT__' + JSON.stringify({ plan })))
            }
          } catch {
            const preview = fullText.slice(0, 300).replace(/\n/g, ' ')
            controller.enqueue(encoder.encode('\n__RESULT__' + JSON.stringify({
              error: 'Impossibile interpretare la risposta di Claude.',
              debug: preview,
            })))
          }

          controller.close()
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Errore sconosciuto'
          controller.enqueue(encoder.encode('\n__RESULT__' + JSON.stringify({ error: msg })))
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Errore sconosciuto'
    return new Response(JSON.stringify({ error: msg }), { status: 500 })
  }
}
