interface RewindIconProps {
  className?: string;
}

export function RewindIcon({ className = "w-5 h-5" }: RewindIconProps) {
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
        d="M12 12H3m0 0l3 3m-3-3l3-3m6-6v3.6A9 9 0 1111.4 21"
      />
      <text 
        x="16" 
        y="8" 
        fontSize="6" 
        textAnchor="middle" 
        fill="currentColor"
        fontWeight="bold"
      >
        15
      </text>
    </svg>
  );
}