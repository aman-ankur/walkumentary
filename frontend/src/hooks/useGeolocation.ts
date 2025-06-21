"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

export interface LocationError {
  code: number;
  message: string;
}

export interface GeolocationState {
  location: LocationCoordinates | null;
  error: LocationError | null;
  isLoading: boolean;
  isSupported: boolean;
  lastUpdated: number | null;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

const DEFAULT_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000, // 5 minutes
  watch: false,
  retryAttempts: 3,
  retryDelay: 1000,
};

const getErrorMessage = (code: number): string => {
  switch (code) {
    case 1:
      return "Location access denied. Please enable location services.";
    case 2:
      return "Location unavailable. Please try again.";
    case 3:
      return "Location request timeout. Please try again.";
    default:
      return "Failed to get location. Please try again.";
  }
};

export function useGeolocation(options: GeolocationOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    isLoading: false,
    isSupported: false, // Will be set correctly after hydration
    lastUpdated: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isSupportedRef = useRef(false);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const updateLocation = useCallback((position: GeolocationPosition) => {
    const location: LocationCoordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
    };

    setState(prev => ({
      ...prev,
      location,
      error: null,
      isLoading: false,
      lastUpdated: Date.now(),
    }));

    retryCountRef.current = 0;
    clearRetryTimeout();
  }, [clearRetryTimeout]);

  const handleError = useCallback((error: GeolocationPositionError) => {
    const locationError: LocationError = {
      code: error.code,
      message: getErrorMessage(error.code),
    };

    // Retry logic for temporary errors
    if (error.code === 2 && retryCountRef.current < (opts.retryAttempts || 0)) {
      retryCountRef.current++;
      retryTimeoutRef.current = setTimeout(() => {
        if (!isSupportedRef.current) return;
        
        setState(prev => ({
          ...prev,
          isLoading: true,
          error: null,
        }));

        navigator.geolocation.getCurrentPosition(
          updateLocation,
          handleError,
          {
            enableHighAccuracy: opts.enableHighAccuracy,
            timeout: opts.timeout,
            maximumAge: opts.maximumAge,
          }
        );
      }, opts.retryDelay);
      return;
    }

    setState(prev => ({
      ...prev,
      error: locationError,
      isLoading: false,
    }));

    clearRetryTimeout();
  }, [opts.retryAttempts, opts.retryDelay, opts.enableHighAccuracy, opts.timeout, opts.maximumAge, updateLocation, clearRetryTimeout]);

  const getCurrentLocation = useCallback(() => {
    if (!isSupportedRef.current) {
      setState(prev => ({
        ...prev,
        error: {
          code: 0,
          message: "Geolocation is not supported by this browser.",
        },
        isLoading: false,
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    navigator.geolocation.getCurrentPosition(
      updateLocation,
      handleError,
      {
        enableHighAccuracy: opts.enableHighAccuracy,
        timeout: opts.timeout,
        maximumAge: opts.maximumAge,
      }
    );
  }, [updateLocation, handleError, opts.enableHighAccuracy, opts.timeout, opts.maximumAge]);

  const startWatching = useCallback(() => {
    if (!isSupportedRef.current) {
      return;
    }

    clearWatch();
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      updateLocation,
      handleError,
      {
        enableHighAccuracy: opts.enableHighAccuracy,
        timeout: opts.timeout,
        maximumAge: opts.maximumAge,
      }
    );
  }, [clearWatch, updateLocation, handleError, opts.enableHighAccuracy, opts.timeout, opts.maximumAge]);

  const stopWatching = useCallback(() => {
    clearWatch();
    setState(prev => ({
      ...prev,
      isLoading: false,
    }));
  }, [clearWatch]);

  // Auto-start watching if watch option is enabled
  useEffect(() => {
    if (opts.watch) {
      startWatching();
    } else {
      stopWatching();
    }

    return () => {
      stopWatching();
      clearRetryTimeout();
    };
  }, [opts.watch, startWatching, stopWatching, clearRetryTimeout]);

  // Check geolocation support after mount (client-side only)
  useEffect(() => {
    const isSupported = typeof navigator !== "undefined" && "geolocation" in navigator;
    isSupportedRef.current = isSupported;
    setState(prev => ({
      ...prev,
      isSupported,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearWatch();
      clearRetryTimeout();
    };
  }, [clearWatch, clearRetryTimeout]);

  return {
    ...state,
    getCurrentLocation,
    startWatching,
    stopWatching,
    clearError: useCallback(() => {
      setState(prev => ({ ...prev, error: null }));
    }, []),
  };
}