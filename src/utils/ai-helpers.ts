export interface ArtifactItem {
  id: string;
  type: 'code' | 'html' | 'markdown' | 'table';
  title: string;
  language?: string;
  content: string;
}

export interface CitationItem {
  title: string;
  url: string;
  domain: string;
  snippet?: string;
}

/**
 * Extracts code blocks and artifacts from markdown content
 */
export function parseArtifacts(content: string): ArtifactItem[] {
  if (!content) return [];
  const artifacts: ArtifactItem[] = [];
  
  // Match markdown code blocks: ```lang\ncode\n```
  const codeBlockRegex = /```([a-zA-Z0-9_-]+)?\s*([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  let index = 1;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const rawLang = (match[1] || 'text').trim().toLowerCase();
    const code = match[2].trim();
    if (!code) continue;

    let type: ArtifactItem['type'] = 'code';
    let title = `${rawLang.toUpperCase()} Snippet #${index}`;

    if (rawLang === 'html' || rawLang === 'svg' || (rawLang === 'xml' && code.includes('<svg'))) {
      type = 'html';
      title = rawLang === 'svg' ? `Vector Graphic #${index}` : `Interactive UI #${index}`;
    } else if (rawLang === 'md' || rawLang === 'markdown') {
      type = 'markdown';
      title = `Document Section #${index}`;
    } else if (rawLang === 'json' || rawLang === 'csv') {
      type = 'table';
      title = `Structured Data #${index}`;
    }

    artifacts.push({
      id: `artifact-${index}-${rawLang}`,
      type,
      title,
      language: rawLang,
      content: code,
    });
    index++;
  }

  return artifacts;
}

/**
 * Formats a timestamp into a human-readable string
 */
export function formatTimestamp(time: number | string | Date): string {
  const d = new Date(time);
  if (isNaN(d.getTime())) return '';
  
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return timeStr;
  
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timeStr}`;
}

/**
 * Calculates estimated reading time for given text
 */
export function estimateReadingTime(text: string): { words: number; minutes: number } {
  if (!text) return { words: 0, minutes: 0 };
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return { words, minutes };
}

/**
 * Cleans and sanitizes user prompt
 */
export function sanitizePrompt(text: string): string {
  if (!text) return '';
  return text.trim();
}

/**
 * Parses Google Search Grounding metadata into displayable citations
 */
export function extractCitations(groundingMetadata: any): CitationItem[] {
  if (!groundingMetadata) return [];
  const citations: CitationItem[] = [];
  const seenUrls = new Set<string>();

  // Grounding chunks from Gemini API
  const chunks = groundingMetadata.groundingChunks || [];
  for (const chunk of chunks) {
    if (chunk.web?.uri) {
      const url = chunk.web.uri;
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);

      let domain = '';
      try {
        domain = new URL(url).hostname.replace(/^www\./, '');
      } catch {
        domain = 'source';
      }

      citations.push({
        title: chunk.web.title || domain,
        url,
        domain,
      });
    }
  }

  // Web search queries if available
  const queries = groundingMetadata.webSearchQueries || [];
  if (citations.length === 0 && queries.length > 0) {
    for (const q of queries) {
      citations.push({
        title: `Search: "${q}"`,
        url: `https://www.google.com/search?q=${encodeURIComponent(q)}`,
        domain: 'google.com',
      });
    }
  }

  return citations;
}

/**
 * Filters chat sessions based on search query
 */
export function filterChatSessions<T extends { title: string; messages?: { content: string }[] }>(
  sessions: T[],
  query: string
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return sessions;

  return sessions.filter((s) => {
    if (s.title.toLowerCase().includes(q)) return true;
    if (s.messages && s.messages.some((m) => m.content.toLowerCase().includes(q))) return true;
    return false;
  });
}

/**
 * Strips markdown, HTML, code blocks, and reasoning tags for clean Web Speech API synthesis
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';

  return text
    // Remove thinking blocks
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    // Replace code blocks with spoken note
    .replace(/```[a-zA-Z0-9_-]*\n[\s\S]*?```/g, ' Code snippet omitted. ')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown links: [label](url) -> label
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove headers: #, ##, etc.
    .replace(/^#{1,6}\s+/gm, '')
    // Remove blockquotes: >
    .replace(/^>\s+/gm, '')
    // Remove bold/italics
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove bullet points / numbered lists
    .replace(/^[-*•]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Assembles speech recognition transcript accurately combining initial text,
 * finalized spoken words, and active interim speech without duplication.
 */
export function assembleTranscript(
  baseText: string,
  finalTranscript: string,
  interimTranscript: string
): string {
  const parts: string[] = [];
  if (baseText.trim()) parts.push(baseText.trim());
  if (finalTranscript.trim()) parts.push(finalTranscript.trim());
  if (interimTranscript.trim()) parts.push(interimTranscript.trim());
  return parts.join(' ').trim();
}

export interface ContextMessage {
  role: 'user' | 'model' | 'assistant' | 'system';
  content: string;
  attachments?: { name?: string; mimeType: string; data: string }[];
}

/**
 * Optimizes conversation history for ultra-low latency & constant-time multi-turn speed:
 * 1. Strips internal reasoning/thinking blocks from past turns (<thinking>...</thinking>).
 * 2. Caches/summarizes long historical assistant messages to prevent input token explosion.
 * 3. Strips heavy base64 binary attachments from older turns (retains only latest turn attachments).
 * 4. Filters out duplicate or empty messages.
 * 5. Strictly normalizes roles for Gemini API:
 *    - First turn MUST be 'user'
 *    - Turns MUST alternate strictly (user -> model -> user -> model -> user)
 *    - Merges consecutive turns of identical roles into single turns
 *    - Last turn MUST be 'user'
 */
export function pruneConversationContext(
  messages: ContextMessage[],
  maxTurns: number = 12
): ContextMessage[] {
  if (!messages || messages.length === 0) return [];

  // Filter out completely empty or invalid items
  const validMessages = messages.filter((m) => {
    const hasText = Boolean(m.content && m.content.trim());
    const hasAttach = Boolean(m.attachments && m.attachments.length > 0);
    return hasText || hasAttach;
  });

  if (validMessages.length === 0) return [];

  // Sliding window over the most recent N turns
  let windowed = validMessages.slice(-maxTurns);
  const lastIdx = windowed.length - 1;

  // Process and sanitize each turn
  const sanitized: ContextMessage[] = windowed.map((msg, idx) => {
    const isLatest = idx === lastIdx;
    const role = msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user';

    let text = msg.content ? msg.content.trim() : '';

    if (role === 'model') {
      // Remove thinking process tags from historical model turns
      text = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();

      // Retain generous context from prior responses so follow-up inquiries have full context
      if (!isLatest && text.length > 1200) {
        const simplified = text.replace(/```[a-zA-Z0-9_-]*\n[\s\S]*?```/g, ' [Code snippet provided] ');
        if (simplified.length > 1200) {
          text = simplified.slice(0, 1100) + '... [Previous context preserved]';
        } else {
          text = simplified;
        }
      }
    }

    // Only allow heavy binary attachments on the latest turn
    const attachments = isLatest && msg.attachments && msg.attachments.length > 0
      ? msg.attachments
      : undefined;

    return {
      role,
      content: text,
      attachments,
    };
  });

  // Ensure conversation starts with 'user'
  while (sanitized.length > 0 && sanitized[0].role !== 'user') {
    sanitized.shift();
  }

  if (sanitized.length === 0) {
    const fallback = validMessages[validMessages.length - 1];
    return [{
      role: 'user',
      content: fallback?.content || 'Hello',
      attachments: fallback?.attachments,
    }];
  }

  // Strictly alternate roles: merge consecutive identical roles
  const normalized: ContextMessage[] = [];
  for (const item of sanitized) {
    if (normalized.length === 0) {
      normalized.push(item);
    } else {
      const prev = normalized[normalized.length - 1];
      if (prev.role === item.role) {
        // Merge with previous turn
        prev.content = `${prev.content}\n${item.content}`.trim();
        if (item.attachments && item.attachments.length > 0) {
          prev.attachments = [...(prev.attachments || []), ...item.attachments];
        }
      } else {
        normalized.push(item);
      }
    }
  }

  // Ensure last turn is 'user'
  while (normalized.length > 1 && normalized[normalized.length - 1].role !== 'user') {
    normalized.pop();
  }

  return normalized;
}

/**
 * Detects if a user message is asking the AI to generate/create/draw an image
 */
export function isImageGenerationRequest(text: string): boolean {
  if (!text) return false;
  const t = text.trim().toLowerCase();

  // Explicit command patterns
  const patterns = [
    /^(?:please\s+)?(?:can\s+you\s+)?(?:could\s+you\s+)?(?:generate|create|make|draw|paint|render|produce|sketch|design)\s+(?:me\s+)?(?:an?\s+)?(?:image|picture|photo|photograph|illustration|drawing|artwork|visual|wallpaper|render)\b/i,
    /^(?:please\s+)?(?:can\s+you\s+)?(?:could\s+you\s+)?(?:draw|paint|sketch)\s+(?:me\s+)?(?:an?\s+)?/i,
    /^(?:i\s+want|i\s+need|give\s+me|show\s+me)\s+(?:an?\s+)?(?:image|picture|photo|illustration|drawing|artwork|visual|wallpaper)\s+(?:of|showing|depicting|with|for)?\b/i,
    /^(?:image|picture|photo)\s+(?:of|for|prompt)\s*:\s*/i,
    /^generate\s+image\s*:\s*/i,
    /\b(?:generate|draw|create|paint)\s+(?:an?\s+)?(?:image|picture|photo|artwork|illustration)\s+(?:of|showing|depicting|with|for)\b/i,
  ];

  // Disqualify purely informational questions about images
  if (/^(?:what\s+is|how\s+to|how\s+do|explain|can\s+you\s+explain|difference\s+between)\b/i.test(t)) {
    return false;
  }

  return patterns.some((p) => p.test(t));
}

/**
 * Extracts the clean core prompt for image generation from a conversational request
 */
export function extractImagePrompt(text: string): string {
  if (!text) return '';
  return text
    .replace(/^(?:please\s+)?(?:can\s+you\s+)?(?:could\s+you\s+)?(?:generate|create|make|draw|paint|render|produce|sketch|design)\s+(?:me\s+)?(?:an?\s+)?(?:image|picture|photo|photograph|illustration|drawing|artwork|visual|wallpaper|render)\s+(?:of|showing|depicting|with|about|for)?\s*/i, '')
    .replace(/^(?:please\s+)?(?:can\s+you\s+)?(?:could\s+you\s+)?(?:draw|paint|sketch)\s+(?:me\s+)?(?:an?\s+)?/i, '')
    .replace(/^(?:i\s+want|i\s+need|give\s+me|show\s+me)\s+(?:an?\s+)?(?:image|picture|photo|illustration|drawing|artwork|visual|wallpaper)\s+(?:of|showing|depicting|with|for)?\s*/i, '')
    .replace(/^(?:image|picture|photo)\s+(?:of|for|prompt)?\s*:\s*/i, '')
    .replace(/^generate\s+image\s*:\s*/i, '')
    .trim() || text.trim();
}

