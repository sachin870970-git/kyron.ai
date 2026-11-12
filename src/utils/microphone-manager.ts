/**
 * KYRON.AI Desktop & Mobile Microphone Diagnostics & Stream Lifecycle Manager
 * 
 * Provides:
 * - Secure-context & HTTPS verification
 * - Device availability checks (enumerateDevices)
 * - Permission query & explicit user-gesture requests
 * - Audio track lifecycle tracking (no memory leaks, clean teardowns)
 * - Comprehensive error diagnostics with user-friendly recovery instructions
 * - Web Audio API Analyser for real-time visualization
 * - Universal fallback audio recorder (MediaRecorder -> backend transcription)
 */

export type MicPermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface MicDiagnostics {
  isSecureContext: boolean;
  hasGetUserMedia: boolean;
  hasSpeechRecognition: boolean;
  hasSpeechSynthesis: boolean;
  hasMediaRecorder: boolean;
  audioInputDeviceCount: number;
  permissionState: MicPermissionState;
  browserName: string;
}

export interface DetailedMicError {
  type:
    | 'PERMISSION_DENIED'
    | 'NO_DEVICE'
    | 'DEVICE_BUSY'
    | 'INSECURE_CONTEXT'
    | 'IFRAME_BLOCKED'
    | 'OVERCONSTRAINED'
    | 'UNSUPPORTED'
    | 'UNKNOWN';
  message: string;
  solution: string;
  rawError?: any;
}

/**
 * Detects current browser engine for tailored troubleshooting guidance.
 */
export function getBrowserInfo(): string {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'Microsoft Edge';
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'Google Chrome';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Apple Safari';
  if (/Firefox\//.test(ua)) return 'Mozilla Firefox';
  return 'Modern Browser';
}

/**
 * Comprehensive runtime capability and diagnostics check.
 */
export async function getMicrophoneDiagnostics(): Promise<MicDiagnostics> {
  const isSecure = typeof window !== 'undefined' ? (window.isSecureContext ?? true) : false;
  const hasGUM = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  const hasSR =
    typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  const hasSS = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const hasMR = typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined';

  let audioDeviceCount = 0;
  if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      audioDeviceCount = devices.filter((d) => d.kind === 'audioinput').length;
    } catch {
      audioDeviceCount = 1; // Fallback if enumeration restricted prior to permission
    }
  }

  let permissionState: MicPermissionState = 'prompt';
  if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
    try {
      const status = await navigator.permissions.query({ name: 'microphone' as any });
      permissionState = status.state as MicPermissionState;
    } catch {
      permissionState = 'prompt';
    }
  } else if (!hasGUM) {
    permissionState = 'unsupported';
  }

  return {
    isSecureContext: isSecure,
    hasGetUserMedia: hasGUM,
    hasSpeechRecognition: hasSR,
    hasSpeechSynthesis: hasSS,
    hasMediaRecorder: hasMR,
    audioInputDeviceCount: audioDeviceCount,
    permissionState,
    browserName: getBrowserInfo(),
  };
}

/**
 * Parses native browser DOMException / MediaStream errors into actionable diagnostic instructions.
 */
export function parseMicrophoneError(err: any): DetailedMicError {
  const errName = err?.name || '';
  const errMsg = err?.message || String(err);
  const browser = getBrowserInfo();

  if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
    return {
      type: 'PERMISSION_DENIED',
      message: 'Microphone access is blocked by browser permissions.',
      solution:
        browser === 'Google Chrome' || browser === 'Microsoft Edge'
          ? 'Click the lock or tuning icon next to the URL in your address bar, ensure "Microphone" is set to "Allow", and click Reload.'
          : browser === 'Apple Safari'
          ? 'Open Safari Settings > Websites > Microphone, find this site, and select "Allow".'
          : 'Please open Site Settings or click the microphone icon in your address bar to allow microphone access.',
      rawError: err,
    };
  }

  if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
    return {
      type: 'NO_DEVICE',
      message: 'No microphone hardware found on your computer.',
      solution:
        'Please plug in a USB microphone, headset, or enable your internal computer microphone in your system Sound Settings.',
      rawError: err,
    };
  }

  if (errName === 'NotReadableError' || errName === 'TrackStartError') {
    return {
      type: 'DEVICE_BUSY',
      message: 'The microphone is in use by another application or operating system process.',
      solution:
        'Close other applications that might be using your microphone (Zoom, Teams, Discord, Skype, or other browser tabs) and try again.',
      rawError: err,
    };
  }

  if (errName === 'SecurityError') {
    return {
      type: 'INSECURE_CONTEXT',
      message: 'Microphone requires a secure HTTPS or localhost origin.',
      solution: 'Ensure you are accessing this application via an HTTPS address or localhost.',
      rawError: err,
    };
  }

  if (errName === 'OverconstrainedError') {
    return {
      type: 'OVERCONSTRAINED',
      message: 'Requested audio constraints could not be satisfied by your microphone.',
      solution: 'Switching to standard fallback audio constraints...',
      rawError: err,
    };
  }

  return {
    type: 'UNKNOWN',
    message: errMsg || 'Could not acquire microphone stream.',
    solution: 'Please ensure your microphone is plugged in, permitted in browser settings, and retry.',
    rawError: err,
  };
}

/**
 * Cleanly requests an active audio MediaStream with noise cancellation & echo suppression.
 * Guaranteed to clean up prior tracks and avoid hardware locks.
 */
export async function acquireMicrophoneStream(
  existingStream?: MediaStream | null
): Promise<{ stream: MediaStream; error: DetailedMicError | null }> {
  // 1. Release existing tracks cleanly
  if (existingStream) {
    try {
      existingStream.getTracks().forEach((t) => t.stop());
    } catch {}
  }

  // 2. Check secure context
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return {
      stream: null as any,
      error: {
        type: 'INSECURE_CONTEXT',
        message: 'Microphone access is restricted to secure contexts (HTTPS or localhost).',
        solution: 'Please load this application through a secure HTTPS connection.',
      },
    };
  }

  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return {
      stream: null as any,
      error: {
        type: 'UNSUPPORTED',
        message: 'Your browser does not support the Web Audio MediaDevices API.',
        solution: 'Please use a modern version of Chrome, Edge, Safari, or Firefox.',
      },
    };
  }

  // 3. Request with optimal constraints
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    return { stream, error: null };
  } catch (err: any) {
    // If overconstrained, retry with simple boolean audio constraint
    if (err?.name === 'OverconstrainedError') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        return { stream, error: null };
      } catch (fallbackErr) {
        return { stream: null as any, error: parseMicrophoneError(fallbackErr) };
      }
    }
    return { stream: null as any, error: parseMicrophoneError(err) };
  }
}

/**
 * Creates an AnalyserNode for audio visualization without locking the stream.
 */
export function createAudioAnalyser(
  stream: MediaStream
): { analyser: AnalyserNode; audioCtx: AudioContext } | null {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;

    const audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.8;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    return { analyser, audioCtx };
  } catch (e) {
    console.warn('Audio analyser initialization skipped:', e);
    return null;
  }
}

/**
 * In-browser audio recorder for environments without native Web Speech API (Firefox, Safari fallbacks).
 */
export class UniversalAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<boolean> {
    const { stream, error } = await acquireMicrophoneStream();
    if (error || !stream) {
      throw new Error(error?.message || 'Could not acquire microphone');
    }
    this.stream = stream;
    this.audioChunks = [];

    // Find supported mimeType
    const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
    let selectedMime = '';
    for (const m of mimeTypes) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) {
        selectedMime = m;
        break;
      }
    }

    const mr = new MediaRecorder(stream, selectedMime ? { mimeType: selectedMime } : undefined);
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.audioChunks.push(e.data);
      }
    };
    this.mediaRecorder = mr;
    mr.start(100);
    return true;
  }

  async stop(): Promise<{ blob: Blob; base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error('Recorder not started'));
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Stop stream tracks
          if (this.stream) {
            this.stream.getTracks().forEach((t) => t.stop());
            this.stream = null;
          }
          resolve({ blob, base64, mimeType });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      };

      try {
        this.mediaRecorder.stop();
      } catch (e) {
        reject(e);
      }
    });
  }

  cancel() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.audioChunks = [];
  }
}
