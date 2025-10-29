'use client';

import { useState } from 'react';
import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceTaskButtonProps {
  onOpenRecording: () => void;
}

export function VoiceTaskButton({ onOpenRecording }: VoiceTaskButtonProps) {
  return (
    <Button
      onClick={onOpenRecording}
      className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-110 z-50 group"
      aria-label="Create task by voice"
    >
      <div className="relative">
        <Mic className="h-7 w-7 text-white" />
        {/* Pulse animation ring */}
        <span className="absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-ping" />
      </div>
    </Button>
  );
}
