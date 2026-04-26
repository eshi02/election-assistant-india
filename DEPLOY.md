# Deployment Guide

## Prerequisites

- Google Cloud Platform account
- Project with billing enabled
- Enabled APIs: Cloud Run, Cloud Build, Generative Language, Translate, TTS, Geocoding, Maps
- `gcloud` CLI installed and authenticated
- `firebase-tools` CLI installed and authenticated

## 1. Backend → Cloud Run

```bash
cd backend

# Initial deploy
gcloud run deploy election-assistant-backend \
  --source . \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 5

# Create secrets
echo -n "YOUR_GEMINI_KEY" | gcloud secrets create gemini-api-key --data-file=-
echo -n "YOUR_GCP_KEY"    | gcloud secrets create gcp-api-key    --data-file=-

# Grant Cloud Run access
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gcloud secrets add-iam-policy-binding gemini-api-key --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor"
gcloud secrets add-iam-policy-binding gcp-api-key    --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor"

# Attach secrets + set CORS
gcloud run services update election-assistant-backend \
  --region asia-south1 \
  --update-secrets="GEMINI_API_KEY=gemini-api-key:latest,GCP_API_KEY=gcp-api-key:latest" \
  --update-env-vars="ALLOWED_ORIGINS=https://YOUR-PROJECT.web.app,NODE_ENV=production"
```

## 2. Frontend → Firebase Hosting

```bash
# from project root
echo "VITE_BACKEND_URL=https://YOUR-CLOUD-RUN-URL" > .env.production
npm run build
firebase deploy --only hosting
```

## 3. Restrict GCP API key

In GCP Console → Credentials → Edit `gcp-services-key`:
- Application restrictions → HTTP referrers
- Add: `https://YOUR-PROJECT.web.app/*`, `https://YOUR-PROJECT.firebaseapp.com/*`