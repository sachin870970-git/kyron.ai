import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  X,
  Sparkles,
  Settings2,
  ChevronDown,
  Globe,
  Radio,
  Send,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Subtitles,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { AIMode, Attachment } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useWebSpeech } from '../hooks/useWebSpeech';
import { KyronLogo } from './KyronLogo';
import {
  detectPromptLanguage,
  getSubtitleBadgeConfig,
  PromptLanguage,
  SubtitleLanguage,
} from '../utils/language-detector';

interface VoiceChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage?: (content: string, attachments: Attachment[], mode: AIMode) => Promise<void> | void;
  onAddVoiceTurn?: (
    userContent: string,
    assistantContent: string,
    captionMeta?: {
      text: string;
      language: SubtitleLanguage;
      promptLanguage?: PromptLanguage;
    }
  ) => void;
  sessionMessages?: any[];
  currentMode: AIMode;
  activeSessionTitle?: string;
  defaultVoice?: string;
}

const SUPPORTED_LANGUAGES = [
  { code: 'hi-IN', label: 'हिन्दी (Hindi - Natural Indian)', flag: '🇮🇳' },
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { code: 'en-IN', label: 'English (Indian Accent)', flag: '🇮🇳' },
  { code: 'hi-Latn', label: 'Hinglish (हिंग्लिश)', flag: '🇮🇳' },
  { code: 'bn-IN', label: 'বাংলা (Bengali)', flag: '🇮🇳' },
  { code: 'ta-IN', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { code: 'te-IN', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'mr-IN', label: 'मराठी (Marathi)', flag: '🇮🇳' },
  { code: 'gu-IN', label: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
  { code: 'pa-IN', label: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇮🇳' },
  { code: 'ur-IN', label: 'اردو (Urdu)', flag: '🇮🇳' },
  { code: 'es-ES', label: 'Español (Spanish)', flag: '🇪🇸' },
  { code: 'fr-FR', label: 'Français (French)', flag: '🇫🇷' },
  { code: 'de-DE', label: 'Deutsch (German)', flag: '🇩🇪' },
  { code: 'ja-JP', label: '日本語 (Japanese)', flag: '🇯🇵' },
  { code: 'zh-CN', label: '中文 (Chinese)', flag: '🇨🇳' },
  { code: 'ar-SA', label: 'العربية (Arabic)', flag: '🇸🇦' },
];

const VOICE_PERSONAS = [
  { id: 'Kore', label: '1. Natural Female Voice (Kore)', gender: 'Female', desc: 'Gentle, warm, natural human cadence' },
  { id: 'Fenrir', label: '2. Natural Male Voice (Fenrir)', gender: 'Male', desc: 'Deep, resonant, confident articulation' },
  { id: 'Charon', label: '3. Professional Assistant (Charon)', gender: 'Assistant', desc: 'Crisp, authoritative, corporate clarity' },
  { id: 'Puck', label: '4. Expressive Conversational (Puck)', gender: 'Expressive', desc: 'Lively, dynamic, engaging inflection' },
];

interface ConversationTurn {
  role: 'user' | 'model';
  content: string;
  captionText?: string;
  captionLang?: SubtitleLanguage;
  promptLang?: PromptLanguage;
}

export const VoiceChatModal: React.FC<VoiceChatModalProps> = ({
  isOpen,
  onClose,
  onSendMessage,
  onAddVoiceTurn,
  sessionMessages = [],
  currentMode,
  activeSessionTitle,
  defaultVoice = 'Kore',
}) => {
  const [selectedLang, setSelectedLang] = useState('en-IN');
  const [selectedVoicePersona, setSelectedVoicePersona] = useState(defaultVoice);
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isAutoSpeakEnabled, setIsAutoSpeakEnabled] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');

  // Multi-Turn Spoken Conversation History with Caption Metadata
  const [conversationTurns, setConversationTurns] = useState<ConversationTurn[]>([]);

  // Real-time Subtitle & Caption Engine States
  const [isCaptionsEnabled, setIsCaptionsEnabled] = useState(true);
  const [captionFontSize, setCaptionFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [captionMode, setCaptionMode] = useState<SubtitleLanguage | 'auto'>('auto');
  const [detectedPromptLang, setDetectedPromptLang] = useState<PromptLanguage>('english');
  const [activeCaptionLang, setActiveCaptionLang] = useState<SubtitleLanguage>('english');
  const [liveCaptionText, setLiveCaptionText] = useState<string>('');
  const [viewTranscriptMode, setViewTranscriptMode] = useState<'subtitle' | 'spoken'>('subtitle');

  // Synchronize conversation context from active session on open
  useEffect(() => {
    if (isOpen && sessionMessages && sessionMessages.length > 0) {
      const recent: ConversationTurn[] = sessionMessages
        .slice(-10)
        .map((m: any) => ({
          role: (m.role === 'model' || m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
          content: m.content || '',
          captionText: m.caption?.text || m.content || '',
          captionLang: m.caption?.language || 'english',
          promptLang: m.caption?.promptLanguage || 'english',
        }))
        .filter((m: any) => m.content && !m.content.startsWith('Error:'));
      setConversationTurns(recent);
    }
  }, [isOpen, sessionMessages]);

  // Spoken transcription state
  const [liveTranscript, setLiveTranscript] = useState('');
  const [lastUserSpeech, setLastUserSpeech] = useState('');
  const [lastAiResponse, setLastAiResponse] = useState('');
  const [isAiStreaming, setIsAiStreaming] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  // Audio elements & wave canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const isSubmittingRef = useRef<boolean>(false);
  const playbackSessionIdRef = useRef<string | null>(null);

  // Evaluates if spoken utterance has meaningful linguistic content (blocks background noise, clicks, breathing, sighs)
  const isValidUserSpeech = (raw: string): boolean => {
    const trimmed = raw.trim();
    if (!trimmed) return false;
    // Must contain at least 2 alphanumeric or Unicode letters
    const letterCount = (trimmed.match(/[\p{L}\p{N}]/gu) || []).length;
    if (letterCount < 2) return false;
    // Discard isolated non-verbal hesitation fillers or noise artifacts
    if (/^(uh|um|ah|mm|hmm|eh|er|shh|psst|ha|oops|tsk)[.?!]*$/i.test(trimmed)) {
      return false;
    }
    return true;
  };

  // Web Speech speech synthesis
  const { isSupported: isSynthSupported, isSpeaking, speak, stop: stopSpeaking, setRate } = useWebSpeech();

  // Speech Recognition hook
  const {
    isSupported: isSpeechSupported,
    status: speechStatus,
    isListening,
    startListening,
    stopListening,
    error: recognitionError,
    errorDetails,
    audioLevel,
    requestPermission,
  } = useSpeechRecognition({
    lang: selectedLang,
    silenceTimeoutMs: 2200,
    onTranscriptChange: (text) => {
      setLiveTranscript(text);
      if (text.trim()) {
        setCurrentStatus('listening');
        // Live prompt language detection as user speaks
        const detection = detectPromptLanguage(text, selectedLang);
        setDetectedPromptLang(detection.detectedLanguage);
        if (captionMode === 'auto') {
          setActiveCaptionLang(detection.targetSubtitleLanguage);
        }
      }
    },
    onFinalTranscript: (text) => {
      // Echo cancellation & noise gate: Ignore transcript if AI is speaking, streaming, or submitting
      const isHtmlAudioPlaying = audioElementRef.current && !audioElementRef.current.paused && !audioElementRef.current.ended;
      const isCurrentlyEmittingSpeech = isSpeaking || Boolean(isHtmlAudioPlaying) || currentStatus === 'speaking';

      if (isCurrentlyEmittingSpeech || isAiStreaming || isSubmittingRef.current) {
        return;
      }

      if (isValidUserSpeech(text)) {
        handleSendSpokenPrompt(text);
      }
    },
  });

  // Keep speech speed in sync
  useEffect(() => {
    setRate(speechSpeed);
  }, [speechSpeed, setRate]);

  const [hasMicStream, setHasMicStream] = useState<boolean>(false);

  // Function to initialize audio analyser on explicit user gesture or mount
  const initAudioAnalyser = useCallback(async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setHasMicStream(true);
      setMicError(null);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
    } catch (err: any) {
      console.warn('Microphone stream access unavailable for waveform:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('Microphone permission required for live voice conversation. Click "Enable Microphone" below or allow access in your browser address bar.');
      }
    }
  }, []);

  // Attempt non-intrusive stream setup on modal open
  useEffect(() => {
    if (!isOpen) return;

    // Only attempt if permission is already granted; avoids jarring prompts before user gesture
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'microphone' as any })
        .then((result) => {
          if (result.state === 'granted') {
            initAudioAnalyser();
          }
        })
        .catch(() => {});
    }

    return () => {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [isOpen, initAudioAnalyser]);

  // Waveform render loop
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      phase += 0.05;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      let energy = 0.2; // idle pulse
      if (analyserRef.current && isListening && !isMuted) {
        const buffer = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(buffer);
        const sum = buffer.reduce((a, b) => a + b, 0);
        energy = Math.max(0.2, (sum / buffer.length / 255) * 2.2);
      } else if (isSpeaking) {
        energy = 0.8 + Math.sin(phase * 4) * 0.4;
      }

      // Draw futuristic multi-wave sound bars
      const bars = 28;
      const barWidth = 6;
      const gap = (width - bars * barWidth) / (bars + 1);

      for (let i = 0; i < bars; i++) {
        const x = gap + i * (barWidth + gap);
        const normalizedIdx = (i - bars / 2) / (bars / 2);
        const bellCurve = Math.exp(-normalizedIdx * normalizedIdx * 2.5);
        const barHeight = Math.max(
          8,
          Math.sin(phase * 3 + i * 0.4) * 20 * energy * bellCurve + 45 * energy * bellCurve
        );
        const y = (height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isSpeaking) {
          gradient.addColorStop(0, '#818cf8'); // Indigo
          gradient.addColorStop(0.5, '#c084fc'); // Purple
          gradient.addColorStop(1, '#f472b6'); // Pink
        } else if (isListening) {
          gradient.addColorStop(0, '#34d399'); // Emerald
          gradient.addColorStop(0.5, '#38bdf8'); // Sky
          gradient.addColorStop(1, '#6366f1'); // Indigo
        } else {
          gradient.addColorStop(0, '#475569');
          gradient.addColorStop(1, '#334155');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, isListening, isSpeaking, isMuted]);

  // Check permission state and handle lifecycle on modal open/close
  useEffect(() => {
    if (isOpen) {
      if (typeof navigator !== 'undefined' && (navigator as any).permissions?.query) {
        (navigator as any).permissions
          .query({ name: 'microphone' })
          .then((res: any) => {
            if (res.state === 'granted') {
              startListening('');
              setCurrentStatus('listening');
            } else {
              setCurrentStatus('idle');
            }
          })
          .catch(() => {
            setCurrentStatus('idle');
          });
      } else {
        setCurrentStatus('idle');
      }
    } else {
      playbackSessionIdRef.current = null;
      stopListening();
      stopSpeaking();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.onended = null;
        audioElementRef.current.onerror = null;
        audioElementRef.current.src = '';
        audioElementRef.current = null;
      }
      setCurrentStatus('idle');
      setLiveTranscript('');
      setLiveCaptionText('');
      setMicError(null);
    }
  }, [isOpen, startListening, stopListening, stopSpeaking]);

  // High-fidelity multilingual TTS player with session isolation, echo protection, and duplicate prevention
  const playAudioSpeech = useCallback(
    async (rawText: string, langToUse: string, onEnd?: () => void) => {
      // Generate a unique playback session token
      const sessionId = `playback-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      playbackSessionIdRef.current = sessionId;

      // Pause microphone immediately while speaker plays to avoid acoustic self-talk feedback
      stopListening();

      // Cleanly halt and nullify any existing playback
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.onended = null;
        audioElementRef.current.onerror = null;
        audioElementRef.current.src = '';
        audioElementRef.current = null;
      }
      stopSpeaking();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      // Clean speech text
      const cleanSpeech = rawText
        .replace(/```[\s\S]*?```/g, 'Here is the generated output.')
        .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
        .replace(/[*#_`>]/g, '')
        .trim();

      if (!cleanSpeech) {
        if (playbackSessionIdRef.current === sessionId) {
          playbackSessionIdRef.current = null;
          setCurrentStatus('idle');
          onEnd?.();
        }
        return;
      }

      // Detect Indian Hindi / Devanagari
      const hasDevanagari = /[\u0900-\u097F]/.test(cleanSpeech);
      const isHindi = hasDevanagari || langToUse.startsWith('hi');
      const resolvedLang = isHindi ? 'hi-IN' : langToUse;

      try {
        const ttsResponse = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanSpeech.slice(0, 850),
            voiceName: selectedVoicePersona,
            lang: resolvedLang,
            speed: speechSpeed,
          }),
        });

        // Abort if the user interrupted or triggered a newer turn during fetch
        if (playbackSessionIdRef.current !== sessionId) return;

        if (ttsResponse.ok) {
          const ttsData = await ttsResponse.json();
          if (ttsData.audioUrl && playbackSessionIdRef.current === sessionId) {
            const audio = new Audio(ttsData.audioUrl);
            audio.playbackRate = speechSpeed;
            audioElementRef.current = audio;

            audio.onended = () => {
              if (playbackSessionIdRef.current !== sessionId) return;
              audioElementRef.current = null;
              playbackSessionIdRef.current = null;
              setCurrentStatus('idle');
              // 350ms acoustic delay so speaker echo completely dissipates before mic opens
              setTimeout(() => {
                onEnd?.();
              }, 350);
            };

            audio.onerror = () => {
              if (playbackSessionIdRef.current !== sessionId) return;
              audioElementRef.current = null;
              // Fallback to Web Speech API only for this exact session
              speak(sessionId, cleanSpeech.slice(0, 750), resolvedLang, () => {
                if (playbackSessionIdRef.current !== sessionId) return;
                playbackSessionIdRef.current = null;
                setTimeout(() => onEnd?.(), 350);
              });
            };

            await audio.play();
            return;
          }
        }
      } catch (ttsErr) {
        console.warn('Backend TTS request error, falling back to Web Speech synthesis:', ttsErr);
      }

      // Verify session validity before fallback
      if (playbackSessionIdRef.current !== sessionId) return;

      // Fallback: Browser Web Speech API
      speak(sessionId, cleanSpeech.slice(0, 750), resolvedLang, () => {
        if (playbackSessionIdRef.current !== sessionId) return;
        playbackSessionIdRef.current = null;
        setTimeout(() => onEnd?.(), 350);
      });
    },
    [selectedVoicePersona, speechSpeed, speak, stopSpeaking, stopListening]
  );

  // Handle submitting the spoken voice query
  const handleSendSpokenPrompt = useCallback(
    async (textToSend: string) => {
      const query = textToSend.trim();
      if (!query || isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      // Stop any existing audio synthesis or playback immediately so it never overlaps
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
      }
      stopSpeaking();
      stopListening();

      // Language detection for User Prompt & Target Subtitle
      // Rules:
      // 1. English prompt -> English caption
      // 2. Hinglish prompt -> English caption ('agar user\'s language hinglish hoo toh caption english')
      // 3. Hindi prompt -> Hindi caption ('agar user\'s language hindi hoo toh caption hindi ho')
      const detection = detectPromptLanguage(query, selectedLang);
      const promptLang = detection.detectedLanguage;
      const targetSubLang = captionMode === 'auto' ? detection.targetSubtitleLanguage : captionMode;

      setDetectedPromptLang(promptLang);
      setActiveCaptionLang(targetSubLang);
      setLastUserSpeech(query);
      setLiveTranscript('');
      setLiveCaptionText('');
      setLastAiResponse('');
      setCurrentStatus('processing');
      setIsAiStreaming(true);

      // Effective language for TTS voice articulation
      let effectiveLang = selectedLang;
      if (promptLang === 'hindi' || promptLang === 'hinglish') {
        effectiveLang = 'hi-IN';
      } else if (promptLang === 'english') {
        effectiveLang = 'en-US';
      }

      try {
        // Construct full conversation context so follow-up voice questions are properly understood
        const outboundMessages = conversationTurns.map((turn) => ({
          role: turn.role,
          content: turn.content,
        }));
        outboundMessages.push({ role: 'user' as const, content: query });

        // Post to backend streaming API with isVoice flag
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
          body: JSON.stringify({
            messages: outboundMessages,
            mode: currentMode,
            isVoice: true,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Server error');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No stream');

        const decoder = new TextDecoder();
        let buffer = '';
        let accumulated = '';
        let receivedServerCaption = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'chunk' && parsed.text) {
                accumulated += parsed.text;
                setLastAiResponse(accumulated);

                // For English, Hindi, or Hinglish prompts where text already matches target language, stream live to subtitle
                if (targetSubLang === 'hindi' || targetSubLang === 'hinglish' || promptLang === 'english') {
                  setLiveCaptionText(accumulated);
                }
              } else if (parsed.type === 'caption') {
                if (parsed.text) {
                  receivedServerCaption = parsed.text;
                  setLiveCaptionText(parsed.text);
                  if (parsed.captionLanguage) {
                    setActiveCaptionLang(parsed.captionLanguage);
                  }
                  if (parsed.detectedLanguage) {
                    setDetectedPromptLang(parsed.detectedLanguage);
                  }
                }
              } else if (parsed.type === 'error') {
                throw new Error(parsed.error);
              }
            } catch {}
          }
        }

        setIsAiStreaming(false);

        // Fallback: If prompt was Hinglish and text contains Devanagari, convert to clean Romanized Hinglish
        let finalCaptionText = receivedServerCaption;
        if (!finalCaptionText) {
          if (promptLang === 'hinglish' && /[\u0900-\u097F]/.test(accumulated)) {
            try {
              const subRes = await fetch('/api/voice-subtitle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  spokenText: accumulated,
                  userPrompt: query,
                  targetLanguage: 'hinglish',
                }),
              });
              if (subRes.ok) {
                const subData = await subRes.json();
                if (subData.captionText) {
                  finalCaptionText = subData.captionText;
                  setLiveCaptionText(subData.captionText);
                }
              }
            } catch (transErr) {
              console.warn('Subtitle fallback translation failed:', transErr);
            }
          }
        }

        if (!finalCaptionText) {
          finalCaptionText = accumulated;
          setLiveCaptionText(accumulated);
        }

        // Update local conversation context with subtitle metadata
        setConversationTurns((prev) => [
          ...prev,
          { role: 'user', content: query, promptLang },
          {
            role: 'model',
            content: accumulated,
            captionText: finalCaptionText,
            captionLang: targetSubLang,
            promptLang,
          },
        ]);

        // Sync to parent session history with caption metadata
        if (onAddVoiceTurn) {
          onAddVoiceTurn(query, accumulated, {
            text: finalCaptionText,
            language: targetSubLang,
            promptLanguage: promptLang,
          });
        } else if (onSendMessage) {
          onSendMessage(query, [], currentMode);
        }

        // Voice output: Speak the AI answer naturally
        if (isAutoSpeakEnabled && accumulated.trim()) {
          setCurrentStatus('speaking');
          playAudioSpeech(accumulated, effectiveLang, () => {
            // Automatically restart listening for next user turn once AI finishes speaking
            if (isOpen && !isMuted) {
              setCurrentStatus('listening');
              startListening('');
            } else {
              setCurrentStatus('idle');
            }
          });
        } else {
          if (isOpen && !isMuted) {
            setCurrentStatus('listening');
            startListening('');
          } else {
            setCurrentStatus('idle');
          }
        }
      } catch (err: any) {
        console.error('Voice query error:', err);
        setLastAiResponse(`Error: ${err.message || 'Could not complete request'}`);
        setCurrentStatus('idle');
        setIsAiStreaming(false);
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [
      captionMode,
      conversationTurns,
      currentMode,
      isAutoSpeakEnabled,
      isMuted,
      isOpen,
      onAddVoiceTurn,
      onSendMessage,
      playAudioSpeech,
      selectedLang,
      startListening,
      stopListening,
      stopSpeaking,
    ]
  );

  const handleInterrupt = useCallback(() => {
    playbackSessionIdRef.current = null;
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.onended = null;
      audioElementRef.current.onerror = null;
      audioElementRef.current.src = '';
      audioElementRef.current = null;
    }
    stopSpeaking();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsMuted(false);
    setCurrentStatus('listening');
    startListening('');
  }, [stopSpeaking, startListening]);

  const handleReplay = useCallback(() => {
    if (lastAiResponse) {
      setCurrentStatus('speaking');
      playAudioSpeech(lastAiResponse, selectedLang, () => {
        if (isOpen && !isMuted) {
          setCurrentStatus('listening');
          startListening('');
        } else {
          setCurrentStatus('idle');
        }
      });
    }
  }, [lastAiResponse, selectedLang, playAudioSpeech, isOpen, isMuted, startListening]);

  const toggleMic = async () => {
    if (isListening) {
      stopListening();
      setIsMuted(true);
      setCurrentStatus('idle');
    } else {
      setIsMuted(false);
      setMicError(null);
      setLiveTranscript('');
      // Trigger native browser permission prompt on direct user gesture
      const granted = await requestPermission();
      if (!hasMicStream) {
        await initAudioAnalyser();
      }
      if (granted) {
        await startListening('');
        setCurrentStatus('listening');
      }
    }
  };

  const handleManualSend = () => {
    if (liveTranscript.trim()) {
      handleSendSpokenPrompt(liveTranscript);
    }
  };

  if (!isOpen) return null;

  // Active badge metadata based on detected prompt language
  const badgeConfig = getSubtitleBadgeConfig({
    detectedLanguage: detectedPromptLang,
    targetSubtitleLanguage: activeCaptionLang,
    confidence: 1.0,
    reason: '',
  });

  const displaySubtitleText = liveCaptionText || lastAiResponse;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/92 backdrop-blur-2xl flex flex-col items-center justify-between p-4 sm:p-6 text-slate-100 select-none animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <header className="w-full max-w-3xl flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <KyronLogo size={36} animated={true} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                KYRON AI Real-Time Voice Hub
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {activeSessionTitle ? `Syncing to: ${activeSessionTitle}` : 'Natural speech & listening mode'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Subtitles Quick Toggle in Header */}
          <button
            onClick={() => setIsCaptionsEnabled(!isCaptionsEnabled)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isCaptionsEnabled
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle Subtitles / Captions (CC)"
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CC</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-2 rounded-xl border transition-colors ${
              isSettingsOpen ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Voice & Language Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Close Voice Mode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Settings Flyout Drawer */}
      {isSettingsOpen && (
        <div className="w-full max-w-xl bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl my-2 backdrop-blur-md animate-in slide-in-from-top-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dictation Language Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dictation Language</span>
              </label>
              <select
                value={selectedLang}
                onChange={(e) => {
                  setSelectedLang(e.target.value);
                  if (isListening) {
                    stopListening();
                    setTimeout(() => startListening(''), 200);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Voice Persona */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                <span>AI Voice Persona</span>
              </label>
              <select
                value={selectedVoicePersona}
                onChange={(e) => setSelectedVoicePersona(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {VOICE_PERSONAS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Subtitle / Caption Language Mode */}
            <div className="sm:col-span-2 bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <label className="text-xs font-semibold text-slate-200 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Subtitles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Subtitles & Caption Language Policy</span>
                </span>
                <span className="text-[10px] text-emerald-300/80 font-mono">Real-time Rule</span>
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                User Language Rules: English prompt ➔ English captions, Hinglish prompt ➔ English captions, Hindi prompt ➔ Hindi captions.
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setCaptionMode('auto')}
                  className={`p-2 rounded-lg border text-left flex items-center justify-between ${
                    captionMode === 'auto'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white font-medium'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Auto (Prompt Rule)</span>
                  {captionMode === 'auto' && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => setCaptionMode('english')}
                  className={`p-2 rounded-lg border text-left flex items-center justify-between ${
                    captionMode === 'english'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Always English</span>
                  {captionMode === 'english' && <Check className="w-3 h-3 text-indigo-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => setCaptionMode('hindi')}
                  className={`p-2 rounded-lg border text-left flex items-center justify-between ${
                    captionMode === 'hindi'
                      ? 'bg-amber-600/20 border-amber-500 text-white font-medium'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Always हिन्दी (Hindi)</span>
                  {captionMode === 'hindi' && <Check className="w-3 h-3 text-amber-400" />}
                </button>
              </div>
            </div>

            {/* Speaking Rate */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-300">Speech Rate</span>
                <span className="text-indigo-400 font-mono">{speechSpeed}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={speechSpeed}
                onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Auto Speak Toggle */}
            <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div>
                <p className="text-xs font-semibold text-slate-200">Auto Read Aloud</p>
                <p className="text-[11px] text-slate-400">Speak AI responses automatically</p>
              </div>
              <button
                onClick={() => setIsAutoSpeakEnabled(!isAutoSpeakEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  isAutoSpeakEnabled ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    isAutoSpeakEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Center Stage: Pulsing Sphere & Dynamic Waveform */}
      <main className="w-full max-w-2xl flex-1 flex flex-col items-center justify-center my-2 relative">
        {/* 1-Click Spoken Language & Subtitle Mode Quick Switcher */}
        <div className="flex items-center justify-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner mb-4">
          <button
            type="button"
            onClick={() => {
              setSelectedLang('en-IN');
              setCaptionMode('hinglish');
              if (isListening) {
                stopListening();
                setTimeout(() => startListening(''), 200);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedLang === 'en-IN' || selectedLang === 'hi-Latn'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Speak in Hinglish (Roman Script) - Subtitles will be in Hinglish"
          >
            <span>🌐 Hinglish (Latin)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedLang('hi-IN');
              setCaptionMode('hindi');
              if (isListening) {
                stopListening();
                setTimeout(() => startListening(''), 200);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedLang === 'hi-IN'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Speak in Hindi - Subtitles will be in Devanagari script (हिन्दी)"
          >
            <span>🇮🇳 हिन्दी (Devanagari)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedLang('en-US');
              setCaptionMode('english');
              if (isListening) {
                stopListening();
                setTimeout(() => startListening(''), 200);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedLang === 'en-US'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Speak in English - Subtitles will be in English"
          >
            <span>🇺🇸 English</span>
          </button>
        </div>

        {/* Central Visualizer Glow Orb */}
        <div className="relative flex items-center justify-center mb-4">
          <button
            type="button"
            onClick={toggleMic}
            className={`w-36 h-36 sm:w-48 sm:h-48 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-500/50 ${
              isSpeaking
                ? 'bg-gradient-to-tr from-purple-600/40 via-indigo-600/30 to-pink-600/40 ring-4 ring-purple-500/30 shadow-[0_0_80px_rgba(168,85,247,0.35)] scale-105'
                : isListening && !isMuted
                ? 'bg-gradient-to-tr from-emerald-600/40 via-sky-600/30 to-indigo-600/40 ring-4 ring-emerald-500/30 shadow-[0_0_80px_rgba(52,211,153,0.35)] scale-105'
                : 'bg-slate-900 border border-slate-800 hover:border-slate-700 hover:scale-102'
            }`}
            title={isListening ? 'Click to pause microphone' : 'Click to start speaking'}
          >
            <div
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center transition-all duration-200 ${
                isSpeaking
                  ? 'bg-gradient-to-tr from-purple-500 to-pink-500 text-white animate-pulse'
                  : isListening && !isMuted
                  ? 'bg-gradient-to-tr from-emerald-500 to-sky-500 text-white'
                  : 'bg-slate-800 text-slate-400 group-hover:text-white'
              }`}
            >
              {isSpeaking ? (
                <Volume2 className="w-10 h-10 animate-bounce" />
              ) : isListening && !isMuted ? (
                <Mic className="w-10 h-10 animate-pulse" />
              ) : (
                <MicOff className="w-10 h-10" />
              )}
            </div>
          </button>

          {/* Ambient Circular Status Pill */}
          <div className="absolute -bottom-4 px-4 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono font-medium shadow-md">
            {isSpeaking ? (
              <span className="text-purple-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                KYRON AI Speaking...
              </span>
            ) : isListening && !isMuted ? (
              <span className="text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Listening to you...
              </span>
            ) : isAiStreaming ? (
              <span className="text-sky-300 flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Synthesizing response & captions...
              </span>
            ) : (
              <button
                type="button"
                onClick={toggleMic}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <Mic className="w-3.5 h-3.5 animate-bounce" />
                <span>{selectedLang === 'hi-IN' ? 'बोलना शुरू करें (Tap to Speak)' : 'Tap to Start Speaking'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Real-Time Waveform Canvas */}
        <canvas
          ref={canvasRef}
          width={480}
          height={60}
          className="w-full max-w-md h-12 rounded-xl my-1"
        />

        {/* Error Notification with Actionable Grant Permission Button */}
        {(micError || recognitionError) && (
          <div className="w-full max-w-md bg-rose-950/50 border border-rose-800/80 rounded-xl p-3.5 text-xs text-rose-300 flex flex-col gap-2.5 my-2 shadow-lg backdrop-blur-sm animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-rose-200">Microphone Access Error</p>
                <p className="mt-0.5 text-rose-300/90 leading-relaxed">{micError || recognitionError}</p>
                {errorDetails?.solution && (
                  <p className="mt-2 text-[11px] text-amber-200 bg-amber-950/40 border border-amber-800/40 p-2 rounded-lg leading-relaxed">
                    💡 <span className="font-medium">How to fix:</span> {errorDetails.solution}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-rose-900/40">
              <button
                type="button"
                onClick={async () => {
                  setMicError(null);
                  const granted = await requestPermission();
                  if (granted) {
                    await initAudioAnalyser();
                    await startListening(liveTranscript);
                    setIsMuted(false);
                    setCurrentStatus('listening');
                  }
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Retry Permission / अनुमति दें</span>
              </button>
              <span className="text-[11px] text-rose-300/70">
                Tip: Click 🔒 lock icon in browser URL bar to Allow
              </span>
            </div>
          </div>
        )}

        {/* Dedicated Live Closed-Captions & Subtitle (CC) Stage */}
        {isCaptionsEnabled && (
          <div className="w-full max-w-xl my-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Subtitle Header Bar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/95 border border-b-0 border-slate-800 rounded-t-xl text-[11px]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 font-bold text-emerald-400">
                  <Subtitles className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="tracking-wider">LIVE SUBTITLES</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${badgeConfig.captionBadgeColor}`}>
                  {badgeConfig.captionLabel}
                </span>
                <span className="hidden sm:inline-block text-[10px] text-slate-400 font-mono">
                  ({badgeConfig.tag})
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Font Size Selector */}
                <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setCaptionFontSize('sm')}
                    className={`px-1.5 py-0.5 rounded ${
                      captionFontSize === 'sm' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Small font size"
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={() => setCaptionFontSize('md')}
                    className={`px-1.5 py-0.5 rounded ${
                      captionFontSize === 'md' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Normal font size"
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => setCaptionFontSize('lg')}
                    className={`px-1.5 py-0.5 rounded ${
                      captionFontSize === 'lg' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Large font size"
                  >
                    A+
                  </button>
                </div>

                {/* Hide Subtitles Button */}
                <button
                  type="button"
                  onClick={() => setIsCaptionsEnabled(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Hide subtitles overlay"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Subtitle Content Box */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-b-xl p-3 sm:p-4 shadow-2xl backdrop-blur-md text-center min-h-[64px] flex items-center justify-center">
              {displaySubtitleText ? (
                <p
                  className={`font-medium tracking-wide text-white transition-all select-text leading-relaxed ${
                    captionFontSize === 'sm'
                      ? 'text-xs'
                      : captionFontSize === 'lg'
                      ? 'text-base sm:text-lg'
                      : 'text-sm sm:text-base'
                  }`}
                >
                  {displaySubtitleText}
                </p>
              ) : (
                <p className="text-xs text-slate-500 italic flex items-center gap-1.5 justify-center">
                  {currentStatus === 'speaking' ? (
                    <span className="text-purple-300 animate-pulse">Syncing speech to captions...</span>
                  ) : currentStatus === 'listening' ? (
                    <span>Speak in English, Hinglish, or Hindi. Subtitles will adapt automatically.</span>
                  ) : (
                    <span>Captions active: English for English & Hinglish, Hindi for Hindi</span>
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Live Conversation Transcript Stream */}
        <div className="w-full max-w-xl bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 min-h-[110px] max-h-[180px] overflow-y-auto space-y-2.5 shadow-inner text-xs sm:text-sm leading-relaxed">
          {/* Spoken by User */}
          {(liveTranscript || lastUserSpeech) && (
            <div className="flex items-start gap-2.5">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono shrink-0">
                YOU
              </span>
              <div className="flex-1">
                <p className="text-slate-200">
                  {liveTranscript ? (
                    <span className="italic text-indigo-200 underline decoration-indigo-500/40">
                      {liveTranscript}
                    </span>
                  ) : (
                    lastUserSpeech
                  )}
                </p>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                  Prompt Language: {badgeConfig.promptLabel}
                </span>
              </div>
            </div>
          )}

          {/* Spoken by AI */}
          {(lastAiResponse || liveCaptionText) && (
            <div className="flex items-start gap-2.5 pt-2 border-t border-slate-800/60">
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono shrink-0">
                AI
              </span>
              <div className="flex-1 space-y-1">
                {/* Toggle between Subtitle and Spoken transcript if prompt was Hinglish */}
                {detectedPromptLang === 'hinglish' && liveCaptionText && lastAiResponse && liveCaptionText !== lastAiResponse && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <button
                      type="button"
                      onClick={() => setViewTranscriptMode('subtitle')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        viewTranscriptMode === 'subtitle'
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      CC Subtitle (English)
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewTranscriptMode('spoken')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        viewTranscriptMode === 'spoken'
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Spoken Audio (Hinglish)
                    </button>
                  </div>
                )}
                <p className="text-slate-200">
                  {viewTranscriptMode === 'spoken' && detectedPromptLang === 'hinglish'
                    ? lastAiResponse
                    : displaySubtitleText}
                </p>
              </div>
            </div>
          )}

          {!liveTranscript && !lastUserSpeech && !lastAiResponse && (
            <p className="text-xs text-slate-500 text-center py-3 italic">
              Say something naturally (e.g. "What are the latest developments in quantum computing?" or "नमस्ते, ब्रह्मांड का विस्तार कैसे हुआ?")
            </p>
          )}
        </div>
      </main>

      {/* Bottom Floating Control Deck */}
      <footer className="w-full max-w-xl flex flex-col items-center gap-2.5">
        {/* If user spoke and wants to confirm immediately */}
        {liveTranscript.trim() && (
          <button
            onClick={handleManualSend}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer animate-in zoom-in-90"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send: "{liveTranscript.slice(0, 32)}..."</span>
          </button>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2.5 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full shadow-2xl backdrop-blur-xl">
          {/* Start / Stop Listening Toggle */}
          <button
            onClick={toggleMic}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              isListening && !isMuted
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isListening ? 'Click to pause listening' : 'Click to start listening'}
          >
            {isListening && !isMuted ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
            <span>{isListening && !isMuted ? 'Stop Listening' : 'Start Listening'}</span>
          </button>

          {/* Subtitles Toggle Button in Footer */}
          <button
            onClick={() => setIsCaptionsEnabled(!isCaptionsEnabled)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              isCaptionsEnabled
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
            }`}
            title={isCaptionsEnabled ? 'Turn off live subtitles' : 'Turn on live subtitles'}
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span>{isCaptionsEnabled ? 'CC On' : 'CC Off'}</span>
          </button>

          {/* Interrupt Control (Visible when AI is speaking via TTS or WebSpeech) */}
          {currentStatus === 'speaking' && (
            <button
              onClick={handleInterrupt}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 transition-all cursor-pointer animate-pulse"
              title="Interrupt AI speech and start speaking immediately"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Interrupt / रुकें</span>
            </button>
          )}

          {/* Replay Last AI Spoken Response */}
          {lastAiResponse && currentStatus !== 'speaking' && (
            <button
              onClick={handleReplay}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
              title="Replay the last AI spoken answer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Replay</span>
            </button>
          )}

          {/* Mute / Unmute Toggle */}
          <button
            onClick={toggleMic}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              isMuted
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Switch Back to Text Chat */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span>Chat Mode</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
