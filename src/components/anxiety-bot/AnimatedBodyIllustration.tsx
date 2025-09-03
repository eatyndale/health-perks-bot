import React, { useEffect, useState } from 'react';

interface TappingPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  description: string;
}

interface AnimatedBodyIllustrationProps {
  currentPoint?: TappingPoint;
  aiText?: string;
  isActive?: boolean;
  onTap?: () => void;
  className?: string;
}

const TAPPING_POINTS: TappingPoint[] = [
  { id: 'karate_chop', name: 'Karate Chop', x: 50, y: 85, description: 'Side of hand' },
  { id: 'top_of_head', name: 'Top of Head', x: 50, y: 15, description: 'Crown of head' },
  { id: 'eyebrow', name: 'Eyebrow', x: 42, y: 22, description: 'Beginning of eyebrow' },
  { id: 'side_of_eye', name: 'Side of Eye', x: 58, y: 24, description: 'Temple area' },
  { id: 'under_eye', name: 'Under Eye', x: 50, y: 28, description: 'Bone under eye' },
  { id: 'under_nose', name: 'Under Nose', x: 50, y: 32, description: 'Between nose and lip' },
  { id: 'chin', name: 'Chin', x: 50, y: 38, description: 'Center of chin' },
  { id: 'collarbone', name: 'Collarbone', x: 50, y: 48, description: 'Below collarbone' },
  { id: 'under_arm', name: 'Under Arm', x: 35, y: 55, description: '4 inches below armpit' },
];

export const AnimatedBodyIllustration: React.FC<AnimatedBodyIllustrationProps> = ({
  currentPoint,
  aiText,
  isActive = false,
  onTap,
  className = '',
}) => {
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    if (isActive && currentPoint) {
      const interval = setInterval(() => {
        setPulseAnimation(prev => !prev);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isActive, currentPoint]);

  const getCurrentPointData = () => {
    return TAPPING_POINTS.find(point => point.id === currentPoint?.id);
  };

  const isCurrentPoint = (point: TappingPoint) => {
    return currentPoint?.id === point.id;
  };

  return (
    <div className={`relative w-full max-w-md mx-auto ${className}`}>
      {/* SVG Body Illustration */}
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-auto"
        style={{ aspectRatio: '1' }}
      >
        {/* Body outline */}
        <g fill="none" stroke="hsl(var(--border))" strokeWidth="0.5">
          {/* Head */}
          <ellipse cx="50" cy="20" rx="8" ry="10" fill="hsl(var(--card))" />
          {/* Neck */}
          <rect x="48" y="30" width="4" height="6" fill="hsl(var(--card))" />
          {/* Torso */}
          <ellipse cx="50" cy="55" rx="12" ry="20" fill="hsl(var(--card))" />
          {/* Arms */}
          <rect x="25" y="45" width="15" height="4" rx="2" fill="hsl(var(--card))" />
          <rect x="60" y="45" width="15" height="4" rx="2" fill="hsl(var(--card))" />
          {/* Legs */}
          <rect x="45" y="75" width="4" height="20" rx="2" fill="hsl(var(--card))" />
          <rect x="51" y="75" width="4" height="20" rx="2" fill="hsl(var(--card))" />
        </g>

        {/* Tapping Points */}
        {TAPPING_POINTS.map((point) => {
          const isCurrent = isCurrentPoint(point);
          const baseSize = 2.5;
          const pulseSize = pulseAnimation && isCurrent ? baseSize * 1.8 : baseSize;
          
          return (
            <g key={point.id}>
              {/* Outer glow effect for active point */}
              {isCurrent && isActive && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={pulseSize * 2}
                  fill="hsl(var(--primary))"
                  opacity={pulseAnimation ? "0.3" : "0.1"}
                  className="transition-all duration-500 ease-in-out"
                />
              )}
              
              {/* Main tapping point */}
              <circle
                cx={point.x}
                cy={point.y}
                r={pulseSize}
                fill={isCurrent ? "hsl(var(--primary))" : "hsl(var(--muted))"}
                stroke={isCurrent ? "hsl(var(--primary-foreground))" : "hsl(var(--border))"}
                strokeWidth="0.5"
                className={`cursor-pointer transition-all duration-300 ${
                  isCurrent ? 'animate-pulse' : 'hover:fill-primary/80'
                }`}
                onClick={onTap}
              />
              
              {/* Point label */}
              <text
                x={point.x}
                y={point.y - 4}
                textAnchor="middle"
                className="text-xs fill-current text-foreground/60"
                style={{ fontSize: '2px' }}
              >
                {point.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* AI Text Bubble */}
      {aiText && currentPoint && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-card border border-border rounded-lg p-3 shadow-lg max-w-xs z-10 animate-fade-in">
          <div className="text-sm text-card-foreground">
            <div className="font-semibold text-primary mb-1">
              {getCurrentPointData()?.name}
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              {getCurrentPointData()?.description}
            </div>
            <div>{aiText}</div>
          </div>
          {/* Speech bubble arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-border"></div>
        </div>
      )}

      {/* Tapping Instructions */}
      {isActive && currentPoint && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-4 py-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-primary">
              Tap gently on the highlighted point
            </span>
          </div>
        </div>
      )}
    </div>
  );
};