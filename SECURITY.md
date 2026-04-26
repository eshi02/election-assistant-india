# Security Notes

## Threat Model & Mitigations

| Threat | Mitigation |
|---|---|
| API key exfiltration | Gemini key never sent to browser. GCP services key is API-restricted to 4 endpoints. |
| Prompt injection | Input sanitization strips known injection patterns. System prompt is hardened with strict rules. |
| LLM output injection | All LLM output passes through `sanitizeOutput` before reaching the client. |
| DoS / abuse | `express-rate-limit` per-IP, per-endpoint. Request timeout of 30s. Body size capped at 10kb. |
| CORS abuse | Origin allowlist enforced — only the deployed Firebase domain in production. |
| Insecure headers | `helmet` middleware sets HSTS, X-Frame-Options, CSP, and other security headers. |
| Container privilege escalation | Cloud Run container runs as non-root user (uid 1001). |
| Sensitive PII storage | We never persist user messages, names, EPIC numbers, or Aadhaar IDs. The system prompt explicitly tells users not to share these. |

## What we explicitly DO NOT do
- No analytics, no tracking, no cookies for user identification
- No logs of user message content (only error logs and request counts)
- No third-party SDKs in the browser

## Reporting
Found something? Open an issue or email the maintainer.