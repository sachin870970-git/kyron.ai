import React, { useState, useEffect } from 'react';
import {
  Plus,
  MessageSquare,
  Search,
  Pin,
  Trash2,
  Settings,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Crown,
  ShieldAlert,
  Image as ImageIcon,
  Film,
  Scissors,
  Orbit,
  Calculator,
  Lock,
  Cpu,
  Globe,
  Code,
  PenTool,
  BookOpen,
  Edit2,
  Zap,
  Layers,
  Activity,
} from 'lucide-react';
import { KyronLogo } from './KyronLogo';
import { AIMode, ChatSession, WorkspaceTab } from '../types';
import { filterChatSessions } from '../utils/ai-helpers';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: (mode?: AIMode) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  currentMode: AIMode;
  onModeSelect: (mode: AIMode) => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  activeWorkspaceTab?: WorkspaceTab;
  onSelectWorkspaceTab?: (tab: WorkspaceTab) => void;
  userPlan?: string;
  onOpenSubscription?: () => void;
  onOpenAdmin?: () => void;
  dailyQuotaUsed?: number;
  dailyQuotaLimit?: number;
}

const AI_STUDIO_TOOLS: {
  id: WorkspaceTab;
  label: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}[] = [
  {
    id: 'image-studio',
    label: 'Image Studio',
    description: '4K Diffusion, Styles & Inpainting',
    icon: <ImageIcon className="w-4 h-4 text-rose-400" />,
    badge: '4K',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  {
    id: 'video-studio',
    label: 'Video Studio',
    description: 'Cinematic Camera Vectors',
    icon: <Film className="w-4 h-4 text-purple-400" />,
    badge: 'HD',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  {
    id: 'video-editor',
    label: 'Video Editor',
    description: 'Timeline, Trim & Subtitles',
    icon: <Scissors className="w-4 h-4 text-pink-400" />,
  },
  {
    id: 'multiverse',
    label: 'Multiverse Simulator',
    description: '3D Parallel Cosmos Engine',
    icon: <Orbit className="w-4 h-4 text-cyan-400" />,
    badge: '3D',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  {
    id: 'scientific-engine',
    label: 'Scientific Engine',
    description: 'ISA Physics, Heat & Live Telemetry',
    icon: <Calculator className="w-4 h-4 text-emerald-400" />,
    badge: 'ISA',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'privacy-center',
    label: 'Privacy Vault',
    description: 'Local-First Zero Data Exposure',
    icon: <Lock className="w-4 h-4 text-amber-400" />,
  },
];

const COGNITIVE_MODES: { id: AIMode; label: string; icon: React.ReactNode }[] = [
  { id: 'immediate', label: 'Ultra-Fast', icon: <Zap className="w-3.5 h-3.5 text-emerald-400" /> },
  { id: 'deep-reasoning', label: 'Reasoning', icon: <Cpu className="w-3.5 h-3.5 text-violet-400" /> },
  { id: 'research', label: 'Web Research', icon: <Globe className="w-3.5 h-3.5 text-sky-400" /> },
  { id: 'code', label: 'Coding', icon: <Code className="w-3.5 h-3.5 text-amber-400" /> },
  { id: 'writing', label: 'Prose', icon: <PenTool className="w-3.5 h-3.5 text-fuchsia-400" /> },
  { id: 'study', label: 'Socratic Tutor', icon: <BookOpen className="w-3.5 h-3.5 text-blue-400" /> },
];

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onTogglePin,
  currentMode,
  onModeSelect,
  onOpenSettings,
  isOpen,
  onToggleOpen,
  activeWorkspaceTab = 'chat',
  onSelectWorkspaceTab,
  userPlan = 'pro',
  onOpenSubscription,
  onOpenAdmin,
  dailyQuotaUsed = 12,
  dailyQuotaLimit = 20,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Expandable AI Tools state with localStorage persistence
  const [isAiToolsExpanded, setIsAiToolsExpanded] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('ultimate_ai_tools_expanded');
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleAiTools = () => {
    setIsAiToolsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ultimate_ai_tools_expanded', String(next));
      } catch {}
      return next;
    });
  };

  const filtered = filterChatSessions(sessions, searchQuery);
  const pinnedSessions = filtered.filter((s) => s.isPinned);
  const regularSessions = filtered.filter((s) => !s.isPinned);

  const startEditing = (s: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(s.id);
    setEditingTitle(s.title);
  };

  const saveEditing = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingTitle.trim()) {
      onRenameSession(id, editingTitle.trim());
    }
    setEditingSessionId(null);
  };

  const handleToolClick = (toolId: WorkspaceTab) => {
    if (onSelectWorkspaceTab) {
      onSelectWorkspaceTab(toolId);
    }
    // Auto-close on mobile screen
    if (window.innerWidth < 768) {
      onToggleOpen();
    }
  };

  const handleSessionClick = (id: string) => {
    onSelectSession(id);
    if (onSelectWorkspaceTab) {
      onSelectWorkspaceTab('chat');
    }
    if (window.innerWidth < 768) {
      onToggleOpen();
    }
  };

  // Render individual session item
  const renderSessionItem = (session: ChatSession) => {
    const isActive = session.id === activeSessionId && activeWorkspaceTab === 'chat';
    const isEditing = editingSessionId === session.id;

    return (
      <div
        key={session.id}
        onClick={() => !isEditing && handleSessionClick(session.id)}
        className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-left cursor-pointer transition-all ${
          isActive
            ? 'bg-indigo-600/20 text-white border border-indigo-500/40 shadow-sm'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MessageSquare
            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
              isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
            }`}
          />
          {isEditing ? (
            <form onSubmit={(e) => saveEditing(session.id, e)} className="flex-1 min-w-0">
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => saveEditing(session.id)}
                autoFocus
                className="w-full bg-slate-900 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
              />
            </form>
          ) : (
            <span className="text-xs truncate font-medium">{session.title || 'Untitled Session'}</span>
          )}
        </div>

        {/* Hover Action Controls */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(session.id);
            }}
            className={`p-1 rounded hover:bg-slate-800 ${
              session.isPinned ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
            title={session.isPinned ? 'Unpin' : 'Pin to top'}
          >
            <Pin className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => startEditing(session, e)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            title="Rename"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSession(session.id);
            }}
            className="p-1 rounded hover:bg-rose-950/50 text-slate-400 hover:text-rose-400"
            title="Delete chat"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  // Compact Rail View on Desktop when collapsed
  if (!isOpen) {
    return (
      <div className="hidden md:flex flex-col items-center py-4 px-2 w-16 bg-slate-950 border-r border-slate-800/80 shrink-0 justify-between select-none">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onToggleOpen}
            aria-label="Expand sidebar"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNewChat(currentMode)}
            aria-label="Start new chat"
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
            title="New Conversation"
          >
            <Plus className="w-4 h-4" />
          </button>

          <div className="w-8 h-px bg-slate-800/80 my-1" />

          {/* Quick studio shortcuts in rail */}
          <button
            onClick={() => handleToolClick('chat')}
            className={`p-2.5 rounded-xl transition-colors ${
              activeWorkspaceTab === 'chat' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Chat Assistant"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToolClick('image-studio')}
            className={`p-2.5 rounded-xl transition-colors ${
              activeWorkspaceTab === 'image-studio' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Image Studio"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToolClick('video-studio')}
            className={`p-2.5 rounded-xl transition-colors ${
              activeWorkspaceTab === 'video-studio' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Video Studio"
          >
            <Film className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2">
          {onOpenSubscription && (
            <button
              onClick={onOpenSubscription}
              aria-label="Subscription"
              className="p-2.5 text-amber-400 hover:text-amber-300 rounded-xl hover:bg-slate-900 transition-colors"
              title="Subscription Plan"
            >
              <Crown className="w-4 h-4 fill-amber-400" />
            </button>
          )}
          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
        onClick={onToggleOpen}
        aria-hidden="true"
      />

      <aside
        aria-label="Main navigation sidebar"
        className="fixed md:static inset-y-0 left-0 w-72 lg:w-80 h-full bg-slate-950 border-r border-slate-800/80 flex flex-col shrink-0 select-none z-50 shadow-2xl md:shadow-none animate-in slide-in-from-left duration-200"
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <KyronLogo size={34} animated={true} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-wider bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent font-sans">
                  KYRON AI
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  CORE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Celestial Intelligence Hub</p>
            </div>
          </div>
          <button
            onClick={onToggleOpen}
            aria-label="Collapse sidebar"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* SECTION A: New Chat Button */}
        <div className="p-3 pb-2 shrink-0">
          <button
            onClick={() => {
              onNewChat(currentMode);
              if (onSelectWorkspaceTab) onSelectWorkspaceTab('chat');
              if (window.innerWidth < 768) onToggleOpen();
            }}
            className="w-full flex items-center justify-between py-2 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </div>
            <kbd className="hidden sm:inline-block text-[10px] font-mono bg-indigo-700/60 px-1.5 py-0.5 rounded text-indigo-200">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* SECTION C: Expandable AI Tools Menu (ONE Single Accordion Menu) */}
        <div className="px-3 py-1 shrink-0">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden">
            <button
              onClick={toggleAiTools}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>AI Tools & Studios</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                  {AI_STUDIO_TOOLS.length}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                {isAiToolsExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </div>
            </button>

            {/* Collapsible Submenu */}
            {isAiToolsExpanded && (
              <div className="p-1.5 pt-0 space-y-0.5 border-t border-slate-800/60 bg-slate-950/60 animate-in fade-in duration-150">
                {AI_STUDIO_TOOLS.map((tool) => {
                  const isActive = activeWorkspaceTab === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleToolClick(tool.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-800 text-white font-medium border border-indigo-500/40'
                          : 'text-slate-300 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0">{tool.icon}</span>
                        <div className="truncate">
                          <p className="text-xs font-medium leading-none">{tool.label}</p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{tool.description}</p>
                        </div>
                      </div>
                      {tool.badge && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold ${
                            tool.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {tool.badge}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Inline Cognitive Mode Selector */}
                <div className="pt-2 mt-1 border-t border-slate-800/60 px-1 pb-1">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Cognitive Mode
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {COGNITIVE_MODES.map((m) => {
                      const isModeActive = currentMode === m.id && activeWorkspaceTab === 'chat';
                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            onModeSelect(m.id);
                            if (onSelectWorkspaceTab) onSelectWorkspaceTab('chat');
                          }}
                          className={`flex items-center gap-1.5 p-1 rounded-md text-[11px] transition-colors cursor-pointer ${
                            isModeActive
                              ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 font-medium'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          <span className="shrink-0">{m.icon}</span>
                          <span className="truncate">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION B: Chat History (Search & Conversations) */}
        <div className="px-3 pt-2 pb-1 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat history..."
              aria-label="Search conversation history"
              className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
            />
          </div>
        </div>

        {/* Scrollable Chat Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-3 min-h-0">
          {/* Pinned Chats */}
          {pinnedSessions.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold text-amber-400/90 uppercase tracking-wider">
                <Pin className="w-3 h-3" />
                <span>Pinned ({pinnedSessions.length})</span>
              </div>
              <div className="space-y-0.5 mt-0.5">
                {pinnedSessions.map((session) => renderSessionItem(session))}
              </div>
            </div>
          )}

          {/* Recent Chats */}
          <div>
            <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Recent Chats ({regularSessions.length})</span>
            </div>
            <div className="space-y-0.5 mt-0.5">
              {regularSessions.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-slate-500">
                  {searchQuery ? 'No matching conversations' : 'No chats yet. Start a new conversation!'}
                </div>
              ) : (
                regularSessions.map((session) => renderSessionItem(session))
              )}
            </div>
          </div>
        </div>

        {/* SECTION D & E: User Profile, Daily Quotas & Settings */}
        <footer className="p-3 border-t border-slate-800/80 bg-slate-950/95 shrink-0 flex flex-col gap-2">
          {/* Daily Quota Indicator Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Activity className="w-3 h-3 text-indigo-400" />
                <span>Daily Quota</span>
              </span>
              <span className="font-mono font-semibold text-slate-200">
                {userPlan === 'ultra' ? 'Unlimited' : `${dailyQuotaUsed} / ${dailyQuotaLimit}`}
              </span>
            </div>
            {userPlan !== 'ultra' && (
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all rounded-full ${
                    dailyQuotaUsed >= dailyQuotaLimit
                      ? 'bg-rose-500'
                      : dailyQuotaUsed / dailyQuotaLimit > 0.75
                      ? 'bg-amber-500'
                      : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, (dailyQuotaUsed / dailyQuotaLimit) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* User Plan Card */}
          {onOpenSubscription && (
            <button
              onClick={onOpenSubscription}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-500/30 hover:border-amber-500/60 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Crown className="w-3.5 h-3.5 fill-amber-400" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white capitalize">{userPlan} Plan Active</div>
                  <div className="text-[10px] text-slate-400">High-speed priority models</div>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                {userPlan === 'free' ? 'UPGRADE' : 'MANAGE'}
              </span>
            </button>
          )}

          {/* Bottom Settings & Admin Bar */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Settings</span>
            </button>

            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                <span>Admin</span>
              </button>
            )}
          </div>

          {/* Creator Attribution */}
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Created by <strong className="text-slate-200 font-semibold">Sachin</strong></span>
            </span>
            <span className="text-[10px] text-indigo-300 font-mono font-medium">Gemini AI Engine</span>
          </div>
        </footer>
      </aside>
    </>
  );
};
