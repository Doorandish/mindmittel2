export type LogLevel = 'info' | 'warn' | 'error';

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  meta?: Record<string, unknown>;
}

export type LogSubscriber = (entry: SystemLogEntry) => void;

const SENSITIVE_KEY_PATTERN =
  /(api[_-]?key|password|secret|token|authorization|mongodb_uri)/i;

/**
 * Recursively scrubs sensitive fields (`apiKey`, `password`, `token`, `authorization`)
 * before log entries enter the in-memory ring buffer or SSE stream.
 */
export function redactSensitiveMetadata(
  input: Record<string, unknown>
): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      output[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      output[key] = redactSensitiveMetadata(value as Record<string, unknown>);
    } else {
      output[key] = value;
    }
  }

  return output;
}

export interface RingBufferLoggerOptions {
  maxEntries?: number;
}

/**
 * Creates a bounded in-memory Ring Buffer Logger with real-time pub/sub
 * for live Server-Sent Events (SSE) debugging in `/system`.
 */
export function createRingBufferLogger(options: RingBufferLoggerOptions = {}) {
  const maxEntries = options.maxEntries ?? 250;
  const buffer: SystemLogEntry[] = [];
  const subscribers = new Set<LogSubscriber>();
  let sequence = 0;

  function emit(
    level: LogLevel,
    moduleName: string,
    message: string,
    meta?: Record<string, unknown>
  ): SystemLogEntry {
    sequence += 1;
    const entry: SystemLogEntry = {
      id: `log_${Date.now()}_${sequence}`,
      timestamp: new Date().toISOString(),
      level,
      module: moduleName,
      message,
      meta: meta ? redactSensitiveMetadata(meta) : undefined,
    };

    buffer.push(entry);
    if (buffer.length > maxEntries) {
      buffer.shift();
    }

    for (const sub of subscribers) {
      try {
        sub(entry);
      } catch {
        // Ignore subscriber error to keep logger resilient
      }
    }

    return entry;
  }

  return {
    info: (
      moduleName: string,
      message: string,
      meta?: Record<string, unknown>
    ) => emit('info', moduleName, message, meta),
    warn: (
      moduleName: string,
      message: string,
      meta?: Record<string, unknown>
    ) => emit('warn', moduleName, message, meta),
    error: (
      moduleName: string,
      message: string,
      meta?: Record<string, unknown>
    ) => emit('error', moduleName, message, meta),
    getRecentLogs: (limit?: number): SystemLogEntry[] => {
      if (!limit || limit >= buffer.length) {
        return [...buffer];
      }
      return buffer.slice(buffer.length - limit);
    },
    subscribe: (listener: LogSubscriber): (() => void) => {
      subscribers.add(listener);
      return () => {
        subscribers.delete(listener);
      };
    },
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __mindmittelSystemLogger:
    | ReturnType<typeof createRingBufferLogger>
    | undefined;
}

if (!globalThis.__mindmittelSystemLogger) {
  const instance = createRingBufferLogger({ maxEntries: 250 });
  instance.info(
    'system.boot',
    'MindMittel V2 observability ring-buffer initialized',
    {
      ringBufferCapacity: 250,
      defaultLocale: 'en',
    }
  );
  instance.info(
    'ai.selector',
    'Dynamic Gemini model router standing by (profiles: fast | reasoning)',
    {
      cacheTtlHours: 6,
    }
  );
  instance.info(
    'rag.chunker',
    'Parent-Child RAG pipeline ready (Parent=2000 chars, Child=400 chars, dims=768)',
    {
      indexName: 'mindmittel_vector_index',
    }
  );
  globalThis.__mindmittelSystemLogger = instance;
}

export const systemLogger = globalThis.__mindmittelSystemLogger;
