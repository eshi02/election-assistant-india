/**
 * Google Cloud Text-to-Speech via REST.
 * Free tier: 1M chars/month (standard voices).
 */

const API_KEY = process.env.GCP_API_KEY;
const ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

const VOICE_BY_LANG = {
  en: { languageCode: 'en-IN', name: 'en-IN-Standard-A' },
  hi: { languageCode: 'hi-IN', name: 'hi-IN-Standard-A' },
  mr: { languageCode: 'mr-IN', name: 'mr-IN-Standard-A' },
};

/**
 * Synthesize speech from text using Google Cloud Text-to-Speech.
 *
 * Strips markdown punctuation so it isn't read aloud, and caps input at 5000 chars.
 *
 * @param {string} text - Text to speak
 * @param {'en'|'hi'|'mr'} [lang='en'] - Voice language (defaults to en-IN if unrecognized)
 * @returns {Promise<string>} Base64-encoded MP3 audio
 * @throws {Error} If GCP_API_KEY is missing or TTS API call fails
 */
export async function synthesizeSpeech(text, lang = 'en') {
  if (!API_KEY) throw new Error('GCP_API_KEY not set');

  const voice = VOICE_BY_LANG[lang] || VOICE_BY_LANG.en;

  // strip markdown so TTS doesn't read out asterisks
  const clean = text.replace(/[*_#`]/g, '').slice(0, 5000);

  const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text: clean },
      voice: { languageCode: voice.languageCode, name: voice.name },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 0.95,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.audioContent; // base64-encoded MP3
}