'use client';

import { useState } from 'react';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { LogoutConfirmDialog } from '@/components/LogoutConfirmDialog';

export function Header() {
  const { user, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  return (
    <>
      <header className="border-b border-gray-200/50 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Navigation */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-lg">SP</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Smart Planner AI</h1>
                  <p className="text-xs text-gray-500">Gestión Inteligente</p>
                </div>
              </div>
              <Navigation />
            </div>

            {/* Right: User Actions */}
            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <UserIcon className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={() => setShowLogoutDialog(true)}>
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <LogoutConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={logout}
      />
    </>
  );
}
