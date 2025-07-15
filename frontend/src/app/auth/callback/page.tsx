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
      
      // If there's a hash, manually trigger session processing
      if (window.location.hash) {
        console.log('🔍 Hash detected - manually triggering session detection...');
        
        try {
          // Manually call getSession to trigger processing
          const { data, error } = await supabase.auth.getSession();
          console.log('🔑 Manual session check result:', { 
            hasSession: !!data.session, 
            hasUser: !!data.session?.user,
            error: error?.message 
          });
          
          // Small delay to ensure auth state change event fires
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error('❌ Manual session check failed:', error);
        }
      }
      
      // Redirect after processing
      console.log('✅ Redirecting to home - auth should be processed');
      router.push('/');
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