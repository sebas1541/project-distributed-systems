import { API_ENDPOINTS } from '@/lib/constants';

export interface TranscriptionResponse {
  success: boolean;
  transcription: string;
  filename: string;
}

export const aiApi = {
  /**
   * Transcribe audio file using Whisper
   */
  async transcribe(audioBlob: Blob): Promise<TranscriptionResponse> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    // AI service runs locally but proxied through Traefik
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost'}${API_ENDPOINTS.AI.TRANSCRIBE}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Transcription failed' }));
      throw new Error(error.message || 'Failed to transcribe audio');
    }

    return response.json();
  },
};
