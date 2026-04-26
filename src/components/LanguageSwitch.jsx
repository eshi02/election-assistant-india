import { Languages } from 'lucide-react';

const LANGS = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
];

export default function LanguageSwitch({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <Languages size={16} className="text-gray-500" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm bg-white border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-saffron"
        aria-label="Select language"
      >
        {LANGS.map(l => (
          <option key={l.code} value={l.code}>
            {l.native}
          </option>
        ))}
      </select>
    </div>
  );
}

export { LANGS };