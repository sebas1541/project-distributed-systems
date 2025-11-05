'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/features/auth';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, register, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        if (!firstName.trim() || !lastName.trim()) {
          setError('Por favor completa todos los campos');
          setIsSubmitting(false);
          return;
        }
        await register({ email, password, firstName, lastName });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Ocurrió un error. Por favor intenta nuevamente.');
      } else {
        setError('Ocurrió un error. Por favor intenta nuevamente.');
      }
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50/30 p-3 sm:p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 sm:space-y-4 text-center pb-6 sm:pb-8">
          <div className="mx-auto">
            <Image 
              src="/logo-white.png" 
              alt="Smart Planner AI Logo" 
              width={160} 
              height={53}
              className="h-12 sm:h-16 w-auto object-contain mx-auto"
            />
          </div>
          <div>
            <CardDescription className="text-sm sm:text-base mt-2">
              {isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <Input
                    type="text"
                    placeholder="Juan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Apellido
                  </label>
                  <Input
                    type="text"
                    placeholder="Pérez"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  {isLogin ? 'Iniciando sesión...' : 'Registrando...'}
                </span>
              ) : (
                isLogin ? 'Iniciar Sesión' : 'Registrarse'
              )}
            </Button>
          </form>

          {/* Google Sign In */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">
                O continúa con
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            onClick={() => window.location.href = 'http://localhost/api/auth/google'}
            disabled={isSubmitting}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </Button>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
              <button
                onClick={toggleMode}
                className="text-blue-600 hover:underline font-medium"
                disabled={isSubmitting}
              >
                {isLogin ? 'Regístrate' : 'Inicia sesión'}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
