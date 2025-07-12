import React from 'react';
import { ArtworkProps } from '../../types';

export function OceanHorizon({ colors, tourTitle, location, className = "" }: ArtworkProps) {
  return (
    <svg viewBox="0 0 400 400" className={`w-full h-full ${className}`}>
      <defs>
        <linearGradient id={`ocean-sky-${tourTitle}`} x1="0" y1="0" x2="0" y2="0.6">
          <stop offset="0%" stopColor={colors.primary} />
          <stop offset="100%" stopColor={colors.secondary} />
        </linearGradient>
        <linearGradient id={`ocean-water-${tourTitle}`} x1="0" y1="0.6" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.water || colors.secondary} />
          <stop offset="100%" stopColor={colors.primary} />
        </linearGradient>
        <radialGradient id={`ocean-sun-${tourTitle}`} cx="0.7" cy="0.3" r="0.15">
          <stop offset="0%" stopColor="#FFF8DC" />
          <stop offset="100%" stopColor={colors.accent} />
        </radialGradient>
      </defs>
      
      {/* Sky */}
      <rect width="400" height="240" fill={`url(#ocean-sky-${tourTitle})`} />
      
      {/* Water */}
      <rect y="240" width="400" height="160" fill={`url(#ocean-water-${tourTitle})`} />
      
      {/* Horizon line */}
      <line x1="0" y1="240" x2="400" y2="240" stroke="#FFF" strokeWidth="1" opacity="0.3" />
      
      {/* Sun */}
      <circle cx="280" cy="120" r="30" fill={`url(#ocean-sun-${tourTitle})`} />
      
      {/* Sun reflection on water */}
      <ellipse 
        cx="280" 
        cy="320" 
        rx="15" 
        ry="60" 
        fill={colors.accent} 
        opacity="0.4"
      />
      
      {/* Distant islands/rocks */}
      <ellipse cx="120" cy="235" rx="25" ry="8" fill={colors.building1 || '#4A5568'} opacity="0.6" />
      <ellipse cx="350" cy="230" rx="20" ry="6" fill={colors.building1 || '#4A5568'} opacity="0.5" />
      
      {/* Water ripples */}
      <path 
        d="M0,280 Q100,275 200,280 T400,285" 
        stroke="#FFF" 
        strokeWidth="1" 
        fill="none" 
        opacity="0.2"
      />
      <path 
        d="M0,320 Q150,315 300,320 T400,325" 
        stroke="#FFF" 
        strokeWidth="1" 
        fill="none" 
        opacity="0.15"
      />
      
      {/* Seagulls */}
      <path d="M100,100 Q105,95 110,100 Q105,105 100,100" fill={colors.building1 || '#4A5568'} opacity="0.4" />
      <path d="M150,120 Q155,115 160,120 Q155,125 150,120" fill={colors.building1 || '#4A5568'} opacity="0.3" />
      
      {/* Text overlay */}
      <foreignObject x="20" y="320" width="360" height="60">
        <div className="flex flex-col space-y-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          <span className="text-white text-lg font-bold leading-none drop-shadow-lg">
            {tourTitle}
          </span>
          {location && (
            <span className="text-white/90 text-sm leading-none drop-shadow">
              {location}
            </span>
          )}
        </div>
      </foreignObject>
    </svg>
  );
}