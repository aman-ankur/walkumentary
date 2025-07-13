import { createClient } from '@supabase/supabase-js'
import { AuthError } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic refresh token handling
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Detect session from URL hash on page load  
    detectSessionInUrl: true,
    // Use session storage for better security
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Custom storage key to avoid conflicts
    storageKey: 'walkumentary-auth-token',
  }
})

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  
  if (error) {
    throw error
  }
  
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw error
  }
}