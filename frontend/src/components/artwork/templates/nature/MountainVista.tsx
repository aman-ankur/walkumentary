import React from 'react';
import { ArtworkProps } from '../../types';

export function MountainVista({ colors, tourTitle, location, className = "" }: ArtworkProps) {
  return (
    <svg viewBox="0 0 400 400" className={`w-full h-full ${className}`}>
      <defs>
        <linearGradient id={`mountain-sky-${tourTitle}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.primary} />
          <stop offset="50%" stopColor={colors.secondary} />
          <stop offset="100%" stopColor={colors.accent} />
        </linearGradient>
        <radialGradient id={`mountain-sun-${tourTitle}`} cx="0.75" cy="0.25" r="0.2">
          <stop offset="0%" stopColor="#FFE4B5" />
          <stop offset="100%" stopColor={colors.accent} />
        </radialGradient>
      </defs>
      
      {/* Sky gradient */}
      <rect width="400" height="400" fill={`url(#mountain-sky-${tourTitle})`} />
      
      {/* Sun */}
      <circle cx="300" cy="100" r="35" fill={`url(#mountain-sun-${tourTitle})`} opacity="0.9" />
      
      {/* Mountain layers (back to front) */}
      <path 
        d="M0,320 Q100,250 200,280 T400,300 L400,400 L0,400 Z" 
        fill={colors.mountain1 || colors.primary} 
        opacity="0.6" 
      />
      <path 
        d="M0,340 Q150,280 300,310 T400,330 L400,400 L0,400 Z" 
        fill={colors.mountain2 || colors.secondary} 
        opacity="0.7" 
      />
      <path 
        d="M50,360 Q200,300 350,340 T400,350 L400,400 L50,400 Z" 
        fill={colors.accent} 
        opacity="0.8" 
      />
      
      {/* Foreground hills */}
      <path 
        d="M0,380 Q100,350 200,370 T400,380 L400,400 L0,400 Z" 
        fill={colors.mountain1 || colors.primary} 
        opacity="0.9" 
      />
      
      {/* Trees silhouettes */}
      <polygon 
        points="80,380 85,360 90,380" 
        fill={colors.mountain1 || colors.primary} 
        opacity="0.8" 
      />
      <polygon 
        points="110,375 117,350 124,375" 
        fill={colors.mountain1 || colors.primary} 
        opacity="0.7" 
      />
      <polygon 
        points="320,385 327,365 334,385" 
        fill={colors.mountain2 || colors.secondary} 
        opacity="0.8" 
      />
      
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