import React from "react";

interface TourArtworkProps {
  tourId: string;
}

/**
 * TourArtwork – deterministic SVG placeholder. Will be replaced with themed
 * artwork templates in Phase 2.
 */
export function TourArtwork({ tourId }: TourArtworkProps) {
  // TODO: replace with hash-based template selection as per audio_player_layout_plan
  return (
    <svg viewBox="0 0 400 400" className="w-full h-full">
      <defs>
        <linearGradient id={`grad-${tourId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E87A47" />
          <stop offset="100%" stopColor="#D16A37" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill={`url(#grad-${tourId})`} />
      <text
        x="200"
        y="200"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="24"
        fill="#fff"
      >
        Artwork
      </text>
    </svg>
  );
} 