import React, { useRef, useEffect, useState } from 'react';
import {
  Menu,
  Sparkles,
  Cpu,
  Globe,
  Code,
  Image as ImageIcon,
  PenTool,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  ExternalLink,
  Download,
  Share2,
  FileCode,
  Layers,
  ChevronRight,
  Info,
  Maximize2,
  Zap,
  ShieldAlert,
  Crown,
  RefreshCw,
  Radio,
  MessageSquare,
} from 'lucide-react';
import { ChatSession, Message, Artifact, AIMode, LatencyMetrics } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { formatTimestamp, estimateReadingTime } from '../utils/ai-helpers';
import { useWebSpeech } from '../hooks/useWebSpeech';
import { PerformanceMonitor, LiveStreamMetrics } from './PerformanceMonitor';
import { KyronLogo } from './KyronLogo';

interface ChatAreaProps {
  session: ChatSession;
  isLoading: boolean;
  onSendMessage: (content: string, attachments: any[], mode: AIMode, aspectRatio?: string) => void;
  onRegenerate: () => void;
  onOpenArtifact: (artifact: Artifact) => void;
  isArtifactPanelOpen: boolean;
  onToggleArtifactPanel: () => void;
  onToggleSidebar: () => void;
  voiceName: string;
  isPerfMonitorOpen: boolean;
  onTogglePerfMonitor: () => void;
  lastMetrics?: LatencyMetrics;
  liveMetrics: LiveStreamMetrics;
  currentMode: AIMode;
  onModeChange: (mode: AIMode) => void;
  sessionStats: {
    totalResponses: number;
    avgTtftMs: number;
    avgTokensPerSec: number;
    fastestTtftMs: number;
  };
  onOpenSubscription?: () => void;
  onOpenVoiceModal?: () => void;
  conversationMode?: 'chat' | 'voice';
  onToggleConversationMode?: (mode: 'chat' | 'voice') => void;
}

interface ChatMessageItemProps {
  message: Message;
  isCopied: boolean;
  onCopy: (content: string, id: string) => void;
  onOpenArtifact: (artifact: Artifact) => void;
  isSpeakingThis: boolean;
  onSpeak: (id: string, content: string) => void;
  rate: number;
  onSetRate: (r: number) => void;
  isArtifactPanelOpen: boolean;
  onToggleArtifactPanel: () => void;
  onRegenerate?: () => void;
  onOpenSubscription?: () => void;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = React.memo(({
  message,
  isCopied,
  onCopy,
  onOpenArtifact,
  isSpeakingThis,
  onSpeak,
  rate,
  onSetRate,
  isArtifactPanelOpen,
  onToggleArtifactPanel,
  onRegenerate,
  onOpenSubscription,
}) => {
  const isUser = message.role === 'user';
  const readingTime = estimateReadingTime(message.content);
  const [approachView, setApproachView] = useState<'both' | 'hard' | 'smart'>('both');

  // Detect KYRON AI Dual-Approach Intelligence (Hard Work & Smart Work)
  const hasHardWork = /###\s*(?:🔨\s*)?HARD WORK/i.test(message.content);
  const hasSmartWork = /###\s*(?:⚡\s*)?SMART WORK/i.test(message.content);
  const isDualApproach = !isUser && hasHardWork && hasSmartWork;

  // Compute displayed content based on toggle
  let displayContent = message.content;
  if (isDualApproach) {
    const parts = message.content.split(/(?=###\s*(?:🔨\s*)?HARD WORK|###\s*(?:⚡\s*)?SMART WORK)/i);
    const prelude = parts[0] && !/###/i.test(parts[0]) ? parts[0] : '';
    const hardPart = parts.find((p) => /###\s*(?:🔨\s*)?HARD WORK/i.test(p)) || '';
    const smartPart = parts.find((p) => /###\s*(?:⚡\s*)?SMART WORK/i.test(p)) || '';

    if (approachView === 'hard') {
      displayContent = (prelude ? prelude + '\n\n' : '') + hardPart;
    } else if (approachView === 'smart') {
      displayContent = (prelude ? prelude + '\n\n' : '') + smartPart;
    }
  }

  return (
    <div
      className={`max-w-4xl mx-auto flex gap-3 sm:gap-4 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
      )}

      <div
        className={`flex flex-col max-w-[88%] sm:max-w-[82%] ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        {/* Message Bubble Container */}
        <div
          className={`rounded-2xl px-4 py-3.5 shadow-sm transition-all ${
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-xs'
              : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-xs w-full'
          }`}
        >
          {/* User Attached Files Preview */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="rounded-xl overflow-hidden border border-white/20 bg-black/20"
                >
                  {att.mimeType.startsWith('image/') ? (
                    <img
                      src={att.data}
                      alt={att.name}
                      className="max-h-48 max-w-xs object-cover rounded-lg"
                    />
                  ) : (
                    <div className="p-2 text-xs flex items-center gap-1.5 text-white/90">
                      <FileCode className="w-4 h-4" />
                      <span>{att.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Citations if available from Web Research */}
          {message.citations && message.citations.length > 0 && (
            <div className="mb-3.5 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-2">
                <Globe className="w-3.5 h-3.5" />
                <span>Grounded Web Sources & Citations</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {message.citations.map((cite, i) => (
                  <a
                    key={i}
                    href={cite.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                  >
                    <span className="font-medium text-emerald-300 truncate max-w-[160px]">
                      {cite.title || cite.domain}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Image Output if generated */}
          {message.imageOutput && (
            <div className="mb-4 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950">
              <img
                src={message.imageOutput.imageUrl}
                alt={message.imageOutput.prompt}
                className="w-full max-h-[500px] object-contain bg-black"
              />
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-300 truncate max-w-md">
                  Prompt: "{message.imageOutput.prompt}"
                </span>
                <a
                  href={message.imageOutput.imageUrl}
                  download="ultimate-ai-generated.png"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PNG</span>
                </a>
              </div>
            </div>
          )}

          {/* Interactive Dual Approach Segmented Selector (Hard Work vs Smart Work) */}
          {isDualApproach && (
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950/90 border border-slate-800 mb-3.5 w-fit">
              <button
                onClick={() => setApproachView('both')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  approachView === 'both'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dual Perspective (Both)
              </button>
              <button
                onClick={() => setApproachView('hard')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  approachView === 'hard'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-amber-400/80 hover:text-amber-300'
                }`}
              >
                <span>🔨 Hard Work (Fundamentals)</span>
              </button>
              <button
                onClick={() => setApproachView('smart')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  approachView === 'smart'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-400/80 hover:text-emerald-300'
                }`}
              >
                <span>⚡ Smart Work (Accelerated)</span>
              </button>
            </div>
          )}

          {/* Markdown Message Content */}
          {isUser ? (
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </div>
          ) : !message.content && message.isStreaming ? (
            <div className="flex items-center gap-2.5 py-1 text-xs text-indigo-300 font-mono">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
              </div>
              <span>Streaming real-time response...</span>
            </div>
          ) : (
            <MarkdownRenderer
              content={displayContent}
              onOpenArtifact={(art) => {
                onOpenArtifact(art);
                if (!isArtifactPanelOpen) onToggleArtifactPanel();
              }}
            />
          )}

          {/* Voice Mode Captions & Subtitles preview if turn was spoken */}
          {message.caption && (
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-xs">
              <div className="flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>CC {message.caption.language === 'hindi' ? 'हिन्दी Subtitle' : 'English Subtitle'}</span>
              </div>
              <div className="flex-1 text-slate-300">
                <p className="italic text-slate-200">"{message.caption.text}"</p>
              </div>
            </div>
          )}

          {/* Error display with specialized Quota Exhaustion Card */}
          {message.error && (
            (() => {
              const isQuotaError =
                message.error.includes('limit has been reached') ||
                message.error.includes('RESOURCE_EXHAUSTED') ||
                message.error.includes('429') ||
                message.error.includes('quota');

              if (isQuotaError) {
                return (
                  <div className="mt-3 p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/40 text-amber-200 shadow-xl backdrop-blur-md">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            QUOTA EXHAUSTED
                          </span>
                          <span className="text-[11px] text-slate-400">Resets: Midnight UTC</span>
                        </div>
                        <p className="text-sm font-semibold text-white leading-relaxed">
                          Your AI request limit has been reached. Please try again after the quota resets or switch to an available paid API plan.
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Google Free Tier daily requests for this model have completed. You can retry with our automatic fallback engines or switch to an available paid plan.
                        </p>

                        <div className="flex flex-wrap items-center gap-2.5 mt-3.5">
                          {onRegenerate && (
                            <button
                              onClick={() => onRegenerate()}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Retry Request</span>
                            </button>
                          )}

                          {onOpenSubscription && (
                            <button
                              onClick={onOpenSubscription}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                            >
                              <Crown className="w-3.5 h-3.5 fill-white" />
                              <span>Switch to Paid Plan ($9/mo)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="mt-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{message.error}</span>
                </div>
              );
            })()
          )}
        </div>

        {/* Message Bottom Action Bar */}
        {!isUser && (
          <div className="flex items-center gap-2 mt-1.5 px-1 text-[11px] text-slate-400">
            <span>{formatTimestamp(message.timestamp)}</span>
            <span>•</span>
            <span>{readingTime.words} words</span>

            {/* Real-time Latency Metrics Badge */}
            {message.latency && (
              <>
                <span>•</span>
                <span
                  className="inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                  title={`Time to First Token: ${message.latency.ttftMs}ms | Total Duration: ${message.latency.totalMs}ms | Speed: ${message.latency.tokensPerSec || 'N/A'} tokens/sec`}
                >
                  <Zap className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
                  <span>{message.latency.ttftMs}ms TTFT</span>
                  {message.latency.tokensPerSec ? (
                    <>
                      <span className="text-emerald-500/40">|</span>
                      <span>{message.latency.tokensPerSec} t/s</span>
                    </>
                  ) : null}
                </span>
              </>
            )}

            <span>•</span>

            {/* Copy */}
            <button
              onClick={() => onCopy(message.content, message.id)}
              className="hover:text-slate-200 transition-colors flex items-center gap-1"
              aria-label="Copy assistant answer"
            >
              {isCopied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Web Speech API Read Aloud button */}
            <button
              onClick={() => onSpeak(message.id, message.content)}
              disabled={!message.content.trim()}
              className={`transition-all flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium ${
                !message.content.trim()
                  ? 'opacity-40 cursor-not-allowed text-slate-500'
                  : isSpeakingThis
                  ? 'bg-indigo-600/30 text-indigo-300 ring-1 ring-indigo-500/50 shadow-sm shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800/80 cursor-pointer'
              }`}
              aria-label={
                isSpeakingThis
                  ? 'Stop reading aloud'
                  : 'Read aloud with Web Speech API'
              }
              title="Read Aloud (Web Speech API)"
            >
              {isSpeakingThis ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <VolumeX className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-indigo-300">Stop Reading</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Read Aloud</span>
                </>
              )}
            </button>

            {/* Speed selector when active */}
            {isSpeakingThis && (
              <div className="flex items-center gap-0.5 bg-slate-850 px-1 py-0.5 rounded border border-slate-700/60 text-[10px]">
                {[1.0, 1.25, 1.5].map((s) => (
                  <button
                    key={s}
                    onClick={() => onSetRate(s)}
                    className={`px-1 py-0.2 rounded ${
                      rate === s ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}

            {/* Open artifacts quick link if found */}
            {message.artifacts && message.artifacts.length > 0 && (
              <button
                onClick={() => {
                  onOpenArtifact(message.artifacts![0]);
                  if (!isArtifactPanelOpen) onToggleArtifactPanel();
                }}
                className="hover:text-amber-400 transition-colors flex items-center gap-1"
              >
                <FileCode className="w-3 h-3" />
                <span>View Artifact</span>
              </button>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 text-xs font-semibold mt-0.5">
          U
        </div>
      )}
    </div>
  );
});

export const ChatArea: React.FC<ChatAreaProps> = ({
  session,
  isLoading,
  onSendMessage,
  onRegenerate,
  onOpenArtifact,
  isArtifactPanelOpen,
  onToggleArtifactPanel,
  onToggleSidebar,
  isPerfMonitorOpen,
  onTogglePerfMonitor,
  lastMetrics,
  liveMetrics,
  currentMode,
  onModeChange,
  sessionStats,
  onOpenSubscription,
  onOpenVoiceModal,
  conversationMode = 'chat',
  onToggleConversationMode,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Web Speech API Read Aloud hook
  const {
    isSupported: isWebSpeechSupported,
    isSpeaking,
    currentMessageId,
    speak,
    stop,
    rate,
    setRate,
  } = useWebSpeech();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sessionMessages = session?.messages || [];
  const prevMsgCountRef = useRef(sessionMessages.length);

  useEffect(() => {
    const isNewMessage = sessionMessages.length !== prevMsgCountRef.current;
    prevMsgCountRef.current = sessionMessages.length;

    if (isNewMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (isLoading && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
      if (isNearBottom) {
        // Direct non-animated scroll avoids layout thrashing 50 times/second
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [sessionMessages, isLoading]);

  // Stop speech if session changes or new message is generating
  useEffect(() => {
    if (isLoading) {
      stop();
    }
  }, [isLoading, stop]);

  useEffect(() => {
    stop();
  }, [session?.id, stop]);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const exportMarkdown = () => {
    const md = sessionMessages
      .map((m) => `### ${m.role === 'user' ? 'User' : 'KYRON AI'}\n\n${m.content}\n`)
      .join('\n---\n\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session?.title || 'chat'}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const hasArtifacts = sessionMessages.some((m) => m.artifacts && m.artifacts.length > 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
      {/* Top Session Header */}
      <div className="h-14 border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 bg-slate-950/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3 overflow-hidden">
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="truncate">
            <h2 className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
              {session.title || 'New Workspace Session'}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="capitalize flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {session.mode || 'standard'} engine
              </span>
              <span>•</span>
              <span>{session.messages.length} messages</span>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {/* Clearly visible Voice / Chat Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 shadow-inner">
            <button
              type="button"
              onClick={() => onToggleConversationMode?.('chat')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                conversationMode === 'chat'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Chat Mode: Text queries receive text answers (No auto voice output)"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chat</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onToggleConversationMode?.('voice');
                if (onOpenVoiceModal) onOpenVoiceModal();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                conversationMode === 'voice'
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Voice Mode: Speak naturally with two-way voice conversation"
            >
              <Radio className="w-3.5 h-3.5 text-purple-300" />
              <span className="hidden sm:inline">Voice</span>
            </button>
          </div>

          {/* Toggleable Speed HUD / Performance Monitor button */}
          <button
            onClick={onTogglePerfMonitor}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
              isPerfMonitorOpen
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                : 'bg-slate-900/90 text-slate-300 border border-slate-700/80 hover:bg-slate-800'
            }`}
            title="Toggle Real-Time Speed & Latency Performance Monitor"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="hidden sm:inline font-sans font-semibold">Speed HUD</span>
            {lastMetrics?.ttftMs ? (
              <span className="text-[11px] text-emerald-400 font-bold hidden md:inline">
                {lastMetrics.ttftMs}ms
              </span>
            ) : null}
          </button>

          {hasArtifacts && (
            <button
              onClick={onToggleArtifactPanel}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                isArtifactPanelOpen
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-indigo-300 border border-indigo-500/30 hover:bg-slate-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Artifact Studio</span>
            </button>
          )}

          <button
            onClick={exportMarkdown}
            title="Export conversation as Markdown"
            aria-label="Export conversation"
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Real-Time Performance Monitor Overlay */}
      <PerformanceMonitor
        isOpen={isPerfMonitorOpen}
        onClose={onTogglePerfMonitor}
        lastMetrics={lastMetrics}
        liveMetrics={liveMetrics}
        currentMode={currentMode}
        onModeChange={onModeChange}
        sessionStats={sessionStats}
      />


      {/* Messages Scroll Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {sessionMessages.length === 0 ? (
          /* Empty / Welcome State */
          <div className="max-w-2xl mx-auto py-8 flex flex-col items-center text-center">
            <div className="mb-4">
              <KyronLogo size={64} animated={true} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1 flex items-center justify-center gap-2">
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent font-sans">
                Welcome to KYRON AI
              </span>
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-medium mb-3">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Created &amp; Developed by <strong className="text-white font-semibold">Sachin</strong> • Celestial AI Core</span>
            </div>
            <p className="text-sm text-slate-400 max-w-lg mb-8 leading-relaxed">
              Your multimodal master intelligence assistant. Research with live Google Search citations, solve complex problems with deep logic reasoning, generate images, write sandboxed code, and analyze documents.
            </p>

            {/* Capability Starter Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
              {[
                {
                  mode: 'research' as AIMode,
                  icon: <Globe className="w-4 h-4 text-emerald-400" />,
                  title: 'Live Web Research',
                  prompt: 'Research and summarize the latest breakthrough discoveries in nuclear fusion and renewable storage.',
                },
                {
                  mode: 'deep-reasoning' as AIMode,
                  icon: <Cpu className="w-4 h-4 text-violet-400" />,
                  title: 'Deep Logical Reasoning',
                  prompt: 'Step-by-step mathematical proof of why the square root of 2 is irrational, plus geometrical interpretation.',
                },
                {
                  mode: 'code' as AIMode,
                  icon: <Code className="w-4 h-4 text-amber-400" />,
                  title: 'Interactive Code & UI',
                  prompt: 'Build a standalone HTML5 interactive solar system simulation with orbiting planets and Tailwind controls.',
                },
                {
                  mode: 'image' as AIMode,
                  icon: <ImageIcon className="w-4 h-4 text-rose-400" />,
                  title: 'Generate Visual Art',
                  prompt: 'A futuristic botanical laboratory glowing with bioluminescent alien flora, 8k cinematic masterpiece.',
                },
              ].map((card, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(card.prompt, [], card.mode)}
                  className="group p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700/80 transition-all text-left flex flex-col justify-between hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-slate-800">{card.icon}</div>
                      <span className="text-xs font-semibold text-slate-200">{card.title}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition-colors" />
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {card.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Memoized Message Stream: Past messages never re-render during streaming */
          sessionMessages.map((message) => (
            <ChatMessageItem
              key={message.id}
              message={message}
              isCopied={copiedMsgId === message.id}
              onCopy={handleCopy}
              onOpenArtifact={onOpenArtifact}
              isSpeakingThis={isSpeaking && currentMessageId === message.id}
              onSpeak={speak}
              rate={rate}
              onSetRate={(r) => {
                setRate(r);
                speak(message.id, message.content);
              }}
              isArtifactPanelOpen={isArtifactPanelOpen}
              onToggleArtifactPanel={onToggleArtifactPanel}
              onRegenerate={onRegenerate}
              onOpenSubscription={onOpenSubscription}
            />
          ))
        )}

        {/* Loading / Generating Indicator (only shown if not already rendering an in-bubble streaming state) */}
        {isLoading && !sessionMessages.some((m) => m.role === 'model' && m.isStreaming) && (
          <div className="max-w-4xl mx-auto flex gap-3 sm:gap-4 items-start">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0 animate-pulse shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 text-xs flex items-center gap-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
              </div>
              <span className="text-slate-400 font-mono">
                KYRON AI is synthesizing intelligence...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
