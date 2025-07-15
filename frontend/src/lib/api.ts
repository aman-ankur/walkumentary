/**
 * Lightweight API client used across the front-end. It wraps `fetch` and
 * provides a handful of convenience helpers that components already expect
 * (getTour, getTourAudio, getUserTours, getTourStatus).
 *
 * The implementation purposefully stays minimal – adjust the base URL via
 * NEXT_PUBLIC_API_BASE_URL (falls back to same-origin FastAPI `/`).
 */

import { supabase } from './supabase';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""; // same-origin by default
console.log('🔍 API Configuration:', {
  BASE_URL,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'SSR'
});

export async function request<T>(
  path: string,
  options: RequestInit = {},
  parseJson = true,
): Promise<T> {
  // Get the current session for auth token WITH TIMEOUT AND FALLBACK
  let session = null;
  
  // Check if this endpoint requires authentication
  const publicEndpoints = ['/health', '/locations/search'];
  const isPublicEndpoint = publicEndpoints.some(endpoint => path.startsWith(endpoint));
  
  if (!isPublicEndpoint) {
    // Only get session for authenticated endpoints, with timeout
    try {
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 1000)
      );
      
      const { data } = await Promise.race([sessionPromise, timeoutPromise]) as any;
      session = data?.session;
    } catch (error) {
      console.warn('Session retrieval failed or timed out for', path, '- proceeding without auth:', error);
    }
  } else {
    console.log('🚀 Skipping session call for public endpoint:', path);
  }
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers as Record<string, string>,
  };

  // Add authorization header if user is logged in
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const fullUrl = `${BASE_URL}${path}`;
  console.log('🌐 FETCH REQUEST:', { 
    fullUrl, 
    BASE_URL, 
    path, 
    headers: { ...headers, Authorization: headers.Authorization ? '[HIDDEN]' : undefined }, 
    options,
    isPublicEndpoint,
    sessionStatus: session ? 'authenticated' : 'anonymous'
  });
  
  // Add fetch timeout for better reliability  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  
  try {
    const res = await fetch(fullUrl, {
      credentials: "include",
      signal: controller.signal,
      ...options,
      headers,
    });
    
    clearTimeout(timeoutId);
    console.log('📡 FETCH RESPONSE:', { url: fullUrl, status: res.status, statusText: res.statusText, ok: res.ok });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
    }

    // Binary responses (audio) – caller sets parseJson=false
    return (parseJson ? (await res.json()) : ((await res.blob()) as unknown)) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('🚨 FETCH ERROR:', { fullUrl, error });
    throw error;
  }
}

export const api = {
  /** GET helper */
  get: <T>(url: string, parseJson = true) => request<T>(url, { method: "GET" }, parseJson),

  /** POST helper */
  post: <T>(url: string, body: unknown, parseJson = true) =>
    request<T>(
      url,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      parseJson,
    ),

  // ---- domain-specific shortcuts ----------------------------------------

  /** Health check endpoint */
  healthCheck: () => api.get<{ status: string; timestamp: number }>("/health"),

  /** Get current authenticated user */
  getCurrentUser: () => api.get<any>("/auth/me"),

  /** Download the raw audio Blob for a tour */
  getTourAudio: (tourId: string) => api.get<Blob>(`/tours/${tourId}/audio`, false),

  /** Fetch a single tour (metadata + transcript) */
  getTour: (tourId: string) => api.get<any>(`/tours/${tourId}`),

  /** Poll generation status */
  getTourStatus: (tourId: string) => api.get<{ status: string }>(`/tours/${tourId}/status`),

  /** List the current user's tours */
  getUserTours: () => api.get<any[]>("/tours/user/tours"),

  /** Search locations */
  searchLocations: (params: any) => api.post<any>("/locations/search", params),

  /** Get nearby locations */
  getNearbyLocations: (params: any) => api.post<any>("/locations/nearby", params),

  /** Store external location in database */
  storeExternalLocation: (locationData: any) => api.post<any>("/locations/store", locationData),

  /** Generate a new tour */
  generateTour: (params: any) => api.post<any>("/tours/generate", params),

  /** Estimate tour generation cost */
  estimateTourCost: (params: any) => api.post<any>("/tours/estimate-cost", params),

  /** Update user profile */
  updateUser: (userData: any) => api.post<any>("/auth/update-profile", userData),

  /** Update user preferences */
  updateUserPreferences: (preferences: any) => api.post<any>("/auth/update-preferences", preferences),

  /** Delete a tour */
  deleteTour: (tourId: string) => api.post<any>(`/tours/${tourId}/delete`, {}),
};

// For tests that import `apiClient`
export const apiClient = api; 