'use client';

import { Button } from '@/components/ui/button';
import { useAuthContext } from './AuthProvider';
import { LogIn, LogOut, User } from 'lucide-react';

interface AuthButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showText?: boolean;
}

export function AuthButton({ 
  variant = 'default', 
  size = 'default',
  showText = true 
}: AuthButtonProps) {
  const { user, loading, signIn, signOut } = useAuthContext();

  if (loading) {
    return (
      <Button variant={variant} size={size} disabled>
        {showText && "Loading..."}
      </Button>
    );
  }

  if (user) {
    return (
      <Button 
        variant={variant} 
        size={size}
        onClick={signOut}
        className="flex items-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        {showText && "Sign out"}
      </Button>
    );
  }

  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={signIn}
      className="flex items-center gap-2"
    >
      <LogIn className="h-4 w-4" />
      {showText && "Sign in with Google"}
    </Button>
  );
}