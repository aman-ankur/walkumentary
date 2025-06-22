'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Rewind,
  FastForward,
  Download,
  Loader2
} from 'lucide-react';

import { api } from '@/lib/api';
import { Tour } from '@/lib/types';

interface AudioPlayerProps {
  tour: Tour;
  onClose?: () => void;
}

export function AudioPlayer({ tour, onClose }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([1]);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load audio when component mounts
  useEffect(() => {
    loadAudio();
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [tour.id]);

  // Update audio element when audioUrl changes
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.load();
    }
  }, [audioUrl]);

  const loadAudio = async () => {
    if (!tour.audio_url) {
      setError('Audio not available for this tour');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const audioBlob = await api.getTourAudio(tour.id);
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      setError(null);
    } catch (error) {
      console.error('Failed to load audio:', error);
      setError('Failed to load audio');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime += 10; // Skip 10 seconds
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime -= 10; // Skip back 10 seconds
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      audioRef.current.volume = volume[0];
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    if (!audioRef.current) return;
    
    setVolume(newVolume);
    audioRef.current.volume = newVolume[0];
    
    if (newVolume[0] === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleTimeChange = (newTime: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime[0];
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const downloadAudio = async () => {
    try {
      if (audioUrl) {
        const link = document.createElement('a');
        link.href = audioUrl;
        link.download = `${tour.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Failed to download audio:', error);
    }
  };

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Audio event handlers
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleEnded = () => setIsPlaying(false);

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading audio...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="py-8">
          <div className="text-center">
            <div className="text-destructive mb-4">{error}</div>
            <Button variant="outline" onClick={loadAudio}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">{tour.title}</CardTitle>
        <div className="flex flex-wrap gap-2">
          {tour.interests.map((interest) => (
            <Badge key={interest} variant="secondary" className="text-xs">
              {interest}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Audio Element */}
        <audio
          ref={audioRef}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          preload="metadata"
        >
          {audioUrl && <source src={audioUrl} type="audio/mpeg" />}
          Your browser does not support the audio element.
        </audio>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            onValueChange={handleTimeChange}
            max={duration || 100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={skipBackward}
            disabled={!audioUrl}
          >
            <Rewind className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={skipBackward}
            disabled={!audioUrl}
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            size="lg"
            onClick={togglePlay}
            disabled={!audioUrl}
            className="w-16 h-16 rounded-full"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={skipForward}
            disabled={!audioUrl}
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={skipForward}
            disabled={!audioUrl}
          >
            <FastForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Volume and Speed Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              disabled={!audioUrl}
            >
              {isMuted || volume[0] === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={volume}
              onValueChange={handleVolumeChange}
              max={1}
              step={0.1}
              className="flex-1"
              disabled={!audioUrl}
            />
            <span className="text-xs text-muted-foreground min-w-[3ch]">
              {Math.round(volume[0] * 100)}%
            </span>
          </div>

          {/* Playback Speed */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Speed:</span>
            <div className="flex gap-1">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <Button
                  key={rate}
                  variant={playbackRate === rate ? "default" : "outline"}
                  size="sm"
                  onClick={() => changePlaybackRate(rate)}
                  disabled={!audioUrl}
                  className="px-2 py-1 text-xs"
                >
                  {rate}x
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Tour Content Preview */}
        {tour.content && (
          <div className="bg-muted/50 rounded-lg p-4 max-h-32 overflow-y-auto">
            <div className="text-sm text-muted-foreground">
              {tour.content.substring(0, 200)}...
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={downloadAudio}
            disabled={!audioUrl}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          )}
        </div>

        {/* Tour Info */}
        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground border-t pt-4">
          <div>
            <span className="font-medium">Duration:</span> {tour.duration_minutes} min
          </div>
          <div>
            <span className="font-medium">Language:</span> {tour.language.toUpperCase()}
          </div>
          <div>
            <span className="font-medium">Location:</span> {tour.location?.name}
          </div>
          <div>
            <span className="font-medium">Generated:</span> {
              new Date(tour.created_at).toLocaleDateString()
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
}