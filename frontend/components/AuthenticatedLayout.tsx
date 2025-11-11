'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { ProtectedRoute } from '@/features/auth';
import { VoiceTaskButton } from '@/components/VoiceTaskButton';
import { VoiceRecordingModal } from '@/components/VoiceRecordingModal';
import { toast } from 'sonner';

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
        
        // Show success toast
        toast.success('¡Tarea creada!', {
          description: result.taskData.title,
          duration: 3000,
        });
        
        // Trigger refresh if callback provided
        if (onTaskCreated) {
          onTaskCreated();
        }
      } else {
        // Task was rejected or not created
        console.warn('⚠️ Task not created from transcription:', result.transcription);
        toast.error('No se pudo crear la tarea', {
          description: 'Tu mensaje no parece ser una solicitud de tarea. Por favor, intenta describir una acción específica que necesites realizar.',
          duration: 5000,
        });
      }
      
    } catch (error) {
      console.error('Transcription error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al procesar el audio', {
        description: errorMessage,
        duration: 4000,
      });
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
