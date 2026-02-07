type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_METHODS: Record<LogLevel, (...args: unknown[]) => void> = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const fn = LOG_METHODS[level];
  if (context) {
    fn(`[${level.toUpperCase()}] ${message}`, context);
  } else {
    fn(`[${level.toUpperCase()}] ${message}`);
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
};
