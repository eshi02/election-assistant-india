/**
 * Google Geocoding API — converts pincode to lat/lng.
 * Free tier: $200/month credit (separate from your $5 GCP credit).
 */

const API_KEY = process.env.GCP_API_KEY;
const ENDPOINT = 'https://maps.googleapis.com/maps/api/geocode/json';

/**
 * Resolve an Indian 6-digit pincode to coordinates and a formatted address
 * using the Google Geocoding API (results biased to country:IN).
 *
 * @param {string} pincode - 6-digit Indian PIN code
 * @returns {Promise<{ pincode: string, formattedAddress: string, location: { lat: number, lng: number }, components: Array<object> }>}
 * @throws {Error} If pincode is malformed, GCP_API_KEY is missing, or no results found
 */
export async function geocodePincode(pincode) {
  if (!API_KEY) throw new Error('GCP_API_KEY not set');
  if (!/^\d{6}$/.test(pincode)) {
    throw new Error('Invalid pincode (must be 6 digits)');
  }

  const url = `${ENDPOINT}?address=${pincode}&components=country:IN&key=${API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) throw new Error(`Geocoding API error: ${res.status}`);

  const data = await res.json();
  if (data.status !== 'OK' || !data.results.length) {
    throw new Error(`No results for pincode ${pincode}`);
  }

  const result = data.results[0];
  return {
    pincode,
    formattedAddress: result.formatted_address,
    location: result.geometry.location, // { lat, lng }
    components: result.address_components,
  };
}