interface ForwardIconProps {
  className?: string;
}

export function ForwardIcon({ className = "w-5 h-5" }: ForwardIconProps) {
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
        d="M12 12h9m0 0l-3 3m3-3l-3-3m-6-6v3.6A9 9 0 0012 21"
      />
      <text 
        x="8" 
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