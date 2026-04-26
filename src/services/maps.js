const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

export async function geocodePincode(pincode) {
  const res = await fetch(`${BACKEND_URL}/api/geocode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pincode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Geocoding failed');
  }
  return res.json();
}

/**
 * Open Google Maps in a new tab with a search for polling stations
 * near the given coordinates.
 */
export function openPollingBoothSearch(lat, lng, address) {
  const query = encodeURIComponent(`polling booth near ${address}`);
  const url = `https://www.google.com/maps/search/${query}/@${lat},${lng},14z`;
  window.open(url, '_blank', 'noopener,noreferrer');
}