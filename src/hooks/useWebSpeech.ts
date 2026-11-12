import { useState, useEffect, useRef, useCallback } from 'react';
import { cleanTextForSpeech } from '../utils/ai-helpers';

export interface WebSpeechState {
  isSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  currentMessageId: string | null;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  rate: number;
}

export function useWebSpeech() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(1.0);

  const timerRef = useRef<any>(null);
  const utteranceQueueRef = useRef<SpeechSynthesisUtterance[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);

      const updateVoices = () => {
        const available = window.speechSynthesis.getVoices();
        setVoices(available);
        if (available.length > 0 && !selectedVoice) {
          // Default to a natural English or local voice
          const preferred =
            available.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))) ||
            available.find((v) => v.default) ||
            available[0];
          setSelectedVoice(preferred || null);
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    utteranceQueueRef.current = [];
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentMessageId(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const speak = useCallback(
    (messageId: string, rawText: string, langCode?: string, onSpeechEnd?: () => void, pitch: number = 1.0) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('Web Speech API is not supported in this browser.');
        return;
      }

      // If already speaking this message, toggle stop
      if (currentMessageId === messageId && isSpeaking) {
        stop();
        return;
      }

      // Stop any existing speech
      window.speechSynthesis.cancel();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const text = cleanTextForSpeech(rawText);
      if (!text) {
        onSpeechEnd?.();
        return;
      }

      // Detect Hindi or other requested languages
      const isHindi = (langCode && langCode.startsWith('hi')) || /[\u0900-\u097F]/.test(rawText);
      const targetLang = isHindi ? 'hi-IN' : langCode || 'en-US';

      // Find the most authentic voice for the language
      let voiceToUse = selectedVoice;
      if (isHindi) {
        const hindiVoice = voices.find(
          (v) => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('lekha')
        );
        if (hindiVoice) voiceToUse = hindiVoice;
      } else if (langCode && (!selectedVoice || !selectedVoice.lang.startsWith(langCode.slice(0, 2)))) {
        const matchingVoice = voices.find((v) => v.lang.startsWith(langCode.slice(0, 2)));
        if (matchingVoice) voiceToUse = matchingVoice;
      }

      // Chunk by sentences to avoid Chrome 15s freeze bug
      const sentences = text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [text];
      const validChunks = sentences.map((s) => s.trim()).filter((s) => s.length > 0);

      if (validChunks.length === 0) {
        onSpeechEnd?.();
        return;
      }

      setCurrentMessageId(messageId);
      setIsSpeaking(true);
      setIsPaused(false);

      const utterances = validChunks.map((chunk, index) => {
        const u = new SpeechSynthesisUtterance(chunk);
        u.lang = targetLang;
        if (voiceToUse) u.voice = voiceToUse;
        u.rate = rate;
        u.pitch = pitch;

        if (index === validChunks.length - 1) {
          u.onend = () => {
            setIsSpeaking(false);
            setIsPaused(false);
            setCurrentMessageId(null);
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            // Trigger completion callback to enable continuous two-way loop
            onSpeechEnd?.();
          };
        }

        u.onerror = (e) => {
          if (e.error !== 'canceled' && e.error !== 'interrupted') {
            console.error('SpeechSynthesis error:', e);
          }
          setIsSpeaking(false);
          setIsPaused(false);
          setCurrentMessageId(null);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          onSpeechEnd?.();
        };

        return u;
      });

      utteranceQueueRef.current = utterances;

      // Keepalive interval for Chrome
      timerRef.current = setInterval(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 10000);

      // Start queue
      utterances.forEach((u) => window.speechSynthesis.speak(u));
    },
    [currentMessageId, isSpeaking, selectedVoice, voices, rate, stop]
  );

  return {
    isSupported,
    isSpeaking,
    isPaused,
    currentMessageId,
    speak,
    stop,
    voices,
    selectedVoice,
    setSelectedVoice,
    rate,
    setRate,
  };
}
