import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2 } from 'lucide-react';
import { sendChatMessage } from '../services/gemini';
import { translate } from '../services/translate';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ lang = 'en' }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! 👋 I'm here to help you understand voting in India. Ask me about registration, polling day, your rights — anything about the election process.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      // Translate user input to English if needed
      const englishQuery = lang === 'en' ? trimmed : await translate(trimmed, 'en');
      const { answer, sources } = await sendChatMessage(englishQuery);

      // Translate response back to user's language
      const finalAnswer = lang === 'en' ? answer : await translate(answer, lang);

      setMessages(prev => [...prev, { role: 'assistant', content: finalAnswer, sources }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Sorry — ${err.message}. Please try again.`, error: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto p-6 space-y-4" role="log" aria-live="polite">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} lang={lang} />
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="bg-saffron text-white p-2 rounded-full h-9 w-9 flex items-center justify-center flex-shrink-0">
              <Bot size={18} />
            </div>
            <div className="bg-gray-100 text-gray-500 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <label htmlFor="chat-input" className="sr-only">Type your election-related question</label>
          <textarea
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about voter registration, polling day, EVM..."
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-saffron focus:border-transparent placeholder:text-gray-500"
            rows={2}
            maxLength={1000}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-saffron text-white rounded-xl px-5 py-3 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}