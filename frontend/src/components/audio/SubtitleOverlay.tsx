import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface SubtitleSegment {
  startTime: number;
  endTime: number;
  text: string;
}

interface SubtitleOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  subtitles?: SubtitleSegment[];
  currentTime?: number;
  onSeek?: (t: number) => void;
}

/**
 * SubtitleOverlay – Full-screen transcript with auto-scroll to current segment.
 */
export function SubtitleOverlay({
  isOpen,
  onClose,
  subtitles = [],
  currentTime = 0,
  onSeek,
}: SubtitleOverlayProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentIdx = subtitles.findIndex(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );

  // Auto-scroll to current segment
  useEffect(() => {
    if (isOpen && currentIdx >= 0 && scrollContainerRef.current) {
      const activeElement = scrollContainerRef.current.querySelector(
        `[data-segment-index="${currentIdx}"]`
      ) as HTMLElement;
      
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [isOpen, currentIdx]);
  
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto rounded-2xl">
      <div className="bg-white rounded-xl max-w-lg w-full p-4 space-y-3 max-h-[90%] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">Transcript</h2>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        {subtitles.length === 0 ? (
          <p className="text-sm text-gray-600">Transcript unavailable.</p>
        ) : (
          <div 
            ref={scrollContainerRef}
            className="space-y-2 flex-1 overflow-y-auto"
          >
            {subtitles.map((s, idx) => (
              <div
                key={idx}
                data-segment-index={idx}
                onClick={() => onSeek?.(s.startTime)}
                className={`p-3 rounded-lg cursor-pointer text-sm transition-colors ${
                  idx === currentIdx
                    ? "bg-orange-100 text-gray-900 ring-2 ring-orange-200"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                {s.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 