import { useState } from 'react';
import { MapPin, Search, ExternalLink, Loader2 } from 'lucide-react';
import { geocodePincode, openPollingBoothSearch } from '../services/maps';

export default function BoothLookup({ onClose }) {
  const [pincode, setPincode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async () => {
    setError('');
    setResult(null);
    if (!/^\d{6}$/.test(pincode)) {
      setError('Please enter a valid 6-digit pincode');
      return;
    }
    setLoading(true);
    try {
      const data = await geocodePincode(pincode);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="text-saffron" size={24} />
          <h3 className="text-xl font-semibold text-ink">Find your polling booth</h3>
        </div>
        <button onClick={onClose} className="text-sm text-gray-500 hover:text-ink">Close</button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Enter your 6-digit pincode to find polling booths near you. For your exact assigned booth, also check{' '}
        <a href="https://voters.eci.gov.in" target="_blank" rel="noopener noreferrer" className="text-navy underline">
          voters.eci.gov.in
        </a>{' '}
        with your EPIC number.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
          placeholder="e.g. 411001"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron"
          aria-label="Enter pincode"
        />
        <button
          onClick={handleLookup}
          disabled={loading || pincode.length !== 6}
          className="bg-saffron text-white px-5 py-3 rounded-xl hover:bg-orange-500 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          Find
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Location found</p>
            <p className="font-medium text-ink">{result.formattedAddress}</p>
          </div>
          <button
            onClick={() => openPollingBoothSearch(
              result.location.lat,
              result.location.lng,
              result.formattedAddress,
            )}
            className="w-full bg-navy text-white px-4 py-2.5 rounded-lg hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
          >
            Open Google Maps to find booths nearby
            <ExternalLink size={16} />
          </button>
          <p className="text-xs text-gray-500">
            Tip: For your exact assigned booth, search by EPIC number on the ECI portal.
          </p>
        </div>
      )}
    </div>
  );
}