import knowledgeBase from '../data/eci-knowledge.json';

/**
 * Lightweight keyword-based retrieval.
 * For 18 entries this is plenty — no embeddings needed.
 *
 * Returns top N entries ranked by keyword overlap with the query.
 */
export function findRelevantEntries(query, topN = 4) {
  if (!query || typeof query !== 'string') return [];

  const queryLower = query.toLowerCase();
  const queryWords = queryLower
    .split(/\s+/)
    .filter(w => w.length > 2); // ignore tiny words like "is", "to"

  const scored = knowledgeBase.entries.map(entry => {
    let score = 0;

    // keyword match (highest weight)
    for (const kw of entry.keywords) {
      if (queryLower.includes(kw.toLowerCase())) score += 5;
    }

    // title word match
    const titleLower = entry.title.toLowerCase();
    for (const word of queryWords) {
      if (titleLower.includes(word)) score += 2;
    }

    // content word match (lowest weight)
    const contentLower = entry.content.toLowerCase();
    for (const word of queryWords) {
      if (contentLower.includes(word)) score += 1;
    }

    return { entry, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(s => s.entry);
}

/**
 * Get all entries — useful for the eligibility wizard
 * which needs the full ruleset, not just relevant snippets.
 */
export function getAllEntries() {
  return knowledgeBase.entries;
}

/**
 * Get entries by category — useful for quick action buttons.
 */
export function getByCategory(category) {
  return knowledgeBase.entries.filter(e => e.category === category);
}

/**
 * Format entries as a context block for Gemini.
 * This is what gets injected into the prompt.
 */
export function formatAsContext(entries) {
  if (!entries.length) return '';

  return entries
    .map(e => `[${e.id}] ${e.title}\n${e.content}`)
    .join('\n\n');
}

export const KB_METADATA = knowledgeBase.metadata;