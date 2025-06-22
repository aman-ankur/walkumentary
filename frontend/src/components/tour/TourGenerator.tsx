'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin, Clock, DollarSign, Sparkles, Volume2 } from 'lucide-react';

import { api } from '@/lib/api';
import { Location, TourGenerationParams } from '@/lib/types';

interface TourGeneratorProps {
  location: Location;
  onTourGenerated?: (tourId: string) => void;
  onClose?: () => void;
}

const AVAILABLE_INTERESTS = [
  'history',
  'culture',
  'architecture',
  'art',
  'food',
  'nature',
  'adventure',
  'photography',
  'local life',
  'monuments',
  'museums',
  'parks',
  'religion',
  'science',
  'technology'
];

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' }
];

export function TourGenerator({ location, onTourGenerated, onClose }: TourGeneratorProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['history', 'culture']);
  const [duration, setDuration] = useState([30]);
  const [language, setLanguage] = useState('en');
  const [isGenerating, setIsGenerating] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<any>(null);
  const [customInterest, setCustomInterest] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Get cost estimate when parameters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      getCostEstimate();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [selectedInterests, duration[0], language]);

  const getCostEstimate = async () => {
    try {
      const params: TourGenerationParams = {
        location_id: location.id,
        interests: selectedInterests,
        duration_minutes: duration[0],
        language: language
      };

      const estimate = await api.estimateTourCost(params);
      setEstimatedCost(estimate);
    } catch (error) {
      console.error('Failed to get cost estimate:', error);
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      } else if (prev.length < 5) {
        return [...prev, interest];
      }
      return prev;
    });
  };

  const addCustomInterest = () => {
    if (customInterest.trim() && !selectedInterests.includes(customInterest.trim()) && selectedInterests.length < 5) {
      setSelectedInterests(prev => [...prev, customInterest.trim()]);
      setCustomInterest('');
    }
  };

  const handleGenerate = async () => {
    if (selectedInterests.length === 0) {
      setError('Please select at least one interest');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const params: TourGenerationParams = {
        location_id: location.id,
        interests: selectedInterests,
        duration_minutes: duration[0],
        language: language
      };

      const response = await api.generateTour(params);
      
      if (onTourGenerated) {
        onTourGenerated(response.tour_id);
      }
    } catch (error) {
      console.error('Failed to generate tour:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate tour');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Generate AI Tour for {location.name}
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {location.city}, {location.country}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Interests Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">
            Interests (max 5) - {selectedInterests.length}/5
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_INTERESTS.map((interest) => (
              <Badge
                key={interest}
                variant={selectedInterests.includes(interest) ? "default" : "secondary"}
                className="cursor-pointer transition-colors hover:bg-primary/80"
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </Badge>
            ))}
          </div>
          
          {/* Custom Interest Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add custom interest..."
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomInterest()}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addCustomInterest}
              disabled={!customInterest.trim() || selectedInterests.length >= 5}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Duration Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <label className="text-sm font-medium">
              Tour Duration: {duration[0]} minutes
            </label>
          </div>
          <Slider
            value={duration}
            onValueChange={setDuration}
            max={180}
            min={10}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>10 min</span>
            <span>180 min</span>
          </div>
        </div>

        {/* Language Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Language</label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cost Estimate */}
        {estimatedCost && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="h-4 w-4" />
              Cost Estimate
            </div>
            {estimatedCost.cached ? (
              <div className="text-sm text-green-600">
                Free (cached content available)
              </div>
            ) : (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Content Generation:</span>
                  <span>${estimatedCost.content_generation?.estimated_cost?.toFixed(4) || '0.0000'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Audio Generation:</span>
                  <span>${estimatedCost.audio_generation?.estimated_cost?.toFixed(4) || '0.0000'}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-medium">
                  <span>Total:</span>
                  <span>${estimatedCost.total_estimated_cost?.toFixed(4) || '0.0000'}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Features Preview */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg p-4">
          <div className="text-sm font-medium mb-2">Your tour will include:</div>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Volume2 className="h-3 w-3" />
              AI-generated audio
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              Personalized content
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              {duration[0]}-minute experience
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              Location-specific facts
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          {onClose && (
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          )}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || selectedInterests.length === 0}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Tour...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Tour
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}