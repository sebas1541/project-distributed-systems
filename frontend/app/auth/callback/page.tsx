'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { STORAGE_KEYS } from '@/lib/constants';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        
        // Redirect to tasks page
        router.push('/tasks');
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/login?error=invalid_data');
      }
    } else {
      router.push('/login?error=missing_data');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Iniciando sesión...</p>
      </div>
    </div>
  );
}
