# 🗳️ Election Process Education Assistant

> AI-powered guide that helps first-time Indian voters (18–22) understand registration, eligibility, polling day, and their rights — multilingual, voice-enabled, and grounded in official ECI guidelines.

**🌐 Live demo:** https://YOUR-PROJECT.web.app
**📺 Video walkthrough:** [link to your demo video]

---

## 🎯 Chosen Vertical

**First-time Indian voters (18–22 years old)** who have just become eligible to vote and need a friendly, accurate guide to navigate registration and polling day. The persona faces three real pain points:

1. **Information overload** — ECI's website is comprehensive but dense
2. **Language barrier** — many young voters are more comfortable in Hindi/Marathi than English
3. **Process anxiety** — fear of doing something wrong on polling day

This assistant solves all three with conversational AI, multilingual support, and step-by-step guidance.

---

## ✨ Features

| Feature | What it does | Why it matters |
|---|---|---|
| 💬 **Conversational chat** | Answers any election-process question, grounded in 18 verified ECI knowledge entries | Reduces hallucination — every answer cites a source |
| ✅ **Eligibility Wizard** | 4-question decision tree → personalized result with next steps | Demonstrates logical decision-making based on user context |
| 📍 **Polling Booth Lookup** | Pincode → Google Maps search for nearby booths | Solves a top user pain point on polling day |
| 🔊 **Voice Output** | Text-to-Speech in 3 languages | Accessibility for low-literacy and visually-impaired users |
| 🌐 **Multilingual** | English, Hindi, Marathi via Cloud Translate | Reaches India's largest voter demographics |
| ♿ **Accessible** | WCAG AA, keyboard nav, ARIA, skip link, focus rings, reduced-motion support | Inclusive by design |

---

## 🏗️ Architecture
┌─────────────────────────┐
│  React + Vite frontend  │   ← Firebase Hosting (free tier)
│  Tailwind, lucide icons │
└────────────┬────────────┘
│ HTTPS
▼
┌─────────────────────────┐
│  Node.js + Express API  │   ← Cloud Run (Docker, asia-south1)
│  helmet, rate-limit     │      runs as non-root user
└────────────┬────────────┘
│
┌─────────┼──────────┬───────────┬────────────┐
▼         ▼          ▼           ▼            ▼
Gemini   Cloud      Cloud         Cloud      ECI Knowledge
2.0 Flash Translate Text-to-Speech Geocoding  Base (JSON)
grounding

**Key design choices:**
- **Knowledge-base grounding (lightweight RAG)** — 18 curated ECI entries in JSON, retrieved by keyword scoring. No vector DB needed for this scale, keeping the repo under 1 MB and the response latency low.
- **Server-side LLM proxy** — Gemini API key never touches the browser. Backend is the only thing that can call Gemini.
- **Stateless Cloud Run** — auto-scales to zero, costs $0 at idle, handles bursts.

---

## 🔧 Google Services Used

| Service | How we use it | Justification |
|---|---|---|
| **Gemini 2.0 Flash** | Conversational AI core, with strict system prompt and KB grounding | Primary intelligence; chosen for low latency and free tier |
| **Cloud Run** | Hosts the Node.js backend in Docker | Auto-scaling, pay-per-request, container-native |
| **Firebase Hosting** | Hosts the React frontend | Global CDN, free SSL, instant rollback |
| **Cloud Translation** | Hindi/Marathi support | India needs > English |
| **Cloud Text-to-Speech** | Audio output in 3 languages | Accessibility scoring; helps low-literacy users |
| **Maps Geocoding API** | Pincode → coordinates → polling-booth Maps search | Real-world utility |
| **Secret Manager** | Stores GEMINI_API_KEY and GCP_API_KEY | Never in code, never in env-vars |

**Total: 7 Google Cloud services, each with a clear justification.**

---

## 🛡️ Security

We took security seriously. See [SECURITY.md](./SECURITY.md) for the full threat model.

**Highlights:**
- API keys stored in **Secret Manager**, never in code or browser
- **GCP API key** restricted by HTTP referrer + API allowlist
- Input sanitization for **prompt injection** patterns
- Output sanitization to strip HTML/script in LLM responses
- **Rate limits** (20/min for chat, 40/min for utilities) per IP
- **CORS allowlist** — only the production Firebase domain is permitted
- **helmet** for security headers (HSTS, X-Frame-Options, CSP-ready)
- Cloud Run container runs as **non-root user** (uid 1001)
- Body size capped at 10 KB; request timeout 30 s
- **No PII storage** — we don't log message content, never ask for Aadhaar/EPIC

---

## ♿ Accessibility

- **WCAG AA color contrast** throughout
- **Keyboard navigable** — every action reachable via Tab
- **Skip-to-content** link on first Tab
- **ARIA labels** on icon buttons; **`aria-live`** on chat log
- **Visible focus indicators** (saffron 2px ring)
- **Multilingual** — English, Hindi, Marathi
- **Voice output** for non-readers
- **`prefers-reduced-motion`** respected

---

## 🧪 Testing

- **Backend unit tests:** `cd backend && npm test` (Vitest, ~10 tests covering sanitization, KB retrieval, formatting)
- **Frontend unit tests:** `npm test` (Vitest + RTL, covers eligibility wizard logic)
- **Manual checklist:** see [TESTING.md](./TESTING.md)

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js 18+
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
- A GCP API key with Translate/TTS/Geocoding/Maps enabled

### Backend

```bash
cd backend
cp .env.example .env  # fill in your keys
npm install
npm run dev           # runs on :8080
```

### Frontend

```bash
# from project root
npm install
echo "VITE_BACKEND_URL=http://localhost:8080" > .env.local
npm run dev           # runs on :5173
```

Open http://localhost:5173.

---

## 📦 Deployment

See [DEPLOY.md](./DEPLOY.md) for the full Cloud Run + Firebase walkthrough.

Quick version:

```bash
# Backend
cd backend
gcloud run deploy election-assistant-backend --source . --region asia-south1

# Frontend
cd ..
npm run build
firebase deploy --only hosting
```

---

## 📚 Approach & Logic

### Why a knowledge base, not pure LLM?

Gemini's training data has Indian election info, but it can be outdated, can confuse Indian rules with other countries', and confidently hallucinates form numbers and deadlines. We solved this with a curated JSON knowledge base of 18 ECI-verified entries. At query time, the backend:

1. Sanitizes user input (length cap, prompt-injection neutralization)
2. Scores all KB entries against the query (keyword + content matching)
3. Picks top 4 entries
4. Injects them as context into Gemini's prompt
5. Sanitizes Gemini's response before returning

This is lightweight RAG — no embeddings or vector DB needed for 18 entries, while still preventing hallucination.

### Why a system prompt with strict rules?

The system prompt explicitly forbids:
- Endorsing parties or candidates (political neutrality)
- Inventing form numbers or deadlines (factual accuracy)
- Discussing non-Indian elections or off-topic subjects (scope)
- Asking for or storing personal IDs (privacy)

This makes the assistant safe to use during an actual election cycle.

### Why Cloud Run + Firebase, not a single platform?

Splitting them gives:
- **Frontend** — globally cached static files (Firebase Hosting CDN)
- **Backend** — auto-scaling container with secret-injected env (Cloud Run)
- API keys live only on the backend, never shipped to browsers

---

## 🤔 Assumptions

- Indian electoral context (ECI rules) — the assistant is not designed for non-Indian elections
- Knowledge base reflects ECI rules as of **2026-04-26**; should be refreshed before each election cycle
- Users have basic internet access; the app does not work offline (yet)
- Pincode lookup uses Google Geocoding — accurate for valid 6-digit Indian pincodes
- We assume good-faith users; abuse is mitigated via rate limits, not authentication

---

## 🗂️ Repository Structure

├── src/                   # React frontend
│   ├── components/        # ChatWindow, EligibilityWizard, BoothLookup, etc.
│   ├── services/          # API clients (gemini, translate, tts, maps)
│   ├── data/              # ECI knowledge base
│   └── utils/             # sanitization helpers
├── backend/               # Cloud Run service
│   ├── src/
│   │   ├── server.js      # Express app
│   │   ├── services/      # Gemini, Translate, TTS, Geocode wrappers
│   │   ├── data/          # KB + retriever
│   │   └── utils/         # sanitization
│   ├── Dockerfile         # Multi-stage, non-root
│   └── package.json
├── firebase.json          # Hosting config + security headers
├── SECURITY.md
├── TESTING.md
└── README.md


---

## 📖 Sources & Credits

- Knowledge base curated from [Election Commission of India](https://eci.gov.in)
- Voter portal: [voters.eci.gov.in](https://voters.eci.gov.in)
- Voter Helpline: 1950
- Built with: React, Vite, Tailwind CSS, Express, Vitest, lucide-react

---

## 📝 License

MIT — see [LICENSE](./LICENSE)

---

**Built for Hack2Skill PromptWars 2026.**