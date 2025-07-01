import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAudioPlayer } from "@/components/player/AudioPlayerProvider";
import { TourArtwork } from "@/components/audio/TourArtwork";
import { SubtitleOverlay } from "@/components/audio/SubtitleOverlay";
import { VolumeControl } from "@/components/audio/VolumeControl";
import { 
  RewindIcon, 
  SkipBackIcon, 
  PlayPauseIcon, 
  SkipForwardIcon, 
  ForwardIcon 
} from "@/components/ui/icons";

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
    volume,
    seek,
    setVolume,
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
        <TourArtwork 
          tourId={tour.id} 
          tourTitle={tour.title}
          location={tour.location}
        />
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
        <div className="flex items-center justify-center gap-5 mb-6">
          <Button
            size="icon"
            variant="ghost"
            className="p-3 rounded-full hover:bg-slate-100 text-slate-600"
            aria-label="Rewind 15 seconds"
            onClick={() => skip(-15)}
          >
            <RewindIcon className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="p-3 rounded-full hover:bg-slate-100 text-slate-600"
            aria-label="Skip backward"
            onClick={() => skip(-30)}
          >
            <SkipBackIcon className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            className="w-16 h-16 rounded-full bg-orange-500 text-white hover:bg-orange-600 shadow-lg"
            onClick={togglePlay}
            aria-label="Play/Pause"
          >
            <PlayPauseIcon isPlaying={isPlaying} className="w-7 h-7" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="p-3 rounded-full hover:bg-slate-100 text-slate-600"
            aria-label="Skip forward"
            onClick={() => skip(30)}
          >
            <SkipForwardIcon className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="p-3 rounded-full hover:bg-slate-100 text-slate-600"
            aria-label="Forward 15 seconds"
            onClick={() => skip(15)}
          >
            <ForwardIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Volume Control */}
        <VolumeControl 
          volume={volume} 
          onVolumeChange={setVolume} 
          className="mb-6"
        />

        {/* Subtitle buttons */}
        <div className="flex gap-2">
          <button
            className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium py-2 px-3 rounded-lg shadow-sm border border-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setSubtitleOpen(true)}
            disabled={!tour?.transcript?.length}
          >
            {tour?.transcript?.length ? "Full-Screen Subtitles" : "Transcript Unavailable"}
          </button>
          <button 
            className="w-10 h-10 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!tour?.transcript?.length}
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth="2"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </button>
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