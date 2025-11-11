'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Mic, Square, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceRecordingModalProps {
  open: boolean;
  onClose: () => void;
  onRecordingComplete: (audioBlob: Blob) => void;
}

type RecordingState = 'idle' | 'recording' | 'stopped' | 'processing';

export function VoiceRecordingModal({ open, onClose, onRecordingComplete }: VoiceRecordingModalProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start recording when modal opens
  useEffect(() => {
    if (open) {
      startRecording();
    } else {
      cleanup();
    }
    
    return () => cleanup();
  }, [open]);

  const cleanup = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setRecordingState('idle');
    setRecordingTime(0);
    setAudioLevel(0);
    setError('');
    audioChunksRef.current = [];
  };

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        if (audioBlob.size > 0) {
          setRecordingState('processing');
          setTimeout(() => {
            onRecordingComplete(audioBlob);
          }, 500);
        }
      };

      // Set up audio analysis for visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Start recording
      mediaRecorder.start();
      setRecordingState('recording');
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start visualization
      visualize();
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setError(err.message || 'No se pudo acceder al micrófono. Por favor verifica los permisos.');
      setRecordingState('idle');
    }
  };

  const visualize = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      setAudioLevel(average / 255); // Normalize to 0-1
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecordingState('stopped');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center animate-in fade-in duration-300">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 text-gray-600 hover:text-black transition-colors"
        aria-label="Close"
      >
        <X className="h-8 w-8" />
      </button>

      <div className="flex flex-col items-center justify-center gap-8 px-6">
        {/* Status text */}
        <div className="text-center">
          {error ? (
            <div className="text-black text-xl font-medium mb-2">⚠️ Error</div>
          ) : recordingState === 'recording' ? (
            <>
              <div className="text-gray-700 text-lg mb-2">Escuchando...</div>
              <div className="text-black font-bold text-3xl">{formatTime(recordingTime)}</div>
            </>
          ) : recordingState === 'processing' ? (
            <div className="text-black text-xl font-medium">Procesando...</div>
          ) : (
            <div className="text-black text-xl font-medium">Preparando...</div>
          )}
        </div>

        {/* Voice wave visualization */}
                {/* Voice wave visualization */}
        <div className="flex items-center justify-center gap-2 h-32">
          {error ? (
            <div className="text-gray-700 text-center max-w-md">{error}</div>
          ) : (
            Array.from({ length: 5 }).map((_, i) => {
              const heightMultiplier = recordingState === 'recording' 
                ? Math.max(0.2, audioLevel + Math.sin(Date.now() / 200 + i) * 0.3)
                : 0.2;
              
              return (
                <div
                  key={i}
                  className="bg-black rounded-full transition-all duration-100"
                  style={{
                    width: '12px',
                    height: `${heightMultiplier * 120}px`,
                    opacity: recordingState === 'recording' ? 0.9 : 0.3,
                  }}
                />
              );
            })
          )}
        </div>

        {/* Recording indicator */}
        {recordingState === 'recording' && !error && (
          <div className="flex items-center gap-2 text-gray-700">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm">Grabando...</span>
          </div>
        )}

        {/* Processing spinner */}
        {recordingState === 'processing' && (
          <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
        )}

        {/* Controls */}
        {recordingState === 'recording' && !error && (
          <Button
            onClick={stopRecording}
            size="lg"
            className="bg-black text-white hover:bg-gray-800 rounded-full h-16 w-16 shadow-xl"
          >
            <Square className="h-6 w-6" />
          </Button>
        )}

        {/* Error retry */}
        {error && (
          <Button
            onClick={handleClose}
            className="bg-black text-white hover:bg-gray-800"
          >
            Cerrar
          </Button>
        )}

        {/* Instructions */}
        {recordingState === 'recording' && !error && (
          <p className="text-gray-600 text-sm text-center max-w-md">
            Habla claramente para describir tu tarea.<br />
            Presiona el botón para detener la grabación.
          </p>
        )}
      </div>
    </div>
  );
}
