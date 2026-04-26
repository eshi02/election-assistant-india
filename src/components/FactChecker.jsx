import { useState } from 'react';
import { CheckCircle2, AlertCircle, XCircle, HelpCircle, Loader2, ShieldCheck, RotateCcw, ExternalLink } from 'lucide-react';
import { factCheck } from '../services/factcheck';
import { translate } from '../services/translate';

const VERDICT_META = {
  true: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    labels: { en: 'True', hi: 'सत्य', mr: 'खरे' },
  },
  misleading: {
    icon: AlertCircle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    labels: { en: 'Misleading', hi: 'भ्रामक', mr: 'दिशाभूल करणारे' },
  },
  false: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    labels: { en: 'False', hi: 'गलत', mr: 'खोटे' },
  },
  unverifiable: {
    icon: HelpCircle,
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    labels: { en: 'Unverifiable', hi: 'सत्यापित नहीं', mr: 'अप्रमाणित' },
  },
};

export default function FactChecker({ onClose, lang = 'en' }) {
  const [claim, setClaim] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    const trimmed = claim.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const englishClaim = lang === 'en' ? trimmed : await translate(trimmed, 'en');
      const data = await factCheck(englishClaim);
      const explanation = lang === 'en' ? data.explanation : await translate(data.explanation, lang);
      setResult({ ...data, explanation });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setClaim('');
    setResult(null);
    setError(null);
  };

  const meta = result ? VERDICT_META[result.verdict] : null;
  const Icon = meta?.icon;
  const verdictLabel = meta ? (meta.labels[lang] || meta.labels.en) : '';

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={22} className="text-saffron" />
          <h2 className="text-lg font-semibold text-ink">Fact-check a forwarded message</h2>
        </div>
        <button onClick={onClose} className="text-sm text-gray-500 hover:text-ink" aria-label="Close fact-checker">
          Close
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-3">
        Paste a forwarded WhatsApp message or claim about Indian elections. We'll check it against verified ECI sources.
        Claims about specific candidates, parties, or election results aren't judged here — try the
        {' '}<a href="https://factcheck.pib.gov.in" target="_blank" rel="noopener noreferrer" className="text-navy underline">PIB Fact Check unit</a> for those.
      </p>

      <label htmlFor="factcheck-input" className="sr-only">Paste the claim to fact-check</label>
      <textarea
        id="factcheck-input"
        value={claim}
        onChange={(e) => setClaim(e.target.value)}
        placeholder="Paste the forwarded message here..."
        rows={6}
        maxLength={1000}
        disabled={loading}
        className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-saffron focus:border-transparent placeholder:text-gray-500 mb-3"
      />

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-400">{claim.length} / 1000</span>
        <button
          onClick={handleSubmit}
          disabled={!claim.trim() || loading}
          className="bg-saffron text-white rounded-xl px-5 py-2 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Checking...
            </>
          ) : (
            <>
              <ShieldCheck size={16} /> Check this claim
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-900 rounded-xl p-3 mb-4 text-sm" role="alert">
          {error}
        </div>
      )}

      {result && meta && (
        <div className={`${meta.bg} border ${meta.border} rounded-xl p-4 mb-4`} role="status" aria-live="polite">
          <div className="flex items-start gap-3 mb-2">
            <Icon className={meta.color} size={28} aria-hidden="true" />
            <div className="flex-1">
              <p className={`text-xs uppercase tracking-wide font-semibold ${meta.color}`}>Verdict</p>
              <h3 className="text-lg font-semibold text-ink">{verdictLabel}</h3>
            </div>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed">{result.explanation}</p>

          {result.sources?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200/70">
              <p className="text-xs text-gray-500">
                Sources: {result.sources.map((s) => s.id).join(', ')}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-orange-50 rounded-xl p-3 text-xs text-gray-700 mb-4">
        <p className="font-medium text-ink mb-1">Spotted misinformation?</p>
        <ul className="space-y-1">
          <li className="flex items-center gap-1">
            <ExternalLink size={12} />
            <a href="https://factcheck.pib.gov.in" target="_blank" rel="noopener noreferrer" className="text-navy underline">
              PIB Fact Check
            </a>
            <span>— official government fact-check</span>
          </li>
          <li className="flex items-center gap-1">
            <ExternalLink size={12} />
            <span>cVIGIL app — report MCC violations & election malpractice</span>
          </li>
          <li>Or call ECI helpline 1950</li>
        </ul>
      </div>

      <div className="flex gap-2">
        {(result || error) && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw size={14} /> Check another
          </button>
        )}
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm bg-navy text-white hover:bg-blue-900 rounded-lg transition-colors"
        >
          Back to chat
        </button>
      </div>
    </div>
  );
}
