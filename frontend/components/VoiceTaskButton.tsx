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
      className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 hover:scale-110 z-50 group"
      aria-label="Create task by voice"
    >
      <div className="relative">
        <Mic className="h-7 w-7 text-black" />
        {/* Pulse animation ring */}
        <span className="absolute inset-0 rounded-full bg-yellow-300 opacity-75 animate-ping" />
      </div>
    </Button>
  );
}
