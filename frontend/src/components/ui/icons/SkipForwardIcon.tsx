interface SkipForwardIconProps {
  className?: string;
}

export function SkipForwardIcon({ className = "w-5 h-5" }: SkipForwardIconProps) {
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
        d="M13 5l9 7-9 7V5z"
      />
    </svg>
  );
}