import React, { useState } from 'react';
import { queryAIAssistant } from '../services/api';
import { 
  Bot, 
  Send, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  AlertCircle,
  Clock
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'Summarize this parcel.',
  'What is the property tax status?',
  'What are the zoning and land use rules?',
  'Are there any legal restrictions or court stays?',
  'What is the transaction history?',
];

export default function AIAssistantCard({ ulpin }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `Hello! I am the Grounded LandSetu AI Assistant. Ask me any factual question about parcel ${ulpin}, and I will retrieve answers directly grounded in the integrated departmental ledgers.`,
      sources: ['Department Ledgers'],
      timestamp: new Date().toISOString(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async (questionToSend) => {
    const q = (questionToSend || query).trim();
    if (!q || !ulpin) return;

    setQuery('');
    setError(null);

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await queryAIAssistant(ulpin, q);
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        sources: res.sources || ['Integrated Parcel Record'],
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(err.message || 'Failed to query AI assistant.');
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          isError: true,
          text: `⚠️ ${err.message || 'Unable to retrieve answer.'}`,
          sources: [],
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[520px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold tracking-tight">Grounded AI Parcel Assistant</h3>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded font-mono">
                RAG Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Strictly grounded in verified parcel ledgers</p>
          </div>
        </div>

        <button
          onClick={() => handleSend('Summarize this parcel.')}
          disabled={loading}
          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-md text-[11px] font-semibold flex items-center space-x-1 transition disabled:opacity-50"
        >
          <Sparkles className="h-3 w-3" />
          <span>Summarize Parcel</span>
        </button>
      </div>

      {/* Suggested Query Chips */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center space-x-2 overflow-x-auto text-xs no-scrollbar">
        <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Quick Queries:</span>
        {SUGGESTED_QUESTIONS.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(suggestion)}
            disabled={loading}
            className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-600 border border-slate-200 rounded-full text-[11px] whitespace-nowrap transition shrink-0 disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Message Chat Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/30 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl p-3.5 ${
                msg.sender === 'user'
                  ? 'bg-emerald-700 text-white rounded-br-none shadow-sm'
                  : msg.isError
                  ? 'bg-red-50 text-red-900 border border-red-200 rounded-bl-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="text-slate-400 font-semibold flex items-center gap-1">
                    <FileText className="h-2.5 w-2.5" /> Sources:
                  </span>
                  {msg.sources.map((src, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium border border-slate-200"
                    >
                      {src}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[9px] text-slate-400 mt-1 px-1">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-slate-500 bg-white p-3 rounded-xl border border-slate-200 w-fit">
            <div className="h-3.5 w-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs">Querying multi-department ledgers...</span>
          </div>
        )}
      </div>

      {/* Query Input Bar */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Ask factual questions about ULPIN ${ulpin}...`}
            disabled={loading}
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="p-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-sm transition disabled:opacity-50"
            title="Submit Query"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
