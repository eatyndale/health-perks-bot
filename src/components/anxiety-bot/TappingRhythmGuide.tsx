import React, { useEffect, useState } from 'react';

interface TappingRhythmGuideProps {
  isActive: boolean;
  duration: number; // in seconds
  onComplete?: () => void;
  className?: string;
}

export const TappingRhythmGuide: React.FC<TappingRhythmGuideProps> = ({
  isActive,
  duration,
  onComplete,
  className = '',
}) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [beat, setBeat] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setTimeRemaining(duration);
      return;
    }

    const countdownInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const beatInterval = setInterval(() => {
      setBeat(prev => !prev);
    }, 600); // Beat every 0.6 seconds

    return () => {
      clearInterval(countdownInterval);
      clearInterval(beatInterval);
    };
  }, [isActive, duration, onComplete]);

  const progress = duration > 0 ? ((duration - timeRemaining) / duration) * 100 : 0;

  return (
    <div className={`text-center ${className}`}>
      {/* Visual rhythm indicator */}
      <div className="relative w-24 h-24 mx-auto mb-4">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-muted">
          {/* Progress ring */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="40%"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              strokeDasharray={`${progress * 2.51} 251`}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
        </div>
        
        {/* Center beat indicator */}
        <div className={`absolute inset-4 rounded-full bg-primary transition-all duration-200 ${
          isActive && beat ? 'scale-110 opacity-100' : 'scale-100 opacity-70'
        }`}>
          <div className="flex items-center justify-center h-full text-primary-foreground font-bold text-lg">
            {timeRemaining}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full transition-colors ${
          isActive && beat 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted text-muted-foreground'
        }`}>
          <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
            isActive && beat ? 'bg-primary-foreground scale-150' : 'bg-muted-foreground'
          }`} />
          <span className="text-sm font-medium">
            {isActive ? 'Tap to the rhythm' : 'Ready to tap'}
          </span>
        </div>

        {isActive && (
          <div className="text-xs text-muted-foreground">
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')} remaining
          </div>
        )}
      </div>
    </div>
  );
};