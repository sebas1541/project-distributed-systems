'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { ProtectedRoute } from '@/features/auth';
import { VoiceTaskButton } from '@/components/VoiceTaskButton';
import { VoiceRecordingModal } from '@/components/VoiceRecordingModal';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isRecordingOpen, setIsRecordingOpen] = useState(false);

  const handleRecordingComplete = async (audioBlob: Blob) => {
    console.log('Audio recorded:', audioBlob);
    console.log('Audio size:', audioBlob.size, 'bytes');
    console.log('Audio type:', audioBlob.type);
    
    // TODO: Send to backend for processing with Whisper
    // For now, just close the modal
    setTimeout(() => {
      setIsRecordingOpen(false);
      // Show success message or open task creation with transcription
    }, 1000);
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
