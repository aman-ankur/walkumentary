import { renderHook, act, waitFor } from "@testing-library/react";
import { useNearbyLocations } from "../useNearbyLocations";
import { LocationResponse } from "@/lib/types";

// Mock the API
jest.mock("@/lib/api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import { api } from "@/lib/api";
const mockApi = api as jest.Mocked<typeof api>;

// Mock location data
const mockLocations: LocationResponse[] = [
  {
    id: "1",
    name: "Castle of Good Hope",
    description: "Historic fort built by the Dutch East India Company",
    latitude: -33.9248,
    longitude: 18.4232,
    city: "Cape Town",
    country: "South Africa",
    location_type: "historic",
    distance: 150,
    location_metadata: { rating: 4.5 },
  },
  {
    id: "2",
    name: "Company's Garden",
    description: "Historic botanical garden in the heart of Cape Town",
    latitude: -33.9274,
    longitude: 18.4229,
    city: "Cape Town",
    country: "South Africa",
    location_type: "park",
    distance: 300,
    location_metadata: { rating: 4.2 },
  },
];

const mockApiResponse = {
  data: {
    locations: mockLocations,
  },
};

describe("useNearbyLocations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should initialize with correct default state", () => {
    const { result } = renderHook(() => useNearbyLocations());

    expect(result.current.locations).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastFetch).toBeNull();
    expect(result.current.center).toBeNull();
    expect(result.current.radius).toBe(1000);
    expect(result.current.filters).toEqual({
      radius: 1000,
      maxResults: 20,
      sortBy: "distance",
    });
  });

  it("should fetch nearby locations successfully", async () => {
    mockApi.post.mockResolvedValueOnce(mockApiResponse);

    const { result } = renderHook(() => useNearbyLocations());

    act(() => {
      result.current.fetchNearbyLocations([-33.924, 18.424]);
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.locations).toEqual(mockLocations);
    expect(result.current.center).toEqual([-33.924, 18.424]);
    expect(result.current.error).toBeNull();
    expect(result.current.lastFetch).toBeGreaterThan(0);

    expect(mockApi.post).toHaveBeenCalledWith("/locations/detect", {
      coordinates: [-33.924, 18.424],
      radius: 1000,
      location_type: undefined,
      min_rating: undefined,
      limit: 20,
      sort_by: "distance",
    });
  });

  it("should handle GPS coordinates object", async () => {
    mockApi.post.mockResolvedValueOnce(mockApiResponse);

    const { result } = renderHook(() => useNearbyLocations());

    const gpsCoordinates = {
      latitude: -33.924,
      longitude: 18.424,
      accuracy: 10,
    };

    act(() => {
      result.current.fetchNearbyLocations(gpsCoordinates);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApi.post).toHaveBeenCalledWith("/locations/detect", {
      coordinates: [-33.924, 18.424],
      radius: 1000,
      location_type: undefined,
      min_rating: undefined,
      limit: 20,
      sort_by: "distance",
    });
  });

  it("should handle API error", async () => {
    const errorMessage = "Failed to fetch locations";
    mockApi.post.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useNearbyLocations());

    act(() => {
      result.current.fetchNearbyLocations([-33.924, 18.424]);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.locations).toEqual([]);
  });

  it("should apply custom filters", async () => {
    mockApi.post.mockResolvedValueOnce(mockApiResponse);

    const { result } = renderHook(() => useNearbyLocations());

    const customFilters = {
      radius: 2000,
      locationType: ["historic", "museum"],
      minRating: 4.0,
      maxResults: 10,
      sortBy: "rating" as const,
    };

    act(() => {
      result.current.fetchNearbyLocations([-33.924, 18.424], customFilters);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApi.post).toHaveBeenCalledWith("/locations/detect", {
      coordinates: [-33.924, 18.424],
      radius: 2000,
      location_type: ["historic", "museum"],
      min_rating: 4.0,
      limit: 10,
      sort_by: "rating",
    });

    expect(result.current.filters).toMatchObject(customFilters);
  });

  it("should sort locations by distance", async () => {
    const unsortedLocations = [...mockLocations].reverse(); // Reverse to test sorting
    mockApi.post.mockResolvedValueOnce({
      data: { locations: unsortedLocations },
    });

    const { result } = renderHook(() => useNearbyLocations());

    act(() => {
      result.current.fetchNearbyLocations([-33.924, 18.424], { sortBy: "distance" });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should be sorted by distance (150m first, then 300m)
    expect(result.current.locations[0].distance).toBe(150);
    expect(result.current.locations[1].distance).toBe(300);
  });

  it("should sort locations by rating", async () => {
    mockApi.post.mockResolvedValueOnce(mockApiResponse);

    const { result } = renderHook(() => useNearbyLocations());

    act(() => {
      result.current.fetchNearbyLocations([-33.924, 18.424], { sortBy: "rating" });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should be sorted by rating (4.5 first, then 4.2)
    expect(result.current.locations[0].location_metadata?.rating).toBe(4.5);
    expect(result.current.locations[1].location_metadata?.rating).toBe(4.2);
  });

  it("should update filters and refetch", async () => {
    mockApi.post.mockResolvedValue(mockApiResponse);

    const { result } = renderHook(() => useNearbyLocations());

    // Set initial center
    act(() => {
      result.current.fetchNearbyLocations([-33.924, 18.424]);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Update filters
    act(() => {
      result.current.updateFilters({ locationType: ["museum"], maxResults: 5 });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.filters.locationType).toEqual(["museum"]);
    expect(result.current.filters.maxResults).toBe(5);
    expect(mockApi.post).toHaveBeenCalledTimes(2);
  });

  it("should update radius and refetch", async () => {
    mockApi.post.mockResolvedValue(mockApiResponse);

    const { result } = renderHook(() => useNearbyLocations());

    // Set initial center
    act(() => {
      result.current.fetchNearbyLocations([-33.924, 18.424]);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Update radius
    act(() => {
      result.current.updateRadius(2000);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.radius).toBe(2000);
    expect(result.current.filters.radius).toBe(2000);
    expect(mockApi.post).toHaveBeenCalledTimes(2);
  });

  it("should refresh locations", async () => {
    mockApi.post.mockResolvedValue(mockApiResponse);

    const { result } = renderHook(() => useNearbyLocations());

    // Set initial center
    act(() => {
      result.current.fetchNearbyLocations([-33.924, 18.424]);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Refresh
    act(() => {
      result.current.refreshLocations();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApi.post).toHaveBeenCalledTimes(2);
  });

  it("should clear error", () => {
    const { result } = renderHook(() => useNearbyLocations());

    // Manually set error for testing
    act(() => {
      (result.current as any).setState((prev: any) => ({
        ...prev,
        error: "Test error",
      }));
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it("should clear locations", () => {
    const { result } = renderHook(() => useNearbyLocations());

    // Set some locations first
    act(() => {
      (result.current as any).setState((prev: any) => ({
        ...prev,
        locations: mockLocations,
        center: [-33.924, 18.424],
        lastFetch: Date.now(),
      }));
    });

    act(() => {
      result.current.clearLocations();
    });

    expect(result.current.locations).toEqual([]);
    expect(result.current.center).toBeNull();
    expect(result.current.lastFetch).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("should detect stale data", () => {
    const { result } = renderHook(() => 
      useNearbyLocations({ cacheTimeout: 60000 }) // 1 minute
    );

    // Data should be stale initially
    expect(result.current.isDataStale).toBe(true);

    // Set fresh data
    act(() => {
      (result.current as any).setState((prev: any) => ({
        ...prev,
        lastFetch: Date.now(),
      }));
    });

    expect(result.current.isDataStale).toBe(false);

    // Make data stale
    act(() => {
      (result.current as any).setState((prev: any) => ({
        ...prev,
        lastFetch: Date.now() - 120000, // 2 minutes ago
      }));
    });

    expect(result.current.isDataStale).toBe(true);
  });

  it("should handle auto-refresh", async () => {
    mockApi.post.mockResolvedValue(mockApiResponse);

    const { result } = renderHook(() =>
      useNearbyLocations({
        autoRefresh: true,
        refreshInterval: 1000,
        cacheTimeout: 500,
      })
    );

    // Set initial center and old data
    act(() => {
      result.current.fetchNearbyLocations([-33.924, 18.424]);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Make data stale
    act(() => {
      (result.current as any).setState((prev: any) => ({
        ...prev,
        lastFetch: Date.now() - 1000, // 1 second ago, should be stale
      }));
    });

    // Advance timer to trigger refresh
    act(() => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledTimes(2);
    });
  });

  it("should abort previous requests", async () => {
    let resolveFirst: (value: any) => void;
    let rejectSecond: (reason: any) => void;

    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    const secondPromise = new Promise((_, reject) => {
      rejectSecond = reject;
    });

    mockApi.post
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    const { result } = renderHook(() => useNearbyLocations());

    // Start first request
    act(() => {
      result.current.fetchNearbyLocations([-33.924, 18.424]);
    });

    // Start second request (should abort first)
    act(() => {
      result.current.fetchNearbyLocations([-33.925, 18.425]);
    });

    // Resolve first request (should be ignored due to abort)
    act(() => {
      resolveFirst(mockApiResponse);
    });

    // Reject second request with abort error
    act(() => {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      rejectSecond(abortError);
    });

    await waitFor(() => {
      // State should not be affected by aborted requests
      expect(result.current.locations).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  it("should cleanup on unmount", () => {
    const { result, unmount } = renderHook(() =>
      useNearbyLocations({ autoRefresh: true, refreshInterval: 1000 })
    );

    // Set initial center to start auto-refresh
    act(() => {
      result.current.fetchNearbyLocations([-33.924, 18.424]);
    });

    unmount();

    // Timer should be cleared (no errors should occur)
    act(() => {
      jest.advanceTimersByTime(2000);
    });
  });
});