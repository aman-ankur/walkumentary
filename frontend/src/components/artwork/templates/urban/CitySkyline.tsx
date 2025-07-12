import React from 'react';
import { ArtworkProps } from '../../types';

export function CitySkyline({ colors, tourTitle, location, className = "" }: ArtworkProps) {
  return (
    <svg viewBox="0 0 400 400" className={`w-full h-full ${className}`}>
      <defs>
        <linearGradient id={`city-sky-${tourTitle}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.primary} />
          <stop offset="70%" stopColor={colors.secondary} />
          <stop offset="100%" stopColor={colors.accent} />
        </linearGradient>
        <radialGradient id={`city-sun-${tourTitle}`} cx="0.8" cy="0.2" r="0.3">
          <stop offset="0%" stopColor="#FFF" opacity="0.9" />
          <stop offset="100%" stopColor={colors.accent} opacity="0.7" />
        </radialGradient>
      </defs>
      
      {/* Sky gradient */}
      <rect width="400" height="400" fill={`url(#city-sky-${tourTitle})`} />
      
      {/* Sun */}
      <circle cx="320" cy="80" r="45" fill={`url(#city-sun-${tourTitle})`} />
      
      {/* Building silhouettes */}
      <rect x="0" y="280" width="60" height="120" fill={colors.building1 || '#1e293b'} opacity="0.9" />
      <rect x="45" y="220" width="40" height="180" fill={colors.building2 || '#334155'} opacity="0.8" />
      <rect x="80" y="260" width="50" height="140" fill={colors.building1 || '#1e293b'} opacity="0.85" />
      <rect x="125" y="190" width="65" height="210" fill={colors.building2 || '#334155'} opacity="0.9" />
      <rect x="185" y="240" width="45" height="160" fill={colors.building1 || '#1e293b'} opacity="0.8" />
      <rect x="225" y="200" width="55" height="200" fill={colors.building2 || '#334155'} opacity="0.85" />
      <rect x="275" y="260" width="40" height="140" fill={colors.building1 || '#1e293b'} opacity="0.9" />
      <rect x="310" y="220" width="50" height="180" fill={colors.building2 || '#334155'} opacity="0.8" />
      <rect x="355" y="280" width="45" height="120" fill={colors.building1 || '#1e293b'} opacity="0.85" />
      
      {/* Windows (small rectangles on buildings) */}
      <rect x="10" y="290" width="4" height="6" fill={colors.accent} opacity="0.6" />
      <rect x="20" y="300" width="4" height="6" fill={colors.accent} opacity="0.5" />
      <rect x="10" y="320" width="4" height="6" fill={colors.accent} opacity="0.7" />
      
      <rect x="135" y="210" width="4" height="6" fill={colors.accent} opacity="0.6" />
      <rect x="145" y="230" width="4" height="6" fill={colors.accent} opacity="0.5" />
      <rect x="155" y="250" width="4" height="6" fill={colors.accent} opacity="0.7" />
      
      <rect x="235" y="220" width="4" height="6" fill={colors.accent} opacity="0.6" />
      <rect x="245" y="240" width="4" height="6" fill={colors.accent} opacity="0.5" />
      
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