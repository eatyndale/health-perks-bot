import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, SkipForward } from "lucide-react";

interface TappingPoint {
  name: string;
  key: string;
  position: { x: number; y: number }; // Relative position for visual guide
  description: string;
}

const tappingPoints: TappingPoint[] = [
  { name: "Start of Eyebrow", key: "eyebrow", position: { x: 30, y: 15 }, description: "Inner edge of the eyebrow" },
  { name: "Outer Eye", key: "outer-eye", position: { x: 70, y: 15 }, description: "Outer corner of the eye" },
  { name: "Under Eye", key: "under-eye", position: { x: 50, y: 25 }, description: "Under the center of the eye" },
  { name: "Under Nose", key: "under-nose", position: { x: 50, y: 40 }, description: "Between nose and upper lip" },
  { name: "Chin", key: "chin", position: { x: 50, y: 55 }, description: "Center of the chin" },
  { name: "Collarbone", key: "collarbone", position: { x: 40, y: 75 }, description: "Below the collarbone" },
  { name: "Under Arm", key: "under-arm", position: { x: 85, y: 60 }, description: "4 inches below armpit" },
  { name: "Top of Head", key: "top-head", position: { x: 50, y: 5 }, description: "Crown of the head" }
];

interface TappingGuideProps {
  reminderPhrases: string[];
  onComplete: () => void;
  onPointChange?: (pointIndex: number) => void;
}

const TappingGuide = ({ reminderPhrases, onComplete, onPointChange }: TappingGuideProps) => {
  const [currentPoint, setCurrentPoint] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(5);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isPlaying) {
      handleNext();
    }

    return () => clearInterval(interval);
  }, [isPlaying, timeRemaining]);

  useEffect(() => {
    onPointChange?.(currentPoint);
  }, [currentPoint, onPointChange]);

  const handleNext = () => {
    if (currentPoint < tappingPoints.length - 1) {
      setCurrentPoint(prev => prev + 1);
      setTimeRemaining(5);
    } else {
      setIsPlaying(false);
      onComplete();
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setCurrentPoint(0);
    setTimeRemaining(5);
    setIsPlaying(false);
  };

  const progress = ((currentPoint + (5 - timeRemaining) / 5) / tappingPoints.length) * 100;
  const currentTappingPoint = tappingPoints[currentPoint];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6 space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Point {currentPoint + 1} of {tappingPoints.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Visual Body Diagram */}
        <div className="relative bg-gradient-to-b from-primary/5 to-secondary/5 rounded-lg p-8 h-96">
          <div className="relative w-full h-full">
            {/* Enhanced body silhouette */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Head */}
                <div className="relative w-20 h-24 rounded-full border-2 border-muted bg-background/80 mx-auto">
                  {/* Face features */}
                  <div className="absolute top-4 left-4 w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-0.5 h-2 bg-muted-foreground" />
                  <div className="absolute top-11 left-1/2 transform -translate-x-1/2 w-3 h-0.5 rounded bg-muted-foreground" />
                </div>
                
                {/* Body */}
                <div className="relative w-16 h-32 bg-background/80 border-2 border-muted rounded-b-lg mx-auto -mt-1">
                  {/* Shoulders */}
                  <div className="absolute -top-1 -left-6 w-6 h-8 bg-background/80 border-2 border-muted rounded-l-lg" />
                  <div className="absolute -top-1 -right-6 w-6 h-8 bg-background/80 border-2 border-muted rounded-r-lg" />
                </div>
              </div>
            </div>

            {/* Enhanced tapping points with better positioning */}
            {tappingPoints.map((point, index) => (
              <div
                key={point.key}
                className={`absolute w-5 h-5 rounded-full transition-all duration-500 ${
                  index === currentPoint
                    ? 'bg-destructive scale-150 animate-pulse shadow-lg shadow-destructive/50 ring-4 ring-destructive/30'
                    : index < currentPoint
                    ? 'bg-primary scale-125 shadow-md'
                    : 'bg-muted scale-100 opacity-60'
                }`}
                style={{
                  left: `${point.position.x}%`,
                  top: `${point.position.y}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: index === currentPoint ? 10 : 1
                }}
              >
                {/* Point number indicator */}
                <div className={`absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold ${
                  index === currentPoint ? 'text-destructive' : 
                  index < currentPoint ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
              </div>
            ))}
            
            {/* Breathing animation overlay when active */}
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-32 h-32 border-4 border-primary/30 rounded-full animate-ping" />
              </div>
            )}
          </div>
        </div>

        {/* Current Point Info */}
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900">
              {currentTappingPoint.name}
            </h3>
            <p className="text-sm text-gray-600">
              {currentTappingPoint.description}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border-2 border-primary/20">
            <p className="text-lg font-medium text-gray-800">
              Tap while saying:
            </p>
            <p className="text-primary font-semibold mt-1">
              "{reminderPhrases[currentPoint] || `This feeling at ${currentTappingPoint.name.toLowerCase()}`}"
            </p>
          </div>

          {/* Timer */}
          {isPlaying && (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">{timeRemaining}</span>
              </div>
              <span className="text-sm text-gray-600">seconds remaining</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-3">
          {!isPlaying ? (
            <Button onClick={handlePlay} className="flex items-center space-x-2">
              <Play className="w-4 h-4" />
              <span>Start Tapping</span>
            </Button>
          ) : (
            <Button onClick={handlePause} variant="outline" className="flex items-center space-x-2">
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </Button>
          )}
          
          <Button onClick={handleNext} variant="outline" className="flex items-center space-x-2">
            <SkipForward className="w-4 h-4" />
            <span>Next Point</span>
          </Button>

          {currentPoint > 0 && (
            <Button onClick={handleReset} variant="ghost" className="text-gray-600">
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TappingGuide;