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
console.log('API BASE_URL:', BASE_URL, 'ENV:', process.env.NEXT_PUBLIC_API_BASE_URL);

export async function request<T>(
  path: string,
  options: RequestInit = {},
  parseJson = true,
): Promise<T> {
  // Get the current session for auth token
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers as Record<string, string>,
  };

  // Add authorization header if user is logged in
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }

  // Binary responses (audio) – caller sets parseJson=false
  return (parseJson ? (await res.json()) : ((await res.blob()) as unknown)) as T;
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