import { apiClient } from "@/services/api/client";
import { AUTH_ENDPOINTS } from "./auth.endpoints";
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from "../types/auth.types";

export const authApi = {
  /**
   * Login user
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return apiClient.post(AUTH_ENDPOINTS.LOGIN, credentials);
  },

  /**
   * Register new user
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    return apiClient.post(AUTH_ENDPOINTS.REGISTER, data);
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    return apiClient.post(AUTH_ENDPOINTS.LOGOUT);
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    return apiClient.post(AUTH_ENDPOINTS.REFRESH_TOKEN, { refreshToken });
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async (): Promise<AuthResponse["user"]> => {
    return apiClient.get("/auth/me");
  },
};
