/**
 * Google Cloud Translation v2 — uses simple API key auth.
 * Free tier: 500K chars/month for 12 months.
 */

const API_KEY = process.env.GCP_API_KEY;
const ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

const SUPPORTED = ['en', 'hi', 'mr']; // English, Hindi, Marathi

/**
 * Translate text into a supported target language using Google Cloud Translation v2.
 *
 * @param {string} text - The source text (assumed to be in English)
 * @param {'en'|'hi'|'mr'} targetLang - Target language code (en is a no-op)
 * @returns {Promise<string>} Translated text
 * @throws {Error} If GCP_API_KEY is missing, language unsupported, or API call fails
 */
export async function translateText(text, targetLang) {
  if (!API_KEY) throw new Error('GCP_API_KEY not set');
  if (!SUPPORTED.includes(targetLang)) {
    throw new Error(`Unsupported language: ${targetLang}`);
  }
  if (targetLang === 'en') return text; // no-op for English

  const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      target: targetLang,
      format: 'text',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Translate API ${res.status}:`, err);
    throw new Error('Translate API error');
  }

  const data = await res.json();
  return data.data.translations[0].translatedText;
}