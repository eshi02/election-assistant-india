/**
 * Defensive input sanitization.
 * - Caps length to prevent token-flooding
 * - Strips obvious prompt-injection patterns
 * - Removes control chars
 */

const MAX_LENGTH = 1000;

const INJECTION_PATTERNS = [
  /ignore\s+(previous|prior|above|all)\s+(instructions?|prompts?|rules?)/gi,
  /disregard\s+(previous|prior|above|all)/gi,
  /forget\s+(everything|all|previous)/gi,
  /you\s+are\s+now\s+(a|an)\s+/gi,
  /system\s*:\s*/gi,
  /\[\s*system\s*\]/gi,
];

export function sanitizeInput(text) {
  if (typeof text !== 'string') return '';

  // strip control chars except newlines and tabs
  let cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // cap length
  if (cleaned.length > MAX_LENGTH) {
    cleaned = cleaned.slice(0, MAX_LENGTH);
  }

  // neutralize injection patterns (replace with marker, don't silently strip)
  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[filtered]');
  }

  return cleaned.trim();
}

export function isLikelyOffTopic(text) {
  // very loose heuristic — Gemini's system prompt is the real defense
  const indianElectionTerms = [
    'vote', 'voter', 'voting', 'election', 'eci', 'epic',
    'polling', 'booth', 'ballot', 'evm', 'vvpat', 'register',
    'eligible', 'constituency', 'lok sabha', 'assembly', 'aadhaar',
    'india', 'indian', 'first time', 'nri', 'form 6', 'nota',
    'candidate', 'mla', 'mp', 'panchayat', 'parliament',
  ];
  const lower = text.toLowerCase();
  const hasAny = indianElectionTerms.some(t => lower.includes(t));
  return !hasAny && text.length > 30;
}