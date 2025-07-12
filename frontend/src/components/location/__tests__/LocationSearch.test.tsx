import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { LocationSearch } from '../LocationSearch';
import { searchLocations } from '@/lib/api';
import { LocationResponse } from '@/lib/types';

// Mock the API function
jest.mock('@/lib/api', () => ({
  searchLocations: jest.fn(),
}));

const mockSearchLocations = searchLocations as jest.MockedFunction<typeof searchLocations>;

// Mock the useDebounce hook
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: jest.fn((value) => value),
}));

// Sample location data
const mockLocations: LocationResponse[] = [
  {
    id: '1',
    name: 'Central Park',
    description: 'Large public park in Manhattan',
    latitude: 40.7829,
    longitude: -73.9654,
    city: 'New York',
    country: 'United States',
    location_type: 'park',
    location_metadata: { rating: 4.5 },
  },
  {
    id: '2',
    name: 'Times Square',
    description: 'Commercial and entertainment hub',
    latitude: 40.7580,
    longitude: -73.9855,
    city: 'New York',
    country: 'United States', 
    location_type: 'landmark',
    location_metadata: { rating: 4.2 },
  },
];

describe('LocationSearch', () => {
  const mockOnLocationSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render search input with placeholder', () => {
    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />);
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should render custom placeholder when provided', () => {
    const customPlaceholder = 'Find your destination';
    render(
      <LocationSearch 
        onLocationSelect={mockOnLocationSelect} 
        placeholder={customPlaceholder}
      />
    );
    
    const searchInput = screen.getByPlaceholderText(customPlaceholder);
    expect(searchInput).toBeInTheDocument();
  });

  it('should search locations when user types', async () => {
    mockSearchLocations.mockResolvedValue(mockLocations);
    
    const user = userEvent.setup({ delay: null });
    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />);
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i);
    
    await user.type(searchInput, 'Central Park');
    
    await waitFor(() => {
      expect(mockSearchLocations).toHaveBeenCalledWith('Central Park');
    });
  });

  it('should display search results', async () => {
    mockSearchLocations.mockResolvedValue(mockLocations);
    
    const user = userEvent.setup({ delay: null });
    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />);
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i);
    await user.type(searchInput, 'Central');
    
    await waitFor(() => {
      expect(screen.getByText('Central Park')).toBeInTheDocument();
      expect(screen.getByText('Times Square')).toBeInTheDocument();
    });
  });

  it('should call onLocationSelect when location is clicked', async () => {
    mockSearchLocations.mockResolvedValue(mockLocations);
    
    const user = userEvent.setup({ delay: null });
    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />);
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i);
    await user.type(searchInput, 'Central');
    
    await waitFor(() => {
      expect(screen.getByText('Central Park')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Central Park'));
    
    expect(mockOnLocationSelect).toHaveBeenCalledWith(mockLocations[0]);
  });

  it('should show loading state while searching', async () => {
    // Mock a delayed response
    mockSearchLocations.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockLocations), 100))
    );
    
    const user = userEvent.setup({ delay: null });
    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />);
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i);
    await user.type(searchInput, 'Central Park');
    
    // Should show loading spinner
    expect(screen.getByTestId('search-loading')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByTestId('search-loading')).not.toBeInTheDocument();
    });
  });

  it('should show error message when search fails', async () => {
    mockSearchLocations.mockRejectedValue(new Error('Search failed'));
    
    const user = userEvent.setup({ delay: null });
    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />);
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i);
    await user.type(searchInput, 'Invalid location');
    
    await waitFor(() => {
      expect(screen.getByText(/failed to search locations/i)).toBeInTheDocument();
    });
  });

  it('should show no results message when no locations found', async () => {
    mockSearchLocations.mockResolvedValue([]);
    
    const user = userEvent.setup({ delay: null });
    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />);
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i);
    await user.type(searchInput, 'Nonexistent location');
    
    await waitFor(() => {
      expect(screen.getByText(/no locations found/i)).toBeInTheDocument();
    });
  });

  it('should handle minimum search length', async () => {
    const user = userEvent.setup({ delay: null });
    
    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />);
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i);
    await user.type(searchInput, 'a'); // Single character
    
    // Should not search with single character
    expect(mockSearchLocations).not.toHaveBeenCalled();
  });

  it('should clear results when input is cleared', async () => {
    mockSearchLocations.mockResolvedValue(mockLocations);
    
    const user = userEvent.setup({ delay: null });
    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />);
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i);
    
    // Type and get results
    await user.type(searchInput, 'Central');
    
    await waitFor(() => {
      expect(screen.getByText('Central Park')).toBeInTheDocument();
    });
    
    // Clear input
    await user.clear(searchInput);
    
    await waitFor(() => {
      expect(screen.queryByText('Central Park')).not.toBeInTheDocument();
    });
  });

  it('should close results when clicking outside', async () => {
    mockSearchLocations.mockResolvedValue(mockLocations);
    
    const user = userEvent.setup({ delay: null });
    render(
      <div>
        <LocationSearch onLocationSelect={mockOnLocationSelect} />
        <div data-testid="outside-element">Outside</div>
      </div>
    );
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i);
    
    // Get search results
    await user.type(searchInput, 'Central');
    
    await waitFor(() => {
      expect(screen.getByText('Central Park')).toBeInTheDocument();
    });
    
    // Click outside
    await user.click(screen.getByTestId('outside-element'));
    
    await waitFor(() => {
      expect(screen.queryByText('Central Park')).not.toBeInTheDocument();
    });
  });

  it('should handle keyboard navigation', async () => {
    mockSearchLocations.mockResolvedValue(mockLocations);
    
    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />);
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i);
    
    // Type to get results
    await userEvent.type(searchInput, 'Central');
    
    await waitFor(() => {
      expect(screen.getByText('Central Park')).toBeInTheDocument();
    });
    
    // Press down arrow to select first item
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    
    // Press enter to select
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    
    expect(mockOnLocationSelect).toHaveBeenCalledWith(mockLocations[0]);
  });

  it('should display location metadata correctly', async () => {
    mockSearchLocations.mockResolvedValue(mockLocations);
    
    const user = userEvent.setup({ delay: null });
    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />);
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i);
    await user.type(searchInput, 'Central');
    
    await waitFor(() => {
      expect(screen.getByText('Central Park')).toBeInTheDocument();
      expect(screen.getByText(/Large public park in Manhattan/)).toBeInTheDocument();
      expect(screen.getByText(/New York, United States/)).toBeInTheDocument();
    });
  });

  it('should handle empty search gracefully', async () => {
    const user = userEvent.setup({ delay: null });
    render(<LocationSearch onLocationSelect={mockOnLocationSelect} />);
    
    const searchInput = screen.getByPlaceholderText(/search for locations/i);
    
    // Type spaces only
    await user.type(searchInput, '   ');
    
    // Should not make API call for empty/whitespace search
    expect(mockSearchLocations).not.toHaveBeenCalled();
  });
});