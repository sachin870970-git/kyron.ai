import React, { useState } from 'react';
import {
  Zap,
  Activity,
  Gauge,
  Clock,
  Cpu,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  BarChart3,
  Layers,
} from 'lucide-react';
import { AIMode, LatencyMetrics } from '../types';

export interface LiveStreamMetrics {
  isStreaming: boolean;
  elapsedMs: number;
  tokenCount: number;
  ttftMs: number | null;
  liveTokensPerSec: number;
  model: string;
}

interface PerformanceMonitorProps {
  isOpen: boolean;
  onClose: () => void;
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
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isOpen,
  onClose,
  lastMetrics,
  liveMetrics,
  currentMode,
  onModeChange,
  sessionStats,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) return null;

  // Active display values: prioritize live streaming stats if streaming
  const activeTtft = liveMetrics.isStreaming
    ? liveMetrics.ttftMs
    : lastMetrics?.ttftMs ?? (sessionStats.avgTtftMs > 0 ? sessionStats.avgTtftMs : null);

  const activeTps = liveMetrics.isStreaming
    ? liveMetrics.liveTokensPerSec
    : lastMetrics?.tokensPerSec ?? (sessionStats.avgTokensPerSec > 0 ? sessionStats.avgTokensPerSec : null);

  const activeTotalMs = liveMetrics.isStreaming
    ? liveMetrics.elapsedMs
    : lastMetrics?.totalMs ?? null;

  // Color coding for TTFT (Sub-500ms is elite/emerald, sub-1000ms is blue, >1000ms is amber)
  const getTtftColor = (ms: number | null) => {
    if (ms === null) return 'text-slate-400';
    if (ms <= 400) return 'text-emerald-400 font-bold';
    if (ms <= 800) return 'text-cyan-400';
    return 'text-amber-400';
  };

  const getTpsColor = (tps: number | null) => {
    if (tps === null) return 'text-slate-400';
    if (tps >= 60) return 'text-emerald-400 font-bold';
    if (tps >= 30) return 'text-cyan-400';
    return 'text-indigo-400';
  };

  return (
    <div
      aria-label="Real-time Performance Monitor"
      className="absolute top-16 right-4 z-40 w-80 sm:w-96 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 shadow-2xl shadow-indigo-950/50 transition-all select-none animate-fadeIn overflow-hidden"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            {liveMetrics.isStreaming ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold text-white tracking-wide">
              REAL-TIME SPEED MONITOR
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {liveMetrics.isStreaming && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
              STREAMING LIVE
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isMinimized ? 'Expand Monitor' : 'Minimize Monitor'}
          >
            {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Performance Monitor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collapsed State Bar */}
      {isMinimized ? (
        <div className="px-3.5 py-2 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              TTFT:{' '}
              <span className={getTtftColor(activeTtft)}>
                {activeTtft !== null ? `${activeTtft}ms` : '--'}
              </span>
            </span>
            <span className="text-slate-400">
              Speed:{' '}
              <span className={getTpsColor(activeTps)}>
                {activeTps !== null ? `${activeTps} t/s` : '--'}
              </span>
            </span>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="text-[10px] text-indigo-400 hover:underline"
          >
            Details
          </button>
        </div>
      ) : (
        <div className="p-3.5 space-y-3">
          {/* Main Key Latency Gauges */}
          <div className="grid grid-cols-3 gap-2">
            {/* TTFT Gauge */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-medium mb-1">
                <span>TTFT</span>
                <Clock className="w-3 h-3 text-cyan-400" />
              </div>
              <div className={`text-base font-mono tracking-tight ${getTtftColor(activeTtft)}`}>
                {activeTtft !== null ? `${activeTtft}ms` : 'Ready'}
              </div>
              <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                First token arrival
              </div>
            </div>

            {/* Tokens Per Second Gauge */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-medium mb-1">
                <span>SPEED</span>
                <Gauge className="w-3 h-3 text-emerald-400" />
              </div>
              <div className={`text-base font-mono tracking-tight ${getTpsColor(activeTps)}`}>
                {activeTps !== null ? `${activeTps}` : 'Ready'}
                {activeTps !== null && (
                  <span className="text-[10px] font-sans text-slate-400 ml-0.5">t/s</span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                Tokens / second
              </div>
            </div>

            {/* Total Latency Gauge */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-medium mb-1">
                <span>TOTAL</span>
                <Activity className="w-3 h-3 text-violet-400" />
              </div>
              <div className="text-base font-mono tracking-tight text-slate-200">
                {activeTotalMs !== null ? `${activeTotalMs}ms` : 'Ready'}
              </div>
              <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                Full response time
              </div>
            </div>
          </div>

          {/* Immediate Response Mode Switcher */}
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/30 via-slate-950 to-indigo-950/30 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Zap className="w-4 h-4 fill-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <span>Immediate Response Mode</span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/30 text-emerald-200">
                    &lt; 300ms
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Minimal reasoning latency & direct tokens
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onModeChange(currentMode === 'immediate' ? 'standard' : 'immediate')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                currentMode === 'immediate'
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              {currentMode === 'immediate' ? 'ACTIVE' : 'ENABLE'}
            </button>
          </div>

          {/* Engine & Session Stats */}
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1 font-sans">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                Active Engine:
              </span>
              <span className="text-indigo-300 font-semibold truncate max-w-[180px]">
                {currentMode === 'immediate'
                  ? 'gemini-3.1-flash-lite (Instant)'
                  : currentMode === 'deep-reasoning'
                  ? 'gemini-3.8-flash (Reasoning)'
                  : 'gemini-3.1-flash-lite (Fast)'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span className="font-sans">Fastest TTFT Record:</span>
              <span className="text-emerald-400 font-semibold">
                {sessionStats.fastestTtftMs > 0 ? `${sessionStats.fastestTtftMs}ms` : '--'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span className="font-sans">Session Avg Speed:</span>
              <span className="text-cyan-300">
                {sessionStats.avgTokensPerSec > 0 ? `${sessionStats.avgTokensPerSec} t/s` : '--'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span className="font-sans">Total Session Queries:</span>
              <span className="text-slate-200">{sessionStats.totalResponses}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
