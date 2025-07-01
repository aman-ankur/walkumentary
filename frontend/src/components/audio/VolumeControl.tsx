import React from "react";
import { VolumeIcon } from "@/components/ui/icons";

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  className?: string;
}

export function VolumeControl({ volume, onVolumeChange, className = "" }: VolumeControlProps) {
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    onVolumeChange(newVolume);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <VolumeIcon className="w-4 h-4 text-slate-600" />
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
          className="h-full bg-orange-500 rounded-full transition-all duration-150"
          style={{ width: `${volume * 100}%` }}
        />
      </div>
    </div>
  );
}