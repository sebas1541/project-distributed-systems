import { apiRequest } from '@/lib/api';
import { API_ENDPOINTS, STORAGE_KEYS } from '@/lib/constants';
import {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  TaskStatus,
} from '@/types';

export const tasksApi = {
  /**
   * Get all tasks for the current user
   */
  async getTasks(status?: TaskStatus): Promise<Task[]> {
    const userId = getUserId();
    const endpoint = status
      ? `${API_ENDPOINTS.TASKS.BASE}?status=${status}`
      : API_ENDPOINTS.TASKS.BASE;

    return apiRequest<Task[]>(endpoint, {
      requiresAuth: true,
      headers: {
        'x-user-id': userId,
      },
    });
  },

  /**
   * Get upcoming tasks
   */
  async getUpcomingTasks(): Promise<Task[]> {
    const userId = getUserId();
    return apiRequest<Task[]>(API_ENDPOINTS.TASKS.UPCOMING, {
      requiresAuth: true,
      headers: {
        'x-user-id': userId,
      },
    });
  },

  /**
   * Get a specific task by ID
   */
  async getTask(id: string): Promise<Task> {
    const userId = getUserId();
    return apiRequest<Task>(API_ENDPOINTS.TASKS.BY_ID(id), {
      requiresAuth: true,
      headers: {
        'x-user-id': userId,
      },
    });
  },

  /**
   * Create a new task
   */
  async createTask(data: CreateTaskDto): Promise<Task> {
    const userId = getUserId();
    return apiRequest<Task>(API_ENDPOINTS.TASKS.BASE, {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(data),
      headers: {
        'x-user-id': userId,
      },
    });
  },

  /**
   * Update an existing task
   */
  async updateTask(id: string, data: UpdateTaskDto): Promise<Task> {
    const userId = getUserId();
    return apiRequest<Task>(API_ENDPOINTS.TASKS.BY_ID(id), {
      method: 'PATCH',
      requiresAuth: true,
      body: JSON.stringify(data),
      headers: {
        'x-user-id': userId,
      },
    });
  },

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<void> {
    const userId = getUserId();
    return apiRequest<void>(API_ENDPOINTS.TASKS.BY_ID(id), {
      method: 'DELETE',
      requiresAuth: true,
      headers: {
        'x-user-id': userId,
      },
    });
  },
};

/**
 * Helper function to get user ID from stored user
 */
function getUserId(): string {
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  if (!userStr) {
    throw new Error('User not found in storage');
  }
  
  try {
    const user = JSON.parse(userStr);
    return user.id;
  } catch {
    throw new Error('Invalid user data in storage');
  }
}
