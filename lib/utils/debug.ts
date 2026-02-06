import { logger } from '@/lib/utils/logger';

/**
 * Debug utilities for logging API responses and data flow
 */

// Set to true to enable debug logging
const DEBUG_ENABLED = false;

export function debugLog(component: string, message: string, data?: any) {
  if (!DEBUG_ENABLED) return;
  const separator = '='.repeat(50);
  logger.debug(`\n${separator}`);
  logger.debug(`[${component}] ${message}`);
  if (data !== undefined) {
    logger.debug('Data', { data });
  }
  logger.debug(`${separator}\n`);
}

export function debugError(component: string, message: string, error: any, context?: any) {
  if (!DEBUG_ENABLED) return;
  const separator = '!'.repeat(50);
  logger.error(`\n${separator}`);
  logger.error(`[${component} ERROR] ${message}`);
  logger.error('Error', { error });
  if (error?.stack) {
    logger.error('Stack', { stack: error.stack });
  }
  if (context !== undefined) {
    logger.error('Context', { context });
  }
  logger.error(`${separator}\n`);
}

export function debugApiResponse(component: string, endpoint: string, response: any) {
  if (!DEBUG_ENABLED) return;
  const separator = '~'.repeat(50);
  logger.debug(`\n${separator}`);
  logger.debug(`[${component}] API Response from ${endpoint}`);
  logger.debug('Type', { type: typeof response });
  logger.debug('Is Array', { isArray: Array.isArray(response) });
  logger.debug('Keys', {
    keys: response && typeof response === 'object' ? Object.keys(response) : 'N/A',
  });
  logger.debug('Full Response', { response });
  logger.debug(`${separator}\n`);
}
