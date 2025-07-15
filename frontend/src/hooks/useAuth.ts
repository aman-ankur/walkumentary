'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, signInWithGoogle } from '@/lib/supabase';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User } from '@/lib/types';
import { apiClient } from '@/lib/api';

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
  
  // Add ref to track if profile fetch is in progress
  const fetchingProfileRef = useRef<string | null>(null);
  // Add ref to track current user state to avoid dependency issues
  const userStateRef = useRef<User | null>(null);

  // Update userStateRef whenever user state changes
  useEffect(() => {
    userStateRef.current = state.user;
  }, [state.user]);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  // Fetch user profile from our API
  const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser) => {
    const userEmail = supabaseUser.email || null;
    
    // Prevent duplicate calls for the same user
    if (fetchingProfileRef.current === userEmail) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚫 Skipping duplicate fetchUserProfile call for:', userEmail);
      }
      return;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('fetchUserProfile called for:', userEmail);
    }
    fetchingProfileRef.current = userEmail;
    
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
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Setting fallback user:', fallbackUser.email);
    }
    // Set fallback user first
    setState(prev => ({ 
      ...prev, 
      user: fallbackUser,
      error: null,
      loading: false  // Set loading to false when user is set
    }));

    // Try to fetch from API in background with timeout
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Attempting to fetch user profile from API...');
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const userProfile = await apiClient.getCurrentUser();
      clearTimeout(timeoutId);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Successfully fetched user profile from API:', userProfile.email);
      }
      setState(prev => ({ 
        ...prev, 
        user: userProfile,
        error: null,
        loading: false  // Ensure loading is false with API user too
      }));
    } catch (error) {
      // Always log profile fetch errors for debugging
      console.error('Failed to fetch user profile, using fallback:', error instanceof Error ? error.message : 'Unknown error');
      // Keep fallback user, don't set error to avoid UI issues
    } finally {
      // Clear the fetching flag
      fetchingProfileRef.current = null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Auth initialization starting...');
    }
    
    // Set loading to false after a short delay to prevent infinite loading
    // The auth state change listener will handle actual authentication
    const initTimeout = setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log('⏰ Auth init timeout - setting loading to false');
      }
      setLoading(false);
    }, 2000);

    // Try to get existing session (but don't hang on it)
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        clearTimeout(initTimeout);
        
        if (!error && session?.user) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🎉 Found existing session for:', session.user.email);
          }
          setState(prev => ({ 
            ...prev, 
            supabaseUser: session.user, 
            session 
          }));
          await fetchUserProfile(session.user);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('ℹ️ No existing session found');
          }
          setLoading(false);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ getSession() failed, relying on auth state listener');
        }
        clearTimeout(initTimeout);
        setLoading(false);
      }
    };

    checkSession();
    
    return () => clearTimeout(initTimeout);
  }, [fetchUserProfile, setLoading]);

  // Listen for auth changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔗 Setting up auth state change listener...');
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Auth state change:', event, { 
            hasSession: !!session, 
            hasUser: !!session?.user,
            userEmail: session?.user?.email 
          });
        }
        
        setState(prev => ({ 
          ...prev, 
          session,
          supabaseUser: session?.user || null,
        }));

        if (event === 'SIGNED_IN' && session?.user) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🎉 User signed in, fetching profile for:', session.user.email);
          }
          await fetchUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          if (process.env.NODE_ENV === 'development') {
            console.log('👋 User signed out');
          }
          fetchingProfileRef.current = null; // Clear any pending fetches
          setState(prev => ({ 
            ...prev, 
            user: null,
            error: null 
          }));
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Token refreshed for:', session.user.email);
          }
          // No need to refetch profile, just update session
        } else if (session?.user && !event.includes('SIGNED_OUT') && event !== 'TOKEN_REFRESHED') {
          if (process.env.NODE_ENV === 'development') {
            console.log('📝 Session updated with user:', session.user.email);
          }
          // Only fetch if we don't have a user AND no fetch is in progress (using ref to avoid dependency issues)
          if (!userStateRef.current && !fetchingProfileRef.current) {
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 Fetching profile for newly available session');
            }
            await fetchUserProfile(session.user);
          } else if (process.env.NODE_ENV === 'development') {
            console.log('🚫 Skipping duplicate profile fetch - user exists or fetch in progress');
          }
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Setting loading to false after auth state change');
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserProfile, setLoading]); // Removed state.user dependency to prevent re-subscriptions

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
      
      await supabase.auth.signOut();
      
      // onAuthStateChange will handle the cleanup
    } catch (error) {
      console.error('Sign out error:', error);
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading]);

  return {
    ...state,
    signIn,
    signOut,
    setError,
  };
}