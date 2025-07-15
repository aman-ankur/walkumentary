import { renderHook, act, waitFor } from "@testing-library/react";
import { useGeolocation } from "../useGeolocation";

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, "geolocation", {
  value: mockGeolocation,
  writable: true,
});

// Mock position object
const mockPosition: GeolocationPosition = {
  coords: {
    latitude: -33.924,
    longitude: 18.424,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    toJSON: () => ({
      latitude: -33.924,
      longitude: 18.424,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    }),
  },
  timestamp: Date.now(),
  toJSON: () => ({
    coords: {
      latitude: -33.924,
      longitude: 18.424,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  }),
};

describe("useGeolocation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should initialize with correct default state", () => {
    const { result } = renderHook(() => useGeolocation());

    expect(result.current.location).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSupported).toBe(true);
    expect(result.current.lastUpdated).toBeNull();
  });

  it("should detect unsupported geolocation", () => {
    // Temporarily remove geolocation
    const originalGeolocation = global.navigator.geolocation;
    delete (global.navigator as any).geolocation;

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.isSupported).toBe(false);

    // Restore geolocation for other tests
    Object.defineProperty(global.navigator, "geolocation", {
      value: originalGeolocation,
      writable: true,
    });
  });

  it("should successfully get current location", async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      setTimeout(() => success(mockPosition), 0);
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.getCurrentLocation();
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.location).toEqual({
      latitude: -33.924,
      longitude: 18.424,
      accuracy: 10,
      altitude: undefined,
      altitudeAccuracy: undefined,
      heading: undefined,
      speed: undefined,
    });
    expect(result.current.error).toBeNull();
    expect(result.current.lastUpdated).toBeGreaterThan(0);
  });

  it("should handle permission denied error", async () => {
    const positionError: GeolocationPositionError = {
      code: 1,
      message: "Permission denied",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      setTimeout(() => error(positionError), 0);
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.getCurrentLocation();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual({
      code: 1,
      message: "Location access denied. Please enable location services.",
    });
    expect(result.current.location).toBeNull();
  });

  it("should handle position unavailable error", async () => {
    const positionError: GeolocationPositionError = {
      code: 2,
      message: "Position unavailable",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      setTimeout(() => error(positionError), 0);
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.getCurrentLocation();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual({
      code: 2,
      message: "Location unavailable. Please try again.",
    });
  });

  it("should handle timeout error", async () => {
    const positionError: GeolocationPositionError = {
      code: 3,
      message: "Timeout",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      setTimeout(() => error(positionError), 0);
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.getCurrentLocation();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual({
      code: 3,
      message: "Location request timeout. Please try again.",
    });
  });

  it("should retry on position unavailable error", async () => {
    let callCount = 0;
    const positionError: GeolocationPositionError = {
      code: 2,
      message: "Position unavailable",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      callCount++;
      if (callCount < 3) {
        setTimeout(() => error(positionError), 0);
      } else {
        setTimeout(() => success(mockPosition), 0);
      }
    });

    const { result } = renderHook(() => 
      useGeolocation({ retryAttempts: 3, retryDelay: 100 })
    );

    act(() => {
      result.current.getCurrentLocation();
    });

    // Fast-forward retry delays
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(callCount).toBe(3);
    expect(result.current.location).toEqual({
      latitude: -33.924,
      longitude: 18.424,
      accuracy: 10,
      altitude: undefined,
      altitudeAccuracy: undefined,
      heading: undefined,
      speed: undefined,
    });
    expect(result.current.error).toBeNull();
  });

  it("should start and stop watching position", () => {
    const watchId = 123;
    mockGeolocation.watchPosition.mockReturnValue(watchId);

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.startWatching();
    });

    expect(mockGeolocation.watchPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );

    act(() => {
      result.current.stopWatching();
    });

    expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(watchId);
  });

  it("should auto-start watching when watch option is enabled", () => {
    const watchId = 123;
    mockGeolocation.watchPosition.mockReturnValue(watchId);

    renderHook(() => useGeolocation({ watch: true }));

    expect(mockGeolocation.watchPosition).toHaveBeenCalled();
  });

  it("should clear error", () => {
    const { result } = renderHook(() => useGeolocation());

    // Set an error first
    act(() => {
      (result.current as any).setState((prev: any) => ({
        ...prev,
        error: { code: 1, message: "Test error" },
      }));
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it("should use custom options", () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      setTimeout(() => success(mockPosition), 0);
    });

    const { result } = renderHook(() =>
      useGeolocation({
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 600000,
      })
    );

    act(() => {
      result.current.getCurrentLocation();
    });

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 600000,
      }
    );
  });

  it("should handle unsupported geolocation gracefully", () => {
    const originalGeolocation = global.navigator.geolocation;
    delete (global.navigator as any).geolocation;

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.getCurrentLocation();
    });

    expect(result.current.error).toEqual({
      code: 0,
      message: "Geolocation is not supported by this browser.",
    });

    // Restore geolocation
    Object.defineProperty(global.navigator, "geolocation", {
      value: originalGeolocation,
      writable: true,
    });
  });

  it("should cleanup on unmount", () => {
    const watchId = 123;
    mockGeolocation.watchPosition.mockReturnValue(watchId);

    const { result, unmount } = renderHook(() => useGeolocation({ watch: true }));

    act(() => {
      result.current.startWatching();
    });

    unmount();

    expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(watchId);
  });
});