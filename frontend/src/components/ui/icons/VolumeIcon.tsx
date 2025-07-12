interface VolumeIconProps {
  className?: string;
  isMuted?: boolean;
  volume?: number;
}

export function VolumeIcon({ className = "w-4 h-4", isMuted = false, volume = 1 }: VolumeIconProps) {
  if (isMuted) {
    // Muted icon with X
    return (
      <svg 
        className={className} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor"
        strokeWidth="2"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M11 5L6 9H2v6h4l5 4V5z"
        />
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M23 9l-6 6M17 9l6 6"
        />
      </svg>
    );
  }

  if (volume < 0.3) {
    // Low volume icon (no sound waves)
    return (
      <svg 
        className={className} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor"
        strokeWidth="2"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M11 5L6 9H2v6h4l5 4V5z"
        />
      </svg>
    );
  }

  if (volume < 0.7) {
    // Medium volume icon (one sound wave)
    return (
      <svg 
        className={className} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor"
        strokeWidth="2"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M11 5L6 9H2v6h4l5 4V5z"
        />
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M15.54 8.46a5 5 0 010 7.07"
        />
      </svg>
    );
  }

  // High volume icon (two sound waves)
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor"
      strokeWidth="2"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M11 5L6 9H2v6h4l5 4V5z"
      />
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"
      />
    </svg>
  );
}