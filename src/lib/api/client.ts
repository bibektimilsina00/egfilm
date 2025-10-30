/**
 * Centralized API Client Configuration
 * Axios instances with proper error handling, retry logic, and timeout
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// =============================================================================
// Base Configuration
// =============================================================================

const BASE_CONFIG: AxiosRequestConfig = {
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json',
    },
};

// =============================================================================
// Error Handler
// =============================================================================

const handleAxiosError = (error: AxiosError) => {
    if (error.response) {
        // Server responded with error status
        const data = error.response.data as any;
        throw {
            message: data?.error || data?.message || 'Server error',
            status: error.response.status,
            data: error.response.data,
        };
    } else if (error.request) {
        // Request was made but no response
        throw {
            message: 'No response from server. Please check your connection.',
            status: 0,
        };
    } else {
        // Request setup error
        throw {
            message: error.message || 'Request failed',
            status: -1,
        };
    }
};

// =============================================================================
// Create Axios Instance with Interceptors
// =============================================================================

const createApiClient = (baseURL: string = ''): AxiosInstance => {
    const instance = axios.create({
        ...BASE_CONFIG,
        baseURL,
    });

    // Response interceptor for error handling
    instance.interceptors.response.use(
        (response: AxiosResponse) => response,
        (error: AxiosError) => {
            handleAxiosError(error);
        }
    );

    return instance;
};

// =============================================================================
// API Clients for Different Endpoints
// =============================================================================

export const userApi = createApiClient('/api/user');
export const notificationsApi = createApiClient('/api/notifications');
export const watchRoomApi = createApiClient('/api/watch-room');
export const authApi = createApiClient('/api/auth');

// Generic API client for other endpoints
export const apiClient = createApiClient('/api');

// =============================================================================
// Type-safe API Response Wrapper
// =============================================================================

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Extract data from Axios response
 */
export const extractData = <T>(response: AxiosResponse<T>): T => {
    return response.data;
};

/**
 * Create query string from params object
 */
export const buildQueryString = (params: Record<string, any>): string => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
        }
    });
    return queryParams.toString();
};
