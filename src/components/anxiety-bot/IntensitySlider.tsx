import { Slider } from "@/components/ui/slider";

interface IntensitySliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  className?: string;
}

const IntensitySlider = ({ value, onValueChange, className }: IntensitySliderProps) => {
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
        <div className="flex justify-center mt-4">
          <div 
            className="w-20 h-20 rounded-full border-4 border-gray-300 flex items-center justify-center shadow-lg transition-all duration-300"
            style={{ backgroundColor: getIntensityColor(intensity) }}
          >
            <span className="text-2xl font-bold text-gray-800">{intensity}</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between text-sm text-gray-500">
        <span>0 - No intensity</span>
        <span>10 - Extreme intensity</span>
      </div>
      
      {/* Color reference bar */}
      <div className="flex h-2 rounded-full overflow-hidden border border-gray-200">
        {Array.from({ length: 11 }, (_, i) => (
          <div
            key={i}
            className="flex-1"
            style={{ backgroundColor: getIntensityColor(i) }}
          />
        ))}
      </div>
    </div>
  );
};

export default IntensitySlider;