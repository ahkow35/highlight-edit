interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      aria-label="HighlightEdit logo"
    >
      {/* Document body */}
      <rect x="46" y="30" width="96" height="120" rx="6" ry="6" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="5"/>
      {/* Folded corner */}
      <polygon points="118,30 142,54 118,54" fill="#F0F0F0" stroke="#1A1A1A" strokeWidth="5" strokeLinejoin="round"/>
      {/* Yellow highlight bar */}
      <rect x="46" y="90" width="96" height="22" fill="#FFE033" opacity="0.95"/>
      {/* Text lines above */}
      <line x1="60" y1="68" x2="124" y2="68" stroke="#C8C8C8" strokeWidth="4" strokeLinecap="round"/>
      <line x1="60" y1="80" x2="110" y2="80" stroke="#C8C8C8" strokeWidth="4" strokeLinecap="round"/>
      {/* Text lines below */}
      <line x1="60" y1="124" x2="124" y2="124" stroke="#C8C8C8" strokeWidth="4" strokeLinecap="round"/>
      <line x1="60" y1="136" x2="100" y2="136" stroke="#C8C8C8" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  );
}
