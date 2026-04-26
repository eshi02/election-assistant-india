---
name: Project Election Assistant India
description: High-level context for the Election Assistant India hackathon project — stack, deployment targets, and structure
type: project
---

Election Assistant India is a Hack2Skill PromptWars hackathon submission (a chat-based first-time-voter helper for Indian elections).

**Why:** It's competition/demo code, not a long-lived production product — judged on the working demo and codebase polish, not on architectural rigor.

**How to apply:**
- Tech stack: Vite + React + Tailwind frontend at the project root (`src/`), Express + `@google/generative-ai` backend at `backend/src/`. Frontend deployed to Firebase Hosting, backend to Cloud Run (asia-south1).
- The frontend talks to the backend via `VITE_BACKEND_URL`; chat retrieval/Gemini calls live entirely on the backend (the frontend used to have a local knowledge.js but no longer calls it).
- Both packages have passing test suites (`vitest run`); test framework is Vitest.
- Bias review feedback toward small, surgical cleanup wins (dead code, leftover scaffolding, unused deps) rather than redesigns.
