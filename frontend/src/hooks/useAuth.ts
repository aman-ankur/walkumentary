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
    try {
      const userProfile = await apiClient.getCurrentUser();
      setState(prev => ({ 
        ...prev, 
        user: userProfile,
        error: null 
      }));
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setError('Failed to load user profile');
    }
  }, [setError]);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth initialization error:', error);
          setError(error.message);
          return;
        }

        if (session?.user) {
          setState(prev => ({ 
            ...prev, 
            supabaseUser: session.user, 
            session 
          }));
          
          // Fetch user profile from our API
          await fetchUserProfile(session.user);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [fetchUserProfile, setError, setLoading]);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session);
        
        setState(prev => ({ 
          ...prev, 
          session,
          supabaseUser: session?.user || null,
        }));

        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setState(prev => ({ 
            ...prev, 
            user: null,
            error: null 
          }));
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserProfile, setLoading]);

  const signIn = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await signInWithGoogle();
      
      if (error) {
        setError(error.message);
      }
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
      
      const { error } = await supabaseSignOut();
      
      if (error) {
        setError(error.message);
      }
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