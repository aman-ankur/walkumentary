'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Volume2,
  Sparkles,
  RefreshCw
} from 'lucide-react';

import { api } from '@/lib/api';
import { Tour } from '@/lib/types';

interface TourStatusTrackerProps {
  tourId: string;
  onTourReady?: (tour: Tour) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export function TourStatusTracker({ 
  tourId, 
  onTourReady, 
  onError, 
  onClose 
}: TourStatusTrackerProps) {
  const [status, setStatus] = useState<any>(null);
  const [tour, setTour] = useState<Tour | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startPolling();

    // Set timeout for 5 minutes
    timeoutRef.current = setTimeout(() => {
      setError('Tour generation timed out. Please try again.');
      stopPolling();
      if (onError) {
        onError('Tour generation timed out');
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      stopPolling();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [tourId]);

  const startPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    checkStatus(); // Initial check

    pollIntervalRef.current = setInterval(() => {
      checkStatus();
    }, 2000); // Poll every 2 seconds
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  };

  const checkStatus = async () => {
    try {
      const statusResponse = await api.getTourStatus(tourId);
      setStatus(statusResponse);

      if (statusResponse.status === 'ready') {
        // Tour is ready, fetch full tour details
        const fullTour = await api.getTour(tourId);
        setTour(fullTour);
        stopPolling();
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        if (onTourReady) {
          onTourReady(fullTour);
        }
      } else if (statusResponse.status === 'content_ready') {
        // Content is ready - fetch tour for display but continue polling for audio
        const fullTour = await api.getTour(tourId);
        setTour(fullTour);
        // Keep polling until status becomes 'ready' - audio is still generating
      } else if (statusResponse.status === 'error') {
        setError('Tour generation failed. Please try again.');
        stopPolling();
        
        if (onError) {
          onError('Tour generation failed');
        }
      }
    } catch (error) {
      console.error('Failed to check tour status:', error);
      setError('Failed to check tour status');
      stopPolling();
      
      if (onError) {
        onError('Failed to check tour status');
      }
    }
  };

  const getProgress = () => {
    if (!status) return 0;
    
    switch (status.status) {
      case 'generating':
        return 50;
      case 'content_ready':
        return 80;
      case 'ready':
        return 100;
      case 'error':
        return 0;
      default:
        return 0;
    }
  };

  const getStatusIcon = () => {
    if (!status) return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    
    switch (status.status) {
      case 'generating':
      case 'content_ready':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    if (error) return error;
    if (!status) return 'Initializing tour generation...';
    
    switch (status.status) {
      case 'generating':
        return 'Generating your personalized tour content and audio...';
      case 'content_ready':
        return 'Content generated! Creating audio narration...';
      case 'ready':
        return 'Your tour is ready! Audio and content have been generated.';
      case 'error':
        return 'Tour generation failed. Please try again.';
      default:
        return 'Processing your tour request...';
    }
  };

  const getEstimatedTime = () => {
    if (!status || status.status !== 'generating') return null;
    
    // Estimate remaining time based on progress
    const elapsed = Date.now() - new Date(status.created_at).getTime();
    const elapsedMinutes = Math.floor(elapsed / 60000);
    
    if (elapsedMinutes < 1) {
      return '1-2 minutes remaining';
    } else if (elapsedMinutes < 3) {
      return '1-2 minutes remaining';
    } else {
      return 'Almost done...';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Tour Generation Progress
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={getProgress()} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{getProgress()}% complete</span>
            {getEstimatedTime() && (
              <span>{getEstimatedTime()}</span>
            )}
          </div>
        </div>

        {/* Status Message */}
        <div className="text-center space-y-2">
          <p className="text-sm">{getStatusMessage()}</p>
          
          {(status?.status === 'generating' || status?.status === 'content_ready') && (
            <div className="text-xs text-muted-foreground">
              AI is creating personalized content based on your preferences...
            </div>
          )}
        </div>

        {/* Generation Steps */}
        {(status?.status === 'generating' || status?.status === 'content_ready') && (
          <div className="space-y-3">
            <div className="text-sm font-medium">Generation Process:</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Tour request processed</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span>Generating personalized content</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Creating audio narration</span>
              </div>
            </div>
          </div>
        )}

        {/* Tour Ready */}
        {status?.status === 'ready' && tour && (
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Tour Ready!</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div><strong>Title:</strong> {tour.title}</div>
              <div><strong>Duration:</strong> {tour.duration_minutes} minutes</div>
              <div><strong>Language:</strong> {tour.language.toUpperCase()}</div>
              {tour.audio_url && (
                <div className="flex items-center gap-1">
                  <Volume2 className="h-4 w-4" />
                  <span>Audio narration included</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {(error || status?.status === 'error') && (
          <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300 mb-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Generation Failed</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400">
              {error || 'Tour generation encountered an error. Please try again.'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {(status?.status === 'generating' || status?.status === 'content_ready') && (
            <Button 
              variant="outline" 
              onClick={checkStatus}
              disabled={!isPolling}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          )}
          
          {status?.status === 'ready' && tour && onTourReady && (
            <Button 
              onClick={() => onTourReady(tour)}
              className="flex-1"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Play Tour
            </Button>
          )}
          
          {(error || status?.status === 'error') && (
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Try Again
            </Button>
          )}
          
          {onClose && (
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
          )}
        </div>

        {/* Debug Info (Development only) */}
        {process.env.NODE_ENV === 'development' && status && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">
              Debug Info
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
              {JSON.stringify(status, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}