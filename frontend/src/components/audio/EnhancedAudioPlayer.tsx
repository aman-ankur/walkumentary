import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAudioPlayer } from "@/components/player/AudioPlayerProvider";
import { TourArtwork } from "@/components/audio/TourArtwork";
import { SubtitleOverlay } from "@/components/audio/SubtitleOverlay";

// TODO: replace with real Tour type once lib/types.ts is updated
export interface EnhancedAudioPlayerProps {
  tour: any;
}

/**
 * EnhancedAudioPlayer – Phase-1 functional player with refreshed skin.
 * Hooks into existing AudioPlayerProvider for playback controls.
 */
export function EnhancedAudioPlayer({ tour }: EnhancedAudioPlayerProps) {
  const [subtitleOpen, setSubtitleOpen] = useState(false);

  // Player state comes from AudioPlayerProvider
  const {
    isPlaying,
    togglePlay,
    currentTime,
    duration,
    seek,
  } = useAudioPlayer();

  const skip = (delta: number) => {
    seek(Math.min(Math.max(currentTime + delta, 0), duration));
  };

  const formatTime = (time = 0) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col">
      {/* Artwork */}
      <div className="h-56 md:h-72">
        <TourArtwork tourId={tour.id} />
      </div>

      {/* Main controls */}
      <div className="p-6 space-y-6">
        {/* Title / location */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2">
            {tour.title}
          </h3>
          {tour?.location?.name && (
            <p className="text-sm text-gray-600">{tour.location.name}</p>
          )}
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={1}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full h-1 accent-orange-500 cursor-pointer"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Seek Backward"
            onClick={() => skip(-15)}
          >
            ⏮️
          </Button>
          <Button
            size="icon"
            className="w-16 h-16 rounded-full bg-orange-500 text-white hover:bg-orange-600"
            onClick={togglePlay}
            aria-label="Play/Pause"
          >
            {isPlaying ? "⏸️" : "▶️"}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Seek Forward"
            onClick={() => skip(15)}
          >
            ⏭️
          </Button>
        </div>

        {/* Subtitle toggle */}
        <div className="text-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSubtitleOpen(true)}
            disabled={!tour?.transcript?.length}
          >
            {tour?.transcript?.length ? "View Transcript" : "Transcript Unavailable"}
          </Button>
        </div>
      </div>

      {/* Overlay */}
      <SubtitleOverlay
        isOpen={subtitleOpen}
        onClose={() => setSubtitleOpen(false)}
        subtitles={tour?.transcript}
        currentTime={currentTime}
        onSeek={seek}
      />
    </div>
  );
} 