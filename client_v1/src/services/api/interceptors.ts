import {
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  AxiosError,
} from "axios";
import { storageService } from "@/services/storage/localStorage.service";
import { STORAGE_KEYS } from "@/shared/constants/storage.constants";

/**
 * Request Interceptor
 * Adds authentication token to requests
 */
export const requestInterceptor = (
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig => {
  // Add authentication token
  const token = storageService.get(STORAGE_KEYS.ACCESS_TOKEN);

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add request timestamp for logging
  //config.metadata = { startTime: new Date() };

  // Log request in development
  if (import.meta.env.DEV) {
    console.log("API Request:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      data: config.data,
    });
  }

  return config;
};

/**
 * Response Interceptor
 * Handles successful responses
 */
export const responseInterceptor = (response: AxiosResponse): AxiosResponse => {
  // Calculate request duration
  // const duration =
  //   new Date().getTime() - response.config?.metadata?.startTime?.getTime();

  // Log response in development
  if (import.meta.env.DEV) {
    console.log("API Response:", {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status,
      // duration: `${duration}ms`,
      data: response.data,
    });
  }

  return response;
};

/**
 * Error Interceptor
 * Handles error responses
 */
export const errorInterceptor = async (error: AxiosError): Promise<never> => {
  // Log error in development
  if (import.meta.env.DEV) {
    console.error("API Error:", {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
  }

  // Handle different error status codes
  if (error.response) {
    const status = error.response.status;

    switch (status) {
      case 401:
        // Unauthorized - Token expired or invalid
        await handleUnauthorized();
        break;

      case 403:
        // Forbidden - User doesn't have permission
        handleForbidden();
        break;

      case 404:
        // Not Found
        handleNotFound();
        break;

      case 422:
        // Validation Error
        handleValidationError(error);
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        // Server Error
        handleServerError();
        break;

      default:
        handleGenericError(error);
    }
  } else if (error.request) {
    // Request was made but no response received
    handleNetworkError();
  } else {
    // Something else happened
    handleGenericError(error);
  }

  return Promise.reject(error);
};

/**
 * Handle 401 Unauthorized
 */
const handleUnauthorized = async (): Promise<void> => {
  // Clear tokens
  storageService.remove(STORAGE_KEYS.ACCESS_TOKEN);
  storageService.remove(STORAGE_KEYS.REFRESH_TOKEN);

  // Redirect to login
  window.location.href = "/login";

  // Optional: Try to refresh token
  // const refreshToken = storageService.get(STORAGE_KEYS.REFRESH_TOKEN)
  // if (refreshToken) {
  //   try {
  //     const newToken = await refreshAccessToken(refreshToken)
  //     storageService.set(STORAGE_KEYS.ACCESS_TOKEN, newToken)
  //     // Retry the original request
  //   } catch {
  //     // Refresh failed, redirect to login
  //   }
  // }
};

/**
 * Handle 403 Forbidden
 */
const handleForbidden = (): void => {
  // Show notification or redirect to unauthorized page
  console.error("You do not have permission to access this resource");
  // toast.error('Access Denied')
};

/**
 * Handle 404 Not Found
 */
const handleNotFound = (): void => {
  console.error("Resource not found");
  // toast.error('Resource not found')
};

/**
 * Handle 422 Validation Error
 */
const handleValidationError = (error: AxiosError): void => {
  const errors = error.response?.data;
  console.error("Validation errors:", errors);
  // Display validation errors to user
};

/**
 * Handle 5xx Server Errors
 */
const handleServerError = (): void => {
  console.error("Server error occurred");
  // toast.error('Something went wrong. Please try again later.')
};

/**
 * Handle Network Errors
 */
const handleNetworkError = (): void => {
  console.error("Network error - No response received");
  // toast.error('Network error. Please check your connection.')
};

/**
 * Handle Generic Errors
 */
const handleGenericError = (error: AxiosError): void => {
  console.error("An error occurred:", error.message);
  // toast.error('An unexpected error occurred')
};
