'use client';

import React, { useState, useEffect } from 'react';
import { Key, X, Check, ShieldCheck } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  setApiKey,
  selectedModel,
  setSelectedModel
}) => {
  const [localKey, setLocalKey] = useState<string>(apiKey);
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    setLocalKey(apiKey);
  }, [apiKey]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiKey(localKey);
    localStorage.setItem('civic_gemini_api_key', localKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setLocalKey('');
    setApiKey('');
    localStorage.removeItem('civic_gemini_api_key');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400" aria-hidden="true">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 id="api-modal-title" className="text-base font-bold text-white">Google Gemini AI Configuration</h2>
              <p className="text-xs text-slate-400">Enables advanced generative plain-language summaries</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Gemini configuration dialog"
            className="text-slate-400 hover:text-white p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="gemini-key-input" className="text-xs font-semibold text-slate-300 block mb-1.5">
              Google Gemini API Key
            </label>
            <input
              id="gemini-key-input"
              type="password"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Your key is saved locally in your browser storage and never stored on third-party servers.
            </p>
          </div>

          <div>
            <label htmlFor="gemini-model-select" className="text-xs font-semibold text-slate-300 block mb-1.5">
              Model Selection
            </label>
            <select
              id="gemini-model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ultra Fast & Grounded)</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next-Gen High Speed)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deepest Context Reasoning)</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <strong>Zero-Configuration Fallback:</strong> If no Gemini key is provided, the studio runs our native deterministic Civic Intelligence Engine so all briefs, calculations, and recommendations work seamlessly.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-slate-400 hover:text-rose-400 transition focus:outline-none focus:underline"
          >
            Clear Key
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-purple-600/20 transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {saved ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : null}
              <span>{saved ? 'Saved!' : 'Save & Activate'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
