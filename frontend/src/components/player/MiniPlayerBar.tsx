"use client";

import Image from "next/image";
import { useAudioPlayer } from "./AudioPlayerProvider";
import { Button } from "@/components/ui/button";

export const MiniPlayerBar: React.FC = () => {
  const { currentTrack, isPlaying, togglePlay, currentTime, duration, seek } = useAudioPlayer();

  if (!currentTrack) return null;

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
      <div className="flex items-center gap-4 px-4 py-2 max-w-5xl mx-auto">
        {currentTrack.cover ? (
          <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden">
            <Image src={currentTrack.cover} alt={currentTrack.title} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-12 h-12 flex-shrink-0 bg-orange-100 rounded"></div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{currentTrack.title}</p>
          <div
            className="relative h-1 bg-gray-200 rounded-full cursor-pointer"
            onClick={(e) => {
              const rect = (e.target as HTMLDivElement).getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              seek(pct * duration);
            }}
          >
            <div className="absolute left-0 top-0 h-full bg-orange-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={togglePlay} className="flex-shrink-0">
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
            </svg>
          )}
        </Button>
      </div>
    </div>
  );
}; 