import { apiRequest } from '@/lib/api';
import { API_ENDPOINTS, STORAGE_KEYS } from '@/lib/constants';
import {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '@/types';

export const authApi = {
  /**
   * Register a new user
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );

    // Store token and user
    if (response.access_token) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.access_token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
    }

    return response;
  },

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );

    // Store token and user
    if (response.access_token) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.access_token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
    }

    return response;
  },

  /**
   * Get current user profile
   */
  async getMe(): Promise<User> {
    return apiRequest<User>(API_ENDPOINTS.AUTH.ME, {
      requiresAuth: true,
    });
  },

  /**
   * Logout user (client-side only)
   */
  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  /**
   * Get stored user
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },
};
