import { Env } from '@/lib/constants/env';
import { createClient } from '@/lib/supabase/client';
import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  type AxiosInstance,
} from 'axios';

type ApiClient = Omit<AxiosInstance, 'get' | 'post' | 'put' | 'patch' | 'delete' | 'request'> & {
  request<T = any, D = any>(config: AxiosRequestConfig<D>): Promise<T>;
  get<T = any, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<T>;
  delete<T = any, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<T>;
  head<T = any, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<T>;
  options<T = any, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<T>;
  post<T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<T>;
  put<T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<T>;
  patch<T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<T>;
};

export const apiClient: ApiClient = axios.create({
  baseURL: Env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
}) as unknown as ApiClient;

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    config.metadata = {
      requestId,
      startTime: Date.now(),
    };

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch {
      // No session available - continue without auth header
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('API request preparation failed:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig & {
      metadata?: { requestId: string; startTime: number };
    };
    const requestId = config?.metadata?.requestId;
    const startTime = config?.metadata?.startTime || Date.now();
    const duration = Date.now() - startTime;

    const errorMessage =
      (error.response?.data as any)?.message || error.message || 'An unexpected error occurred';

    console.error('API Error:', {
      url: config?.url || 'unknown',
      error: error.message,
      stack: error.stack,
      requestId,
      method: config?.method?.toUpperCase(),
      statusCode: error.response?.status,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      duration,
      responseData: error.response?.data,
      networkError: !error.response,
      timeout: error.code === 'ECONNABORTED',
    });

    const apiError = {
      message: errorMessage,
      status: error.response?.status,
      success: false,
    };

    return Promise.reject(apiError);
  }
);

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
