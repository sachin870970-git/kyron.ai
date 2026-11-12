/**
 * KYRON.AI Server-Side Quota & Request Engine
 * - Centralized request concurrency & queue management
 * - In-memory LRU/TTL response caching to prevent duplicate API quota burns
 * - 429 RESOURCE_EXHAUSTED detection distinguishing daily quota vs. temporary rate limits
 * - Dynamic model failover without hammering exhausted models
 * - Usage analytics & telemetry
 */

export interface QuotaClassification {
  is429: boolean;
  isDailyQuota: boolean;
  retryDelayMs: number;
  friendlyMessage: string;
  originalError: string;
}

export interface ServerApiMetrics {
  totalRequests: number;
  todayRequests: number;
  rateLimit429Errors: number;
  dailyQuotaExhaustedErrors: number;
  cacheHits: number;
  modelUsage: Record<string, number>;
  last429Timestamp: number | null;
  lastResetTimestamp: number;
  estimatedTokens: number;
  dailyQuotaLimit: number;
  activeProvider: string;
}

class ServerQuotaManager {
  private metrics: ServerApiMetrics = {
    totalRequests: 0,
    todayRequests: 0,
    rateLimit429Errors: 0,
    dailyQuotaExhaustedErrors: 0,
    cacheHits: 0,
    modelUsage: {},
    last429Timestamp: null,
    lastResetTimestamp: Date.now(),
    estimatedTokens: 0,
    dailyQuotaLimit: 1500,
    activeProvider: 'google-gemini',
  };

  // Model status: records when a model has hit daily quota or temporary rate limit
  private modelStatus: Map<string, { isDailyExhausted: boolean; exhaustedAt: number; retryUntil: number }> = new Map();

  // In-memory cache: hash -> { text: string, timestamp: number, model: string }
  private cache: Map<string, { text: string; timestamp: number; model: string }> = new Map();
  private readonly CACHE_MAX_SIZE = 150;
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

  // Concurrency limiter: max concurrent outbound calls
  private currentActiveRequests = 0;
  private readonly MAX_CONCURRENT_REQUESTS = 4;
  private requestQueue: Array<() => void> = [];

  constructor() {
    // Check reset daily at midnight UTC
    setInterval(() => {
      this.checkDailyReset();
    }, 60 * 1000);
  }

  private checkDailyReset() {
    const now = new Date();
    const lastReset = new Date(this.metrics.lastResetTimestamp);
    if (now.getUTCDate() !== lastReset.getUTCDate() || now.getTime() - this.metrics.lastResetTimestamp > 24 * 3600 * 1000) {
      this.metrics.todayRequests = 0;
      this.metrics.lastResetTimestamp = Date.now();
      this.modelStatus.clear();
      console.log('[QuotaManager] Daily quota cycle reset at Midnight UTC');
    }
  }

  /**
   * Acquire a slot in the concurrency queue (10s timeout)
   */
  public async acquireSlot(timeoutMs = 10000): Promise<void> {
    if (this.currentActiveRequests < this.MAX_CONCURRENT_REQUESTS) {
      this.currentActiveRequests++;
      return;
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.requestQueue.indexOf(proceed);
        if (idx !== -1) this.requestQueue.splice(idx, 1);
        reject(new Error('Server request queue timeout. Please retry in a few moments.'));
      }, timeoutMs);

      const proceed = () => {
        clearTimeout(timer);
        this.currentActiveRequests++;
        resolve();
      };

      this.requestQueue.push(proceed);
    });
  }

  /**
   * Release a slot when request completes
   */
  public releaseSlot(): void {
    this.currentActiveRequests = Math.max(0, this.currentActiveRequests - 1);
    if (this.requestQueue.length > 0 && this.currentActiveRequests < this.MAX_CONCURRENT_REQUESTS) {
      const next = this.requestQueue.shift();
      if (next) next();
    }
  }

  /**
   * Classify API error and extract retry information
   */
  public classifyError(err: any): QuotaClassification {
    const message = (err?.message || '').toLowerCase();
    const status = err?.status || err?.code || 0;

    const is429 =
      status === 429 ||
      message.includes('429') ||
      message.includes('resource_exhausted') ||
      message.includes('quota') ||
      message.includes('rate limit');

    // Daily quota exhaustion detection
    const isDailyQuota =
      message.includes('daily request limit exceeded') ||
      message.includes('generate_content_free_tier_requests') ||
      message.includes('per-day') ||
      message.includes('daily limit');

    // Extract retry delay if available from headers or error details
    let retryDelayMs = 10000; // default 10s
    if (err?.details) {
      const detailsStr = JSON.stringify(err.details);
      const match = detailsStr.match(/"retryDelay":\s*"(\d+)s"/i);
      if (match) {
        retryDelayMs = parseInt(match[1]) * 1000;
      }
    }
    const matchSeconds = message.match(/retry in\s+(\d+)\s*s/i) || message.match(/after\s+(\d+)\s*s/i);
    if (matchSeconds) {
      retryDelayMs = parseInt(matchSeconds[1]) * 1000;
    }

    if (is429) {
      this.metrics.rateLimit429Errors++;
      this.metrics.last429Timestamp = Date.now();
      if (isDailyQuota) {
        this.metrics.dailyQuotaExhaustedErrors++;
      }
    }

    let cleanError = err?.message || 'AI engine communication error';
    try {
      if (cleanError.includes('{') && cleanError.includes('}')) {
        const jsonMatch = cleanError.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const innerMsg = parsed?.error?.message || parsed?.message;
          if (typeof innerMsg === 'string') {
            try {
              const nested = JSON.parse(innerMsg);
              if (nested?.error?.message) cleanError = nested.error.message;
              else cleanError = innerMsg;
            } catch {
              cleanError = innerMsg;
            }
          }
        }
      }
    } catch {}

    if (cleanError.includes('high demand') || cleanError.includes('503') || cleanError.includes('UNAVAILABLE')) {
      cleanError = 'The AI model is currently experiencing high traffic. Please retry in a few seconds.';
    }

    const friendlyMessage = isDailyQuota
      ? 'Your AI request limit has been reached. Please try again after the quota resets or switch to an available paid API plan.'
      : is429
      ? `AI rate limit reached. Server will auto-retry or switch models in ${Math.round(retryDelayMs / 1000)}s.`
      : cleanError;

    return {
      is429,
      isDailyQuota,
      retryDelayMs,
      friendlyMessage,
      originalError: cleanError,
    };
  }

  /**
   * Mark a model as exhausted so subsequent calls don't pointlessly hammer it
   */
  public markModelExhausted(model: string, isDaily: boolean, retryDelayMs = 15000): void {
    const now = Date.now();
    const duration = isDaily ? 6 * 3600 * 1000 : retryDelayMs + 2000;
    this.modelStatus.set(model, {
      isDailyExhausted: isDaily,
      exhaustedAt: now,
      retryUntil: now + duration,
    });
    console.warn(`[QuotaManager] Model ${model} marked as ${isDaily ? 'DAILY EXHAUSTED' : 'TEMPORARILY RATE-LIMITED'} until ${new Date(now + duration).toLocaleTimeString()}`);
  }

  /**
   * Check if a model is currently eligible for invocation
   */
  public isModelAvailable(model: string): boolean {
    const status = this.modelStatus.get(model);
    if (!status) return true;
    if (Date.now() > status.retryUntil) {
      this.modelStatus.delete(model);
      return true;
    }
    return false;
  }

  /**
   * Select best eligible model from candidates list
   */
  public getEligibleModels(candidates: string[]): string[] {
    const available = candidates.filter((m) => this.isModelAvailable(m));
    if (available.length > 0) return available;
    // If all are marked rate-limited, return all to allow fallback attempt
    return candidates;
  }

  /**
   * Cache Lookup for identical prompts
   */
  public getCachedResponse(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }
    this.metrics.cacheHits++;
    return entry.text;
  }

  /**
   * Cache Store
   */
  public setCachedResponse(key: string, text: string, model: string): void {
    if (!key || !text || text.length < 5) return;
    if (this.cache.size >= this.CACHE_MAX_SIZE) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, {
      text,
      timestamp: Date.now(),
      model,
    });
  }

  /**
   * Record successful request
   */
  public recordSuccess(model: string, tokens: number): void {
    this.metrics.totalRequests++;
    this.metrics.todayRequests++;
    this.metrics.modelUsage[model] = (this.metrics.modelUsage[model] || 0) + 1;
    this.metrics.estimatedTokens += tokens;
  }

  /**
   * Retrieve snapshot of system metrics
   */
  public getMetrics(): ServerApiMetrics {
    this.checkDailyReset();
    return { ...this.metrics };
  }

  /**
   * Admin set daily limit
   */
  public setDailyLimit(limit: number): void {
    if (limit > 0) {
      this.metrics.dailyQuotaLimit = limit;
    }
  }

  /**
   * Calculate next reset estimate
   */
  public getResetEstimate(): string {
    const now = new Date();
    const nextMidnight = new Date();
    nextMidnight.setUTCHours(24, 0, 0, 0);
    const diffMs = nextMidnight.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m (Midnight UTC)`;
  }
}

export const quotaManager = new ServerQuotaManager();
