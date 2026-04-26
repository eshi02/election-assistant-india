import { Vote, Github } from 'lucide-react';
import ChatWindow from './components/ChatWindow';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-blue-50">
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
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <ChatWindow />
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-6 text-center text-xs text-gray-500">
        Built for Hack2Skill PromptWars · Powered by Google Cloud
      </footer>
    </div>
  );
}

export default App;