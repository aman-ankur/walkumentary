'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    console.log('🔐 Auth callback page loaded');
    console.log('📍 Current URL:', window.location.href);
    
    // Give Supabase time to process the hash tokens before redirecting
    const timer = setTimeout(() => {
      console.log('🚀 Redirecting to home page');
      router.push('/');
    }, 1500); // 1.5 second delay to ensure hash is processed
    
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