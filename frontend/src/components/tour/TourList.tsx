'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play,
  Clock,
  MapPin,
  Calendar,
  Download,
  Trash2,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Volume2
} from 'lucide-react';

import { api } from '@/lib/api';
import { Tour } from '@/lib/types';
import { AudioPlayer } from './AudioPlayer';

interface TourListProps {
  onTourSelect?: (tour: Tour) => void;
  refreshTrigger?: number; // External trigger to refresh list
}

export function TourList({ onTourSelect, refreshTrigger }: TourListProps) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [deletingTourId, setDeletingTourId] = useState<string | null>(null);

  useEffect(() => {
    // Defer tours loading to avoid network congestion with search
    const loadDelay = setTimeout(() => {
      loadTours();
    }, 1500); // Wait 1.5 seconds before loading tours

    return () => clearTimeout(loadDelay);
  }, [refreshTrigger]);

  const loadTours = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🎵 Loading user tours...');
      const userTours = await api.getUserTours();
      console.log('✅ User tours loaded:', userTours.length);
      setTours(userTours);
    } catch (error) {
      console.error('Failed to load tours:', error);
      setError('Failed to load tours');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTourSelect = (tour: Tour) => {
    setSelectedTour(tour);
    if (onTourSelect) {
      onTourSelect(tour);
    }
  };

  const handleDelete = async (tourId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent tour selection when clicking delete
    
    if (!confirm('Are you sure you want to delete this tour?')) {
      return;
    }

    try {
      setDeletingTourId(tourId);
      await api.deleteTour(tourId);
      setTours(prev => prev.filter(tour => tour.id !== tourId));
      
      // Close audio player if deleted tour is selected
      if (selectedTour?.id === tourId) {
        setSelectedTour(null);
      }
    } catch (error) {
      console.error('Failed to delete tour:', error);
      alert('Failed to delete tour');
    } finally {
      setDeletingTourId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'generating':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready':
        return 'Ready';
      case 'generating':
        return 'Generating...';
      case 'error':
        return 'Error';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (selectedTour) {
    return (
      <AudioPlayer
        tour={selectedTour}
        onClose={() => setSelectedTour(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading your tours...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="py-8">
          <div className="text-center">
            <div className="text-destructive mb-4">{error}</div>
            <Button variant="outline" onClick={loadTours}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tours.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Your Tours</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-muted-foreground mb-4">
            You haven't generated any tours yet.
          </div>
          <div className="text-sm text-muted-foreground">
            Find a location and generate your first AI-powered tour!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Tours ({tours.length})</CardTitle>
        <Button variant="outline" size="sm" onClick={loadTours}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {tours.map((tour) => (
          <Card 
            key={tour.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleTourSelect(tour)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Tour Title and Status */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-lg truncate">
                      {tour.title || 'Untitled Tour'}
                    </h3>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(tour.status)}
                      <span className="text-sm text-muted-foreground">
                        {getStatusText(tour.status)}
                      </span>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>{tour.location?.name}</span>
                    {tour.location?.city && tour.location?.country && (
                      <span>• {tour.location.city}, {tour.location.country}</span>
                    )}
                  </div>

                  {/* Tour Details */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{tour.duration_minutes} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(tour.created_at)}</span>
                    </div>
                    {tour.audio_url && (
                      <div className="flex items-center gap-1">
                        <Volume2 className="h-4 w-4" />
                        <span>Audio ready</span>
                      </div>
                    )}
                  </div>

                  {/* Interests */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {tour.interests.slice(0, 3).map((interest) => (
                      <Badge key={interest} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                    {tour.interests.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{tour.interests.length - 3} more
                      </Badge>
                    )}
                  </div>

                  {/* Content Preview */}
                  {tour.content && tour.status === 'ready' && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {tour.content.substring(0, 100)}...
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  {tour.status === 'ready' && (
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTourSelect(tour);
                      }}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Play
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleDelete(tour.id, e)}
                    disabled={deletingTourId === tour.id}
                  >
                    {deletingTourId === tour.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}