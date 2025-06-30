import React from "react";
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
 * SubtitleOverlay – MVP list of transcript segments. No auto-scroll yet.
 */
export function SubtitleOverlay({
  isOpen,
  onClose,
  subtitles = [],
  currentTime = 0,
  onSeek,
}: SubtitleOverlayProps) {
  if (!isOpen) return null;

  const currentIdx = subtitles.findIndex(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">Transcript</h2>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        {subtitles.length === 0 ? (
          <p className="text-sm text-gray-600">Transcript unavailable.</p>
        ) : (
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {subtitles.map((s, idx) => (
              <div
                key={idx}
                onClick={() => onSeek?.(s.startTime)}
                className={`p-3 rounded-lg cursor-pointer text-sm transition-colors ${
                  idx === currentIdx
                    ? "bg-orange-100 text-gray-900"
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