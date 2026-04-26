import { useState } from 'react';
import { Bot, User, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { speakText } from '../services/tts';

export default function MessageBubble({ msg, lang = 'en' }) {
  const [audioState, setAudioState] = useState('idle'); // idle | loading | playing
  const [audio, setAudio] = useState(null);

  const handleSpeak = async () => {
    if (audioState === 'playing' && audio) {
      audio.pause();
      setAudio(null);
      setAudioState('idle');
      return;
    }
    setAudioState('loading');
    try {
      const a = await speakText(msg.content, lang);
      setAudio(a);
      setAudioState('playing');
      a.onended = () => setAudioState('idle');
    } catch (err) {
      console.error('TTS failed:', err);
      setAudioState('idle');
    }
  };

  if (msg.role === 'user') {
    return (
      <div className="flex gap-3 justify-end">
        <div
          className="max-w-[75%] rounded-2xl px-4 py-3 bg-navy text-white"
          role="article"
          aria-label="Your message"
        >
          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
        </div>
        <div className="bg-gray-300 text-gray-700 p-2 rounded-full h-9 w-9 flex items-center justify-center flex-shrink-0">
          <User size={18} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 justify-start">
      <div className="bg-saffron text-white p-2 rounded-full h-9 w-9 flex items-center justify-center flex-shrink-0">
        <Bot size={18} />
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          msg.error ? 'bg-red-50 border border-red-200 text-red-900' : 'bg-gray-100 text-ink'
        }`}
        role="article"
        aria-label="Assistant response"
      >
        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

        {!msg.error && (
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-200">
            <button
              onClick={handleSpeak}
              className="text-xs text-gray-600 hover:text-ink flex items-center gap-1 transition-colors"
              aria-label={audioState === 'playing' ? 'Stop reading' : 'Read aloud'}
            >
              {audioState === 'loading' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : audioState === 'playing' ? (
                <VolumeX size={14} />
              ) : (
                <Volume2 size={14} />
              )}
              {audioState === 'playing' ? 'Stop' : 'Listen'}
            </button>

            {msg.sources?.length > 0 && (
              <span className="text-xs text-gray-500">
                Sources: {msg.sources.map(s => s.id).join(', ')}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}