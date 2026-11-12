export type AIMode =
  | 'immediate'
  | 'standard'
  | 'deep-reasoning'
  | 'research'
  | 'code'
  | 'image'
  | 'video'
  | 'video-editor'
  | 'writing'
  | 'study'
  | 'business'
  | 'data'
  | 'creative';

export type WorkspaceTab =
  | 'chat'
  | 'image-studio'
  | 'video-studio'
  | 'video-editor'
  | 'multiverse'
  | 'scientific-engine'
  | 'ai-agents'
  | 'my-projects'
  | 'privacy-center';

export interface Attachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  data: string; // base64 or data URL
}

export interface Citation {
  title: string;
  url: string;
  domain: string;
  snippet?: string;
}

export interface Artifact {
  id: string;
  type: 'code' | 'html' | 'markdown' | 'table';
  title: string;
  language?: string;
  content: string;
}

export interface GeneratedImageMeta {
  imageUrl: string;
  prompt: string;
  aspectRatio: string;
  style?: string;
  quality?: string;
  seed?: number;
}

export interface LatencyMetrics {
  ttftMs: number;
  totalMs: number;
  tokensPerSec?: number;
}

export interface DualWorkResponse {
  hardWork: string;
  smartWork: string;
  detectedTopic?: string;
}

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  placement: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  opacity: number;
  style: 'subtle' | 'visible' | 'glow';
  fontSize: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  mode?: AIMode;
  attachments?: Attachment[];
  citations?: Citation[];
  artifacts?: Artifact[];
  imageOutput?: GeneratedImageMeta;
  isStreaming?: boolean;
  error?: string;
  latency?: LatencyMetrics;
  metrics?: LatencyMetrics;
  dualWork?: DualWorkResponse;
  caption?: {
    text: string;
    language: 'english' | 'hindi' | 'hinglish';
    promptLanguage?: 'english' | 'hinglish' | 'hindi';
  };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  mode: AIMode;
  customSystemPrompt?: string;
  isPinned?: boolean;
}

export interface UserSettings {
  defaultMode: AIMode;
  theme: 'dark' | 'light' | 'system' | 'midnight';
  voice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' | 'Aoede';
  temperature: number;
  customSystemPrompt: string;
  preferredModel?: string;
  language?: string;
  autoSpeak?: boolean;
  speechSpeed?: number;
  contextTurnLimit?: number;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'user' | 'pro';
  plan: PlanTier;
  isAuthenticated: boolean;
  twoFactorEnabled: boolean;
  autoLockMinutes: number; // 0 = disabled, 5, 15, 30
  incognitoMode: boolean;
  localEncryption: boolean;
  piiMasking: boolean;
  noTrainingPolicy: boolean;
  dataRetentionDays: number; // 0 = permanent, 1, 7, 30
  createdAt: number;
  lastLoginAt: number;
  sessionToken?: string;
}

export interface AuthSession {
  id: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  lastActiveAt: number;
  isCurrent: boolean;
}

// Subscription & Billing Types
export type PlanTier = 'free' | 'basic' | 'pro' | 'ultra' | 'ultra-max' | 'enterprise';
export type BillingInterval = 'monthly' | 'yearly';

export interface PlanLimits {
  dailyMessages: number;
  dailyImages: number;
  videoGenerations: number;
  maxFileUploadMb: number;
  allow4k: boolean;
  allowResearchMode: boolean;
  priorityProcessing: boolean;
}

export interface SubscriptionState {
  plan: PlanTier;
  interval: BillingInterval;
  status: 'active' | 'canceled' | 'trialing';
  renewalDate: string;
  dailyMessagesUsed: number;
  imageGenerationsUsed: number;
  videoGenerationsUsed: number;
}

export interface PaymentTransaction {
  id: string;
  date: string;
  amount: number;
  plan: PlanTier;
  interval: BillingInterval;
  invoiceNumber: string;
  status: 'succeeded' | 'refunded';
}

export interface AdminConfig {
  freeDailyMessages: number;
  freeDailyImages: number;
  proPriceMonthly: number;
  proPriceYearly: number;
  proDailyMessages: number;
  proDailyImages: number;
  ultraPriceMonthly: number;
  ultraPriceYearly: number;
  ultraDailyMessages: number;
  ultraDailyImages: number;
  activeModelOverride: string;
  maintenanceMode: boolean;
  watermarkConfig: WatermarkConfig;
}

// Image Studio Types
export interface GeneratedImageItem {
  id: string;
  url: string;
  prompt: string;
  enhancedPrompt?: string;
  negativePrompt?: string;
  cameraSettings?: string;
  style: string;
  aspectRatio: string;
  quality: string;
  width?: number;
  height?: number;
  seed: number;
  engine?: string;
  createdAt: number;
  isFavorite?: boolean;
  isUpscaled?: boolean;
  originalUrl?: string;
}

// Video Studio & Editor Types
export interface VideoStoryboardScene {
  sceneIndex: number;
  duration: number;
  description: string;
  subtitle: string;
  cameraMotion: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'orbit' | 'tilt-up' | 'dolly-in';
  visualParticles: string;
  subject: string;
  imageUrl?: string | null;
}

export interface VideoQualityScorecard {
  promptAdherence: number;
  temporalConsistency: number;
  sharpness: number;
  visualSharpness?: number;
  motionFluidity: number;
  overallRating: string;
  inspectionPassed: boolean;
}

export interface VideoStoryboard {
  title: string;
  mood: string;
  colorPalette: {
    background: string;
    primary: string;
    accent: string;
    text: string;
  };
  audioCue: string;
  scenes: VideoStoryboardScene[];
  qualityScorecard?: VideoQualityScorecard;
}

export interface GeneratedVideoClip {
  id: string;
  title: string;
  videoUrl: string;
  duration: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
  style: string;
  prompt: string;
  enhancedPrompt?: string;
  cameraMovement?: string;
  motionIntensity?: string;
  resolution?: string;
  qualityScorecard?: VideoQualityScorecard;
  storyboard?: VideoStoryboard;
  createdAt: number;
}

export interface SubtitleCue {
  id: string;
  start: number;
  end: number;
  text: string;
}

export interface TextOverlay {
  id: string;
  text: string;
  position: 'top' | 'center' | 'bottom';
  color: string;
  fontSize: number;
  start: number;
  end: number;
}

export interface VideoTrackClip {
  id: string;
  type: 'video' | 'audio' | 'text' | 'image';
  title: string;
  start: number;
  duration: number;
  color?: string;
  src?: string;
  volume?: number;
  content?: string;
}

export interface VideoEditorState {
  trimStart: number;
  trimEnd: number;
  filter: 'none' | 'cinematic' | 'cyberpunk' | 'vhs' | 'noir' | 'vintage' | 'matrix' | 'warm';
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  vignette: number;
  subtitles: SubtitleCue[];
  textOverlays: TextOverlay[];
  tracks: VideoTrackClip[];
}

export interface MultiverseAgentResult {
  model: string;
  profile: {
    name: string;
    role: string;
    color: string;
    badge: string;
    model: string;
  };
  status: 'success' | 'error';
  content: string;
  latencyMs: number;
  wordCount: number;
  estimatedTokens: number;
  error?: string;
  timestamp: number;
}

export interface MultiverseCouncilResponse {
  success: boolean;
  prompt: string;
  mode: 'compare' | 'debate' | 'collaborate' | 'consensus';
  totalDurationMs: number;
  agents: MultiverseAgentResult[];
  arbiter: {
    recommendedBestModel: string;
    evaluationSummary: string;
    masterSynthesis: string;
  };
}
