import { useState, useEffect, useRef, useCallback } from 'react';
import { assembleTranscript } from '../utils/ai-helpers';
import {
  acquireMicrophoneStream,
  parseMicrophoneError,
  DetailedMicError,
  UniversalAudioRecorder,
  getMicrophoneDiagnostics,
} from '../utils/microphone-manager';

export type SpeechRecognitionStatus =
  | 'idle'
  | 'requesting_permission'
  | 'listening'
  | 'processing'
  | 'error';

export interface UseSpeechRecognitionOptions {
  onTranscriptChange?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  lang?: string;
  silenceTimeoutMs?: number;
}

export function useSpeechRecognition({
  onTranscriptChange,
  onFinalTranscript,
  lang = 'en-US',
  silenceTimeoutMs = 2800,
}: UseSpeechRecognitionOptions = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [status, setStatus] = useState<SpeechRecognitionStatus>('idle');
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [errorDetails, setErrorDetails] = useState<DetailedMicError | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Active listener for microphone permissions changes in browser settings
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) return;

    let permissionObj: PermissionStatus | null = null;
    navigator.permissions
      .query({ name: 'microphone' as any })
      .then((status) => {
        permissionObj = status;
        setPermissionState(status.state as any);
        if (status.state === 'granted') {
          setErrorDetails(null);
        }
        status.onchange = () => {
          setPermissionState(status.state as any);
          if (status.state === 'granted') {
            setErrorDetails(null);
            setStatus('idle');
          } else if (status.state === 'denied') {
            setErrorDetails({
              type: 'PERMISSION_DENIED',
              message: 'Microphone permission was denied in your browser settings.',
              solution: 'Click the lock or tuning icon next to the URL in your address bar, change Microphone to "Allow", and reload.',
            });
            setStatus('error');
            setIsListening(false);
          }
        };
      })
      .catch(() => {});

    return () => {
      if (permissionObj) {
        permissionObj.onchange = null;
      }
    };
  }, []);

  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>('');
  const finalTranscriptRef = useRef<string>('');
  const isManuallyStoppedRef = useRef<boolean>(true);
  const silenceTimerRef = useRef<any>(null);
  const fallbackRecorderRef = useRef<UniversalAudioRecorder | null>(null);

  // Audio level monitoring
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const callbackRef = useRef(onTranscriptChange);
  const finalCallbackRef = useRef(onFinalTranscript);
  useEffect(() => {
    callbackRef.current = onTranscriptChange;
    finalCallbackRef.current = onFinalTranscript;
  }, [onTranscriptChange, onFinalTranscript]);

  // Clean audio monitoring
  const cleanupAudioMonitor = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  // Initialize SpeechRecognition instance
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
        setStatus('listening');
        setErrorDetails(null);
      };

// Substantive speech activity check: ensures the transcript contains at least 2 authentic letters/Devanagari, not breathing or filler noises
function isSubstantiveSpeech(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  const lettersOnly = (trimmed.match(/[\p{L}\p{N}]/gu) || []).join('');
  if (lettersOnly.length < 2) return false;
  if (/^(uh|um|ah|mm|hmm|eh|er|shh|psst|ha|oops|tsk|cough|sneeze|sniff)[.?!]*$/i.test(trimmed)) {
    return false;
  }
  return true;
}

      recognition.onresult = (event: any) => {
        let interim = '';
        let newlyFinalized = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const transcript = item[0]?.transcript || '';
          if (item.isFinal) {
            newlyFinalized += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        if (newlyFinalized) {
          finalTranscriptRef.current += newlyFinalized;
        }

        setInterimTranscript(interim);

        const fullText = assembleTranscript(
          baseTextRef.current,
          finalTranscriptRef.current,
          interim
        );

        if (callbackRef.current) {
          callbackRef.current(fullText);
        }

        // Reset silence timer on fresh speech ONLY if substantive words were uttered
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        const hasSpokenContent = isSubstantiveSpeech(newlyFinalized) || isSubstantiveSpeech(interim) || isSubstantiveSpeech(finalTranscriptRef.current);

        if (silenceTimeoutMs > 0 && hasSpokenContent) {
          silenceTimerRef.current = setTimeout(() => {
            const currentFinal = finalTranscriptRef.current.trim();
            // Silence must NEVER be treated as a command or question if no substantive speech exists
            if (isSubstantiveSpeech(currentFinal) && finalCallbackRef.current) {
              finalTranscriptRef.current = '';
              baseTextRef.current = '';
              setInterimTranscript('');
              finalCallbackRef.current(currentFinal);
            }
          }, silenceTimeoutMs);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition event error:', event.error);
        if (event.error === 'not-allowed') {
          setStatus('error');
          setErrorDetails({
            type: 'PERMISSION_DENIED',
            message: 'Microphone access is blocked by browser permissions.',
            solution:
              'Click the lock or microphone icon near your browser address bar, set Microphone permission to "Allow", and reload.',
          });
          setIsListening(false);
        } else if (event.error === 'no-speech') {
          // Normal silence, keep listening
        } else if (event.error === 'network') {
          setStatus('error');
          setErrorDetails({
            type: 'UNKNOWN',
            message: 'Network connection issue with cloud speech service.',
            solution: 'Check your internet connection or use backend audio transcription.',
          });
        } else if (event.error !== 'aborted') {
          setStatus('error');
          setErrorDetails({
            type: 'UNKNOWN',
            message: `Speech recognition error: ${event.error}`,
            solution: 'Please ensure your microphone is active and retry.',
          });
        }
      };

      recognition.onend = () => {
        if (!isManuallyStoppedRef.current) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
            setStatus('idle');
          }
        } else {
          setIsListening(false);
          setStatus('idle');
          setInterimTranscript('');
          cleanupAudioMonitor();
        }
      };

      recognitionRef.current = recognition;
    } else {
      // Check if MediaRecorder is available for universal backend fallback
      const hasMediaRecorder = typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined';
      setIsSupported(hasMediaRecorder);
      if (!hasMediaRecorder) {
        setErrorDetails({
          type: 'UNSUPPORTED',
          message: 'Voice speech recognition is not supported in this browser.',
          solution: 'Please use Google Chrome, Microsoft Edge, Safari, or a modern browser.',
        });
      }
    }

    return () => {
      if (recognitionRef.current) {
        isManuallyStoppedRef.current = true;
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      cleanupAudioMonitor();
    };
  }, [lang, silenceTimeoutMs, cleanupAudioMonitor]);

  // Explicit permission request
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setStatus('requesting_permission');
    setErrorDetails(null);

    const { stream, error } = await acquireMicrophoneStream();
    if (error || !stream) {
      setStatus('error');
      setErrorDetails(error);
      return false;
    }

    // Immediately stop test tracks
    stream.getTracks().forEach((t) => t.stop());
    setStatus('idle');
    return true;
  }, []);

  // Start listening (with native Web Speech or Universal MediaRecorder fallback)
  const startListening = useCallback(
    async (currentInputText: string = '') => {
      setErrorDetails(null);
      baseTextRef.current = currentInputText;
      finalTranscriptRef.current = '';
      setInterimTranscript('');

      // 1. Verify Microphone Access First via User Gesture
      setStatus('requesting_permission');
      const { stream, error } = await acquireMicrophoneStream(micStreamRef.current);

      if (error || !stream) {
        setStatus('error');
        setErrorDetails(error);
        setIsListening(false);
        return;
      }

      micStreamRef.current = stream;

      // 2. Set up Audio Level Meter
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          if (audioCtx.state === 'suspended') {
            await audioCtx.resume().catch(() => {});
          }
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.5;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const sampleLevel = () => {
            if (!analyserRef.current) return;
            const buffer = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(buffer);
            const sum = buffer.reduce((acc, v) => acc + v, 0);
            const avg = sum / buffer.length / 255;
            setAudioLevel(avg);
            animFrameRef.current = requestAnimationFrame(sampleLevel);
          };
          sampleLevel();
        }
      } catch (e) {
        console.warn('Audio analyser setup note:', e);
      }

      // 3. Choose Native SpeechRecognition or Universal AudioRecorder fallback
      if (recognitionRef.current) {
        try {
          isManuallyStoppedRef.current = false;
          recognitionRef.current.lang = lang;
          recognitionRef.current.start();
          setIsListening(true);
          setStatus('listening');
        } catch (err: any) {
          if (err.name === 'InvalidStateError') {
            setIsListening(true);
            setStatus('listening');
          } else {
            console.error('SpeechRecognition start error:', err);
            setStatus('error');
            setErrorDetails({
              type: 'UNKNOWN',
              message: 'Failed to initialize speech recognition engine.',
              solution: 'Please refresh the page and try clicking the microphone again.',
            });
          }
        }
      } else {
        // Universal MediaRecorder Fallback (Firefox / Safari fallback)
        try {
          const recorder = new UniversalAudioRecorder();
          await recorder.start();
          fallbackRecorderRef.current = recorder;
          setIsListening(true);
          setStatus('listening');
        } catch (recErr: any) {
          console.error('Universal recorder error:', recErr);
          setStatus('error');
          setErrorDetails(parseMicrophoneError(recErr));
        }
      }
    },
    [lang]
  );

  // Stop listening
  const stopListening = useCallback(async () => {
    isManuallyStoppedRef.current = true;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    // If using fallback recorder, finalize audio and transcribe via backend
    if (fallbackRecorderRef.current) {
      setStatus('processing');
      try {
        const { base64, mimeType } = await fallbackRecorderRef.current.stop();
        fallbackRecorderRef.current = null;

        const res = await fetch('/api/transcribe-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioData: base64, mimeType, lang }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.transcript) {
            const assembled = assembleTranscript(baseTextRef.current, data.transcript, '');
            if (callbackRef.current) callbackRef.current(assembled);
            if (finalCallbackRef.current) finalCallbackRef.current(assembled);
          }
        }
      } catch (e) {
        console.warn('Fallback transcription error:', e);
      }
    }

    setIsListening(false);
    setStatus('idle');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
    baseTextRef.current = '';
    cleanupAudioMonitor();
  }, [lang, cleanupAudioMonitor]);

  const toggleListening = useCallback(
    (currentInputText: string = '') => {
      if (isListening) {
        stopListening();
      } else {
        startListening(currentInputText);
      }
    },
    [isListening, startListening, stopListening]
  );

  return {
    isSupported,
    status,
    permissionState,
    isListening,
    interimTranscript,
    error: errorDetails?.message || null,
    errorDetails,
    audioLevel,
    requestPermission,
    resetError: () => setErrorDetails(null),
    startListening,
    stopListening,
    toggleListening,
  };
}
