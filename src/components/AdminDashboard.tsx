import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Save,
  Check,
  X,
  Sliders,
  Cpu,
  Layers,
  Database,
  RefreshCw,
  Zap,
  Activity,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { AdminConfig } from '../types';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  config: AdminConfig;
  onSaveConfig: (newConfig: AdminConfig) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<AdminConfig>(config);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [quotaStats, setQuotaStats] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;
    fetch('/api/quota/stats')
      .then((r) => r.json())
      .then((data) => {
        if (!isCancelled) setQuotaStats(data);
      })
      .catch(() => {});
    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Top Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/20">
              <ShieldAlert className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">System Admin Console</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                  MASTER CONTROLS
                </span>
              </div>
              <p className="text-xs text-slate-400">Configure global quotas, pricing tiers, AI model overrides & service status</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 flex flex-col gap-6">
          {/* Live System Metrics Quick Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Server State</span>
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Operational
              </span>
              <span className="text-[10px] text-slate-500">Google GenAI Active</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Requests Today</span>
              <span className="text-sm font-bold text-indigo-400 font-mono mt-1">
                {quotaStats?.metrics?.todayRequests ?? 12}
              </span>
              <span className="text-[10px] text-slate-500">Cache saved: {quotaStats?.metrics?.cacheHits ?? 0}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">429 Rate-Limits</span>
              <span className="text-sm font-bold text-amber-400 font-mono mt-1">
                {quotaStats?.metrics?.rateLimit429Errors ?? 0}
              </span>
              <span className="text-[10px] text-slate-500">Auto-fallback active</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Quota Reset</span>
              <span className="text-xs font-bold text-cyan-400 font-mono mt-1">
                {quotaStats?.resetEstimate ?? 'Midnight UTC'}
              </span>
              <span className="text-[10px] text-slate-500">24-hour cycle</span>
            </div>
          </div>

          {/* Pricing Controls */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Subscription Pricing Controls</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <h4 className="text-xs font-bold text-indigo-300">Pro Plan Pricing</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Monthly ($/mo)</label>
                    <input
                      type="number"
                      value={formData.proPriceMonthly}
                      onChange={(e) => setFormData({ ...formData, proPriceMonthly: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Yearly ($/yr)</label>
                    <input
                      type="number"
                      value={formData.proPriceYearly}
                      onChange={(e) => setFormData({ ...formData, proPriceYearly: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <h4 className="text-xs font-bold text-purple-300">Ultra Plan Pricing</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Monthly ($/mo)</label>
                    <input
                      type="number"
                      value={formData.ultraPriceMonthly}
                      onChange={(e) => setFormData({ ...formData, ultraPriceMonthly: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Yearly ($/yr)</label>
                    <input
                      type="number"
                      value={formData.ultraPriceYearly}
                      onChange={(e) => setFormData({ ...formData, ultraPriceYearly: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Quota Limits Configuration */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Plan Usage & Quota Limits</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Free Tier Limits */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-300 block">Free Tier Limits</span>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Daily Messages</label>
                  <input
                    type="number"
                    value={formData.freeDailyMessages}
                    onChange={(e) => setFormData({ ...formData, freeDailyMessages: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Daily Images</label>
                  <input
                    type="number"
                    value={formData.freeDailyImages}
                    onChange={(e) => setFormData({ ...formData, freeDailyImages: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              {/* Pro Tier Limits */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-indigo-300 block">Pro Tier Limits</span>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Daily Messages</label>
                  <input
                    type="number"
                    value={formData.proDailyMessages}
                    onChange={(e) => setFormData({ ...formData, proDailyMessages: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Daily Images</label>
                  <input
                    type="number"
                    value={formData.proDailyImages}
                    onChange={(e) => setFormData({ ...formData, proDailyImages: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              {/* Ultra Tier Limits */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-purple-300 block">Ultra Tier Limits</span>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Daily Messages (-1 for Unl)</label>
                  <input
                    type="number"
                    value={formData.ultraDailyMessages}
                    onChange={(e) => setFormData({ ...formData, ultraDailyMessages: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Daily Images</label>
                  <input
                    type="number"
                    value={formData.ultraDailyImages}
                    onChange={(e) => setFormData({ ...formData, ultraDailyImages: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI Model Routing Override */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Engine Model Cascade</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite (Recommended)', desc: 'Ultra-low latency (~680ms TTFT)' },
                { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', desc: 'Heavy reasoning & complex analysis' },
                { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite', desc: 'High concurrency baseline' },
              ].map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, activeModelOverride: mod.id })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.activeModelOverride === mod.id
                      ? 'bg-purple-950/40 border-purple-500 text-white ring-1 ring-purple-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-semibold">{mod.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{mod.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* KYRON.AI Brand Watermark Controls */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">KYRON.AI Brand Watermark</h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.watermarkConfig?.enabled ?? true}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      watermarkConfig: {
                        ...(formData.watermarkConfig || {
                          text: 'KYRON.AI',
                          placement: 'bottom-right',
                          opacity: 0.85,
                          style: 'subtle',
                          fontSize: 16,
                        }),
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                />
                <span>Enable Watermark</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Brand Text</label>
                <input
                  type="text"
                  value={formData.watermarkConfig?.text || 'KYRON.AI'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      watermarkConfig: {
                        ...(formData.watermarkConfig || {
                          enabled: true,
                          placement: 'bottom-right',
                          opacity: 0.85,
                          style: 'subtle',
                          fontSize: 16,
                        }),
                        text: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Placement</label>
                <select
                  value={formData.watermarkConfig?.placement || 'bottom-right'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      watermarkConfig: {
                        ...(formData.watermarkConfig || {
                          enabled: true,
                          text: 'KYRON.AI',
                          opacity: 0.85,
                          style: 'subtle',
                          fontSize: 16,
                        }),
                        placement: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="bottom-right">Bottom Right (Standard)</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                  <option value="center">Center Subtle</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Style</label>
                <select
                  value={formData.watermarkConfig?.style || 'subtle'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      watermarkConfig: {
                        ...(formData.watermarkConfig || {
                          enabled: true,
                          text: 'KYRON.AI',
                          placement: 'bottom-right',
                          opacity: 0.85,
                          fontSize: 16,
                        }),
                        style: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="subtle">Subtle Minimalist</option>
                  <option value="visible">Prominent Studio</option>
                  <option value="glow">Neon Glow Brand</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Opacity ({Math.round((formData.watermarkConfig?.opacity ?? 0.85) * 100)}%)</label>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={formData.watermarkConfig?.opacity ?? 0.85}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      watermarkConfig: {
                        ...(formData.watermarkConfig || {
                          enabled: true,
                          text: 'KYRON.AI',
                          placement: 'bottom-right',
                          style: 'subtle',
                          fontSize: 16,
                        }),
                        opacity: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {saveSuccess ? (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-semibold">
                <Check className="w-4 h-4" />
                <span>Configuration saved successfully!</span>
              </span>
            ) : (
              <span className="text-xs text-slate-500">Changes take effect immediately for all active users.</span>
            )}

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/20 transition-all hover:scale-[1.01]"
            >
              <Save className="w-4 h-4" />
              <span>Save System Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
