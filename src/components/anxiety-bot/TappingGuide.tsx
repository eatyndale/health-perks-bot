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

        {/* Visual Guide */}
        <div className="relative bg-gradient-to-b from-blue-50 to-green-50 rounded-lg p-8 h-80">
          <div className="relative w-full h-full">
            {/* Head outline (simplified) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-32 h-40 rounded-full border-2 border-gray-300 bg-white/50">
                {/* Face features */}
                <div className="absolute top-6 left-8 w-2 h-2 rounded-full bg-gray-400" /> {/* Left eye */}
                <div className="absolute top-6 right-8 w-2 h-2 rounded-full bg-gray-400" /> {/* Right eye */}
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-gray-400" /> {/* Nose */}
                <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-4 h-1 rounded bg-gray-400" /> {/* Mouth */}
              </div>
            </div>

            {/* Tapping points */}
            {tappingPoints.map((point, index) => (
              <div
                key={point.key}
                className={`absolute w-4 h-4 rounded-full transition-all duration-300 ${
                  index === currentPoint
                    ? 'bg-red-500 scale-150 animate-pulse shadow-lg'
                    : index < currentPoint
                    ? 'bg-green-500 scale-110'
                    : 'bg-gray-400 scale-100'
                }`}
                style={{
                  left: `${point.position.x}%`,
                  top: `${point.position.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            ))}
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