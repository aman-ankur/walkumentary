import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LocationSearch from '../LocationSearch'

// Mock the API
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}))

import { api } from '@/lib/api'
const mockApi = api as jest.Mocked<typeof api>

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
})

describe('LocationSearch', () => {
  const mockOnLocationSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockApi.get.mockClear()
    mockApi.post.mockClear()
    mockGeolocation.getCurrentPosition.mockClear()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should render search input', () => {
    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />)
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i)
    expect(searchInput).toBeInTheDocument()
  })

  it('should render GPS button', () => {
    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />)
    
    const gpsButton = screen.getByRole('button', { name: /use current location/i })
    expect(gpsButton).toBeInTheDocument()
  })

  it('should handle text input changes', async () => {
    const user = userEvent.setup({ delay: null })
    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />)
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i)
    
    await user.type(searchInput, 'New York')
    
    expect(searchInput).toHaveValue('New York')
  })

  it('should debounce search requests', async () => {
    const user = userEvent.setup({ delay: null })
    mockApi.get.mockResolvedValue({
      success: true,
      locations: [
        {
          id: '1',
          name: 'New York',
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'New York, NY, USA',
          location_type: 'city'
        }
      ],
      total: 1
    })

    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />)
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i)
    
    // Type rapidly
    await user.type(searchInput, 'N')
    await user.type(searchInput, 'e')
    await user.type(searchInput, 'w')
    
    // Should not have made API calls yet
    expect(mockApi.get).not.toHaveBeenCalled()
    
    // Advance timers to trigger debounced search
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledTimes(1)
      expect(mockApi.get).toHaveBeenCalledWith('/locations/search?q=New')
    })
  })

  it('should display search results', async () => {
    const user = userEvent.setup({ delay: null })
    const mockLocations = [
      {
        id: '1',
        name: 'Central Park',
        latitude: 40.7829,
        longitude: -73.9654,
        address: 'Central Park, New York, NY',
        location_type: 'park'
      },
      {
        id: '2',
        name: 'Times Square',
        latitude: 40.7580,
        longitude: -73.9855,
        address: 'Times Square, New York, NY',
        location_type: 'attraction'
      }
    ]

    mockApi.get.mockResolvedValue({
      success: true,
      locations: mockLocations,
      total: 2
    })

    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />)
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i)
    await user.type(searchInput, 'park')
    
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Central Park')).toBeInTheDocument()
      expect(screen.getByText('Times Square')).toBeInTheDocument()
    })
  })

  it('should handle location selection', async () => {
    const user = userEvent.setup({ delay: null })
    const mockLocation = {
      id: '1',
      name: 'Central Park',
      latitude: 40.7829,
      longitude: -73.9654,
      address: 'Central Park, New York, NY',
      location_type: 'park'
    }

    mockApi.get.mockResolvedValue({
      success: true,
      locations: [mockLocation],
      total: 1
    })

    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />)
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i)
    await user.type(searchInput, 'park')
    
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Central Park')).toBeInTheDocument()
    })
    
    const locationItem = screen.getByText('Central Park')
    await user.click(locationItem)
    
    expect(mockOnLocationSelect).toHaveBeenCalledWith(mockLocation)
  })

  it('should handle GPS location detection', async () => {
    const user = userEvent.setup({ delay: null })
    
    // Mock successful geolocation
    mockGeolocation.getCurrentPosition.mockImplementation((successCallback) => {
      const position = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10
        }
      }
      successCallback(position as GeolocationPosition)
    })

    mockApi.post.mockResolvedValue({
      success: true,
      locations: [
        {
          id: '1',
          name: 'Nearby Restaurant',
          latitude: 40.7130,
          longitude: -74.0065,
          address: '123 Main St, New York, NY',
          location_type: 'restaurant'
        }
      ]
    })

    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />)
    
    const gpsButton = screen.getByRole('button', { name: /use current location/i })
    await user.click(gpsButton)
    
    await waitFor(() => {
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled()
      expect(mockApi.post).toHaveBeenCalledWith('/locations/detect', {
        coordinates: { latitude: 40.7128, longitude: -74.0060 },
        radius: 1000
      })
    })
  })

  it('should handle geolocation errors', async () => {
    const user = userEvent.setup({ delay: null })
    
    // Mock geolocation error
    mockGeolocation.getCurrentPosition.mockImplementation((successCallback, errorCallback) => {
      errorCallback({
        code: 1,
        message: 'User denied geolocation'
      } as GeolocationPositionError)
    })

    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />)
    
    const gpsButton = screen.getByRole('button', { name: /use current location/i })
    await user.click(gpsButton)
    
    await waitFor(() => {
      expect(screen.getByText(/unable to get your location/i)).toBeInTheDocument()
    })
  })

  it('should show loading state during search', async () => {
    const user = userEvent.setup({ delay: null })
    
    // Mock a delayed API response
    mockApi.get.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        success: true,
        locations: [],
        total: 0
      }), 1000))
    )

    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />)
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i)
    await user.type(searchInput, 'test')
    
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/searching/i)).toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup({ delay: null })
    
    mockApi.get.mockRejectedValue(new Error('API Error'))

    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />)
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i)
    await user.type(searchInput, 'test')
    
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    await waitFor(() => {
      expect(screen.getByText(/failed to search locations/i)).toBeInTheDocument()
    })
  })

  it('should clear results when search is cleared', async () => {
    const user = userEvent.setup({ delay: null })
    
    mockApi.get.mockResolvedValue({
      success: true,
      locations: [
        {
          id: '1',
          name: 'Test Location',
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'Test Address',
          location_type: 'place'
        }
      ],
      total: 1
    })

    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />)
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i)
    
    // Search for something
    await user.type(searchInput, 'test')
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Test Location')).toBeInTheDocument()
    })
    
    // Clear the search
    await user.clear(searchInput)
    
    // Results should be cleared
    expect(screen.queryByText('Test Location')).not.toBeInTheDocument()
  })

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup({ delay: null })
    
    const mockLocations = [
      {
        id: '1',
        name: 'First Location',
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'First Address',
        location_type: 'place'
      },
      {
        id: '2',
        name: 'Second Location',
        latitude: 40.7129,
        longitude: -74.0061,
        address: 'Second Address',
        location_type: 'place'
      }
    ]

    mockApi.get.mockResolvedValue({
      success: true,
      locations: mockLocations,
      total: 2
    })

    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />)
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i)
    await user.type(searchInput, 'location')
    
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    await waitFor(() => {
      expect(screen.getByText('First Location')).toBeInTheDocument()
      expect(screen.getByText('Second Location')).toBeInTheDocument()
    })
    
    // Test arrow key navigation
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')
    
    expect(mockOnLocationSelect).toHaveBeenCalledWith(mockLocations[1])
  })

  it('should handle empty search results', async () => {
    const user = userEvent.setup({ delay: null })
    
    mockApi.get.mockResolvedValue({
      success: true,
      locations: [],
      total: 0
    })

    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />)
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i)
    await user.type(searchInput, 'nonexistentlocation')
    
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    await waitFor(() => {
      expect(screen.getByText(/no locations found/i)).toBeInTheDocument()
    })
  })

  it('should not search with empty query', async () => {
    const user = userEvent.setup({ delay: null })
    
    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />)
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i)
    await user.type(searchInput, '   ') // Just whitespace
    
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    expect(mockApi.get).not.toHaveBeenCalled()
  })

  it('should handle minimum search length', async () => {
    const user = userEvent.setup({ delay: null })
    
    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />)
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i)
    await user.type(searchInput, 'a') // Single character
    
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    // Should not search with single character
    expect(mockApi.get).not.toHaveBeenCalled()
    
    await user.type(searchInput, 'b') // Two characters
    
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    // Should search with two characters
    expect(mockApi.get).toHaveBeenCalled()
  })
})