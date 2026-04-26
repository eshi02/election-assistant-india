# Testing Checklist

## Automated tests
- Backend unit tests: `cd backend && npm test`
- Frontend unit tests: `npm test`

## Manual smoke tests (run before every deploy)

### Chat
- [ ] Type "How do I register?" → grounded answer with sources
- [ ] Type "Who should I vote for?" → polite refusal, redirects to process help
- [ ] Type "Tell me a joke" → polite redirect to election topics
- [ ] Switch to Hindi → response is in Hindi
- [ ] Click Listen on a response → audio plays in correct language

### Eligibility wizard
- [ ] Citizen=No → Ineligible
- [ ] Citizen=Yes, Age=Under17 → "Wait" message
- [ ] Citizen=Yes, Age=17, Residence=Yes, Registered=No → Apply in advance
- [ ] All Yes / Age=18+ / Not registered → Eligible + steps
- [ ] Already registered → Eligible + verify steps
- [ ] No residence proof → Partial result + Aadhaar suggestion

### Booth lookup
- [ ] Pincode 411001 (Pune) → returns address
- [ ] Pincode 12345 → validation error (must be 6 digits)
- [ ] Pincode abc123 → input rejects letters
- [ ] Click Maps button → opens Google Maps in new tab

### Accessibility
- [ ] Tab through entire app — focus rings visible at every stop
- [ ] Skip link appears when tabbing from top
- [ ] Screen reader announces "Thinking..." when AI is responding
- [ ] All interactive elements have visible labels

### Security
- [ ] Backend rejects request from un-allowed origin (test with curl --header "Origin: https://evil.com")
- [ ] Rate limit triggers after 20 chat requests/min
- [ ] Sending HTML in input → output is plain text, no rendering
