import axios, { type AxiosInstance } from "axios";
import { api } from "@/core/config/api.config";
import {
  requestInterceptor,
  responseInterceptor,
  errorInterceptor,
} from "./interceptors";

/**
 * Main API Client
 * Configured Axios instance for all API calls
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: api.baseURL,
      timeout: api.timeout,
      headers: api.headers,
      withCredentials: false, // Set to true if using cookies
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(requestInterceptor, (error) =>
      Promise.reject(error),
    );

    // Response interceptor
    this.client.interceptors.response.use(
      responseInterceptor,
      errorInterceptor,
    );
  }

  /**
   * GET request
   */
  async get<T>(url: string, config = {}): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T>(url: string, data = {}, config = {}): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data = {}, config = {}): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data = {}, config = {}): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config = {}): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  /**
   * Get the underlying Axios instance
   * Use this for advanced configurations
   */
  getInstance(): AxiosInstance {
    return this.client;
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();

// Also export the class for testing or custom instances
export default ApiClient;
