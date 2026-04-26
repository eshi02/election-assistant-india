import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KB_PATH = join(__dirname, 'eci-knowledge.json');

let cachedKB = null;

async function loadKB() {
  if (cachedKB) return cachedKB;
  const raw = await readFile(KB_PATH, 'utf-8');
  cachedKB = JSON.parse(raw);
  return cachedKB;
}

/**
 * Retrieve the top-N most relevant entries from the ECI knowledge base for a query.
 *
 * Uses a simple keyword-overlap score: keyword match (5pts), title word match (2pts),
 * content word match (1pt). Entries with score 0 are filtered out.
 *
 * @param {string} query - User question (free text)
 * @param {number} [topN=4] - Maximum number of entries to return
 * @returns {Promise<Array<{id: string, title: string, content: string, keywords: string[]}>>}
 */
export async function findRelevantEntries(query, topN = 4) {
  if (!query || typeof query !== 'string') return [];
  const kb = await loadKB();

  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

  const scored = kb.entries.map(entry => {
    let score = 0;
    for (const kw of entry.keywords) {
      if (queryLower.includes(kw.toLowerCase())) score += 5;
    }
    const titleLower = entry.title.toLowerCase();
    for (const word of queryWords) {
      if (titleLower.includes(word)) score += 2;
    }
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
 * Render an array of knowledge entries into a single context block for the LLM,
 * with each entry separated by a `---` divider and tagged with its source id.
 *
 * @param {Array<{id: string, title: string, content: string}>} entries
 * @returns {string} Formatted context (empty string if no entries)
 */
export function formatAsContext(entries) {
  if (!entries.length) return '';
  return entries
    .map(e => `[Source: ${e.id}]\n${e.title}\n${e.content}`)
    .join('\n\n---\n\n');
}

/**
 * Return the metadata block from the ECI knowledge base
 * (source attribution, last-updated date, etc.).
 *
 * @returns {Promise<{ source: string, lastUpdated: string }>}
 */
export async function getMetadata() {
  const kb = await loadKB();
  return kb.metadata;
}