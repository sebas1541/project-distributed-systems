'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { ProtectedRoute } from '@/features/auth';
import { VoiceTaskButton } from '@/components/VoiceTaskButton';
import { VoiceRecordingModal } from '@/components/VoiceRecordingModal';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  onTaskCreated?: () => void;
}

export default function AuthenticatedLayout({
  children,
  onTaskCreated,
}: AuthenticatedLayoutProps) {
  const [isRecordingOpen, setIsRecordingOpen] = useState(false);

  const handleRecordingComplete = async (audioBlob: Blob) => {
    console.log('🎤 Audio recorded:', audioBlob);
    console.log('📊 Audio size:', audioBlob.size, 'bytes');
    console.log('🎵 Audio type:', audioBlob.type);
    
    try {
      // Import the AI API
      const { aiApi } = await import('@/lib/aiApi');
      
      console.log('🚀 Sending audio to AI service via Traefik...');
      const result = await aiApi.transcribe(audioBlob);
      
      console.log('✅ Transcription received:', result.transcription);
      
      if (result.taskCreated && result.taskData) {
        console.log('✅ Task created:', result.taskData);
        // Trigger refresh if callback provided
        if (onTaskCreated) {
          onTaskCreated();
        }
      }
      
    } catch (error) {
      console.error('Transcription error:', error);
      alert('Error al procesar el audio. Por favor intenta nuevamente.');
    } finally {
      setIsRecordingOpen(false);
    }
  };

  return (
    <ProtectedRoute>
      <Header />
      {children}
      
      {/* Voice Task Creation Button */}
      <VoiceTaskButton onOpenRecording={() => setIsRecordingOpen(true)} />
      
      {/* Voice Recording Modal */}
      <VoiceRecordingModal
        open={isRecordingOpen}
        onClose={() => setIsRecordingOpen(false)}
        onRecordingComplete={handleRecordingComplete}
      />
    </ProtectedRoute>
  );
}
