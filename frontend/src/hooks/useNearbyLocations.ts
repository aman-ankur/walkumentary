"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { LocationResponse } from "@/lib/types";
import { LocationCoordinates } from "./useGeolocation";

export interface NearbyFilters {
  radius?: number;
  locationType?: string[];
  minRating?: number;
  maxResults?: number;
  sortBy?: "distance" | "rating" | "popularity";
}

export interface NearbyLocationState {
  locations: LocationResponse[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
  center: [number, number] | null;
  radius: number;
  filters: NearbyFilters;
}

export interface UseNearbyLocationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  defaultRadius?: number;
  defaultFilters?: NearbyFilters;
  cacheTimeout?: number;
}

const DEFAULT_OPTIONS: UseNearbyLocationsOptions = {
  autoRefresh: false,
  refreshInterval: 60000, // 1 minute
  defaultRadius: 1000, // 1km
  defaultFilters: {
    maxResults: 20,
    sortBy: "distance",
  },
  cacheTimeout: 300000, // 5 minutes
};

const DEFAULT_FILTERS: NearbyFilters = {
  radius: 1000,
  maxResults: 20,
  sortBy: "distance",
};

export function useNearbyLocations(options: UseNearbyLocationsOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<NearbyLocationState>({
    locations: [],
    isLoading: false,
    error: null,
    lastFetch: null,
    center: null,
    radius: opts.defaultRadius || 1000,
    filters: { ...DEFAULT_FILTERS, ...opts.defaultFilters },
  });

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearRefreshInterval = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  const abortCurrentRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const fetchNearbyLocations = useCallback(async (
    coordinates: LocationCoordinates | [number, number],
    customFilters?: Partial<NearbyFilters>
  ) => {
    abortCurrentRequest();
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const coords: [number, number] = Array.isArray(coordinates)
      ? coordinates
      : [coordinates.latitude, coordinates.longitude];

    const filters = { ...state.filters, ...customFilters };
    const radius = filters.radius || state.radius;

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      center: coords,
      radius,
      filters,
    }));

    try {
      const response = await api.post("/locations/detect", {
        coordinates: coords,
        radius,
        location_type: filters.locationType,
        min_rating: filters.minRating,
        limit: filters.maxResults,
        sort_by: filters.sortBy,
      });

      if (controller.signal.aborted) {
        return;
      }

      let locations = (response as any).data?.locations || (response as any).locations || [];

      // Apply client-side sorting if needed
      if (filters.sortBy === "distance") {
        locations.sort((a: LocationResponse, b: LocationResponse) => {
          const distA = a.distance || Infinity;
          const distB = b.distance || Infinity;
          return distA - distB;
        });
      } else if (filters.sortBy === "rating") {
        locations.sort((a: LocationResponse, b: LocationResponse) => {
          const ratingA = a.location_metadata?.rating || 0;
          const ratingB = b.location_metadata?.rating || 0;
          return ratingB - ratingA;
        });
      }

      setState(prev => ({
        ...prev,
        locations,
        isLoading: false,
        lastFetch: Date.now(),
      }));

    } catch (error: any) {
      if (controller.signal.aborted) {
        return;
      }

      console.error("Nearby locations error:", error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to fetch nearby locations",
      }));
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [state.filters, state.radius, abortCurrentRequest]);

  const refreshLocations = useCallback(() => {
    if (state.center) {
      fetchNearbyLocations(state.center);
    }
  }, [state.center, fetchNearbyLocations]);

  const updateFilters = useCallback((newFilters: Partial<NearbyFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
    }));

    // Auto-refresh if we have a center location
    if (state.center) {
      fetchNearbyLocations(state.center, newFilters);
    }
  }, [state.center, fetchNearbyLocations]);

  const updateRadius = useCallback((newRadius: number) => {
    setState(prev => ({
      ...prev,
      radius: newRadius,
      filters: { ...prev.filters, radius: newRadius },
    }));

    // Auto-refresh if we have a center location
    if (state.center) {
      fetchNearbyLocations(state.center, { radius: newRadius });
    }
  }, [state.center, fetchNearbyLocations]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearLocations = useCallback(() => {
    abortCurrentRequest();
    setState(prev => ({
      ...prev,
      locations: [],
      error: null,
      lastFetch: null,
      center: null,
      isLoading: false,
    }));
  }, [abortCurrentRequest]);

  // Check if data is stale
  const isDataStale = useCallback(() => {
    if (!state.lastFetch || !opts.cacheTimeout) {
      return true;
    }
    return Date.now() - state.lastFetch > opts.cacheTimeout;
  }, [state.lastFetch, opts.cacheTimeout]);

  // Auto-refresh setup
  useEffect(() => {
    if (opts.autoRefresh && opts.refreshInterval && state.center) {
      clearRefreshInterval();
      refreshIntervalRef.current = setInterval(() => {
        if (isDataStale()) {
          refreshLocations();
        }
      }, opts.refreshInterval);
    } else {
      clearRefreshInterval();
    }

    return clearRefreshInterval;
  }, [opts.autoRefresh, opts.refreshInterval, state.center, isDataStale, refreshLocations, clearRefreshInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearRefreshInterval();
      abortCurrentRequest();
    };
  }, [clearRefreshInterval, abortCurrentRequest]);

  return {
    ...state,
    fetchNearbyLocations,
    refreshLocations,
    updateFilters,
    updateRadius,
    clearError,
    clearLocations,
    isDataStale: isDataStale(),
  };
}