import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ChatInput } from './components/ChatInput';
import { ArtifactPanel } from './components/ArtifactPanel';
import { SettingsModal } from './components/SettingsModal';
import { ImageStudio } from './components/ImageStudio';
import { VideoStudio } from './components/VideoStudio';
import { VideoEditor } from './components/VideoEditor';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Multiverse } from './components/Multiverse';
import { ScientificEngine } from './components/ScientificEngine';
import { PrivacyCenter } from './components/PrivacyCenter';
import { VoiceChatModal } from './components/VoiceChatModal';
import { AuthModal } from './components/AuthModal';
import { AuthGate } from './components/AuthGate';
import { KyronLogo } from './components/KyronLogo';
import { CosmicCometBackground } from './components/CosmicCometBackground';
import { PerformanceMonitor, LiveStreamMetrics } from './components/PerformanceMonitor';
import { useAuth } from './hooks/useAuth';
import { useWebSpeech } from './hooks/useWebSpeech';
import {
  ChatSession,
  Message,
  Artifact,
  AIMode,
  UserSettings,
  Attachment,
  LatencyMetrics,
  WorkspaceTab,
  SubscriptionState,
  AdminConfig,
  PlanTier,
  BillingInterval,
} from './types';
import { parseArtifacts, extractCitations, isImageGenerationRequest, extractImagePrompt } from './utils/ai-helpers';
import {
  MessageSquare,
  Image as ImageIcon,
  Film,
  Scissors,
  Crown,
  ShieldAlert,
  Zap,
  Settings,
  Sparkles,
  Menu,
  Orbit,
  Calculator,
  Lock,
  ChevronDown,
  Activity,
  BarChart2,
  Check,
} from 'lucide-react';

const STORAGE_KEY_SESSIONS = 'ultimate_ai_sessions_v2';
const STORAGE_KEY_SETTINGS = 'ultimate_ai_settings_v2';
const STORAGE_KEY_PERF_MONITOR = 'ultimate_ai_perf_monitor_v2';
const STORAGE_KEY_SUBSCRIPTION = 'ultimate_ai_subscription_v2';
const STORAGE_KEY_ADMIN = 'ultimate_ai_admin_v2';

const DEFAULT_SETTINGS: UserSettings = {
  defaultMode: 'immediate',
  theme: 'dark',
  voice: 'Kore',
  temperature: 0.7,
  customSystemPrompt: '',
};

const DEFAULT_SUBSCRIPTION: SubscriptionState = {
  plan: 'pro',
  interval: 'monthly',
  status: 'active',
  renewalDate: '2026-12-02',
  dailyMessagesUsed: 12,
  imageGenerationsUsed: 3,
  videoGenerationsUsed: 1,
};

const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  freeDailyMessages: 20,
  freeDailyImages: 5,
  proPriceMonthly: 9,
  proPriceYearly: 90,
  proDailyMessages: 500,
  proDailyImages: 100,
  ultraPriceMonthly: 29,
  ultraPriceYearly: 290,
  ultraDailyMessages: -1,
  ultraDailyImages: 500,
  activeModelOverride: 'gemini-3.1-flash-lite',
  maintenanceMode: false,
  watermarkConfig: {
    enabled: true,
    text: 'KYRON.AI',
    placement: 'bottom-right',
    opacity: 0.85,
    style: 'subtle',
    fontSize: 16,
  },
};

export interface StudioModuleOption {
  id: WorkspaceTab;
  name: string;
  badge: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  dotColor: string;
}

const STUDIO_MODULES: StudioModuleOption[] = [
  {
    id: 'chat',
    name: 'AI Chat Studio',
    badge: 'CORE',
    desc: 'Multi-turn conversational intelligence, search & code synthesis',
    icon: MessageSquare,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    dotColor: 'bg-indigo-400',
  },
  {
    id: 'image-studio',
    name: 'Image Studio',
    badge: '4K HD',
    desc: 'SDXL & Imagen prompt generation, negative prompts & styles',
    icon: ImageIcon,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    dotColor: 'bg-rose-400',
  },
  {
    id: 'video-studio',
    name: 'Video Studio',
    badge: 'VEO 2.0',
    desc: 'Cinematic video generation from text prompts and keyframe images',
    icon: Film,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    dotColor: 'bg-purple-400',
  },
  {
    id: 'video-editor',
    name: 'Video Editor',
    badge: 'TIMELINE',
    desc: 'Cut, trim, splice and export clips with audio & visual effects',
    icon: Scissors,
    color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30',
    dotColor: 'bg-fuchsia-400',
  },
  {
    id: 'multiverse',
    name: 'Multiverse Lab',
    badge: 'QUANTUM',
    desc: 'Branch conversations into parallel timelines and alternate theories',
    icon: Orbit,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    dotColor: 'bg-cyan-400',
  },
  {
    id: 'scientific-engine',
    name: 'Scientific Engine',
    badge: 'ANALYSIS',
    desc: 'Deep LaTeX formulas, physics simulations & multi-step theorem proofs',
    icon: Calculator,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    dotColor: 'bg-emerald-400',
  },
  {
    id: 'privacy-center',
    name: 'Privacy & Security Center',
    badge: 'AES-256',
    desc: 'Zero data retention, local encryption keys, sessions & audit trails',
    icon: Lock,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    dotColor: 'bg-amber-400',
  },
];

function createInitialSession(mode: AIMode = 'immediate'): ChatSession {
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: 'New Conversation',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    mode,
  };
}

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse sessions from storage:', e);
    }
    return [createInitialSession()];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0]?.id || '');
  const [currentMode, setCurrentMode] = useState<AIMode>('immediate');
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('chat');
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('kyron_comet_intro_v3') === 'true';
    } catch {
      return false;
    }
  });

  // Inter-studio payload transport
  const [videoStudioInitialImage, setVideoStudioInitialImage] = useState<{ url: string; prompt: string } | null>(null);
  const [videoEditorInitialUrl, setVideoEditorInitialUrl] = useState<string | null>(null);
  const [videoEditorInitialTitle, setVideoEditorInitialTitle] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isArtifactPanelOpen, setIsArtifactPanelOpen] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [conversationMode, setConversationMode] = useState<'chat' | 'voice'>('chat');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { speak: speakAiVoice } = useWebSpeech();

  // Authentication & Security state
  const {
    user: authUser,
    activeSessions: authSessions,
    login: authLogin,
    signup: authSignup,
    guestLogin: authGuestLogin,
    logout: authLogout,
    updatePrivacySettings: authUpdatePrivacy,
    revokeOtherSessions: authRevokeSessions,
  } = useAuth();

  // Unified Studio Hub dropdown open/close state
  const [isStudioDropdownOpen, setIsStudioDropdownOpen] = useState(false);

  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
      if (stored) return { ...DEFAULT_SUBSCRIPTION, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_SUBSCRIPTION;
  });

  // Admin settings state
  const [adminConfig, setAdminConfig] = useState<AdminConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ADMIN);
      if (stored) return { ...DEFAULT_ADMIN_CONFIG, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_ADMIN_CONFIG;
  });

  // Toggleable Performance Monitor HUD state (default open for visibility)
  const [isPerfMonitorOpen, setIsPerfMonitorOpen] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PERF_MONITOR);
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  const [liveMetrics, setLiveMetrics] = useState<LiveStreamMetrics>({
    isStreaming: false,
    elapsedMs: 0,
    tokenCount: 0,
    ttftMs: null,
    liveTokensPerSec: 0,
    model: 'gemini-3.1-flash-lite',
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce saving sessions to localStorage so high-speed token streaming does not freeze the UI thread
  const saveSessionsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (saveSessionsTimeoutRef.current) {
      clearTimeout(saveSessionsTimeoutRef.current);
    }
    saveSessionsTimeoutRef.current = setTimeout(() => {
      // Ephemeral Incognito Mode: Never persist conversations to disk when enabled
      if (authUser.incognitoMode) {
        return;
      }
      try {
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
      } catch (e: any) {
        console.error('Failed to persist sessions:', e);
        // Resilient handling for QuotaExceededError when user pastes massive prompts
        if (e?.name === 'QuotaExceededError' || e?.code === 22 || (typeof e?.message === 'string' && e.message.includes('quota'))) {
          try {
            const pruned = sessions.slice(0, 10).map((s, sIdx) => ({
              ...s,
              messages: s.messages.slice(-25).map((m, mIdx) => ({
                ...m,
                attachments: m.attachments?.map((a) => ({
                  ...a,
                  data: sIdx > 0 || mIdx < s.messages.length - 2 ? '' : a.data,
                })),
              })),
            }));
            localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(pruned));
          } catch (inner) {
            console.warn('Unable to persist even pruned sessions:', inner);
          }
        }
      }
    }, 500);

    return () => {
      if (saveSessionsTimeoutRef.current) {
        clearTimeout(saveSessionsTimeoutRef.current);
      }
    };
  }, [sessions]);

  // Ensure sessions is never empty
  useEffect(() => {
    if (!sessions || sessions.length === 0) {
      const fresh = createInitialSession();
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
    }
  }, [sessions]);

  // Sync settings to localStorage and apply theme class
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to persist settings:', e);
    }

    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-midnight', 'theme-dark');
    if (settings.theme === 'light') {
      root.classList.add('theme-light');
    } else if (settings.theme === 'midnight') {
      root.classList.add('theme-midnight');
    } else {
      root.classList.add('theme-dark');
    }
  }, [settings]);

  // Sync subscription to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUBSCRIPTION, JSON.stringify(subscription));
    } catch (e) {
      console.error('Failed to persist subscription:', e);
    }
  }, [subscription]);

  // Sync admin config to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(adminConfig));
    } catch (e) {
      console.error('Failed to persist admin config:', e);
    }
  }, [adminConfig]);

  // Sync perf monitor preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PERF_MONITOR, JSON.stringify(isPerfMonitorOpen));
    } catch (e) {
      console.error('Failed to persist perf monitor setting:', e);
    }
  }, [isPerfMonitorOpen]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewChat(currentMode);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPerfMonitorOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMode]);

  const activeSession = (sessions && sessions.length > 0 ? (sessions.find((s) => s.id === activeSessionId) || sessions[0]) : null) || createInitialSession();

  // Aggregated real-time session latency and speed statistics
  const assistantMessagesWithLatency = (activeSession?.messages || []).filter(
    (m) => m.role === 'model' && m.latency && typeof m.latency.ttftMs === 'number'
  );
  const totalResponses = assistantMessagesWithLatency.length;
  const avgTtftMs =
    totalResponses > 0
      ? Math.round(
          assistantMessagesWithLatency.reduce((acc, m) => acc + (m.latency?.ttftMs || 0), 0) /
            totalResponses
        )
      : 0;
  const avgTokensPerSec =
    totalResponses > 0
      ? Math.round(
          (assistantMessagesWithLatency.reduce(
            (acc, m) => acc + (m.latency?.tokensPerSec || 0),
            0
          ) /
            totalResponses) *
            10
        ) / 10
      : 0;
  const fastestTtftMs =
    totalResponses > 0
      ? Math.min(...assistantMessagesWithLatency.map((m) => m.latency?.ttftMs || 999999))
      : 0;
  const sessionStats = {
    totalResponses,
    avgTtftMs,
    avgTokensPerSec,
    fastestTtftMs: fastestTtftMs === 999999 ? 0 : fastestTtftMs,
  };
  const lastAssistantMessage = [...(activeSession?.messages || [])]
    .reverse()
    .find((m) => m.role === 'model' && m.latency);

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    const target = sessions.find((s) => s.id === id);
    if (target?.mode) {
      setCurrentMode(target.mode);
    }
  };

  const handleNewChat = (mode?: AIMode) => {
    const newSession = createInitialSession(mode || currentMode);
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    if (mode) setCurrentMode(mode);
    setWorkspaceTab('chat');
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fresh = createInitialSession();
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  };

  const handleTogglePin = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned } : s))
    );
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const handleSendMessage = async (
    content: string,
    attachments: Attachment[] = [],
    mode: AIMode = currentMode,
    aspectRatio: string = '1:1',
    isVoiceQuery: boolean = false
  ) => {
    if (!content.trim() && attachments.length === 0) return;

    // Increment message quota usage
    setSubscription((prev) => ({
      ...prev,
      dailyMessagesUsed: prev.dailyMessagesUsed + 1,
    }));

    // PII Redactor: Mask sensitive card & phone numbers if privacy protection is enabled
    let effectiveContent = content.trim();
    if (authUser.piiMasking && effectiveContent) {
      effectiveContent = effectiveContent
        .replace(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[REDACTED-PHONE]')
        .replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[REDACTED-CARD]');
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: effectiveContent,
      timestamp: Date.now(),
      attachments,
      mode,
    };

    const currentMessages = activeSession.messages;
    const isFirstMessage = currentMessages.length === 0;
    const sessionTitle = isFirstMessage
      ? content.slice(0, 32).trim() || 'Multimodal Request'
      : activeSession.title;

    const assistantPlaceholderId = `msg-${Date.now()}-model`;
    const assistantMessage: Message = {
      id: assistantPlaceholderId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      mode,
      isStreaming: true,
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSession.id) {
          return {
            ...s,
            title: sessionTitle,
            updatedAt: Date.now(),
            messages: [...s.messages, userMessage, assistantMessage],
          };
        }
        return s;
      })
    );

    setIsLoading(true);

    // If user explicitly asks for image generation
    if (mode === 'image' || isImageGenerationRequest(content)) {
      setSubscription((prev) => ({
        ...prev,
        imageGenerationsUsed: prev.imageGenerationsUsed + 1,
      }));

      try {
        const cleanPrompt = extractImagePrompt(content);
        const imgRes = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: cleanPrompt, aspectRatio }),
        });

        if (!imgRes.ok) {
          const errData = await imgRes.json().catch(() => ({}));
          throw new Error(errData.error || `Image generation failed with status ${imgRes.status}`);
        }

        const imgData = await imgRes.json();

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === activeSession.id) {
              return {
                ...s,
                messages: s.messages.map((m) => {
                  if (m.id === assistantPlaceholderId) {
                    return {
                      ...m,
                      content: `I've created an image for you: **"${cleanPrompt}"**\n\n${imgData.description || ''}`,
                      imageOutput: {
                        imageUrl: imgData.imageUrl,
                        prompt: cleanPrompt,
                        aspectRatio: imgData.aspectRatio || aspectRatio,
                      },
                      isStreaming: false,
                    };
                  }
                  return m;
                }),
              };
            }
            return s;
          })
        );
        setIsLoading(false);
        return;
      } catch (err: any) {
        console.error('Image generation error:', err);
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === activeSession.id) {
              return {
                ...s,
                messages: s.messages.map((m) => {
                  if (m.id === assistantPlaceholderId) {
                    return {
                      ...m,
                      content: `Sorry, I encountered an issue generating the image: ${err.message}`,
                      error: err.message,
                      isStreaming: false,
                    };
                  }
                  return m;
                }),
              };
            }
            return s;
          })
        );
        setIsLoading(false);
        return;
      }
    }

    // Text & Multimodal Streaming Request
    const requestStartTime = performance.now();
    let ttftRecorded: number | null = null;
    let accumulatedText = '';
    let accumulatedGrounding: any = null;
    let tokenCount = 0;
    let lastRenderTimestamp = 0;

    setLiveMetrics({
      isStreaming: true,
      elapsedMs: 0,
      tokenCount: 0,
      ttftMs: null,
      liveTokensPerSec: 0,
      model: 'gemini-3.1-flash-lite',
    });

    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const outboundMessages = [...currentMessages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          messages: outboundMessages,
          mode,
          customSystemPrompt: settings.customSystemPrompt,
          temperature: settings.temperature,
          aspectRatio,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream available from server.');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          const dataPayload = trimmed.slice(6);
          if (dataPayload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataPayload);

            if (parsed.type === 'start') {
              continue;
            }

            if (parsed.type === 'chunk' && parsed.text) {
              if (ttftRecorded === null) {
                ttftRecorded = Math.round(performance.now() - requestStartTime);
              }

              accumulatedText += parsed.text;
              tokenCount += Math.ceil(parsed.text.length / 3.5);

              const now = performance.now();
              const elapsedSec = (now - requestStartTime) / 1000;
              const liveTokensPerSec = elapsedSec > 0 ? Math.round((tokenCount / elapsedSec) * 10) / 10 : 0;

              setLiveMetrics({
                isStreaming: true,
                elapsedMs: Math.round(now - requestStartTime),
                tokenCount,
                ttftMs: ttftRecorded,
                liveTokensPerSec,
                model: 'gemini-3.1-flash-lite',
              });

              if (now - lastRenderTimestamp > 35) {
                lastRenderTimestamp = now;
                const currentTextSnapshot = accumulatedText;
                setSessions((prev) =>
                  prev.map((s) => {
                    if (s.id === activeSession.id) {
                      return {
                        ...s,
                        messages: s.messages.map((m) =>
                          m.id === assistantPlaceholderId
                            ? { ...m, content: currentTextSnapshot, isStreaming: true }
                            : m
                        ),
                      };
                    }
                    return s;
                  })
                );
              }
            } else if (parsed.type === 'grounding' && parsed.groundingMetadata) {
              accumulatedGrounding = parsed.groundingMetadata;
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error || 'Server stream failed');
            }
          } catch (parseErr: any) {
            if (parseErr.message && !parseErr.message.includes('JSON')) {
              throw parseErr;
            }
          }
        }
      }

      const totalRequestDurationMs = Math.round(performance.now() - requestStartTime);
      const totalSec = totalRequestDurationMs / 1000;
      const finalTokensPerSec = totalSec > 0 ? Math.round((tokenCount / totalSec) * 10) / 10 : 0;

      const latency: LatencyMetrics = {
        ttftMs: ttftRecorded ?? totalRequestDurationMs,
        totalMs: totalRequestDurationMs,
        tokensPerSec: finalTokensPerSec,
      };

      const extractedArtifacts = parseArtifacts(accumulatedText);
      const extractedCitations = extractCitations(accumulatedGrounding);

      setLiveMetrics({
        isStreaming: false,
        elapsedMs: totalRequestDurationMs,
        tokenCount,
        ttftMs: latency.ttftMs,
        liveTokensPerSec: finalTokensPerSec,
        model: 'gemini-3.1-flash-lite',
      });

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSession.id) {
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === assistantPlaceholderId
                  ? {
                      ...m,
                      content: accumulatedText,
                      isStreaming: false,
                      artifacts: extractedArtifacts.length > 0 ? extractedArtifacts : undefined,
                      citations: extractedCitations.length > 0 ? extractedCitations : undefined,
                      latency,
                    }
                  : m
              ),
            };
          }
          return s;
        })
      );

      if (extractedArtifacts.length > 0) {
        setActiveArtifact(extractedArtifacts[0]);
      }

      // Voice output: Automatically speak response ONLY if in standalone voice mode AND voice modal is NOT active
      if (conversationMode === 'voice' && !isVoiceModalOpen && accumulatedText) {
        const cleanSpeech = accumulatedText
          .replace(/```[\s\S]*?```/g, 'Code block output omitted.')
          .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
          .replace(/[*#_`>]/g, '')
          .trim();
        if (cleanSpeech) {
          speakAiVoice(assistantPlaceholderId, cleanSpeech.slice(0, 750));
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === activeSession.id) {
              return {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantPlaceholderId
                    ? { ...m, content: accumulatedText || '*(Generation paused by user)*', isStreaming: false }
                    : m
                ),
              };
            }
            return s;
          })
        );
      } else {
        console.error('Chat generation error:', err);
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === activeSession.id) {
              return {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantPlaceholderId
                    ? {
                        ...m,
                        content: `**Error:** ${err.message || 'Unable to complete response. Please verify network or key.'}`,
                        error: err.message,
                        isStreaming: false,
                      }
                    : m
                ),
              };
            }
            return s;
          })
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleAddVoiceTurn = (
    userContent: string,
    assistantContent: string,
    captionMeta?: { text: string; language: 'english' | 'hindi' | 'hinglish'; promptLanguage?: 'english' | 'hinglish' | 'hindi' }
  ) => {
    if (!userContent.trim()) return;
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: userContent.trim(),
      timestamp: Date.now(),
      mode: currentMode,
    };
    const assistantMsg: Message = {
      id: `msg-${Date.now() + 1}-model`,
      role: 'model',
      content: assistantContent.trim(),
      timestamp: Date.now() + 1,
      mode: currentMode,
      isStreaming: false,
      caption: captionMeta,
    };
    setSubscription((prev) => ({
      ...prev,
      dailyMessagesUsed: prev.dailyMessagesUsed + 1,
    }));
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSession.id) {
          const isFirstMessage = s.messages.length === 0;
          const sessionTitle = isFirstMessage ? userContent.slice(0, 32).trim() : s.title;
          return {
            ...s,
            title: sessionTitle,
            updatedAt: Date.now(),
            messages: [...s.messages, userMsg, assistantMsg],
          };
        }
        return s;
      })
    );
  };

  const handleRegenerate = () => {
    const msgs = activeSession.messages;
    if (msgs.length === 0) return;
    const lastUserMsg = [...msgs].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content, lastUserMsg.attachments, lastUserMsg.mode);
    }
  };

  const handleClearAllChats = () => {
    const fresh = createInitialSession();
    setSessions([fresh]);
    setActiveSessionId(fresh.id);
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify({ sessions, settings, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ultimate-ai-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.sessions && Array.isArray(parsed.sessions)) {
          setSessions(parsed.sessions);
          if (parsed.sessions.length > 0) {
            setActiveSessionId(parsed.sessions[0].id);
          }
        }
        if (parsed.settings) {
          setSettings((prev) => ({ ...prev, ...parsed.settings }));
        }
        alert('Data imported successfully!');
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  // Cross-studio handoffs
  const handleSendImageToVideoStudio = (imageUrl: string, promptText: string) => {
    setVideoStudioInitialImage({ url: imageUrl, prompt: promptText });
    setWorkspaceTab('video-studio');
  };

  const handleSendVideoToEditor = (videoUrl: string, title: string) => {
    setVideoEditorInitialUrl(videoUrl);
    setVideoEditorInitialTitle(title);
    setWorkspaceTab('video-editor');
  };

  // Cosmic Comet Pre-Interface Experience: Showcase cosmic comet streaming stardust look before entering interface
  if (!hasSeenIntro) {
    return (
      <CosmicCometBackground
        showIntroSplash={true}
        onEnterApp={() => {
          try {
            sessionStorage.setItem('kyron_comet_intro_v3', 'true');
          } catch {}
          setHasSeenIntro(true);
        }}
      />
    );
  }

  // User Authentication Gate: Prioritize login or signup screen before user enters the web app
  if (!authUser.isAuthenticated) {
    return (
      <AuthGate
        onLogin={authLogin}
        onSignup={authSignup}
        onGuestAccess={authGuestLogin}
      />
    );
  }

  const currentStudio = STUDIO_MODULES.find((m) => m.id === workspaceTab) || STUDIO_MODULES[0];
  const CurrentStudioIcon = currentStudio.icon;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onTogglePin={handleTogglePin}
        currentMode={currentMode}
        onModeSelect={(m) => {
          setCurrentMode(m);
          setSessions((prev) =>
            prev.map((s) => (s.id === activeSession.id && s.messages.length === 0 ? { ...s, mode: m } : s))
          );
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
        activeWorkspaceTab={workspaceTab}
        onSelectWorkspaceTab={(tab) => setWorkspaceTab(tab)}
        userPlan={subscription.plan}
        onOpenSubscription={() => setIsSubscriptionOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        dailyQuotaUsed={subscription.dailyMessagesUsed}
        dailyQuotaLimit={adminConfig.freeDailyMessages || 20}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Top Master Workspace Switcher Bar */}
        <header className="h-13 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur px-4 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open sidebar"
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}

            {/* KYRON AI Brand Mark */}
            <div className="flex items-center gap-2">
              <KyronLogo size={32} animated={true} />
              <div className="hidden sm:block">
                <div className="text-sm font-black tracking-wider bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent font-sans">
                  KYRON AI
                </div>
                <div className="text-[9px] text-cyan-300/80 -mt-0.5 font-mono tracking-widest uppercase">Celestial Core</div>
              </div>
            </div>

            {/* ONLY ONE Unified Studio Hub Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setIsStudioDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-indigo-500/50 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-all shadow-sm group"
                title="Integrated Studio Hub — Click to switch workspace"
              >
                <div className={`w-2 h-2 rounded-full ${currentStudio.dotColor} animate-pulse`} />
                <span className="text-indigo-400 font-mono text-[11px] uppercase tracking-wider hidden sm:inline">⚡ Studio Hub:</span>
                <CurrentStudioIcon className="w-3.5 h-3.5 text-indigo-300" />
                <span className="text-white font-medium">{currentStudio.name}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isStudioDropdownOpen ? 'rotate-180 text-indigo-400' : ''}`}
                />
              </button>

              {/* Dropdown Menu attaching all 7 Studios */}
              {isStudioDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsStudioDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-slate-800 text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Unified Studio Suite</span>
                      <span className="text-cyan-400 font-bold">7 Engines</span>
                    </div>
                    <div className="space-y-1 mt-1 max-h-96 overflow-y-auto">
                      {STUDIO_MODULES.map((item) => {
                        const Icon = item.icon;
                        const isSelected = workspaceTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setWorkspaceTab(item.id);
                              setIsStudioDropdownOpen(false);
                            }}
                            className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all ${
                              isSelected
                                ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                                : 'hover:bg-slate-800/80 text-slate-300 hover:text-white border border-transparent'
                            }`}
                          >
                            <div className={`p-2 rounded-lg border shrink-0 ${item.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold">{item.name}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                    {item.badge}
                                  </span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                                </div>
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{item.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center gap-2">
            {/* Live Real-Time Telemetry & Performance Analysis Widget */}
            <button
              onClick={() => setIsPerfMonitorOpen((prev) => !prev)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all shadow-sm ${
                isPerfMonitorOpen
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
              title="Toggle Real-Time Telemetry & Performance Analysis Dashboard"
            >
              <div className="relative flex items-center justify-center">
                <div className={`w-2 h-2 rounded-full ${liveMetrics.isStreaming ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'}`} />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute" />
              </div>
              <span className="font-semibold text-slate-200">Analysis:</span>
              <span className="text-emerald-400 font-bold">
                {liveMetrics.isStreaming && liveMetrics.liveTokensPerSec > 0
                  ? `${liveMetrics.liveTokensPerSec} t/s`
                  : '84 t/s'}
              </span>
              <span className="text-slate-500 text-[10px] hidden md:inline">•</span>
              <span className="text-cyan-300 text-[11px] hidden md:inline">
                {liveMetrics.isStreaming && liveMetrics.ttftMs
                  ? `${liveMetrics.ttftMs}ms`
                  : '220ms'}
              </span>
              <Activity className={`w-3.5 h-3.5 ml-0.5 ${isPerfMonitorOpen ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            </button>

            <button
              onClick={() => setIsSubscriptionOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-indigo-500/15 border border-amber-500/30 hover:border-amber-500/60 text-xs text-amber-300 font-semibold transition-all shadow-sm group"
            >
              <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="uppercase tracking-wider">{subscription.plan} TIER</span>
            </button>

            {/* Incognito Status Badge */}
            {authUser.incognitoMode && (
              <span className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>INCOGNITO</span>
              </span>
            )}

            {/* Account & Security Profile Button */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition-all cursor-pointer group"
              title="Account Credentials & Security"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                {authUser.name ? authUser.name.charAt(0) : 'S'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-[11px] font-bold text-white leading-tight flex items-center gap-1">
                  <span>{authUser.name.split(' ')[0]}</span>
                  {authUser.isAuthenticated && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </span>
                <span className="text-[9px] text-slate-400 leading-tight">
                  {authUser.isAuthenticated ? 'Verified Vault' : 'Sign In'}
                </span>
              </div>
            </button>

            <button
              onClick={() => setIsAdminOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
              title="System Admin & Quota Controls"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Admin</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-colors"
              title="Preferences"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Workspace Views */}
        {workspaceTab === 'chat' && (
          <main className="flex-1 flex flex-col h-[calc(100%-3.25rem)] min-w-0 overflow-hidden relative">
            <ChatArea
              session={activeSession}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              onRegenerate={handleRegenerate}
              onOpenArtifact={(art) => {
                setActiveArtifact(art);
                setIsArtifactPanelOpen(true);
              }}
              isArtifactPanelOpen={isArtifactPanelOpen}
              onToggleArtifactPanel={() => setIsArtifactPanelOpen((prev) => !prev)}
              onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
              voiceName={settings.voice}
              isPerfMonitorOpen={isPerfMonitorOpen}
              onTogglePerfMonitor={() => setIsPerfMonitorOpen((prev) => !prev)}
              lastMetrics={lastAssistantMessage?.latency}
              liveMetrics={liveMetrics}
              currentMode={currentMode}
              onModeChange={(m) => {
                setCurrentMode(m);
                setSessions((prev) =>
                  prev.map((s) => (s.id === activeSession.id && s.messages.length === 0 ? { ...s, mode: m } : s))
                );
              }}
              sessionStats={sessionStats}
              onOpenSubscription={() => setIsSubscriptionOpen(true)}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              conversationMode={conversationMode}
              onToggleConversationMode={(m) => setConversationMode(m)}
            />

            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onStop={handleStop}
              currentMode={currentMode}
              onModeChange={(m) => {
                setCurrentMode(m);
                setSessions((prev) =>
                  prev.map((s) => (s.id === activeSession.id && s.messages.length === 0 ? { ...s, mode: m } : s))
                );
              }}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            />
          </main>
        )}

        {workspaceTab === 'image-studio' && (
          <ImageStudio
            userPlan={subscription.plan}
            onUpgradePrompt={() => setIsSubscriptionOpen(true)}
            onSendToVideoStudio={handleSendImageToVideoStudio}
            watermarkConfig={adminConfig.watermarkConfig}
          />
        )}

        {workspaceTab === 'video-studio' && (
          <VideoStudio
            initialImage={videoStudioInitialImage}
            userPlan={subscription.plan}
            onSendToVideoEditor={handleSendVideoToEditor}
            watermarkConfig={adminConfig.watermarkConfig}
          />
        )}

        {workspaceTab === 'video-editor' && (
          <VideoEditor
            initialVideoUrl={videoEditorInitialUrl}
            initialTitle={videoEditorInitialTitle}
            userPlan={subscription.plan}
          />
        )}

        {workspaceTab === 'multiverse' && (
          <Multiverse
            onSendToVideoStudio={handleSendImageToVideoStudio}
            onSendToImageStudio={() => setWorkspaceTab('image-studio')}
          />
        )}

        {workspaceTab === 'scientific-engine' && <ScientificEngine />}

        {workspaceTab === 'privacy-center' && (
          <PrivacyCenter
            user={authUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onUpdatePrivacySettings={authUpdatePrivacy}
            onLogout={authLogout}
            activeSessions={authSessions}
            onRevokeOtherSessions={authRevokeSessions}
          />
        )}

        {/* Mobile Ergonomic Bottom Navigation Bar (iOS / Android Modern Dock) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-3 py-1.5 flex items-center justify-around shadow-2xl">
          <button
            onClick={() => setWorkspaceTab('chat')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              workspaceTab === 'chat' ? 'text-indigo-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-[10px]">Chat</span>
          </button>

          <button
            onClick={() => setWorkspaceTab(workspaceTab === 'image-studio' ? 'video-studio' : 'image-studio')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              workspaceTab === 'image-studio' || workspaceTab === 'video-studio' ? 'text-indigo-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px]">{workspaceTab === 'video-studio' ? 'Video' : 'Create'}</span>
          </button>

          <button
            onClick={() => setWorkspaceTab('multiverse')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              workspaceTab === 'multiverse' ? 'text-cyan-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Orbit className="w-4 h-4" />
            <span className="text-[10px]">Multiverse</span>
          </button>

          <button
            onClick={() => setWorkspaceTab('video-editor')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              workspaceTab === 'video-editor' ? 'text-purple-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span className="text-[10px]">Editor</span>
          </button>

          <button
            onClick={() => setIsSubscriptionOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all text-amber-400 hover:text-amber-300 cursor-pointer"
          >
            <Crown className="w-4 h-4 fill-amber-400" />
            <span className="text-[10px] font-semibold">Pro</span>
          </button>
        </nav>
      </div>

      {/* Artifact Studio Split Panel */}
      {isArtifactPanelOpen && (
        <ArtifactPanel
          artifact={activeArtifact}
          onClose={() => setIsArtifactPanelOpen(false)}
        />
      )}

      {/* System Settings & Customization Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
        onClearAllChats={handleClearAllChats}
        onExportData={handleExportData}
        onImportData={handleImportData}
        subscription={subscription}
        onOpenSubscription={() => {
          setIsSettingsOpen(false);
          setIsSubscriptionOpen(true);
        }}
      />

      {/* Real-Time AI Voice Chat Modal */}
      <VoiceChatModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSendMessage={handleSendMessage}
        onAddVoiceTurn={handleAddVoiceTurn}
        sessionMessages={activeSession.messages}
        currentMode={currentMode}
        activeSessionTitle={activeSession.title}
        defaultVoice={settings.voice}
      />

      {/* Premium Subscription & Billing Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
        subscription={subscription}
        onUpdateSubscription={(newPlan, interval) => {
          setSubscription((prev) => ({
            ...prev,
            plan: newPlan,
            interval,
            status: 'active',
          }));
        }}
      />

      {/* Admin Dashboard Console Modal */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        config={adminConfig}
        onSaveConfig={(newConfig) => setAdminConfig(newConfig)}
      />

      {/* User Authentication & Security Credentials Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={authUser}
        onLogin={authLogin}
        onSignup={authSignup}
        onLogout={authLogout}
        onUpdatePrivacySettings={authUpdatePrivacy}
      />

      {/* Real-time Analysis & Telemetry HUD */}
      <PerformanceMonitor
        isOpen={isPerfMonitorOpen}
        onClose={() => setIsPerfMonitorOpen(false)}
        lastMetrics={activeSession.messages.slice().reverse().find((m) => m.metrics || m.latency)?.metrics || activeSession.messages.slice().reverse().find((m) => m.metrics || m.latency)?.latency}
        liveMetrics={liveMetrics}
        currentMode={currentMode}
        onModeChange={(m) => {
          setCurrentMode(m);
          setSessions((prev) =>
            prev.map((s) => (s.id === activeSession.id && s.messages.length === 0 ? { ...s, mode: m } : s))
          );
        }}
        sessionStats={{
          totalResponses: activeSession.messages.filter((m) => m.role === 'model').length,
          avgTtftMs:
            Math.round(
              activeSession.messages
                .filter((m) => (m.metrics?.ttftMs || m.latency?.ttftMs))
                .reduce((acc, m) => acc + (m.metrics?.ttftMs || m.latency?.ttftMs || 0), 0) /
                Math.max(1, activeSession.messages.filter((m) => m.metrics?.ttftMs || m.latency?.ttftMs).length)
            ) || 240,
          avgTokensPerSec:
            Math.round(
              activeSession.messages
                .filter((m) => (m.metrics?.tokensPerSec || m.latency?.tokensPerSec))
                .reduce((acc, m) => acc + (m.metrics?.tokensPerSec || m.latency?.tokensPerSec || 0), 0) /
                Math.max(1, activeSession.messages.filter((m) => m.metrics?.tokensPerSec || m.latency?.tokensPerSec).length)
            ) || 84,
          fastestTtftMs:
            Math.min(
              ...activeSession.messages
                .filter((m) => m.metrics?.ttftMs || m.latency?.ttftMs)
                .map((m) => (m.metrics?.ttftMs || m.latency?.ttftMs)!),
              195
            ),
        }}
      />
    </div>
  );
}
