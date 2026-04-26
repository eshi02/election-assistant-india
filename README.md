# Election Process Education Assistant

> AI-powered guide that helps first-time Indian voters (18–22) understand registration, eligibility, polling day, and their rights — multilingual, voice-enabled, and grounded in official ECI guidelines.

**Live demo:** https://starry-runner-494505-d9.web.app
**Submission:** Hack2Skill PromptWars 2026

---

## 1. Chosen Vertical

**First-time Indian voters, ages 18–22**, who have just become eligible to vote and need a friendly, accurate guide to navigate registration and polling day. The persona faces three real pain points:

1. **Information overload** — ECI's website is comprehensive but dense and form-heavy.
2. **Language barrier** — many young voters are more comfortable in Hindi or Marathi than English.
3. **Process anxiety** — fear of doing something wrong on polling day and being turned away.

This assistant solves all three with conversational AI, multilingual support, voice output, and step-by-step decision-tree guidance — without ever endorsing a candidate or party.

---

## 2. Approach & Logic

### Why a knowledge base, not pure LLM?

Gemini's training data has Indian election information, but it can be outdated, conflate Indian rules with other countries', and confidently hallucinate form numbers and deadlines. We solved this with a **curated JSON knowledge base of 19 ECI-verified entries** plus lightweight RAG-style retrieval.

### Why a strict system prompt?

The system prompt explicitly forbids endorsing parties or candidates, inventing form numbers or deadlines, discussing non-Indian elections, and asking for or storing personal IDs (Aadhaar, EPIC). This makes the assistant safe to use during an actual election cycle.

### Why split frontend & backend across two services?

- **Frontend on Firebase Hosting** — globally cached static files, free SSL, instant rollback.
- **Backend on Cloud Run** — auto-scaling container; the only place that can call the Gemini API. The Gemini key never touches the browser.

---

## 3. How the Solution Works

### End-to-end request flow (chat)

```
User types in browser
     ↓
React frontend (Firebase Hosting)
     ↓ HTTPS POST /api/chat
Express backend (Cloud Run)
     ↓
1. Sanitize input    → reject control chars, neutralize prompt-injection patterns
2. Retrieve top-N    → keyword-score 19 ECI entries, pick top 4
3. Build prompt      → system rules + retrieved context + user question
4. Call Gemini 2.5 Flash with safety filters set to BLOCK_MEDIUM_AND_ABOVE
5. Sanitize output   → strip <script>, on*=, javascript: from LLM response
     ↓ JSON { answer, sources }
Render bubble + Listen button (TTS) in user's chosen language
```

### Component summary

| Feature | What it does | How |
|---|---|---|
| Conversational chat | Grounded answers about the Indian election process | Gemini 2.5 Flash + lightweight RAG over 19 ECI entries |
| Eligibility Wizard | 4-question decision tree → personalized result + next steps | Pure-React state machine; short-circuits on hard disqualifiers |
| Polling Booth Lookup | Pincode → coordinates → Google Maps polling-booth search | Server-side Google Geocoding API |
| Voice output (TTS) | Reads any chat reply aloud in EN/HI/MR | Google Cloud Text-to-Speech REST |
| Multilingual UI | Translates user input to English, response back to user's language | Google Cloud Translation v2 |
| Accessibility | WCAG AA, keyboard, ARIA, skip link, reduced-motion | Tailwind + custom focus styles + semantic HTML |

---

## 4. Architecture

```
┌──────────────────────────────────────────┐
│  Browser                                 │
│  React 19 + Vite + Tailwind              │
└──────────────────┬───────────────────────┘
                   │ HTTPS (CORS allowlist)
                   ▼
┌──────────────────────────────────────────┐
│  Firebase Hosting (CDN)                  │   static SPA
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  Cloud Run · asia-south1                 │
│  Node 20 + Express                       │
│  helmet · express-rate-limit · CORS      │
│  trust proxy=1 · 1MB JSON cap · 30s rt   │
└──────┬─────────┬─────────┬────────┬──────┘
       │         │         │        │
       ▼         ▼         ▼        ▼
   Gemini    Cloud      Cloud      Cloud
   2.5 Flash Translate  TTS        Geocoding
              v2        REST       API
```

### Design choices

- **Lightweight RAG** — keyword scoring over 19 entries, no vector DB. Repo stays under 1 MB; retrieval latency is sub-millisecond.
- **Stateless backend** — Cloud Run scales to zero, costs $0 at idle.
- **API keys never reach the browser** — all Google service calls are proxied through the backend.
- **`trust proxy` is set to 1** so `express-rate-limit` reads the real client IP from `X-Forwarded-For` (Cloud Run is one proxy hop). Without this, rate limiting would key everyone to the load balancer.

---

## 5. Repository Structure

```
election-assistant-india/
├── src/                        # React frontend (Vite)
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css               # Tailwind + a11y CSS (sr-only, focus-visible)
│   ├── components/
│   │   ├── ChatWindow.jsx
│   │   ├── MessageBubble.jsx
│   │   ├── EligibilityWizard.jsx     + .test.jsx
│   │   ├── BoothLookup.jsx
│   │   ├── QuickActions.jsx
│   │   └── LanguageSwitch.jsx
│   ├── services/               # Browser API clients (no API keys here)
│   │   ├── gemini.js           # POST /api/chat
│   │   ├── translate.js        # POST /api/translate
│   │   ├── tts.js              # POST /api/tts
│   │   └── maps.js             # builds Google Maps search URL
│   └── test-setup.js
├── backend/                    # Cloud Run service
│   ├── Dockerfile              # Node 20-slim, non-root user
│   ├── src/
│   │   ├── server.js           # Express app + middleware + 4 endpoints
│   │   ├── services/
│   │   │   ├── gemini.js       # Gemini 2.5 Flash + safety + RAG
│   │   │   ├── translate.js    # Cloud Translation v2 wrapper
│   │   │   ├── tts.js          # Cloud Text-to-Speech wrapper
│   │   │   └── geocode.js      # Geocoding API wrapper
│   │   ├── data/
│   │   │   ├── eci-knowledge.json    # 19 curated ECI entries
│   │   │   └── knowledge.js          # retriever + .test.js
│   │   └── utils/
│   │       └── sanitize.js     # input + output sanitizers + .test.js
│   ├── vitest.config.js
│   ├── README.md
│   └── .env.example
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── index.html
├── firebase.json               # SPA rewrites + security headers + asset cache
├── vite.config.js              # Vite + Vitest (jsdom) config
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── package.json                # frontend deps + scripts
├── DEPLOY.md
├── SECURITY.md
├── TESTING.md
└── README.md
```

---

## 6. Run Locally

### Prerequisites
- Node.js 20+
- Gemini API key — [Google AI Studio](https://aistudio.google.com/apikey)
- GCP API key with **Translation**, **Text-to-Speech**, and **Geocoding** APIs enabled

### Backend
```bash
cd backend
cp .env.example .env             # fill in GEMINI_API_KEY and GCP_API_KEY
npm install
npm run dev                      # http://localhost:8080
```

### Frontend
```bash
# from project root
npm install
echo "VITE_BACKEND_URL=http://localhost:8080" > .env.local
npm run dev                      # http://localhost:5173
```

---

## 7. Deploy

Full walkthrough: [DEPLOY.md](./DEPLOY.md). TL;DR:

```bash
# Backend → Cloud Run
cd backend
gcloud run deploy election-assistant-backend \
  --source . --region asia-south1 \
  --set-env-vars "GEMINI_API_KEY=...,GCP_API_KEY=...,ALLOWED_ORIGINS=https://YOUR.web.app"

# Frontend → Firebase Hosting
cd ..
echo "VITE_BACKEND_URL=https://YOUR-CLOUD-RUN-URL" > .env.production
npm run build
firebase deploy --only hosting
```

---

## 8. Assumptions

- **Indian electoral context** — the assistant is designed for ECI rules; not for non-Indian elections.
- **Knowledge base reflects ECI rules as of 2026-04-26** — should be re-curated before each election cycle.
- **Online-only** — no offline / PWA mode in v1.
- **6-digit Indian pincodes** for booth lookup; international pincodes are rejected.
- **Good-faith users** — abuse is mitigated via per-IP rate limits and prompt-injection filtering, not authentication. A real production rollout would add CAPTCHA / Firebase App Check.
- **Free tier sufficiency** — Gemini, Translate, TTS, and Geocoding free tiers cover hackathon-scale traffic.

---

## 9. Sources & Credits

- Knowledge base curated from [Election Commission of India](https://eci.gov.in)
- Voter portal: [voters.eci.gov.in](https://voters.eci.gov.in)
- Voter Helpline: **1950**
- Built with: React 19, Vite, Tailwind CSS, Express 5, Vitest, Testing Library, lucide-react

---

## License

MIT — see [LICENSE](./LICENSE).

**Built for Hack2Skill PromptWars 2026.**
