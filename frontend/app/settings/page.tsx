'use client';

import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, XCircle, User } from 'lucide-react';
import { useAuth } from '@/features/auth';

export default function SettingsPage() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voiceLanguage, setVoiceLanguage] = useState<'en' | 'es'>('en');

  useEffect(() => {
    checkConnectionStatus();
    
    // Load saved language preference
    const savedLanguage = localStorage.getItem('voice-language') as 'en' | 'es';
    if (savedLanguage) {
      setVoiceLanguage(savedLanguage);
    }
    
    // Check if we just came back from OAuth callback
    const params = new URLSearchParams(window.location.search);
    const calendarStatus = params.get('calendar');
    
    if (calendarStatus === 'connected') {
      setIsConnected(true);
      // Mark that prompt has been shown/handled
      localStorage.setItem('calendar-prompt-shown', 'true');
      // Clean up URL
      window.history.replaceState({}, '', '/settings');
    } else if (calendarStatus === 'error') {
      alert('Error connecting to Google Calendar. Please try again.');
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  const handleLanguageChange = (language: 'en' | 'es') => {
    setVoiceLanguage(language);
    localStorage.setItem('voice-language', language);
  };

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
      <div className="max-w-4xl mx-auto space-y-8 py-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Configuración</h1>
          <p className="text-lg text-gray-600">
            Administra tu perfil y las integraciones de tu cuenta
          </p>
        </div>

        {/* Profile Card */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Section Header */}
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900">Perfil</h2>
                <p className="text-sm text-gray-500 mt-1">Información de tu cuenta</p>
              </div>

              {/* Profile Information */}
              <div className="space-y-6">
                {/* Profile Picture and Name */}
                <div className="flex items-center gap-6 p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl">
                  {user?.picture ? (
                    <img 
                      src={user.picture} 
                      alt={`${user.firstName} ${user.lastName}`}
                      className="h-20 w-20 rounded-2xl object-cover border-4 border-white shadow-lg ring-2 ring-purple-100"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg ring-2 ring-purple-100">
                      <User className="h-10 w-10 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                      {user?.email}
                    </p>
                  </div>
                </div>

                {/* Account Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow duration-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Nombre</p>
                    <p className="text-lg font-semibold text-gray-900">{user?.firstName}</p>
                  </div>
                  <div className="p-5 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow duration-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Apellido</p>
                    <p className="text-lg font-semibold text-gray-900">{user?.lastName}</p>
                  </div>
                  <div className="p-5 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow duration-200 sm:col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Correo Electrónico</p>
                    <p className="text-lg font-semibold text-gray-900">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voice Language Preference Card */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Section Header */}
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900">Idioma de Voz</h2>
                <p className="text-sm text-gray-500 mt-1">Selecciona el idioma para las tareas por voz</p>
              </div>

              {/* Language Selection */}
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Elige el idioma en el que hablarás al crear tareas con el micrófono
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* English Option */}
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                      voiceLanguage === 'en'
                        ? 'border-yellow-500 bg-yellow-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">🇺🇸</div>
                      <div className="text-left">
                        <p className="font-bold text-gray-900 text-lg">English</p>
                        <p className="text-sm text-gray-600">Voice tasks in English</p>
                      </div>
                      {voiceLanguage === 'en' && (
                        <div className="ml-auto">
                          <CheckCircle className="h-6 w-6 text-yellow-500" />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Spanish Option */}
                  <button
                    onClick={() => handleLanguageChange('es')}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                      voiceLanguage === 'es'
                        ? 'border-yellow-500 bg-yellow-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">🇪🇸</div>
                      <div className="text-left">
                        <p className="font-bold text-gray-900 text-lg">Español</p>
                        <p className="text-sm text-gray-600">Tareas por voz en español</p>
                      </div>
                      {voiceLanguage === 'es' && (
                        <div className="ml-auto">
                          <CheckCircle className="h-6 w-6 text-yellow-500" />
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Google Calendar Integration Card */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Section Header */}
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900">Google Calendar</h2>
                <p className="text-sm text-gray-500 mt-1">Sincroniza tus tareas automáticamente</p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center gap-3 py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-yellow-600 border-t-transparent"></div>
                  <span className="text-sm font-medium">Verificando conexión...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Connection Status */}
                  <div className="flex items-center justify-between p-5 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      {isConnected ? (
                        <>
                          <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Conectado</p>
                            <p className="text-sm text-gray-600">Sincronización activa</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <XCircle className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">No conectado</p>
                            <p className="text-sm text-gray-600">Conecta tu cuenta de Google</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    {isConnected ? (
                      <Button 
                        onClick={handleDisconnect} 
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto border-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200"
                      >
                        Desconectar Google Calendar
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleConnect}
                        size="lg"
                        className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Calendar className="mr-2 h-5 w-5" />
                        Conectar con Google Calendar
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
