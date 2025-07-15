'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

/**
 * Simple component to handle browser state issues during OAuth callback
 * Addresses the specific problem where users get stuck on "Completing authentication..."
 */
export function AuthStateRecovery() {
  const [isStuck, setIsStuck] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show recovery button if user has been waiting too long
    const timer = setTimeout(() => {
      setIsStuck(true);
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only show if there's a potential auth issue
    if (isStuck) {
      // Check if we're on callback page or have auth fragments in URL
      const hasAuthFragment = window.location.hash.includes('access_token') || 
                            window.location.pathname.includes('/auth/callback');
      
      if (hasAuthFragment) {
        setIsVisible(true);
      }
    }
  }, [isStuck]);

  const handleRefresh = () => {
    // Simple page refresh to restart auth flow
    window.location.reload();
  };

  const handleReturnHome = () => {
    // Clear any auth fragments and go home
    window.location.href = window.location.origin;
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="text-sm text-gray-600 mb-3">
        Authentication seems to be taking longer than usual.
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={handleRefresh}
          variant="outline"
          size="sm"
        >
          Retry
        </Button>
        <Button 
          onClick={handleReturnHome}
          variant="default"
          size="sm"
        >
          Go Home
        </Button>
      </div>
    </div>
  );
} 