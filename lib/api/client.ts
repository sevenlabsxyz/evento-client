import { Env } from '@/lib/constants/env';
import { logger } from '@/lib/utils/logger';
import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

// Create the main API client for session-based authentication
export const apiClient = axios.create({
  baseURL: Env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // Important: includes session cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const requestId = logger.generateRequestId();

    // Store request ID and start time in config for correlation
    config.metadata = {
      requestId,
      startTime: Date.now(),
    };

    // Log the outgoing request
    // logger.logApiRequest(config.url || 'unknown', {
    //   requestId,
    //   method: config.method?.toUpperCase(),
    //   headers: config.headers as Record<string, string>,
    //   body: config.data,
    //   userAgent: navigator?.userAgent,
    // });

    return config;
  },
  (error: AxiosError) => {
    logger.logApiError('request_preparation_failed', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and data extraction
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // const config = response.config as AxiosRequestConfig & {
    //   metadata?: { requestId: string; startTime: number };
    // };
    // const requestId = config.metadata?.requestId;
    // const startTime = config.metadata?.startTime || Date.now();
    // const duration = Date.now() - startTime;

    // Log successful response
    // logger.logApiResponse(config.url || 'unknown', {
    //   requestId,
    //   statusCode: response.status,
    //   headers: response.headers as Record<string, string>,
    //   body: response.data,
    //   bodySize: JSON.stringify(response.data).length,
    //   duration,
    // });

    // For successful responses, return the data directly
    return response.data;
  },
  (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig & {
      metadata?: { requestId: string; startTime: number };
    };
    const requestId = config?.metadata?.requestId;
    const startTime = config?.metadata?.startTime || Date.now();
    const duration = Date.now() - startTime;

    // Extract error message from response
    const errorMessage =
      (error.response?.data as any)?.message || error.message || 'An unexpected error occurred';

    // Log API error with full context
    logger.logApiError(config?.url || 'unknown', error, {
      requestId,
      method: config?.method?.toUpperCase(),
      statusCode: error.response?.status,
      userAgent: navigator?.userAgent,
      additionalContext: {
        duration,
        responseData: error.response?.data,
        networkError: !error.response,
        timeout: error.code === 'ECONNABORTED',
      },
    });

    // Create a standardized error object
    const apiError = {
      message: errorMessage,
      status: error.response?.status,
      success: false,
    };

    return Promise.reject(apiError);
  }
);

// Extend AxiosRequestConfig to include metadata for request correlation
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      requestId: string;
      startTime: number;
    };
  }

  interface InternalAxiosRequestConfig {
    metadata?: {
      requestId: string;
      startTime: number;
    };
  }
}

export default apiClient;
