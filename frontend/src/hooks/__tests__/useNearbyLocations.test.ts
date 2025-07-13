import { renderHook, act, waitFor } from "@testing-library/react";
import { useNearbyLocations } from "../useNearbyLocations";
import { LocationResponse } from "@/lib/types";

// Mock the API
jest.mock("@/lib/api", () => ({
  post: jest.fn(),
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
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
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
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

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
    expect(result.current.center).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.lastFetch).toBeNull();
    expect(result.current.isDataStale).toBe(true);
  });

  it("should fetch nearby locations successfully", async () => {
    mockApi.post.mockResolvedValue(mockLocations);

    const { result } = renderHook(() => useNearbyLocations());

    await act(async () => {
      await result.current.fetchNearbyLocations([-33.924, 18.424]);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.locations).toEqual(mockLocations);
    expect(result.current.center).toEqual([-33.924, 18.424]);
    expect(result.current.error).toBeNull();
    expect(result.current.lastFetch).toBeGreaterThan(0);
  });

  it("should handle API errors gracefully", async () => {
    const errorMessage = "Network error";
    mockApi.post.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useNearbyLocations());

    await act(async () => {
      await result.current.fetchNearbyLocations([-33.924, 18.424]);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.locations).toEqual([]);
    expect(result.current.error).toBe(errorMessage);
  });

  it("should update filters", async () => {
    const { result } = renderHook(() => useNearbyLocations());

    act(() => {
      result.current.updateFilters({ radius: 500 });
    });

    expect(result.current.filters.radius).toBe(500);
  });

  it("should update radius", async () => {
    const { result } = renderHook(() => useNearbyLocations());

    act(() => {
      result.current.updateRadius(2000);
    });

    expect(result.current.radius).toBe(2000);
  });

  it("should clear error when called", async () => {
    mockApi.post.mockRejectedValue(new Error("Test error"));

    const { result } = renderHook(() => useNearbyLocations());

    // Cause an error
    await act(async () => {
      await result.current.fetchNearbyLocations([-33.924, 18.424]);
    });

    expect(result.current.error).toBeTruthy();

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it("should clear locations when called", async () => {
    mockApi.post.mockResolvedValue(mockLocations);

    const { result } = renderHook(() => useNearbyLocations());

    // Fetch some locations first
    await act(async () => {
      await result.current.fetchNearbyLocations([-33.924, 18.424]);
    });

    expect(result.current.locations.length).toBeGreaterThan(0);

    // Clear the locations
    act(() => {
      result.current.clearLocations();
    });

    expect(result.current.locations).toEqual([]);
    expect(result.current.center).toBeNull();
    expect(result.current.lastFetch).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("should detect stale data correctly", async () => {
    mockApi.post.mockResolvedValue(mockLocations);

    const { result } = renderHook(() =>
      useNearbyLocations({ cacheTimeout: 1000 }) // 1 second timeout
    );

    // Initially should be stale
    expect(result.current.isDataStale).toBe(true);

    // Fetch fresh data
    await act(async () => {
      await result.current.fetchNearbyLocations([-33.924, 18.424]);
    });

    expect(result.current.isDataStale).toBe(false);

    // Fast forward time to make data stale
    act(() => {
      jest.advanceTimersByTime(1100);
    });

    expect(result.current.isDataStale).toBe(true);
  });

  it("should refresh locations when called", async () => {
    mockApi.post.mockResolvedValue(mockLocations);

    const { result } = renderHook(() => useNearbyLocations());

    // Set initial center
    await act(async () => {
      await result.current.fetchNearbyLocations([-33.924, 18.424]);
    });

    expect(mockApi.post).toHaveBeenCalledTimes(1);

    // Refresh should call API again
    await act(async () => {
      result.current.refreshLocations();
    });

    expect(mockApi.post).toHaveBeenCalledTimes(2);
  });
});