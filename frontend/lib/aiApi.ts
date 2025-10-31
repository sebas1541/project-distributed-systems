import { API_ENDPOINTS, STORAGE_KEYS } from '@/lib/constants';
import type { User } from '@/types/auth.types';

export interface TranscriptionResponse {
  success: boolean;
  transcription: string;
  filename: string;
  taskCreated?: boolean;
  taskData?: {
    title: string;
    description: string;
    dueDate: string | null;
    priority: 'low' | 'medium' | 'high';
  };
}

export const aiApi = {
  /**
   * Transcribe audio file using Whisper and create task via NLP
   */
  async transcribe(audioBlob: Blob): Promise<TranscriptionResponse> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    // Get user ID from localStorage
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    const user: User | null = userStr ? JSON.parse(userStr) : null;

    const headers: Record<string, string> = {};
    if (user?.id) {
      headers['x-user-id'] = user.id;
    }

    // AI service runs locally but proxied through Traefik
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost'}${API_ENDPOINTS.AI.TRANSCRIBE}`, {
      method: 'POST',
      body: formData,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Transcription failed' }));
      throw new Error(error.message || 'Failed to transcribe audio');
    }

    return response.json();
  },
};
