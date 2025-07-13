'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    console.log('🔐 Auth callback page loaded');
    console.log('📍 URL hash:', window.location.hash);
    
    // With detectSessionInUrl: true, Supabase automatically processes the hash
    // Just wait a moment and redirect - the auth state listener will handle the rest
    const timer = setTimeout(() => {
      console.log('✅ Redirecting to home - Supabase should auto-detect session');
      router.push('/');
    }, 1000);
    
    return () => clearTimeout(timer);
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