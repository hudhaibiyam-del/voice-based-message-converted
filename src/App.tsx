/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Volume2,
  MessageSquare,
  Mic2
} from 'lucide-react';
import VoiceConverter from './components/VoiceConverter';
import FaqChatbot from './components/FaqChatbot';

export default function App() {
  const [activeTab, setActiveTab] = useState<'voice' | 'chat'>('voice');

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Volume2 className="w-8 h-8 text-blue-600" />
              VoxConvert
            </h1>
            <p className="text-muted-foreground mt-1">Multi-tool AI Assistant</p>
          </div>
          
          <nav className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
            <button
              onClick={() => setActiveTab('voice')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'voice' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Mic2 className="w-4 h-4" />
              Voice
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'chat' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              FAQ Chat
            </button>
          </nav>
        </header>

        <main>
          {activeTab === 'voice' ? <VoiceConverter /> : <FaqChatbot />}
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">
            Secure & Private • AI Powered by Gemini
          </p>
        </footer>
      </div>
    </div>
  );
}
