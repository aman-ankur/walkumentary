interface SkipBackIconProps {
  className?: string;
}

export function SkipBackIcon({ className = "w-5 h-5" }: SkipBackIconProps) {
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
        d="M11 19l-9-7 9-7v14zM22 19l-9-7 9-7v14z"
      />
    </svg>
  );
}