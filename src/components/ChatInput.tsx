import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Mic,
  MicOff,
  Image as ImageIcon,
  Sparkles,
  Cpu,
  Globe,
  Code,
  PenTool,
  X,
  Volume2,
  AlertCircle,
  Radio,
  Zap,
} from 'lucide-react';
import { AIMode, Attachment } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useWebSpeech } from '../hooks/useWebSpeech';
import { AdvancedMicButton, MicButtonState } from './AdvancedMicButton';

interface ChatInputProps {
  onSendMessage: (content: string, attachments: Attachment[], mode: AIMode, aspectRatio?: string) => void;
  isLoading: boolean;
  onStop: () => void;
  currentMode: AIMode;
  onModeChange: (mode: AIMode) => void;
  onOpenVoiceModal?: () => void;
}

const DICTATION_LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'ja-JP', label: '日本語' },
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  onStop,
  currentMode,
  onModeChange,
  onOpenVoiceModal,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [selectedLang, setSelectedLang] = useState('en-US');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Speech Synthesis hook to know if AI is actively speaking
  const { isSpeaking, stop: stopSpeaking } = useWebSpeech();

  // Hook for Web Speech API SpeechRecognition
  const {
    isSupported: isSpeechSupported,
    status: speechStatus,
    isListening,
    interimTranscript,
    error: speechError,
    errorDetails,
    audioLevel,
    requestPermission,
    startListening,
    stopListening,
    toggleListening,
  } = useSpeechRecognition({
    lang: selectedLang,
    onTranscriptChange: (text) => {
      setInput(text);
    },
  });

  // Determine state for the 7-state Advanced Microphone Button
  const micButtonState: MicButtonState = speechError || errorDetails
    ? 'error'
    : isSpeaking
    ? 'speaking'
    : isLoading
    ? 'thinking'
    : speechStatus === 'requesting_permission'
    ? 'requesting_permission'
    : speechStatus === 'processing'
    ? 'processing'
    : isListening
    ? 'listening'
    : 'idle';

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 220)}px`;
    }
  }, [input]);

  // Global shortcut: Ctrl+M or Cmd+M to toggle voice dictation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleListening(input);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [input, toggleListening]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            data: result,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;
    if (!input.trim() && attachments.length === 0) return;

    // Stop dictation when submitting
    if (isListening) {
      stopListening();
    }

    onSendMessage(input, attachments, currentMode, aspectRatio);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      {/* Speech Error Banner */}
      {speechError && (
        <div className="mb-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{speechError}</span>
          </div>
          <button
            onClick={() => stopListening()}
            className="text-xs text-rose-400 hover:text-white underline ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 backdrop-blur-md shadow-2xl transition-all focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20 relative">
        {/* Active Voice Dictation Audio Wave Banner */}
        {isListening && (
          <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-rose-950/40 via-purple-950/40 to-slate-900 border-b border-rose-500/30 rounded-t-2xl animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>

              {/* Animated Soundwave bars */}
              <div className="flex items-center gap-0.5 h-3">
                <span className="w-0.5 h-full bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-0.5 h-3/4 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-0.5 h-full bg-rose-400 rounded-full animate-bounce [animation-delay:-0.4s]"></span>
                <span className="w-0.5 h-1/2 bg-rose-400 rounded-full animate-bounce"></span>
              </div>

              <span className="text-xs font-medium text-rose-300">
                Listening... Speak your message (Web Speech API)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {interimTranscript && (
                <span className="text-[11px] text-rose-300/80 italic max-w-xs truncate hidden sm:inline">
                  "{interimTranscript}"
                </span>
              )}
              <button
                type="button"
                onClick={() => stopListening()}
                className="px-2 py-0.5 rounded-lg text-xs font-medium bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white transition-colors"
              >
                Stop Dictation
              </button>
            </div>
          </div>
        )}

        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 border-b border-slate-800">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200"
              >
                {att.mimeType.startsWith('image/') ? (
                  <img
                    src={att.data}
                    alt={att.name}
                    className="w-7 h-7 rounded object-cover border border-slate-600"
                  />
                ) : (
                  <Paperclip className="w-4 h-4 text-indigo-400" />
                )}
                <span className="max-w-[140px] truncate text-xs">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  aria-label={`Remove ${att.name}`}
                  className="p-0.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? 'Transcribing speech in real-time...'
              : currentMode === 'image'
              ? 'Describe the image you want to create (e.g. "Futuristic neon solarpunk city with waterfalls, 8k cinematic lighting")...'
              : currentMode === 'research'
              ? 'Ask anything requiring live search, sources, or citations (e.g. "Latest discoveries in fusion energy 2026")...'
              : currentMode === 'deep-reasoning'
              ? 'Pose a complex logic, math, architectural, or puzzle problem...'
              : currentMode === 'code'
              ? 'Ask for code, algorithms, full components, or debug instructions...'
              : 'Message KYRON AI... (Ask a question, analyze data, upload files)'
          }
          rows={1}
          aria-label="Prompt input"
          className="w-full bg-transparent px-4 pt-3.5 pb-2 text-sm text-slate-100 placeholder-slate-400 outline-none resize-none min-h-[52px] max-h-[220px]"
        />

        {/* Controls Bar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          {/* Mode switch pills, Upload button, and Voice dictation button */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.js,.ts,.tsx,.json,.csv,.py,.md"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach image or file for multimodal analysis"
              aria-label="Attach file"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Advanced Multi-State Microphone Button with Live Waveform & Permission Recovery */}
            <AdvancedMicButton
              state={micButtonState}
              audioLevel={audioLevel}
              onClick={() => toggleListening(input)}
              onOpenVoiceHub={onOpenVoiceModal}
              errorDetails={errorDetails}
              onRetryPermission={async () => {
                await requestPermission();
                startListening(input);
              }}
              selectedLang={selectedLang}
              onSelectLang={(lang) => setSelectedLang(lang)}
              onStopSpeaking={() => stopSpeaking()}
            />

            {/* Mode Indicator & Quick Switch */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60 text-xs">
              <button
                type="button"
                onClick={() => onModeChange('immediate')}
                className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                  currentMode === 'immediate'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
                title="Immediate Response Mode: < 300ms latency, zero reasoning overhead"
              >
                <Zap className={`w-3 h-3 ${currentMode === 'immediate' ? 'fill-slate-950' : 'fill-emerald-400 text-emerald-400'}`} />
                <span className="hidden sm:inline">Instant</span>
              </button>

              <button
                type="button"
                onClick={() => onModeChange('standard')}
                className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                  currentMode === 'standard'
                    ? 'bg-indigo-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span className="hidden sm:inline">Fast</span>
              </button>

              <button
                type="button"
                onClick={() => onModeChange('deep-reasoning')}
                className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                  currentMode === 'deep-reasoning'
                    ? 'bg-violet-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3 h-3" />
                <span className="hidden sm:inline">Reason</span>
              </button>

              <button
                type="button"
                onClick={() => onModeChange('research')}
                className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                  currentMode === 'research'
                    ? 'bg-emerald-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span className="hidden sm:inline">Search</span>
              </button>

              <button
                type="button"
                onClick={() => onModeChange('code')}
                className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                  currentMode === 'code'
                    ? 'bg-amber-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3 h-3" />
                <span className="hidden sm:inline">Code</span>
              </button>

              <button
                type="button"
                onClick={() => onModeChange('image')}
                className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                  currentMode === 'image'
                    ? 'bg-rose-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                <span className="hidden sm:inline">Image</span>
              </button>
            </div>

            {/* Aspect ratio selector for Image Mode */}
            {currentMode === 'image' && (
              <div className="flex items-center gap-1 ml-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
                {['1:1', '16:9', '9:16', '4:3', '3:4'].map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                      aspectRatio === ratio
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Send / Stop button */}
          <div>
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                title="Stop generation"
                aria-label="Stop generating response"
                className="p-2.5 rounded-xl bg-rose-600/90 text-white hover:bg-rose-500 transition-colors shadow-md shadow-rose-600/20"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!input.trim() && attachments.length === 0}
                title="Send message (Enter)"
                aria-label="Send message"
                className={`p-2.5 rounded-xl transition-all ${
                  input.trim() || attachments.length > 0
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 hover:scale-105 active:scale-95'
                    : 'bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      <p className="text-center text-[11px] text-slate-400 mt-2 font-sans flex items-center justify-center gap-2">
        <span>KYRON AI can make mistakes. Verify critical facts and citations.</span>
        <span>•</span>
        <span className="text-slate-500 font-mono">Dictate with Mic or Ctrl+M</span>
      </p>
    </div>
  );
};
