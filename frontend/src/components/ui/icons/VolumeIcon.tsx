interface VolumeIconProps {
  className?: string;
}

export function VolumeIcon({ className = "w-4 h-4" }: VolumeIconProps) {
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