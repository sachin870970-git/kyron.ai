import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Volume2,
  Trash2,
  Download,
  Upload,
  Check,
  Sun,
  Moon,
  Laptop,
  Cpu,
  Globe,
  Activity,
  Shield,
  Crown,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { UserSettings, AIMode, SubscriptionState } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
  onClearAllChats: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  subscription?: SubscriptionState;
  onOpenSubscription?: () => void;
}

type SettingsTab = 'general' | 'appearance' | 'voice' | 'models' | 'quota' | 'privacy' | 'account';

const LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'ja-JP', label: '日本語' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onClearAllChats,
  onExportData,
  onImportData,
  subscription,
  onOpenSubscription,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [current, setCurrent] = useState<UserSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [quotaStats, setQuotaStats] = useState<any>(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(false);

  // Fetch live server quota statistics when tab is quota or on mount
  useEffect(() => {
    let isCancelled = false;
    const fetchStats = async () => {
      setIsLoadingQuota(true);
      try {
        const res = await fetch('/api/quota/stats');
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) setQuotaStats(data);
        }
      } catch (e) {
        console.warn('Could not fetch quota stats:', e);
      } finally {
        if (!isCancelled) setIsLoadingQuota(false);
      }
    };
    fetchStats();
    return () => {
      isCancelled = true;
    };
  }, [activeTab]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSaveSettings(current);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Centralized Settings & Preferences</h2>
              <p className="text-[11px] text-slate-400">Configure AI models, themes, speech, and quotas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 overflow-x-auto shrink-0 scrollbar-none">
          {[
            { id: 'general' as SettingsTab, label: 'General', icon: <Sliders className="w-3.5 h-3.5" /> },
            { id: 'appearance' as SettingsTab, label: 'Appearance', icon: <Sun className="w-3.5 h-3.5" /> },
            { id: 'voice' as SettingsTab, label: 'Voice & Speech', icon: <Volume2 className="w-3.5 h-3.5" /> },
            { id: 'models' as SettingsTab, label: 'AI Engine', icon: <Cpu className="w-3.5 h-3.5" /> },
            { id: 'quota' as SettingsTab, label: 'API Quotas', icon: <Activity className="w-3.5 h-3.5" /> },
            { id: 'privacy' as SettingsTab, label: 'Privacy & Data', icon: <Shield className="w-3.5 h-3.5" /> },
            { id: 'account' as SettingsTab, label: 'Account', icon: <Crown className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-300 space-y-5">
          {/* TAB 1: General */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Default Intelligence Mode
                </label>
                <select
                  value={current.defaultMode}
                  onChange={(e) => setCurrent({ ...current, defaultMode: e.target.value as AIMode })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="immediate">Ultra-Fast (Gemini 3.1 Flash Lite - Sub-500ms TTFT)</option>
                  <option value="standard">Smart Chat (Versatile Multi-turn)</option>
                  <option value="deep-reasoning">Deep Reasoning (Decomposition & STEM Proofs)</option>
                  <option value="research">Web Research (Live Google Search Grounding)</option>
                  <option value="code">Code Studio (Interactive UI & Sandboxing)</option>
                  <option value="writing">Writing & Drafting</option>
                  <option value="study">Socratic Study Coach</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-200">Creativity / Temperature</label>
                  <span className="font-mono text-indigo-400 font-bold">{current.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={current.temperature}
                  onChange={(e) => setCurrent({ ...current, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>0.0 (Strict & Deterministic)</span>
                  <span>1.0 (Creative & Varied)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Custom System Persona Instructions
                </label>
                <textarea
                  rows={3}
                  value={current.customSystemPrompt}
                  onChange={(e) => setCurrent({ ...current, customSystemPrompt: e.target.value })}
                  placeholder="e.g. Always respond in concise bullet points, or adapt answers for senior machine learning engineers..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Appearance */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-2">Visual Theme</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'dark', label: 'Dark Slate', icon: <Moon className="w-4 h-4 text-indigo-400" /> },
                    { id: 'light', label: 'Clean Light', icon: <Sun className="w-4 h-4 text-amber-400" /> },
                    { id: 'midnight', label: 'Midnight OLED', icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
                    { id: 'system', label: 'System Auto', icon: <Laptop className="w-4 h-4 text-slate-400" /> },
                  ].map((themeOpt) => (
                    <button
                      key={themeOpt.id}
                      type="button"
                      onClick={() => setCurrent({ ...current, theme: themeOpt.id as any })}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all cursor-pointer ${
                        current.theme === themeOpt.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {themeOpt.icon}
                      <span className="font-medium text-xs">{themeOpt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Voice & Speech */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Dictation & Recognition Language
                </label>
                <select
                  value={current.language || 'en-US'}
                  onChange={(e) => setCurrent({ ...current, language: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label} ({l.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  AI Text-to-Speech Voice Persona
                </label>
                <select
                  value={current.voice}
                  onChange={(e) => setCurrent({ ...current, voice: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="Kore">Kore (Balanced, clear & natural)</option>
                  <option value="Fenrir">Fenrir (Deep, authoritative & confident)</option>
                  <option value="Puck">Puck (Enthusiastic, lively & expressive)</option>
                  <option value="Aoede">Aoede (Melodic, warm & friendly)</option>
                  <option value="Zephyr">Zephyr (Soft & conversational)</option>
                  <option value="Charon">Charon (Calm & steady)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-200">Speaking Speed</label>
                  <span className="font-mono text-purple-400 font-bold">{current.speechSpeed || 1.0}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.5"
                  step="0.05"
                  value={current.speechSpeed || 1.0}
                  onChange={(e) => setCurrent({ ...current, speechSpeed: parseFloat(e.target.value) })}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3">
                <div>
                  <p className="font-semibold text-slate-200">Auto Read Aloud Replies</p>
                  <p className="text-[11px] text-slate-400">Automatically speak text responses when generated</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrent({ ...current, autoSpeak: !current.autoSpeak })}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    current.autoSpeak ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      current.autoSpeak ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: AI Engine & Models */}
          {activeTab === 'models' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 leading-relaxed">
                <p className="font-semibold mb-1">Quota Optimization Recommendation</p>
                <p className="text-indigo-200/90 text-[11px]">
                  <strong>Gemini 3.1 Flash Lite</strong> offers the highest free-tier rate limits and sub-500ms TTFT latency.
                  Gemini 3.8 Flash is reserved for deep-reasoning mode with step-by-step thinking.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Primary Text Generation Engine
                </label>
                <select
                  value={current.preferredModel || 'gemini-3.1-flash-lite'}
                  onChange={(e) => setCurrent({ ...current, preferredModel: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Recommended for Free Tier Quota)</option>
                  <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (Fast Multi-Modal)</option>
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash (Advanced Reasoning)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Context Window Pruning (Turn Limit)
                </label>
                <select
                  value={current.contextTurnLimit || 6}
                  onChange={(e) => setCurrent({ ...current, contextTurnLimit: parseInt(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="4">4 Turns (Maximum Quota Savings)</option>
                  <option value="6">6 Turns (Recommended Balance)</option>
                  <option value="10">10 Turns (Extended Long Context)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Pruning older turns prevents massive token re-transmissions that burn through free quota limits.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: API Quotas & Telemetry */}
          {activeTab === 'quota' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Server Quota & Cache Status</span>
                {isLoadingQuota && <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
              </div>

              {quotaStats ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] font-mono text-slate-400 uppercase">Requests Today</p>
                    <p className="text-lg font-bold text-white mt-0.5">{quotaStats.metrics?.todayRequests ?? 0}</p>
                    <p className="text-[10px] text-slate-500">Daily limit: {quotaStats.metrics?.dailyQuotaLimit ?? 1500}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] font-mono text-slate-400 uppercase">Cache Hits</p>
                    <p className="text-lg font-bold text-emerald-400 mt-0.5">{quotaStats.metrics?.cacheHits ?? 0}</p>
                    <p className="text-[10px] text-slate-500">100% quota saved</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] font-mono text-slate-400 uppercase">Rate-Limit Hits (429)</p>
                    <p className="text-lg font-bold text-amber-400 mt-0.5">{quotaStats.metrics?.rateLimit429Errors ?? 0}</p>
                    <p className="text-[10px] text-slate-500">Auto-resolved via fallback</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] font-mono text-slate-400 uppercase">Next Quota Reset</p>
                    <p className="text-xs font-semibold text-indigo-300 mt-1">{quotaStats.resetEstimate || 'Midnight UTC'}</p>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500">Loading quota diagnostics...</div>
              )}
            </div>
          )}

          {/* TAB 6: Privacy & Storage */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">Data & Session Backup</h3>
                <p className="text-[11px] text-slate-400 mb-3">
                  All your chats and creations remain stored securely in your browser's private local storage.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onExportData}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON Backup</span>
                  </button>

                  <label className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import JSON Data</span>
                    <input type="file" accept=".json" onChange={onImportData} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <h3 className="font-semibold text-rose-400 mb-1">Danger Zone</h3>
                <p className="text-[11px] text-slate-500 mb-2">Permanently erase conversation history from this device.</p>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Delete all chats and local session data?')) {
                      onClearAllChats();
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-800/40 hover:bg-rose-900/50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Chat History</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 7: Account */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-bold text-white capitalize">{subscription?.plan || 'pro'} Tier Active</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">High-priority generation, 4K upscaling, and camera vectors</p>
                </div>
                {onOpenSubscription && (
                  <button
                    type="button"
                    onClick={onOpenSubscription}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer"
                  >
                    Manage Plan
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400">
            Created by <strong className="text-slate-200">Sachin</strong> • KYRON AI Platform
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
