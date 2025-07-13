import React, { useState, useEffect } from "react";
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
  
  // Debug subtitle state changes
  useEffect(() => {
    console.log('SubtitleOverlay state changed:', subtitleOpen);
  }, [subtitleOpen]);

  // Player state comes from AudioPlayerProvider
  const {
    isPlaying,
    togglePlay,
    currentTime,
    duration,
    volume,
    playbackRate,
    seek,
    setVolume,
    setPlaybackRate,
  } = useAudioPlayer();

  const skip = (delta: number) => {
    seek(Math.min(Math.max(currentTime + delta, 0), duration));
  };

  const formatTime = (time = 0) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleDownloadTranscript = () => {
    if (!tour?.transcript?.length) return;
    
    const transcriptText = tour.transcript
      .map((segment: any, index: number) => 
        `${index + 1}. ${segment.text}`
      )
      .join('\n\n');
    
    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tour.title || 'tour'}-transcript.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col relative">
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
          className="mb-4"
        />

        {/* Playback Speed Control */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-medium text-gray-700">Playback Speed</span>
          <div className="flex items-center gap-1">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackRate(speed)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  playbackRate === speed
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-700"
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

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
            onClick={handleDownloadTranscript}
            title="Download transcript"
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
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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