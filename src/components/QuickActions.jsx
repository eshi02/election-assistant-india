import { ClipboardCheck, MapPin, MessageSquare } from 'lucide-react';

export default function QuickActions({ onAction }) {
  const actions = [
    { id: 'eligibility', label: 'Am I eligible?', icon: ClipboardCheck },
    { id: 'booth', label: 'Find polling booth', icon: MapPin },
    { id: 'chat', label: 'Ask anything', icon: MessageSquare },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {actions.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onAction(id)}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:border-saffron hover:bg-orange-50 focus:border-saffron focus:bg-orange-50 px-4 py-2 rounded-full text-sm font-medium text-ink transition-colors shadow-sm"
        >
          <Icon size={16} />
          {label}
        </button>
      ))}
    </div>
  );
}