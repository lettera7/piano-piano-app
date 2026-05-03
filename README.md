# 🌿 Piano Piano

> Il piano nutrizionale diventa una routine semplice, condivisa e organizzata.

Piano Piano è una PWA (Progressive Web App) per seguire piani nutrizionali personalizzati assegnati da un nutrizionista. Non è un'app medica e non genera consigli nutrizionali autonomi.

---

## ✨ Funzionalità MVP

- 📅 **Dashboard Oggi** — pasti del giorno corrente con stato completamento
- 🔄 **Ciclo automatico** — calcola settimana 1 o 2 in base alla data di inizio
- 📋 **Vista Piano** — calendario 14 giorni con tutti i pasti
- 🥣 **Meal Prep** — preparazioni da fare in anticipo, raggruppate per tag
- 🛒 **Lista della Spesa** — generata automaticamente per giorno/settimana/ciclo
- 📓 **Diario** — annotazioni giornaliere (fame, energia, digestione, note)
- 📊 **Report settimanale** — riepilogo da inviare al nutrizionista
- 👥 **Modalità coppia** — profili Marina e Luca con note separate
- ⚙️ **Impostazioni** — data inizio piano, profilo, import
- 📱 **PWA** — installabile su iPhone e Android

---

## 🚀 Installazione locale

### Prerequisiti

- Node.js 18+
- npm 9+

### Setup

```bash
# Clona o scarica il progetto
cd piano-piano

# Installa le dipendenze
npm install

# Avvia in modalità sviluppo
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

---

## 📦 Build e produzione

```bash
# Build ottimizzato per produzione
npm run build

# Avvia il server di produzione locale
npm run start
```

---

## 🌐 Deploy su Vercel

### 1. Crea un repository GitHub

```bash
git init
git add .
git commit -m "Initial commit: Piano Piano MVP"
git branch -M main
git remote add origin https://github.com/tuo-utente/piano-piano.git
git push -u origin main
```

### 2. Collega a Vercel

1. Vai su [vercel.com](https://vercel.com) e accedi con il tuo account GitHub
2. Clicca **"Add New Project"**
3. Seleziona il repository `piano-piano`
4. Vercel rileva automaticamente Next.js — lascia le impostazioni di default
5. Clicca **"Deploy"**

### 3. Apri da smartphone

Dopo il deploy, Vercel ti fornirà un URL del tipo:
```
https://piano-piano-xyz.vercel.app
```

### 4. Aggiungi alla schermata Home (PWA)

**iPhone (Safari):**
1. Apri l'URL in Safari
2. Tocca l'icona **Condividi** (rettangolo con freccia in su)
3. Scorri e tocca **"Aggiungi alla schermata Home"**
4. Rinomina se vuoi → **"Aggiungi"**

**Android (Chrome):**
1. Apri l'URL in Chrome
2. Tocca i **tre puntini** in alto a destra
3. Tocca **"Aggiungi alla schermata Home"** o **"Installa app"**
4. Conferma → **"Aggiungi"**

L'app si aprirà come un'app nativa, senza barra del browser. ✅

---

## 🗂 Struttura del progetto

```
piano-piano/
├── public/
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # Icone app (192, 512px)
├── src/
│   ├── app/
│   │   ├── page.tsx           # Dashboard "Oggi"
│   │   ├── plan/
│   │   │   ├── page.tsx       # Vista calendario 14 giorni
│   │   │   └── meal-prep/     # Sezione "Prepara prima"
│   │   ├── shopping/          # Lista della spesa
│   │   ├── diary/             # Diario + report
│   │   └── settings/
│   │       ├── page.tsx       # Impostazioni
│   │       └── import/        # Import piano (JSON/manuale)
│   ├── components/
│   │   ├── AppShell.tsx       # Layout principale + navigazione
│   │   ├── MealCard.tsx       # Card pasto con azioni
│   │   ├── MealDetailDrawer.tsx # Drawer dettaglio pasto
│   │   └── ProfileSwitcher.tsx  # Selettore profilo Marina/Luca
│   ├── data/
│   │   └── plan.json          # Piano nutrizionale (2 settimane)
│   ├── lib/
│   │   ├── store.ts           # Zustand store con localStorage
│   │   └── utils.ts           # Utilità: ciclo, spesa, report
│   └── types/
│       └── index.ts           # TypeScript types
├── next.config.js             # Next.js + PWA config
├── tailwind.config.ts         # Design system
├── tsconfig.json
└── postcss.config.js
```

---

## 🎨 Design system

| Variabile | Colore | Uso |
|-----------|--------|-----|
| `cream` | `#faf8f4` | Background principale |
| `sage` | `#5e9e5e` | Elementi primari, CTA |
| `golden` | `#e8c547` | Highlight, badge |
| `terracotta` | `#c0634a` | Alert delicati |
| `warmgray` | scala | Testi, bordi |

Font: **Playfair Display** (titoli) + **DM Sans** (corpo)

---

## 🔧 Personalizzazione dati

Il piano nutrizionale di esempio si trova in `src/data/plan.json`.

Per usare il tuo piano personale:
1. Vai su **Impostazioni → Importa piano**
2. Incolla il tuo JSON strutturato

Oppure modifica direttamente `src/data/plan.json` seguendo la stessa struttura.

---

## 🔮 Roadmap futura

- [ ] **Supabase integration** — database, auth, sync multi-device
- [ ] **Row Level Security** — ogni utente vede solo i propri piani
- [ ] **Upload PDF** — parsing automatico del piano dal PDF del nutrizionista
- [ ] **Notifiche push** — reminder pasti
- [ ] **Condivisione piano** — tra utenti autorizzati (coppia, famiglia)
- [ ] **Esportazione report** — PDF formattato da inviare al nutrizionista
- [ ] **Scan barcode** — per aggiungere ingredienti alla spesa

---

## ⚠️ Disclaimer

Piano Piano è uno strumento organizzativo personale.  
Non fornisce consigli medici o nutrizionali.  
Non sostituisce il rapporto con il tuo nutrizionista.  
Tutti i dati rimangono nel tuo dispositivo (localStorage).

---

## 📄 Licenza

Uso privato. Tutti i diritti riservati.
