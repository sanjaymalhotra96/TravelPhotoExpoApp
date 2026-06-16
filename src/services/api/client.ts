import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { API_CONFIG, STORAGE_KEYS } from '../../constants';
import { StorageService } from '../storage';
import { supabase } from '../../lib/supabase';

export class ApiError extends Error {
  status?: number;
  code?: string;
  errors?: Record<string, string[]>;

  constructor(message: string, status?: number, code?: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

const getBaseUrl = (): string => {
  const customUrl = StorageService.getString(STORAGE_KEYS.CUSTOM_API_URL);
  return customUrl || API_CONFIG.BASE_URL;
};

export const apiClient: AxiosInstance = axios.create({
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Inject Custom base URLs & Supabase Auth JWTs
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    config.baseURL = getBaseUrl();

    // Fetch active session dynamically from Supabase
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(new ApiError(error.message, undefined, 'REQUEST_SETUP_ERROR'));
  }
);

// Response Interceptor: Handle HTTP Status errors and mapping to clean ApiErrors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    let message = 'An unexpected network error occurred.';
    let status = error.response?.status;
    let code = 'NETWORK_ERROR';
    let errors: Record<string, string[]> | undefined;

    if (error.code === 'ECONNABORTED') {
      message = 'Request timed out. The backend is taking too long to respond.';
      code = 'TIMEOUT';
    } else if (error.response) {
      const responseData = error.response.data;
      message = responseData?.message || `Error (${status})`;
      code = responseData?.code || 'SERVER_ERROR';
      errors = responseData?.errors;

      switch (status) {
        case 401:
          message = 'Authentication session has expired. Please sign in again.';
          code = 'UNAUTHORIZED';
          break;
        case 403:
          message = 'Access denied. You do not have permissions for this action.';
          code = 'FORBIDDEN';
          break;
        case 404:
          message = 'The requested server resource was not found.';
          code = 'NOT_FOUND';
          break;
        case 422:
          message = responseData?.message || 'Data validation failed.';
          code = 'VALIDATION_FAILED';
          break;
        case 500:
          message = 'Internal backend server failure. Please try again later.';
          code = 'INTERNAL_SERVER_ERROR';
          break;
      }
    } else if (error.request) {
      message = 'No response received from the backend host. Please verify internet connection.';
      code = 'NO_RESPONSE';
    }

    return Promise.reject(new ApiError(message, status, code, errors));
  }
);
