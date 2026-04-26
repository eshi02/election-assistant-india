import { useState } from 'react';
import { Vote, Github } from 'lucide-react';
import ChatWindow from './components/ChatWindow';
import EligibilityWizard from './components/EligibilityWizard';
import BoothLookup from './components/BoothLookup';
import QuickActions from './components/QuickActions';
import LanguageSwitch from './components/LanguageSwitch';

function App() {
  const [activeView, setActiveView] = useState('chat'); // 'chat' | 'eligibility' | 'booth'
  const [lang, setLang] = useState('en');

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-blue-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-navy focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:z-50"
      >
        Skip to main content
      </a>
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-saffron text-white p-2 rounded-lg">
              <Vote size={24} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink">Election Assistant</h1>
              <p className="text-xs text-gray-500">For first-time Indian voters</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitch value={lang} onChange={setLang} />
            <a
              href="https://github.com/eshi02/election-assistant-india"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-ink transition-colors"
              aria-label="View source on GitHub"
            >
              <Github size={20} />
            </a>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-3xl mx-auto px-4 py-8">
        <QuickActions onAction={setActiveView} />

        {activeView === 'chat' && <ChatWindow lang={lang} />}
        {activeView === 'eligibility' && (
          <EligibilityWizard onClose={() => setActiveView('chat')} />
        )}
        {activeView === 'booth' && (
          <BoothLookup onClose={() => setActiveView('chat')} />
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-6 text-center text-xs text-gray-500">
        Built for Hack2Skill PromptWars · Powered by Google Cloud<br />
        Gemini · Cloud Run · Firebase Hosting · Maps · Translate · Text-to-Speech
      </footer>
    </div>
  );
}

export default App;