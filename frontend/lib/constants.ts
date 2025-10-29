export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    ME: '/api/auth/me',
  },
  TASKS: {
    BASE: '/api/tasks',
    BY_ID: (id: string) => `/api/tasks/${id}`,
    UPCOMING: '/api/tasks/upcoming',
  },
  AI: {
    TRANSCRIBE: '/api/ai/transcribe',
  },
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  USER: 'user',
} as const;

