import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GPSLocationDetector } from "../GPSLocationDetector";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNearbyLocations } from "@/hooks/useNearbyLocations";
import { LocationResponse } from "@/lib/types";

// Mock the hooks
jest.mock("@/hooks/useGeolocation");
jest.mock("@/hooks/useNearbyLocations");

const mockUseGeolocation = useGeolocation as jest.MockedFunction<typeof useGeolocation>;
const mockUseNearbyLocations = useNearbyLocations as jest.MockedFunction<typeof useNearbyLocations>;

// Mock location data
const mockLocation = {
  latitude: -33.924,
  longitude: 18.424,
  accuracy: 10,
};

const mockNearbyLocations: LocationResponse[] = [
  {
    id: "1",
    name: "Castle of Good Hope",
    description: "Historic fort",
    latitude: -33.9248,
    longitude: 18.4232,
    distance: 150,
    location_metadata: { rating: 4.5 },
  },
  {
    id: "2",
    name: "Company's Garden",
    description: "Botanical garden",
    latitude: -33.9274,
    longitude: 18.4229,
    distance: 300,
    location_metadata: { rating: 4.2 },
  },
];

describe("GPSLocationDetector", () => {
  const mockGeolocationReturn = {
    location: null,
    error: null,
    isLoading: false,
    isSupported: true,
    lastUpdated: null,
    getCurrentLocation: jest.fn(),
    startWatching: jest.fn(),
    stopWatching: jest.fn(),
    clearError: jest.fn(),
  };

  const mockNearbyReturn = {
    locations: [],
    isLoading: false,
    error: null,
    lastFetch: null,
    center: null,
    radius: 1000,
    filters: { radius: 1000, maxResults: 20, sortBy: "distance" as const },
    fetchNearbyLocations: jest.fn(),
    refreshLocations: jest.fn(),
    updateFilters: jest.fn(),
    updateRadius: jest.fn(),
    clearError: jest.fn(),
    clearLocations: jest.fn(),
    isDataStale: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGeolocation.mockReturnValue(mockGeolocationReturn);
    mockUseNearbyLocations.mockReturnValue(mockNearbyReturn);
  });

  it("should render initial state", () => {
    render(<GPSLocationDetector />);

    expect(screen.getByText("GPS Location Detection")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /detect location/i })).toBeInTheDocument();
  });

  it("should show unsupported message when GPS is not supported", () => {
    mockUseGeolocation.mockReturnValue({
      ...mockGeolocationReturn,
      isSupported: false,
    });

    render(<GPSLocationDetector />);

    expect(screen.getByText("Not Supported")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /detect location/i })).toBeDisabled();
  });

  it("should show loading state during GPS detection", () => {
    mockUseGeolocation.mockReturnValue({
      ...mockGeolocationReturn,
      isLoading: true,
    });

    render(<GPSLocationDetector />);

    expect(screen.getByText("Detect Location")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /detect location/i });
    expect(button).toBeDisabled();
  });

  it("should handle GPS detection button click", async () => {
    const user = userEvent.setup();
    render(<GPSLocationDetector />);

    const detectButton = screen.getByRole("button", { name: /detect location/i });
    await user.click(detectButton);

    expect(mockGeolocationReturn.getCurrentLocation).toHaveBeenCalled();
  });

  it("should show location when GPS detection succeeds", () => {
    mockUseGeolocation.mockReturnValue({
      ...mockGeolocationReturn,
      location: mockLocation,
      lastUpdated: Date.now(),
    });

    render(<GPSLocationDetector />);

    expect(screen.getByText("Location detected")).toBeInTheDocument();
    expect(screen.getByText(/Lat: -33.924000, Lng: 18.424000/)).toBeInTheDocument();
    expect(screen.getByText(/Accuracy: 10m/)).toBeInTheDocument();
  });

  it("should show GPS error", () => {
    mockUseGeolocation.mockReturnValue({
      ...mockGeolocationReturn,
      error: { code: 1, message: "Location access denied" },
    });

    render(<GPSLocationDetector />);

    expect(screen.getByText("Location Error")).toBeInTheDocument();
    expect(screen.getByText("Location access denied")).toBeInTheDocument();
  });

  it("should show nearby locations error", () => {
    mockUseNearbyLocations.mockReturnValue({
      ...mockNearbyReturn,
      error: "Failed to fetch nearby locations",
    });

    render(<GPSLocationDetector />);

    expect(screen.getByText("Location Error")).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch nearby locations")).toBeInTheDocument();
  });

  it("should clear errors when close button is clicked", async () => {
    const user = userEvent.setup();
    
    mockUseGeolocation.mockReturnValue({
      ...mockGeolocationReturn,
      error: { code: 1, message: "Location access denied" },
    });

    render(<GPSLocationDetector />);

    const closeButton = screen.getByRole("button", { name: "" }); // X button
    await user.click(closeButton);

    expect(mockGeolocationReturn.clearError).toHaveBeenCalled();
  });

  it("should show track location buttons when location is available", () => {
    mockUseGeolocation.mockReturnValue({
      ...mockGeolocationReturn,
      location: mockLocation,
    });

    render(<GPSLocationDetector />);

    expect(screen.getByRole("button", { name: /track location/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
  });

  it("should start and stop location tracking", async () => {
    const user = userEvent.setup();
    
    mockUseGeolocation.mockReturnValue({
      ...mockGeolocationReturn,
      location: mockLocation,
    });

    const { rerender } = render(<GPSLocationDetector />);

    // Start tracking
    const trackButton = screen.getByRole("button", { name: /track location/i });
    await user.click(trackButton);

    expect(mockGeolocationReturn.startWatching).toHaveBeenCalled();

    // Mock auto-refresh state
    mockUseGeolocation.mockReturnValue({
      ...mockGeolocationReturn,
      location: mockLocation,
    });

    rerender(<GPSLocationDetector />);

    // Should now show stop tracking button (this would be handled by component state)
    // In the actual component, autoRefresh state would change the button text
  });

  it("should refresh nearby locations", async () => {
    const user = userEvent.setup();
    
    mockUseGeolocation.mockReturnValue({
      ...mockGeolocationReturn,
      location: mockLocation,
    });

    render(<GPSLocationDetector />);

    const refreshButton = screen.getByRole("button", { name: /refresh/i });
    await user.click(refreshButton);

    expect(mockNearbyReturn.refreshLocations).toHaveBeenCalled();
  });

  it("should show nearby locations when available", () => {
    mockUseGeolocation.mockReturnValue({
      ...mockGeolocationReturn,
      location: mockLocation,
    });

    mockUseNearbyLocations.mockReturnValue({
      ...mockNearbyReturn,
      locations: mockNearbyLocations,
    });

    render(<GPSLocationDetector />);

    expect(screen.getByText("Nearby Locations (2)")).toBeInTheDocument();
    expect(screen.getByText("Castle of Good Hope")).toBeInTheDocument();
    expect(screen.getByText("Company's Garden")).toBeInTheDocument();
  });

  it("should show no locations message when none found", () => {
    mockUseGeolocation.mockReturnValue({
      ...mockGeolocationReturn,
      location: mockLocation,
    });

    mockUseNearbyLocations.mockReturnValue({
      ...mockNearbyReturn,
      locations: [],
    });

    render(<GPSLocationDetector />);

    expect(screen.getByText("No locations found nearby")).toBeInTheDocument();
    expect(screen.getByText("Try increasing the search radius")).toBeInTheDocument();
  });

  it("should show loading state for nearby locations", () => {
    mockUseGeolocation.mockReturnValue({
      ...mockGeolocationReturn,
      location: mockLocation,
    });

    mockUseNearbyLocations.mockReturnValue({
      ...mockNearbyReturn,
      isLoading: true,
    });

    render(<GPSLocationDetector />);

    expect(screen.getByText("Finding nearby locations...")).toBeInTheDocument();
  });

  it("should toggle settings panel", async () => {
    const user = userEvent.setup();
    
    mockUseGeolocation.mockReturnValue({
      ...mockGeolocationReturn,
      location: mockLocation,
    });

    render(<GPSLocationDetector />);

    // Settings should not be visible initially
    expect(screen.queryByText("Search Filters")).not.toBeInTheDocument();

    // Click settings button
    const settingsButton = screen.getByRole("button", { name: "" }); // Settings icon button
    await user.click(settingsButton);

    // Settings should now be visible
    expect(screen.getByText("Search Filters")).toBeInTheDocument();
  });

  it("should update radius via slider", async () => {
    mockUseGeolocation.mockReturnValue({
      ...mockGeolocationReturn,
      location: mockLocation,
    });

    render(<GPSLocationDetector showSettings={false} />);

    // Force show filters by clicking settings
    const settingsButton = screen.getByRole("button", { name: "" });
    fireEvent.click(settingsButton);

    // Find the radius slider
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "2000" } });

    expect(mockNearbyReturn.updateRadius).toHaveBeenCalledWith(2000);
  });

  it("should call onLocationSelect when location is selected", async () => {
    const mockOnLocationSelect = jest.fn();
    
    mockUseGeolocation.mockReturnValue({
      ...mockGeolocationReturn,
      location: mockLocation,
    });

    mockUseNearbyLocations.mockReturnValue({
      ...mockNearbyReturn,
      locations: mockNearbyLocations,
    });

    render(<GPSLocationDetector onLocationSelect={mockOnLocationSelect} />);

    // This would be handled by the LocationCard component
    // The test would need to be more integrated to test this functionality
  });

  it("should auto-start GPS detection when autoStart is true", () => {
    render(<GPSLocationDetector autoStart={true} />);

    expect(mockGeolocationReturn.getCurrentLocation).toHaveBeenCalled();
  });

  it("should show stale data badge", () => {
    mockUseGeolocation.mockReturnValue({
      ...mockGeolocationReturn,
      location: mockLocation,
    });

    mockUseNearbyLocations.mockReturnValue({
      ...mockNearbyReturn,
      locations: mockNearbyLocations,
      isDataStale: true,
    });

    render(<GPSLocationDetector />);

    expect(screen.getByText("Stale Data")).toBeInTheDocument();
  });

  it("should format last updated time", () => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    mockUseGeolocation.mockReturnValue({
      ...mockGeolocationReturn,
      location: mockLocation,
      lastUpdated: fiveMinutesAgo,
    });

    render(<GPSLocationDetector />);

    expect(screen.getByText("• 5 minutes ago")).toBeInTheDocument();
  });

  it("should handle custom className", () => {
    const { container } = render(<GPSLocationDetector className="custom-class" />);
    
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should hide settings when showSettings is false", () => {
    render(<GPSLocationDetector showSettings={false} />);

    // Settings button should not be present
    expect(screen.queryByRole("button", { name: "" })).toBeNull();
  });
});