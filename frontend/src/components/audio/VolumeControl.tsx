import React, { useState, useEffect } from "react";
import { VolumeIcon } from "@/components/ui/icons";

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  className?: string;
}

export function VolumeControl({ volume, onVolumeChange, className = "" }: VolumeControlProps) {
  const [isMuted, setIsMuted] = useState(volume === 0);
  const [previousVolume, setPreviousVolume] = useState(volume > 0 ? volume : 0.5);

  // Update muted state when volume changes externally
  useEffect(() => {
    setIsMuted(volume === 0);
    if (volume > 0) {
      setPreviousVolume(volume);
    }
  }, [volume]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    onVolumeChange(newVolume);
  };

  const toggleMute = () => {
    if (isMuted) {
      // Unmute: restore previous volume
      onVolumeChange(previousVolume);
    } else {
      // Mute: set volume to 0
      onVolumeChange(0);
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={toggleMute}
        className="p-1 rounded hover:bg-gray-100 transition-colors"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        <VolumeIcon 
          className={`w-4 h-4 transition-colors ${
            isMuted ? "text-gray-400" : "text-slate-600"
          }`} 
          isMuted={isMuted}
          volume={volume}
        />
      </button>
      <div className="flex-1 h-1 bg-slate-200 rounded-full relative">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={handleVolumeChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Volume Control"
        />
        <div 
          className={`h-full rounded-full transition-all duration-150 ${
            isMuted ? "bg-gray-300" : "bg-orange-500"
          }`}
          style={{ width: `${volume * 100}%` }}
        />
      </div>
    </div>
  );
}