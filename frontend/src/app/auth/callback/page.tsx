'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('🔐 Auth callback page loaded');
      console.log('📍 URL hash:', window.location.hash);
      
      // If there's no hash, just redirect
      if (!window.location.hash) {
        console.log('❌ No hash found, redirecting to home');
        router.push('/');
        return;
      }
      
      console.log('⏳ Waiting for Supabase to process hash tokens...');
      
      // Wait for Supabase to automatically process the hash
      // This gives time for the auth state change listener to fire
      setTimeout(() => {
        console.log('✅ Redirecting to home - auth hook will handle session');
        router.push('/');
      }, 2000);
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Completing authentication...</p>
      </div>
    </div>
  );
}