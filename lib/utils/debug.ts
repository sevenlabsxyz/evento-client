/**
 * Debug utilities for logging API responses and data flow
 */

export function debugLog(component: string, message: string, data?: any) {
  const separator = '='.repeat(50);
  console.log(`\n${separator}`);
  console.log(`[${component}] ${message}`);
  if (data !== undefined) {
    console.log('Data:', JSON.stringify(data, null, 2));
  }
  console.log(`${separator}\n`);
}

export function debugError(component: string, message: string, error: any, context?: any) {
  const separator = '!'.repeat(50);
  console.error(`\n${separator}`);
  console.error(`[${component} ERROR] ${message}`);
  console.error('Error:', error);
  if (error?.stack) {
    console.error('Stack:', error.stack);
  }
  if (context !== undefined) {
    console.error('Context:', JSON.stringify(context, null, 2));
  }
  console.error(`${separator}\n`);
}

export function debugApiResponse(component: string, endpoint: string, response: any) {
  const separator = '~'.repeat(50);
  console.log(`\n${separator}`);
  console.log(`[${component}] API Response from ${endpoint}`);
  console.log('Type:', typeof response);
  console.log('Is Array:', Array.isArray(response));
  console.log('Keys:', response && typeof response === 'object' ? Object.keys(response) : 'N/A');
  console.log('Full Response:', JSON.stringify(response, null, 2));
  console.log(`${separator}\n`);
}
