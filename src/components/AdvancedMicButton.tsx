import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  RefreshCw,
  Sparkles,
  Cpu,
  Volume2,
  AlertCircle,
  HelpCircle,
  Radio,
  ChevronDown,
  X,
  VolumeX,
} from 'lucide-react';
import { DetailedMicError } from '../utils/microphone-manager';

export type MicButtonState =
  | 'idle'
  | 'requesting_permission'
  | 'listening'
  | 'processing'
  | 'thinking'
  | 'speaking'
  | 'error';

interface AdvancedMicButtonProps {
  state: MicButtonState;
  audioLevel?: number; // 0 to 1
  onClick: () => void;
  onOpenVoiceHub?: () => void;
  errorDetails?: DetailedMicError | null;
  onRetryPermission?: () => void;
  selectedLang?: string;
  onSelectLang?: (lang: string) => void;
  onStopSpeaking?: () => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', label: 'English (US)', short: 'EN' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)', short: 'HI' },
  { code: 'en-GB', label: 'English (UK)', short: 'UK' },
  { code: 'es-ES', label: 'Español', short: 'ES' },
  { code: 'fr-FR', label: 'Français', short: 'FR' },
];

export const AdvancedMicButton: React.FC<AdvancedMicButtonProps> = ({
  state,
  audioLevel = 0,
  onClick,
  onOpenVoiceHub,
  errorDetails,
  onRetryPermission,
  selectedLang = 'en-US',
  onSelectLang,
  onStopSpeaking,
}) => {
  const [showErrorPopover, setShowErrorPopover] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-open error popover if an error occurs
  useEffect(() => {
    if (state === 'error') {
      setShowErrorPopover(true);
    } else {
      setShowErrorPopover(false);
    }
  }, [state]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowErrorPopover(false);
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute live waveform bar heights from audioLevel
  const barHeights = [
    Math.max(4, Math.round(audioLevel * 22)),
    Math.max(6, Math.round(audioLevel * 30 + 4)),
    Math.max(4, Math.round(audioLevel * 26)),
    Math.max(6, Math.round(audioLevel * 18 + 2)),
  ];

  return (
    <div ref={containerRef} className="relative inline-flex items-center gap-1.5 select-none">
      {/* Main Multi-State Microphone Button */}
      <button
        type="button"
        onClick={() => {
          if (state === 'speaking' && onStopSpeaking) {
            onStopSpeaking();
            return;
          }
          if (state === 'error') {
            setShowErrorPopover(!showErrorPopover);
            return;
          }
          onClick();
        }}
        title={
          state === 'idle'
            ? 'Start Voice Dictation (Ctrl+M)'
            : state === 'requesting_permission'
            ? 'Requesting microphone permission...'
            : state === 'listening'
            ? 'Listening... Click to stop recording'
            : state === 'processing'
            ? 'Transcribing your speech to text...'
            : state === 'thinking'
            ? 'AI is thinking and reasoning...'
            : state === 'speaking'
            ? 'AI is speaking response... Click to mute'
            : 'Microphone permission blocked. Click for help'
        }
        aria-label={`Microphone status: ${state}`}
        className={`relative px-2.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 font-medium text-xs cursor-pointer shadow-sm ${
          state === 'idle'
            ? 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60'
            : state === 'requesting_permission'
            ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 ring-2 ring-amber-500/30 animate-pulse'
            : state === 'listening'
            ? 'bg-gradient-to-r from-rose-500/25 via-pink-500/25 to-purple-500/25 border border-rose-500/60 text-rose-300 ring-2 ring-rose-500/40 shadow-lg shadow-rose-500/20'
            : state === 'processing'
            ? 'bg-violet-500/20 border border-violet-500/50 text-violet-300 ring-2 ring-violet-500/30'
            : state === 'thinking'
            ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 ring-2 ring-indigo-500/30'
            : state === 'speaking'
            ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/60 text-purple-200 ring-2 ring-purple-500/40 shadow-md shadow-purple-500/20'
            : 'bg-rose-950/60 border border-rose-600 text-rose-300 ring-2 ring-rose-500/40'
        }`}
      >
        {/* State 1: Idle */}
        {state === 'idle' && (
          <>
            <Mic className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">Voice</span>
          </>
        )}

        {/* State 2: Requesting Permission */}
        {state === 'requesting_permission' && (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span className="text-amber-300 font-semibold">Allow Mic...</span>
          </>
        )}

        {/* State 3: Listening with Live Waveform */}
        {state === 'listening' && (
          <div className="flex items-center gap-1.5">
            <MicOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            {/* 4 Animated Waveform Bars responding to live volume */}
            <div className="flex items-center gap-0.5 h-4 px-0.5">
              {barHeights.map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-gradient-to-t from-rose-500 to-pink-400 rounded-full transition-all duration-75"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>
            <span className="text-rose-300 font-bold hidden sm:inline">Listening</span>
          </div>
        )}

        {/* State 4: Processing Speech to Text */}
        {state === 'processing' && (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-violet-400 animate-spin" />
            <span className="text-violet-300 font-semibold hidden sm:inline">Transcribing...</span>
          </>
        )}

        {/* State 5: AI Thinking */}
        {state === 'thinking' && (
          <>
            <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="text-indigo-300 font-semibold hidden sm:inline">Thinking...</span>
          </>
        )}

        {/* State 6: AI Speaking */}
        {state === 'speaking' && (
          <>
            <Volume2 className="w-3.5 h-3.5 text-pink-400 animate-bounce" />
            <span className="text-pink-300 font-semibold hidden sm:inline">Speaking</span>
            <span className="text-[10px] text-pink-400 font-mono">(Tap to stop)</span>
          </>
        )}

        {/* State 7: Error / Permission Denied */}
        {state === 'error' && (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
            <span className="text-rose-300 font-bold">Mic Blocked</span>
          </>
        )}
      </button>

      {/* Language Quick-Selector Chip */}
      {onSelectLang && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            title="Speech Language (English / हिन्दी)"
            className="px-1.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-[11px] font-mono text-slate-300 border border-slate-700/60 flex items-center gap-0.5 cursor-pointer"
          >
            <span>{selectedLang === 'hi-IN' ? 'HI' : 'EN'}</span>
            <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
          </button>

          {showLangDropdown && (
            <div className="absolute bottom-9 left-0 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 w-36 text-xs animate-in fade-in zoom-in-95">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-slate-800 mb-1">
                Voice Language
              </div>
              {SUPPORTED_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    onSelectLang(l.code);
                    setShowLangDropdown(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    selectedLang === l.code
                      ? 'bg-indigo-600/20 text-indigo-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{l.label}</span>
                  <span className="text-[10px] font-mono text-slate-400">{l.short}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Two-Way Voice Conversation Hub Trigger */}
      {onOpenVoiceHub && (
        <button
          type="button"
          onClick={onOpenVoiceHub}
          title="Open Two-Way Real-Time Voice Conversation Mode (Hands-free dialogue)"
          className="p-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer group shadow-sm"
        >
          <Radio className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline">Voice Hub</span>
        </button>
      )}

      {/* Error & Permission Help Popover Modal / Bubble */}
      {showErrorPopover && errorDetails && (
        <div className="absolute bottom-11 left-0 z-50 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-md border border-rose-500/60 rounded-2xl shadow-2xl p-3.5 text-xs text-slate-200 animate-in fade-in zoom-in-95">
          <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Microphone Access Notice</span>
            </div>
            <button
              type="button"
              onClick={() => setShowErrorPopover(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-slate-300 leading-relaxed mb-2 text-[11px] font-medium">
            {errorDetails.message}
          </p>

          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 mb-3 space-y-1">
            <span className="font-semibold text-indigo-300 block">How to enable:</span>
            <p className="leading-relaxed">{errorDetails.solution}</p>
          </div>

          <div className="flex items-center gap-2">
            {onRetryPermission && (
              <button
                type="button"
                onClick={() => {
                  setShowErrorPopover(false);
                  onRetryPermission();
                }}
                className="flex-1 py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/20"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Permission</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowErrorPopover(false)}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
