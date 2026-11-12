/**
 * Smart Intent Classifier & Adaptive Conversational Resolver
 * 
 * Accurately classifies user inputs into specific conversational categories:
 * - A. Greetings and casual conversation
 * - B. Simple factual questions
 * - C. Complex educational questions
 * - D. Programming and technical questions
 * - E. Creative writing requests & humor
 * - F. Image and file analysis
 * - G. Follow-up questions
 * - H. General discussions
 * - I. Thanks, acknowledgements and farewells
 */

export type UserIntent =
  | 'GREETING'
  | 'CASUAL_CHAT'
  | 'THANKS'
  | 'ACKNOWLEDGEMENT'
  | 'FAREWELL'
  | 'SIMPLE_FACTUAL'
  | 'COMPLEX_EDUCATIONAL'
  | 'PROGRAMMING_TECHNICAL'
  | 'CREATIVE_WRITING'
  | 'JOKE_OR_HUMOR'
  | 'FOLLOW_UP'
  | 'CREATOR_IDENTITY'
  | 'GENERAL_DISCUSSION';

export interface IntentClassificationResult {
  intent: UserIntent;
  confidence: number;
  isSimpleConversational: boolean;
  language: 'english' | 'hindi' | 'hinglish';
  recommendedLength: 'concise' | 'normal' | 'detailed';
  followUpContext?: {
    isFollowUp: boolean;
    referencedTopic: string;
    targetLanguage?: 'hindi' | 'english';
    requiresExample?: boolean;
  };
}

// Regex patterns for greetings
const GREETING_REGEX =
  /^(hello|hi|hey|heyy|heya|hiya|greetings|good\s+(morning|afternoon|evening|day)|namaste|namaskar|pranam|ram\s*ram|salaam|adaab|hola|bonjour)[\s!.,?~-]*$/i;

// Regex patterns for casual check-ins and conversational inquiries
const CASUAL_CHAT_REGEX =
  /(how\s+(are\s+you|r\s+u|have\s+you\s+been|is\s+it\s+going|are\s+things)|what'?s\s+up|wassup|sup|kya\s+haal|kaise\s+ho|kaisi\s+ho|kaisa\s+hai|sab\s+theek|aap\s+kaise\s+hai|aap\s+kaise\s+ho|how\s+are\s+you\s+doing)/i;

// Regex patterns for thanks
const THANKS_REGEX =
  /(thank\s+you|thanks|thx|ty|thank\s+u|thanks\s+a\s+lot|thank\s+you\s+so\s+much|shukriya|dhanyawad|bahut\s+shukriya|many\s+thanks)/i;

// Regex patterns for acknowledgements
const ACKNOWLEDGEMENT_REGEX =
  /^(okay|ok|okk|okie|alright|fine|cool|got\s+it|understood|noted|thik\s+hai|theek\s+hai|accha|achha|sahi\s+hai|sure|sounds\s+good|yep|yes|haan|ha)[\s!.,?~-]*$/i;

// Regex patterns for farewells
const FAREWELL_REGEX =
  /^(bye|goodbye|bye\s+bye|cya|see\s+you|see\s+ya|tata|alvida|phir\s+milte\s+hain|good\s+night|gn|have\s+a\s+good\s+(one|day))[\s!.,?~-]*$/i;

// Follow-up patterns
const FOLLOW_UP_PATTERNS = [
  /explain\s+(it\s+)?in\s+hindi/i,
  /hindi\s+mein\s+samjhao/i,
  /hindi\s+me\s+batao/i,
  /in\s+hindi(\s+please)?/i,
  /now\s+explain\s+with\s+(an?\s+)?example/i,
  /give\s+(me\s+)?(an?\s+)?example/i,
  /example\s+dekar\s+samjhao/i,
  /example\s+batao/i,
  /tell\s+me\s+more/i,
  /explain\s+further/i,
  /what\s+are\s+its\s+(functions|parts|uses|benefits)/i,
  /its\s+main\s+functions/i,
  /what\s+else/i,
  /how\s+does\s+it\s+work/i,
];

/**
 * Detect language of the input
 */
export function detectInputLanguage(text: string): 'english' | 'hindi' | 'hinglish' {
  const trimmed = text.trim();
  if (/[\u0900-\u097F]/.test(trimmed)) {
    return 'hindi';
  }
  const hinglishMarkers = /\b(namaste|kaise|kaisi|kaisa|kya|kyun|kyu|kar|karo|karna|raha|rahe|rahi|hai|hain|ho|hoon|nahi|nahin|haan|bhai|batao|samjhao|mujhe|mera|aap|tum|thik|achha|bahut)\b/i;
  if (hinglishMarkers.test(trimmed)) {
    return 'hinglish';
  }
  return 'english';
}

/**
 * Extracts the primary conversational topic from previous user and assistant turns
 */
export function extractPriorTopic(messages: any[], currentPrompt: string): string {
  if (!messages || messages.length === 0) return '';

  const cleanPrompt = currentPrompt.trim().toLowerCase();
  const priorTurns = messages.filter((m: any) => m && m.content && m.content.trim().toLowerCase() !== cleanPrompt);

  if (priorTurns.length === 0) return '';

  // Look backwards for user queries first
  for (let i = priorTurns.length - 1; i >= 0; i--) {
    const msg = priorTurns[i];
    if (msg.role === 'user' && msg.content) {
      const text = msg.content.toLowerCase();
      if (text.includes('python')) return 'python programming';
      if (text.includes('photosynthesis')) return 'photosynthesis';
      if (text.includes('artificial intelligence') || text.includes(' ai ')) return 'artificial intelligence';
      if (text.includes('digestive system') || text.includes('digestion')) return 'human digestive system';
      if (text.includes('quantum')) return 'quantum physics';
      if (text.includes('solar system')) return 'solar system';
      if (text.length > 5 && text.length < 100 && !GREETING_REGEX.test(text) && !THANKS_REGEX.test(text)) {
        return msg.content.trim();
      }
    }
  }

  // Check assistant content
  for (let i = priorTurns.length - 1; i >= 0; i--) {
    const msg = priorTurns[i];
    if ((msg.role === 'model' || msg.role === 'assistant') && msg.content) {
      const text = msg.content.toLowerCase();
      if (text.includes('python')) return 'python programming';
      if (text.includes('photosynthesis')) return 'photosynthesis';
      if (text.includes('artificial intelligence') || text.includes(' ai ')) return 'artificial intelligence';
      if (text.includes('digestive system')) return 'human digestive system';
    }
  }

  return '';
}

/**
 * Classifies user intent with high precision
 */
export function classifyUserIntent(prompt: string, messages: any[] = []): IntentClassificationResult {
  const clean = (prompt || '').trim();
  const lower = clean.toLowerCase();
  const lang = detectInputLanguage(clean);

  // 1. Creator and Developer Identity
  const isCreator =
    /who\s+(created|made|developed|built|designed|owns?|coded)\s+(you|this|kyron|ultimate|the\s+ai)/i.test(lower) ||
    /who\s+is\s+your\s+(creator|developer|maker|owner|author|founder|boss)/i.test(lower) ||
    /(tumhe|aapko|tujhe|is\s+ai\s+ko|kyron\s+ko)\s+kisne\s+banaya/i.test(lower) ||
    /(tumhara|aapka|kyron\s+ka)\s+(creator|developer|malik|owner|founder)\s+kaun/i.test(lower) ||
    /(kisne\s+banaya|kisne\s+create\s+kiya)\s*(hai|tumhe|aapko|kyron)?/i.test(lower) ||
    /who\s+is\s+sachin/i.test(lower) ||
    /sachin\s+kaun\s+hai/i.test(lower);

  if (isCreator) {
    return {
      intent: 'CREATOR_IDENTITY',
      confidence: 1.0,
      isSimpleConversational: false,
      language: lang,
      recommendedLength: 'concise',
    };
  }

  // 2. Greetings
  if (GREETING_REGEX.test(lower)) {
    return {
      intent: 'GREETING',
      confidence: 1.0,
      isSimpleConversational: true,
      language: lang,
      recommendedLength: 'concise',
    };
  }

  // 3. Casual chat check-in ("How are you?", "Kaise ho?")
  if (CASUAL_CHAT_REGEX.test(lower)) {
    return {
      intent: 'CASUAL_CHAT',
      confidence: 1.0,
      isSimpleConversational: true,
      language: lang,
      recommendedLength: 'concise',
    };
  }

  // Combined Greeting + Casual ("Hi, how are you?", "Hello kaise ho?")
  if (/^(hello|hi|hey)[\s,]+(how\s+are\s+you|how\s+r\s+u|kaise\s+ho|what's\s+up)[\s!.,?]*$/i.test(lower)) {
    return {
      intent: 'CASUAL_CHAT',
      confidence: 1.0,
      isSimpleConversational: true,
      language: lang,
      recommendedLength: 'concise',
    };
  }

  // 4. Thanks & Gratitude
  if (THANKS_REGEX.test(lower)) {
    return {
      intent: 'THANKS',
      confidence: 1.0,
      isSimpleConversational: true,
      language: lang,
      recommendedLength: 'concise',
    };
  }

  // 5. Acknowledgements
  if (ACKNOWLEDGEMENT_REGEX.test(lower)) {
    return {
      intent: 'ACKNOWLEDGEMENT',
      confidence: 1.0,
      isSimpleConversational: true,
      language: lang,
      recommendedLength: 'concise',
    };
  }

  // 6. Farewells
  if (FAREWELL_REGEX.test(lower)) {
    return {
      intent: 'FAREWELL',
      confidence: 1.0,
      isSimpleConversational: true,
      language: lang,
      recommendedLength: 'concise',
    };
  }

  // 7. Follow-up Intent ("Explain it in Hindi", "Now explain with an example", etc.)
  const isFollowUpPattern = FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(lower));
  if (isFollowUpPattern || lower.startsWith('okay, now explain') || lower.startsWith('now explain')) {
    const priorTopic = extractPriorTopic(messages, clean);
    const targetLang = /hindi/i.test(lower) ? 'hindi' : undefined;
    const requiresExample = /example/i.test(lower);

    return {
      intent: 'FOLLOW_UP',
      confidence: 0.95,
      isSimpleConversational: false,
      language: targetLang || lang,
      recommendedLength: 'normal',
      followUpContext: {
        isFollowUp: true,
        referencedTopic: priorTopic,
        targetLanguage: targetLang,
        requiresExample,
      },
    };
  }

  // 8. Jokes & Humor
  if (/^(tell\s+(me\s+)?a\s+joke|make\s+me\s+laugh|crack\s+a\s+joke|koi\s+joke\s+sunao|joke\s+batao)[\s!.,?]*$/i.test(lower)) {
    return {
      intent: 'JOKE_OR_HUMOR',
      confidence: 0.98,
      isSimpleConversational: true,
      language: lang,
      recommendedLength: 'concise',
    };
  }

  // 9. Simple Factual Questions (e.g. "What is 2 + 2?", "2 + 2", "Capital of France")
  const isSimpleMath = /^(what\s+is\s+)?(\d+[\s\+\-\*\/x×÷\^]+\d+)(\s*=\s*\?)?[\s?]*$/i.test(lower) ||
    /^(2\s*\+\s*2|two\s+plus\s+two)[\s?]*$/i.test(lower);
  const isSimpleFact = /^(what\s+is\s+the\s+capital\s+of\s+[a-z\s]+|who\s+was\s+the\s+first\s+president\s+of\s+[a-z\s]+)[\s?]*$/i.test(lower);

  if (isSimpleMath || isSimpleFact) {
    return {
      intent: 'SIMPLE_FACTUAL',
      confidence: 0.95,
      isSimpleConversational: true,
      language: lang,
      recommendedLength: 'concise',
    };
  }

  // 10. Creative Writing & Essays
  if (
    /write\s+(a\s+)?(detailed\s+)?essay/i.test(lower) ||
    /write\s+a\s+(story|poem|letter|article|speech|script)/i.test(lower)
  ) {
    return {
      intent: 'CREATIVE_WRITING',
      confidence: 0.95,
      isSimpleConversational: false,
      language: lang,
      recommendedLength: 'detailed',
    };
  }

  // 11. Programming and Technical Questions
  if (
    lower.includes('programming') ||
    lower.includes('write code') ||
    lower.includes('how to code') ||
    lower.includes('in python') ||
    lower.includes('in javascript') ||
    lower.includes('in typescript') ||
    lower.includes('function in') ||
    lower.includes('class in') ||
    lower.includes('what is python') ||
    lower.includes('what is react') ||
    lower.includes('algorithm')
  ) {
    return {
      intent: 'PROGRAMMING_TECHNICAL',
      confidence: 0.9,
      isSimpleConversational: false,
      language: lang,
      recommendedLength: 'normal',
    };
  }

  // 12. Complex Educational Questions
  if (
    lower.includes('in detail') ||
    lower.includes('explain photosynthesis') ||
    lower.includes('digestive system') ||
    lower.includes('quantum mechanics') ||
    lower.includes('cellular respiration') ||
    lower.includes('comprehensive breakdown') ||
    lower.includes('step by step') ||
    lower.startsWith('explain how') ||
    lower.startsWith('explain why')
  ) {
    return {
      intent: 'COMPLEX_EDUCATIONAL',
      confidence: 0.9,
      isSimpleConversational: false,
      language: lang,
      recommendedLength: 'detailed',
    };
  }

  // Default: General Discussion
  return {
    intent: 'GENERAL_DISCUSSION',
    confidence: 0.8,
    isSimpleConversational: false,
    language: lang,
    recommendedLength: 'normal',
  };
}
