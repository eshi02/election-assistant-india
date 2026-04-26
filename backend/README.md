# Election Assistant — Backend

Cloud Run service that proxies Gemini API calls and exposes Translate / TTS / Geocoding helpers.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness check (used by Cloud Run) |
| POST | `/api/chat` | Grounded LLM answer to a user question |
| POST | `/api/translate` | Translate text between en/hi/mr |
| POST | `/api/tts` | Synthesize speech (returns base64 MP3) |
| POST | `/api/geocode` | Pincode → lat/lng + address |

## Environment variables

| Var | Purpose |
|---|---|
| `GEMINI_API_KEY` | Gemini API access (server-only) |
| `GCP_API_KEY` | Translate / TTS / Geocoding access |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowlist |
| `PORT` | Listen port (set automatically by Cloud Run) |

## Run locally

```bash
npm install
cp .env.example .env  # fill in keys
npm run dev
```

## Run tests

```bash
npm test
```

## Deploy to Cloud Run

See `../DEPLOY.md` in project root.
