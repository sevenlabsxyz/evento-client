/**
 * Centralized logging utility for production debugging
 * Provides structured logging with request tracing and data sanitization
 */

import { Env } from '../constants/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
	requestId?: string;
	userId?: string;
	userAgent?: string;
	ip?: string;
	url?: string;
	method?: string;
	statusCode?: number;
	duration?: number;
	[key: string]: any;
}

interface ApiRequestLog extends LogContext {
	type: 'api_request';
	endpoint: string;
	headers?: Record<string, string>;
	body?: any;
	timestamp: string;
}

interface ApiResponseLog extends LogContext {
	type: 'api_response';
	endpoint: string;
	headers?: Record<string, string>;
	body?: any;
	bodySize?: number;
	timestamp: string;
}

interface ApiErrorLog extends LogContext {
	type: 'api_error';
	endpoint: string;
	error: string;
	stack?: string;
	timestamp: string;
}

type LogEntry = ApiRequestLog | ApiResponseLog | ApiErrorLog;

class Logger {
	private isDevelopment = Env.NODE_ENV === 'development';
	private isProduction = Env.NODE_ENV === 'production';

	/**
	 * Generate a unique request ID for tracing
	 */
	generateRequestId(): string {
		return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Sanitize sensitive data from objects
	 */
	private sanitizeData(data: any): any {
		if (!data || typeof data !== 'object') {
			return data;
		}

		const sensitiveKeys = [
			'password',
			'token',
			'authorization',
			'auth',
			'api_key',
			'apikey',
			'secret',
			'cookie',
			'session',
			'jwt',
			'bearer',
		];

		if (Array.isArray(data)) {
			return data.map((item) => this.sanitizeData(item));
		}

		const sanitized = { ...data };

		for (const key in sanitized) {
			const lowerKey = key.toLowerCase();

			if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
				sanitized[key] = '[REDACTED]';
			} else if (typeof sanitized[key] === 'object') {
				sanitized[key] = this.sanitizeData(sanitized[key]);
			}
		}

		return sanitized;
	}

	/**
	 * Format log entry for output
	 */
	private formatLog(level: LogLevel, message: string, context?: LogContext): string {
		const timestamp = new Date().toISOString();

		if (this.isDevelopment) {
			// Pretty format for development
			const contextStr = context ? `\n${JSON.stringify(context, null, 2)}` : '';
			return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
		} else {
			// JSON format for production (easier to parse)
			return JSON.stringify({
				timestamp,
				level,
				message,
				...context,
			});
		}
	}

	/**
	 * Write log to console (in production, this would typically go to a logging service)
	 */
	private writeLog(level: LogLevel, message: string, context?: LogContext): void {
		const formattedLog = this.formatLog(level, message, context);

		switch (level) {
			case 'debug':
				if (this.isDevelopment) console.debug(formattedLog);
				break;
			case 'info':
				console.info(formattedLog);
				break;
			case 'warn':
				console.warn(formattedLog);
				break;
			case 'error':
				console.error(formattedLog);
				break;
		}
	}

	/**
	 * Log API request
	 */
	logApiRequest(
		endpoint: string,
		options: {
			requestId?: string;
			method?: string;
			headers?: Record<string, string>;
			body?: any;
			userAgent?: string;
			ip?: string;
		} = {}
	): void {
		const context: ApiRequestLog = {
			type: 'api_request',
			endpoint,
			timestamp: new Date().toISOString(),
			requestId: options.requestId,
			method: options.method,
			headers: this.sanitizeData(options.headers),
			body: this.sanitizeData(options.body),
			userAgent: options.userAgent,
			ip: options.ip,
		};

		this.writeLog('info', `API Request: ${options.method || 'UNKNOWN'} ${endpoint}`, context);
	}

	/**
	 * Log API response
	 */
	logApiResponse(
		endpoint: string,
		options: {
			requestId?: string;
			statusCode?: number;
			headers?: Record<string, string>;
			body?: any;
			bodySize?: number;
			duration?: number;
		} = {}
	): void {
		const context: ApiResponseLog = {
			type: 'api_response',
			endpoint,
			timestamp: new Date().toISOString(),
			requestId: options.requestId,
			statusCode: options.statusCode,
			headers: this.sanitizeData(options.headers),
			body: this.sanitizeData(options.body),
			bodySize: options.bodySize,
			duration: options.duration,
		};

		const level = options.statusCode && options.statusCode >= 400 ? 'warn' : 'info';
		this.writeLog(level, `API Response: ${options.statusCode || 'UNKNOWN'} ${endpoint}`, context);
	}

	/**
	 * Log API error
	 */
	logApiError(
		endpoint: string,
		error: Error | string,
		options: {
			requestId?: string;
			method?: string;
			statusCode?: number;
			userAgent?: string;
			ip?: string;
			additionalContext?: Record<string, any>;
		} = {}
	): void {
		const errorMessage = error instanceof Error ? error.message : error;
		const stack = error instanceof Error ? error.stack : undefined;

		const context: ApiErrorLog = {
			type: 'api_error',
			endpoint,
			timestamp: new Date().toISOString(),
			requestId: options.requestId,
			method: options.method,
			statusCode: options.statusCode,
			error: errorMessage,
			stack,
			userAgent: options.userAgent,
			ip: options.ip,
			...this.sanitizeData(options.additionalContext),
		};

		this.writeLog('error', `API Error: ${errorMessage} at ${endpoint}`, context);
	}

	/**
	 * Log general information
	 */
	info(message: string, context?: LogContext): void {
		this.writeLog('info', message, context);
	}

	/**
	 * Log warnings
	 */
	warn(message: string, context?: LogContext): void {
		this.writeLog('warn', message, context);
	}

	/**
	 * Log errors
	 */
	error(message: string, context?: LogContext): void {
		this.writeLog('error', message, context);
	}

	/**
	 * Log debug information (only in development)
	 */
	debug(message: string, context?: LogContext): void {
		if (this.isDevelopment) {
			this.writeLog('debug', message, context);
		}
	}

	/**
	 * Create a child logger with preset context
	 */
	child(presetContext: LogContext): Logger {
		const childLogger = new Logger();

		// Override methods to include preset context
		const originalLogApiRequest = childLogger.logApiRequest.bind(childLogger);
		const originalLogApiResponse = childLogger.logApiResponse.bind(childLogger);
		const originalLogApiError = childLogger.logApiError.bind(childLogger);

		childLogger.logApiRequest = (endpoint: string, options = {}) => {
			originalLogApiRequest(endpoint, { ...presetContext, ...options });
		};

		childLogger.logApiResponse = (endpoint: string, options = {}) => {
			originalLogApiResponse(endpoint, { ...presetContext, ...options });
		};

		childLogger.logApiError = (endpoint: string, error: Error | string, options = {}) => {
			originalLogApiError(endpoint, error, { ...presetContext, ...options });
		};

		return childLogger;
	}
}

// Export singleton instance
export const logger = new Logger();
export default logger;

// Export types for use in other files
export type { ApiErrorLog, ApiRequestLog, ApiResponseLog, LogContext, LogLevel };
