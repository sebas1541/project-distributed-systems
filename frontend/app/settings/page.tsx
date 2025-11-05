'use client';

import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';

export default function SettingsPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnectionStatus();
    
    // Check if we just came back from OAuth callback
    const params = new URLSearchParams(window.location.search);
    const calendarStatus = params.get('calendar');
    
    if (calendarStatus === 'connected') {
      setIsConnected(true);
      // Clean up URL
      window.history.replaceState({}, '', '/settings');
    } else if (calendarStatus === 'error') {
      alert('Error connecting to Google Calendar. Please try again.');
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.id || '1';
      
      const response = await fetch('http://localhost/api/scheduler/auth/google/status', {
        headers: {
          'x-user-id': userId,
        },
      });
      const data = await response.json();
      setIsConnected(data.connected);
    } catch (error) {
      console.error('Error checking calendar status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.id || '1';
    
    // Redirect to OAuth flow with userId in header
    window.location.href = `http://localhost/api/scheduler/auth/google/connect?userId=${userId}`;
  };

  const handleDisconnect = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.id || '1';
      
      await fetch('http://localhost/api/scheduler/auth/google/disconnect', {
        headers: {
          'x-user-id': userId,
        },
      });
      setIsConnected(false);
      alert('Google Calendar disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      alert('Error disconnecting Google Calendar');
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="mt-2 text-gray-600">
            Administra las integraciones y preferencias de tu cuenta
          </p>
        </div>

        {/* Google Calendar Integration Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Integración con Google Calendar
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Sincroniza automáticamente tus tareas con fechas de vencimiento a Google Calendar
                  </p>
                </div>

                {loading ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Verificando conexión...</span>
                  </div>
                ) : (
                  <>
                    {/* Connection Status */}
                    <div className="flex items-center gap-2">
                      {isConnected ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-green-700">
                            Conectado a Google Calendar
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-600">
                            No conectado
                          </span>
                        </>
                      )}
                    </div>

                    {/* Info Box */}
                    {isConnected && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h3 className="font-semibold text-blue-900 mb-2">¿Cómo funciona?</h3>
                        <ul className="space-y-1 text-sm text-blue-800">
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>Cuando creas una tarea con fecha, aparece en Google Calendar</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>Al actualizar una tarea, el evento del calendario se actualiza automáticamente</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>Al eliminar una tarea, el evento se elimina del calendario</span>
                          </li>
                        </ul>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-2">
                      {isConnected ? (
                        <Button 
                          onClick={handleDisconnect} 
                          variant="outline"
                          className="w-full sm:w-auto"
                        >
                          Desconectar Google Calendar
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleConnect}
                          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Conectar con Google Calendar
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
