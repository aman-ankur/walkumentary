'use client';

import { useState, useEffect, useCallback } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, signInWithGoogle, signOut as supabaseSignOut } from '@/lib/supabase';
import { apiClient } from '@/lib/api';
import { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    supabaseUser: null,
    session: null,
    loading: true,
    error: null,
  });

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  // Fetch user profile from our API
  const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser) => {
    console.log('fetchUserProfile called for:', supabaseUser.email);
    
    // Create fallback user immediately to prevent loading issues
    const fallbackUser: User = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      full_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '',
      avatar_url: supabaseUser.user_metadata?.avatar_url || '',
      preferences: {
        interests: [],
        language: 'english',
        default_tour_duration: 30,
        audio_speed: 1.0,
        theme: 'light'
      },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Setting fallback user:', fallbackUser.email);
    // Set fallback user first
    setState(prev => ({ 
      ...prev, 
      user: fallbackUser,
      error: null,
      loading: false  // Set loading to false when user is set
    }));

    // Try to fetch from API in background with timeout
    try {
      console.log('Attempting to fetch user profile from API...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const userProfile = await apiClient.getCurrentUser();
      clearTimeout(timeoutId);
      
      console.log('Successfully fetched user profile from API:', userProfile.email);
      setState(prev => ({ 
        ...prev, 
        user: userProfile,
        error: null,
        loading: false  // Ensure loading is false with API user too
      }));
    } catch (error) {
      console.error('Failed to fetch user profile, using fallback:', error);
      // Keep fallback user, don't set error to avoid UI issues
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    console.log('🚀 Auth initialization starting...');
    
    // Set loading to false after a short delay to prevent infinite loading
    // The auth state change listener will handle actual authentication
    const initTimeout = setTimeout(() => {
      console.log('⏰ Auth init timeout - setting loading to false');
      setLoading(false);
    }, 2000);

    // Try to get existing session (but don't hang on it)
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        clearTimeout(initTimeout);
        
        if (!error && session?.user) {
          console.log('🎉 Found existing session for:', session.user.email);
          setState(prev => ({ 
            ...prev, 
            supabaseUser: session.user, 
            session 
          }));
          await fetchUserProfile(session.user);
        } else {
          console.log('ℹ️ No existing session found');
          setLoading(false);
        }
      } catch (error) {
        console.log('⚠️ getSession() failed, relying on auth state listener');
        clearTimeout(initTimeout);
        setLoading(false);
      }
    };

    checkSession();
    
    return () => clearTimeout(initTimeout);
  }, [fetchUserProfile, setLoading]);

  // Listen for auth changes
  useEffect(() => {
    console.log('🔗 Setting up auth state change listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          userEmail: session?.user?.email 
        });
        
        setState(prev => ({ 
          ...prev, 
          session,
          supabaseUser: session?.user || null,
        }));

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🎉 User signed in, fetching profile for:', session.user.email);
          await fetchUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setState(prev => ({ 
            ...prev, 
            user: null,
            error: null 
          }));
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 Token refreshed for:', session.user.email);
          // No need to refetch profile, just update session
        } else if (session?.user && !event.includes('SIGNED_OUT')) {
          console.log('📝 Session updated with user:', session.user.email);
          // This handles cases where session becomes available without a specific event
          if (!state.user) {
            console.log('🔄 Fetching profile for newly available session');
            await fetchUserProfile(session.user);
          }
        }
        
        console.log('✅ Setting loading to false after auth state change');
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserProfile, setLoading]);

  const signIn = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await signInWithGoogle();
      
      // Note: onAuthStateChange will handle the success case
    } catch (error) {
      console.error('Sign in error:', error);
      setError('Failed to sign in');
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await supabaseSignOut();
      
      // Note: onAuthStateChange will handle the success case
    } catch (error) {
      console.error('Sign out error:', error);
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading]);

  const refreshProfile = useCallback(async () => {
    if (state.supabaseUser) {
      await fetchUserProfile(state.supabaseUser);
    }
  }, [state.supabaseUser, fetchUserProfile]);

  return {
    user: state.user,
    supabaseUser: state.supabaseUser,
    session: state.session,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    signIn,
    signOut,
    refreshProfile,
    setError,
  };
}