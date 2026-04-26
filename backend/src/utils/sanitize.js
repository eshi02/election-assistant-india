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

/**
 * Strip anything that looks like injected HTML/script tags from LLM output.
 * Defense-in-depth: even though we render as text, never trust.
 */
export function sanitizeOutput(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, ''); // strip onclick=, onerror=, etc.
}

