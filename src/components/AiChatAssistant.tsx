'use client';

import React, { useState } from 'react';
import { Send, Sparkles, User, Bot, Loader2 } from 'lucide-react';
import { CivicBrief } from '@/types';

interface AiChatAssistantProps {
  brief: CivicBrief;
  apiKey: string | null;
}

export const AiChatAssistant: React.FC<AiChatAssistantProps> = ({ brief, apiKey }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: `Hello! I am your Civic Intelligence Analyst for this air quality brief. You can ask me any question about the underlying readings, likely hotspot sources, data gaps, or specific protocols for ${brief.personaTitle}.`
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userQ = input.trim();
    setInput('');

    setMessages(prev => [...prev, { role: 'user', text: userQ }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief,
          question: userQ,
          apiKey
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.answer }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${data.error}` }]);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setMessages(prev => [...prev, { role: 'assistant', text: `Failed to connect: ${message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'What was the highest peak reading and where was it recorded?',
    'What precautions should primary schools take today?',
    'Are there any sensor freeze or telemetry gaps detected?',
    'What is the top priority action for our team?'
  ];

  return (
    <section aria-labelledby="ai-chat-heading" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400" aria-hidden="true">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 id="ai-chat-heading" className="text-sm font-bold text-white">Ask Briefing Studio (Interactive AI Assistant)</h3>
            <p className="text-xs text-slate-400">Interrogate this brief and underlying data in natural language</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
          {apiKey ? 'Powered by Gemini AI' : 'Civic Intelligence Engine'}
        </span>
      </div>

      {/* Messages Scroll Box */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Conversation history with AI assistant"
        className="h-60 overflow-y-auto space-y-3 p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-start gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                m.role === 'user'
                  ? 'bg-cyan-600 text-slate-950 font-medium'
                  : 'bg-slate-900 text-slate-200 border border-slate-800'
              }`}
            >
              <span className="sr-only">{m.role === 'user' ? 'You said:' : 'AI responded:'}</span>
              {m.text}
            </div>
            {m.role === 'user' && (
              <div className="w-6 h-6 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]" aria-hidden="true">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400" aria-live="assertive">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" aria-hidden="true" />
            <span>Analyzing brief telemetry...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Suggested quick questions">
        <span className="text-[10px] text-slate-500">Quick prompts:</span>
        {samplePrompts.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setInput(p)}
            className="text-[10px] text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/60 transition focus:outline-none focus:ring-1 focus:ring-purple-400"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2"
      >
        <label htmlFor="ai-chat-input" className="sr-only">
          Ask a question about this data brief
        </label>
        <input
          id="ai-chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this data brief..."
          className="flex-1 bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          aria-label="Send message to AI assistant"
          className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl transition focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>
    </section>
  );
};
