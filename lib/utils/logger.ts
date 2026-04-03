type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface ApiLogMetadata {
  method?: string;
  status?: number;
  [key: string]: unknown;
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const CHAT_DEBUG_FLAG =
  process.env.NEXT_PUBLIC_CHAT_DEBUG === '1' || process.env.NEXT_PUBLIC_CHAT_DEBUG === 'true';

function isDebugEnabled() {
  if (CHAT_DEBUG_FLAG) {
    return true;
  }

  if (!IS_PRODUCTION) {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const query = new URLSearchParams(window.location.search);
    if (query.get('debugChat') === '1' || query.get('debugChat') === 'true') {
      return true;
    }
  } catch {
    // ignore query parse issues and keep defaults
  }

  return false;
}

function writeLog(level: LogLevel, message: string, metadata?: unknown) {
  if (IS_PRODUCTION && (level === 'debug' || level === 'info')) {
    if (!isDebugEnabled()) {
      return;
    }
  }

  if (level === 'debug' && !isDebugEnabled()) {
    return;
  }

  const logMethod: (...args: unknown[]) => void = console[level] ?? console.log;

  if (metadata === undefined) {
    logMethod(message);
    return;
  }

  logMethod(message, metadata);
}

export const logger = {
  debug(message: string, metadata?: unknown) {
    writeLog('debug', message, metadata);
  },

  info(message: string, metadata?: unknown) {
    writeLog('info', message, metadata);
  },

  warn(message: string, metadata?: unknown) {
    writeLog('warn', message, metadata);
  },

  error(message: string, metadata?: unknown) {
    writeLog('error', message, metadata);
  },

  logApiRequest(url: string, metadata?: ApiLogMetadata) {
    writeLog('debug', `[API Request] ${url}`, metadata);
  },

  logApiResponse(url: string, metadata?: ApiLogMetadata) {
    writeLog('debug', `[API Response] ${url}`, metadata);
  },
};
