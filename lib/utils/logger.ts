type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface ApiLogMetadata {
  method?: string;
  status?: number;
  [key: string]: unknown;
}

const DEBUG_ENABLED = process.env.NODE_ENV !== 'production';

function writeLog(level: LogLevel, message: string, metadata?: unknown) {
  if (level === 'debug' && !DEBUG_ENABLED) {
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
