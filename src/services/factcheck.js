const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

export async function factCheck(claim) {
  const response = await fetch(`${BACKEND_URL}/api/factcheck`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claim }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Backend error: ${response.status}`);
  }

  return response.json(); // { verdict, explanation, sources }
}
