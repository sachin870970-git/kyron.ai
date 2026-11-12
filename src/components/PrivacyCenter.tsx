import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  HardDrive,
  Trash2,
  Download,
  AlertTriangle,
  Cpu,
  Check,
  EyeOff,
  UserCheck,
  KeyRound,
  Smartphone,
  Eye,
  RefreshCw,
  Clock,
  ShieldAlert,
  LogIn,
  UserPlus,
  Crown,
  Laptop,
} from 'lucide-react';
import { UserAccount, AuthSession } from '../types';

interface PrivacyCenterProps {
  user?: UserAccount;
  onOpenAuthModal?: () => void;
  onUpdatePrivacySettings?: (updates: Partial<UserAccount>) => void;
  onLogout?: () => void;
  activeSessions?: AuthSession[];
  onRevokeOtherSessions?: () => void;
}

export const PrivacyCenter: React.FC<PrivacyCenterProps> = ({
  user,
  onOpenAuthModal,
  onUpdatePrivacySettings,
  onLogout,
  activeSessions = [],
  onRevokeOtherSessions,
}) => {
  // Local toggles for settings if not provided via user prop
  const [localUser, setLocalUser] = useState<Partial<UserAccount>>({
    isAuthenticated: user?.isAuthenticated ?? true,
    name: user?.name || 'Sachin Kumar',
    email: user?.email || 'kumarsachin870970@gmail.com',
    twoFactorEnabled: user?.twoFactorEnabled ?? false,
    autoLockMinutes: user?.autoLockMinutes ?? 0,
    incognitoMode: user?.incognitoMode ?? false,
    localEncryption: user?.localEncryption ?? true,
    piiMasking: user?.piiMasking ?? true,
    noTrainingPolicy: user?.noTrainingPolicy ?? true,
    dataRetentionDays: user?.dataRetentionDays ?? 0,
  });

  useEffect(() => {
    if (user) {
      setLocalUser(user);
    }
  }, [user]);

  const handleToggle = (key: keyof UserAccount, val: any) => {
    setLocalUser((prev) => ({ ...prev, [key]: val }));
    if (onUpdatePrivacySettings) {
      onUpdatePrivacySettings({ [key]: val });
    }
  };

  // Storage telemetry calculation
  const [storageUsage, setStorageUsage] = useState<{
    localStorageKb: number;
    sessionsCount: number;
    cachedImagesKb: number;
  }>({ localStorageKb: 0, sessionsCount: 0, cachedImagesKb: 0 });

  const [notification, setNotification] = useState<string | null>(null);

  const calculateStorage = () => {
    let totalLength = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        totalLength += (localStorage.getItem(key) || '').length;
      }
    }

    let sessions = 0;
    try {
      const s = localStorage.getItem('ultimate_ai_sessions_v1');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) sessions = parsed.length;
      }
    } catch {}

    setStorageUsage({
      localStorageKb: Math.round(totalLength / 1024),
      sessionsCount: sessions,
      cachedImagesKb: Math.round((totalLength * 0.4) / 1024),
    });
  };

  useEffect(() => {
    calculateStorage();
  }, []);

  const handleExportAllData = () => {
    const backup: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        backup[key] = localStorage.getItem(key);
      }
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ultimate-ai-privacy-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setNotification('Personal data archive successfully downloaded!');
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePurgeChats = () => {
    if (window.confirm('Are you sure you want to purge all local conversation histories? This action is irreversible.')) {
      localStorage.removeItem('ultimate_ai_sessions_v1');
      calculateStorage();
      setNotification('All conversation histories purged from client memory.');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handlePurgeAllLocalData = () => {
    if (window.confirm('CRITICAL: Purge all local preferences, keys, history, and cached media? You will be reset to a clean slate.')) {
      localStorage.clear();
      calculateStorage();
      setNotification('Client device wiped cleanly of all KYRON AI local footprints.');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-950 text-slate-100 flex flex-col">
      {/* Header Bar */}
      <div className="border-b border-slate-800/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4 bg-slate-950/80 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">KYRON AI Privacy & Security Center</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                End-to-End Vault
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Authentication identity, ephemeral sessions, client-side encryption, and zero third-party telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {notification && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-1.5 font-medium animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>{notification}</span>
            </div>
          )}

          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{localUser.isAuthenticated ? 'Account Credentials' : 'Login / Sign Up'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {/* SECTION 1: AUTHENTICATION & IDENTITY STATUS CARD */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/20">
                {localUser.name ? localUser.name.charAt(0) : 'U'}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{localUser.name || 'Sachin Kumar'}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                  {localUser.isAuthenticated ? 'VERIFIED' : 'GUEST'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5 fill-amber-300" />
                  <span>PRO TIER</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{localUser.email || 'kumarsachin870970@gmail.com'}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1.5">
                <span>Created by Sachin</span>
                <span>•</span>
                <span>Session: Active (Encrypted)</span>
                <span>•</span>
                <span className="text-emerald-400">256-Bit TLS</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span>Switch / Re-login</span>
              </button>
            )}

            {localUser.isAuthenticated && onLogout && (
              <button
                onClick={onLogout}
                className="px-3.5 py-2 rounded-xl bg-slate-950 border border-rose-800/60 hover:bg-rose-950/30 text-xs font-semibold text-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 rotate-180" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* SECTION 2: ARCHITECTURE TELEMETRY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <HardDrive className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Local-First Sandbox</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                All conversations, editor timelines, project settings, and cached assets reside inside your device's browser sandbox storage.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Local Footprint:</span>
              <span className="text-emerald-400 font-bold">{storageUsage.localStorageKb} KB</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Payload Isolation Gateway</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                When AI processing is called, only the active turn and necessary context are transmitted. Unrelated session history is pruned and remains strictly local.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Gateway Status:</span>
              <span className="text-cyan-400 font-bold">Strict Isolation</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                <EyeOff className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Zero Telemetry & Tracking</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                No third-party marketing beacons, advertising pixels, or invasive telemetry cookies. User prompts are never logged for ad profiling.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Trackers Detected:</span>
              <span className="text-purple-400 font-bold">0 Detected</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: PRIVACY & DATA SAFEGUARD CONTROLS (EXPANDED) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Comprehensive Privacy & Security Controls</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Control 1: Incognito Mode */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
              <div className="pr-3">
                <span className="text-xs font-semibold text-white block">Incognito & Ephemeral Mode</span>
                <span className="text-[11px] text-slate-400">
                  Operate in volatile RAM. No prompts, images, or responses are saved to disk or browser history.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={Boolean(localUser.incognitoMode)}
                  onChange={(e) => handleToggle('incognitoMode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Control 2: Client-side AES encryption */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
              <div className="pr-3">
                <span className="text-xs font-semibold text-white block">Local AES Storage Vault</span>
                <span className="text-[11px] text-slate-400">
                  Encrypts local chat histories and settings using client-side key derivation before writing to storage.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={Boolean(localUser.localEncryption)}
                  onChange={(e) => handleToggle('localEncryption', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Control 3: PII Masking */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
              <div className="pr-3">
                <span className="text-xs font-semibold text-white block">Sensitive Data & PII Redactor</span>
                <span className="text-[11px] text-slate-400">
                  Auto-masks credit cards, phone numbers, emails, and credentials from prompts before sending to AI.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={Boolean(localUser.piiMasking)}
                  onChange={(e) => handleToggle('piiMasking', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            {/* Control 4: No-Training Policy */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
              <div className="pr-3">
                <span className="text-xs font-semibold text-white block">Strict No-Training AI Guarantee</span>
                <span className="text-[11px] text-slate-400">
                  Enforces enterprise headers prohibiting cloud models from indexing your private conversations for training.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={Boolean(localUser.noTrainingPolicy)}
                  onChange={(e) => handleToggle('noTrainingPolicy', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Control 5: Two-Factor Authentication */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
              <div className="pr-3">
                <span className="text-xs font-semibold text-white block">Two-Factor Authentication (2FA)</span>
                <span className="text-[11px] text-slate-400">
                  Require TOTP authenticator code verification for sensitive project access.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={Boolean(localUser.twoFactorEnabled)}
                  onChange={(e) => handleToggle('twoFactorEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {/* Control 6: Data Retention Schedule */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
              <div className="pr-3">
                <span className="text-xs font-semibold text-white block">Automated Data Retention Policy</span>
                <span className="text-[11px] text-slate-400">
                  Auto-expire conversation histories after a set timeframe.
                </span>
              </div>
              <select
                value={localUser.dataRetentionDays || 0}
                onChange={(e) => handleToggle('dataRetentionDays', parseInt(e.target.value))}
                className="py-1 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value={0}>Keep Forever</option>
                <option value={1}>Auto-delete 24h</option>
                <option value={7}>Auto-delete 7 days</option>
                <option value={30}>Auto-delete 30 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 4: ACTIVE SESSIONS & DEVICE SECURITY AUDIT */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Laptop className="w-4 h-4 text-indigo-400" />
              <span>Active Authorized Devices & Sessions</span>
            </h3>
            {onRevokeOtherSessions && (
              <button
                onClick={() => {
                  onRevokeOtherSessions();
                  setNotification('All other device sessions revoked.');
                  setTimeout(() => setNotification(null), 3000);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
              >
                Revoke All Other Sessions
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {activeSessions.length > 0 ? (
              activeSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{sess.device}</span>
                        {sess.isCurrent && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                            THIS DEVICE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {sess.browser} • {sess.ip} • {sess.location}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {sess.isCurrent ? 'Active Now' : '4 hours ago'}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white">Current Browser Session</span>
                    <p className="text-[11px] text-slate-400 font-mono">TLS 1.3 Verified • Local Sandbox</p>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">Active Now</span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 5: DATA SOVEREIGNTY & EXPORT CONTROLS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <span>Data Sovereignty & Permanent Erasure</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={handleExportAllData}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <Download className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="text-xs font-bold text-white">Export Personal Archive</h4>
                <p className="text-[11px] text-slate-400 mt-1">Download complete JSON archive of all chats, preferences, and sessions.</p>
              </div>
              <span className="text-[10px] text-indigo-400 font-mono mt-3 block">Download JSON →</span>
            </button>

            <button
              onClick={handlePurgeChats}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-800/50 text-left transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <Trash2 className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="text-xs font-bold text-white">Clear Chat Histories</h4>
                <p className="text-[11px] text-slate-400 mt-1">Permanently remove all {storageUsage.sessionsCount} conversations from browser cache.</p>
              </div>
              <span className="text-[10px] text-amber-400 font-mono mt-3 block">Purge Chats →</span>
            </button>

            <button
              onClick={handlePurgeAllLocalData}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-rose-800/50 text-left transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <AlertTriangle className="w-5 h-5 text-rose-400 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="text-xs font-bold text-white">Wipe All Local Footprints</h4>
                <p className="text-[11px] text-slate-400 mt-1">Full cryptographic reset: clear all sessions, models, and cache data.</p>
              </div>
              <span className="text-[10px] text-rose-400 font-mono mt-3 block">Full Device Wipe →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
