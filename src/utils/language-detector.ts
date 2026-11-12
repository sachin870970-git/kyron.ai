/**
 * Language Detector & Subtitle Policy Engine for KYRON AI
 *
 * Rules:
 * 1. If user's language is English -> Caption / Subtitle MUST be English
 * 2. If user's language is Hinglish -> Caption / Subtitle MUST be Hinglish (Romanized Hindi)
 * 3. If user's language is Hindi -> Caption / Subtitle MUST be Hindi (Devanagari)
 * "jo language me bolu caption v ussi me hona chahiyea" -> Exact 1:1 language and script matching!
 */

export type PromptLanguage = 'english' | 'hinglish' | 'hindi';
export type SubtitleLanguage = 'english' | 'hinglish' | 'hindi';

export interface LanguageDetectionResult {
  detectedLanguage: PromptLanguage;
  targetSubtitleLanguage: SubtitleLanguage;
  confidence: number;
  reason: string;
}

// Common Hinglish / Romanized Hindi marker keywords
const HINGLISH_KEYWORDS = new Set([
  'namaste', 'kaise', 'kaisi', 'kaisa', 'kya', 'kyun', 'kyu', 'kar', 'karo', 'karna',
  'karein', 'karega', 'karegi', 'raha', 'rahe', 'rahi', 'hai', 'hain', 'ho', 'hoon',
  'hun', 'nahi', 'nahin', 'haan', 'bhai', 'batao', 'bataiye', 'samjhao', 'samajh',
  'bol', 'bolo', 'suno', 'sunao', 'chahiye', 'acha', 'achha', 'accha', 'theek',
  'thik', 'mujhe', 'mera', 'meri', 'mere', 'tera', 'teri', 'tere', 'tum', 'tumhara',
  'tumhari', 'aap', 'aapka', 'aapki', 'aapke', 'aapko', 'hum', 'humein', 'kuch',
  'kuchh', 'kaun', 'kab', 'kahan', 'kidhar', 'kitna', 'kitni', 'kitne', 'hota',
  'hoti', 'hote', 'shuru', 'kare', 'baat', 'baatein', 'dost', 'yahan', 'wahan',
  'idhar', 'udhar', 'zyada', 'jyada', 'kam', 'bohot', 'bahut', 'sirf', 'pehle',
  'baad', 'sath', 'saath', 'madad', 'madat', 'kripya', 'dhanyawad', 'shukriya',
  'alvida', 'zindagi', 'waqt', 'samay', 'seekhna', 'seekhni', 'bata', 'dikhao',
  'lagta', 'lagti', 'hoga', 'hogi', 'yaar', 'bhaiya', 'didi', 'apna', 'apni',
  'apne', 'sab', 'sabko', 'kaunsa', 'kaunsi', 'kaise ho', 'kya haal', 'bhaijaan'
]);

/**
 * Detects whether a spoken or typed prompt is English, Hinglish, or Hindi
 */
export function detectPromptLanguage(text: string, selectedSpeechLang?: string): LanguageDetectionResult {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return {
      detectedLanguage: 'english',
      targetSubtitleLanguage: 'english',
      confidence: 1.0,
      reason: 'Empty prompt defaults to English',
    };
  }

  // 1. Check for Devanagari Unicode characters (Hindi script: \u0900-\u097F)
  const devanagariMatches = trimmed.match(/[\u0900-\u097F]/g) || [];
  const totalLetters = (trimmed.match(/[\p{L}]/gu) || []).length || trimmed.length;
  const devanagariRatio = devanagariMatches.length / Math.max(totalLetters, 1);

  if (devanagariMatches.length >= 2 || devanagariRatio > 0.3) {
    return {
      detectedLanguage: 'hindi',
      targetSubtitleLanguage: 'hindi',
      confidence: Math.min(1.0, 0.7 + devanagariRatio * 0.3),
      reason: 'Contains Devanagari Hindi characters',
    };
  }

  // 2. Tokenize Latin words to check for Hinglish markers
  const words = trimmed
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, '')
    .split(/\s+/)
    .filter(Boolean);

  let hinglishWordCount = 0;
  for (const word of words) {
    if (HINGLISH_KEYWORDS.has(word)) {
      hinglishWordCount++;
    }
  }

  // Also check two-word colloquialisms (e.g. "kya hai", "kaise ho", "batao na")
  const lowerTrimmed = trimmed.toLowerCase();
  const hasHinglishPhrase =
    /\b(kaise ho|kya hai|kya hal|kya chal|batao na|suno na|mujhe batao|kuch batao|karna hai|karein kya|theek hai|accha hai|kya kare)\b/i.test(
      lowerTrimmed
    );

  if (hinglishWordCount >= 1 || hasHinglishPhrase || selectedSpeechLang === 'hi-Latn' || selectedSpeechLang === 'en-IN') {
    return {
      detectedLanguage: 'hinglish',
      // Strict User Directive: Spoken in Hinglish -> Caption in Hinglish!
      targetSubtitleLanguage: 'hinglish',
      confidence: Math.min(1.0, 0.65 + (hinglishWordCount / Math.max(words.length, 1)) * 0.35),
      reason: `Detected ${hinglishWordCount} Hinglish vocabulary marker(s). Caption matched to Hinglish.`,
    };
  }

  // 3. Fallback: Pure Latin English
  return {
    detectedLanguage: 'english',
    targetSubtitleLanguage: 'english',
    confidence: 0.95,
    reason: 'Standard English vocabulary and script',
  };
}

/**
 * Returns formatted display label and badge for the detected language and target subtitle
 */
export function getSubtitleBadgeConfig(result: LanguageDetectionResult) {
  switch (result.detectedLanguage) {
    case 'hindi':
      return {
        promptLabel: 'हिन्दी (Hindi)',
        captionLabel: 'हिन्दी Subtitles',
        promptBadgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        captionBadgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        tag: 'HINDI ➔ HINDI CAPTION',
      };
    case 'hinglish':
      return {
        promptLabel: 'Hinglish (हिंग्लिश)',
        captionLabel: 'Hinglish Subtitles',
        promptBadgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        captionBadgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        tag: 'HINGLISH ➔ HINGLISH CAPTION',
      };
    case 'english':
    default:
      return {
        promptLabel: 'English (US)',
        captionLabel: 'English Subtitles',
        promptBadgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        captionBadgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        tag: 'ENGLISH ➔ ENGLISH CAPTION',
      };
  }
}
