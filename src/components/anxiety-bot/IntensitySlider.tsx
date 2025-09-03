import { Slider } from "@/components/ui/slider";

interface IntensitySliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  className?: string;
  label?: string;
  showProgress?: boolean;
}

const IntensitySlider = ({ 
  value, 
  onValueChange, 
  className,
  label = "How intense is your feeling right now?",
  showProgress = true
}: IntensitySliderProps) => {
  const intensity = value[0];
  
  // Generate color based on intensity (0=white, gradually to yellow, then red at 10)
  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'hsl(0, 0%, 100%)'; // White
    if (intensity <= 5) {
      // Transition from white to yellow
      const ratio = intensity / 5;
      const hue = 60; // Yellow hue
      const saturation = Math.round(ratio * 100);
      const lightness = Math.round(100 - (ratio * 30)); // From 100% to 70%
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    } else {
      // Transition from yellow to red
      const ratio = (intensity - 5) / 5;
      const hue = Math.round(60 - (ratio * 60)); // From 60 (yellow) to 0 (red)
      const saturation = 100;
      const lightness = Math.round(70 - (ratio * 20)); // From 70% to 50%
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-card-foreground mb-2">{label}</h3>
        <p className="text-sm text-muted-foreground">Slide to rate your intensity level</p>
      </div>
      
      <div className="relative">
        <Slider
          value={value}
          onValueChange={onValueChange}
          max={10}
          min={0}
          step={1}
          className="w-full"
        />
        
        {/* Intensity indicator */}
        <div className="flex justify-center mt-6">
          <div className="relative">
            <div 
              className="w-24 h-24 rounded-full border-4 border-border flex items-center justify-center shadow-lg transition-all duration-500 hover:scale-105"
              style={{ backgroundColor: getIntensityColor(intensity) }}
            >
              <span className="text-3xl font-bold text-gray-800">{intensity}</span>
            </div>
            {intensity > 0 && (
              <div className="absolute -inset-2 rounded-full animate-pulse bg-primary/20"></div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>0 - No intensity</span>
        <span>10 - Extreme intensity</span>
      </div>
      
      {showProgress && (
        <div className="space-y-2">
          {/* Color reference bar */}
          <div className="flex h-3 rounded-full overflow-hidden border border-border shadow-inner">
            {Array.from({ length: 11 }, (_, i) => (
              <div
                key={i}
                className="flex-1 transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: getIntensityColor(i) }}
              />
            ))}
          </div>
          
          {/* Descriptive labels */}
          <div className="grid grid-cols-3 text-xs text-muted-foreground text-center">
            <span>Calm</span>
            <span>Moderate</span>
            <span>Intense</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntensitySlider;