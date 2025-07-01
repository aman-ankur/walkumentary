interface PlayPauseIconProps {
  isPlaying: boolean;
  className?: string;
}

export function PlayPauseIcon({ isPlaying, className = "w-7 h-7" }: PlayPauseIconProps) {
  if (isPlaying) {
    // Pause icon
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
      </svg>
    );
  }
  
  // Play icon
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 3v18l15-9L5 3z"/>
    </svg>
  );
}