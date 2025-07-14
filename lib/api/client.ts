import axios, { AxiosError } from 'axios';

// Use environment variable for API URL, with fallback for production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://evento.so/api';

// Create the main API client for session-based authentication
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important: includes session cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Response interceptor for handling errors and data extraction
apiClient.interceptors.response.use(
  (response) => {
    // For successful responses, return the data directly
    return response.data;
  },
  (error: AxiosError) => {
    // Extract error message from response
    const errorMessage = (error.response?.data as any)?.message || error.message || 'An unexpected error occurred';
    
    // Create a standardized error object
    const apiError = {
      message: errorMessage,
      status: error.response?.status,
      success: false,
    };
    
    return Promise.reject(apiError);
  }
);

// No request interceptor needed - cookies handle authentication automatically

export default apiClient;