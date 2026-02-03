const LOG_SERVER_URL = process.env.NEXT_PUBLIC_LOG_SERVER_URL || 'http://localhost:3333';
const SOURCE = 'client';

type LogLevel = 'debug' | 'info' | 'log' | 'warn' | 'error';

interface LogEntry {
  source: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

let logQueue: LogEntry[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 100;
const MAX_BATCH_SIZE = 50;

async function flushLogs() {
  if (logQueue.length === 0) return;

  const batch = logQueue.splice(0, MAX_BATCH_SIZE);

  try {
    await fetch(`${LOG_SERVER_URL}/log/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    });
  } catch {}
}

function scheduleFlush() {
  if (flushTimeout) return;
  flushTimeout = setTimeout(() => {
    flushTimeout = null;
    flushLogs();
  }, FLUSH_INTERVAL);
}

function sendLog(level: LogLevel, message: string, data?: unknown) {
  const entry: LogEntry = {
    source: SOURCE,
    level,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  logQueue.push(entry);
  scheduleFlush();
}

export const logger = {
  debug: (message: string, data?: unknown) => {
    console.debug(message, data !== undefined ? data : '');
    sendLog('debug', message, data);
  },

  info: (message: string, data?: unknown) => {
    console.info(message, data !== undefined ? data : '');
    sendLog('info', message, data);
  },

  log: (message: string, data?: unknown) => {
    console.log(message, data !== undefined ? data : '');
    sendLog('log', message, data);
  },

  warn: (message: string, data?: unknown) => {
    console.warn(message, data !== undefined ? data : '');
    sendLog('warn', message, data);
  },

  error: (message: string, data?: unknown) => {
    console.error(message, data !== undefined ? data : '');
    sendLog('error', message, data);
  },
};

export default logger;
