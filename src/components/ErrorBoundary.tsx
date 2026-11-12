import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Trash2, Download, Copy, Check, Terminal, Sparkles } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      copied: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CRITICAL: KYRON.AI caught an unhandled React error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleSafeMode = () => {
    try {
      // Keep existing sessions but verify and sanitize array
      const stored = localStorage.getItem('ultimate_ai_sessions_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map((s) => ({
            id: s.id || `session-${Date.now()}`,
            title: s.title || 'Recovered Chat',
            createdAt: s.createdAt || Date.now(),
            updatedAt: Date.now(),
            messages: Array.isArray(s.messages)
              ? s.messages.filter((m: any) => m && typeof m.content === 'string')
              : [],
            mode: s.mode || 'immediate',
          }));
          localStorage.setItem('ultimate_ai_sessions_v2', JSON.stringify(sanitized));
        }
      }
    } catch (e) {
      console.error('Failed to sanitize sessions in Safe Mode:', e);
    }
    window.location.reload();
  };

  private handleFactoryReset = () => {
    if (window.confirm('Reset local storage cache? This will create a fresh session.')) {
      try {
        localStorage.removeItem('ultimate_ai_sessions_v2');
        localStorage.removeItem('ultimate_ai_settings_v2');
        localStorage.removeItem('ultimate_ai_perf_monitor_v2');
      } catch (e) {
        console.error('Error clearing storage:', e);
      }
      window.location.reload();
    }
  };

  private handleExportBackup = () => {
    try {
      const data: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ultimate_ai_')) {
          data[key] = localStorage.getItem(key);
        }
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ultimate-ai-emergency-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Unable to export backup: ' + (e as Error).message);
    }
  };

  private handleCopyDiagnostic = () => {
    const text = `KYRON.AI Error Diagnostic:\nError: ${this.state.error?.message}\nStack: ${this.state.error?.stack}\nComponentStack: ${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(text);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans select-none">
          <div className="w-full max-w-2xl bg-slate-900 border border-rose-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            {/* Top Glow Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500" />

            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    KYRON.AI Resilient Guard
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Self-Healing Active</span>
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Application Protected from Crash
                </h1>
                <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                  An unexpected error was intercepted (e.g., during complex prompt parsing or rendering). Your raw data is safe in local storage.
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 mb-6 text-xs font-mono text-rose-300 overflow-x-auto max-h-40">
              <div className="flex items-center gap-2 text-slate-400 mb-1 border-b border-slate-800 pb-1">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                <span>Exception details</span>
              </div>
              <p className="break-words">{this.state.error?.message || 'Unknown runtime error'}</p>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Resume Session (Try Again)</span>
              </button>

              <button
                onClick={this.handleSafeMode}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Safe Mode Auto-Repair</span>
              </button>

              <button
                onClick={this.handleExportBackup}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Emergency Backup JSON</span>
              </button>

              <button
                onClick={this.handleFactoryReset}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 text-xs font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cache & Reset Safely</span>
              </button>
            </div>

            {/* Diagnostic Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-4">
              <span>KYRON.AI Engine v2.4 • Zero-Loss Architecture</span>
              <button
                onClick={this.handleCopyDiagnostic}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied Log</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Diagnostic</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
