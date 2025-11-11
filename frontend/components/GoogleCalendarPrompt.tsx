'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle } from 'lucide-react';

interface GoogleCalendarPromptProps {
  open: boolean;
  onClose: () => void;
}

export function GoogleCalendarPrompt({ open, onClose }: GoogleCalendarPromptProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.id || '1';
    
    // Store that we showed this prompt
    localStorage.setItem('calendar-prompt-shown', 'true');
    
    // Redirect to OAuth flow
    window.location.href = `http://localhost/api/scheduler/auth/google/connect?userId=${userId}`;
  };

  const handleSkip = () => {
    // Store that we showed this prompt
    localStorage.setItem('calendar-prompt-shown', 'true');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50">
            <Calendar className="h-8 w-8 text-yellow-600" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Conecta tu Google Calendar
          </DialogTitle>
          <DialogDescription className="text-center text-base space-y-3 pt-2">
            <p>
              Sincroniza automáticamente tus tareas con Google Calendar para tener 
              todo organizado en un solo lugar.
            </p>
            <div className="space-y-2 pt-4">
              <div className="flex items-start gap-3 text-left">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600">
                  Tus tareas aparecerán automáticamente en tu calendario
                </span>
              </div>
              <div className="flex items-start gap-3 text-left">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600">
                  Recibe notificaciones y recordatorios de Google
                </span>
              </div>
              <div className="flex items-start gap-3 text-left">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600">
                  Accede a tus tareas desde cualquier dispositivo
                </span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isConnecting}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Configurar después
          </Button>
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent mr-2"></div>
                Conectando...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Conectar ahora
              </>
            )}
          </Button>
        </DialogFooter>

        <p className="text-xs text-center text-gray-500 mt-4">
          Puedes conectar o desconectar tu Google Calendar en cualquier momento desde Configuración
        </p>
      </DialogContent>
    </Dialog>
  );
}
