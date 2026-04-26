const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

export async function translate(text, targetLang) {
  const res = await fetch(`${BACKEND_URL}/api/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, targetLang }),
  });
  if (!res.ok) throw new Error('Translation failed');
  const data = await res.json();
  return data.translated;
}