import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, SkipForward } from "lucide-react";
import eyebrowGif from "@/assets/tapping/eyebrow.gif";
import outerEyeGif from "@/assets/tapping/outer-eye.gif";
import underEyeGif from "@/assets/tapping/under-eye.gif";
import underNoseGif from "@/assets/tapping/under-nose.gif";
import chinGif from "@/assets/tapping/chin.gif";
import collarboneGif from "@/assets/tapping/collarbone.gif";
import underArmGif from "@/assets/tapping/under-arm.gif";
import topHeadGif from "@/assets/tapping/top-head.gif";

interface TappingPoint {
  name: string;
  key: string;
  position: { x: number; y: number }; // Relative position for visual guide
  description: string;
  gifUrl: string;
}

const tappingPoints: TappingPoint[] = [
  { name: "Start of Eyebrow", key: "eyebrow", position: { x: 30, y: 15 }, description: "Inner edge of the eyebrow", gifUrl: eyebrowGif },
  { name: "Outer Eye", key: "outer-eye", position: { x: 70, y: 15 }, description: "Outer corner of the eye", gifUrl: outerEyeGif },
  { name: "Under Eye", key: "under-eye", position: { x: 50, y: 25 }, description: "Under the center of the eye", gifUrl: underEyeGif },
  { name: "Under Nose", key: "under-nose", position: { x: 50, y: 40 }, description: "Between nose and upper lip", gifUrl: underNoseGif },
  { name: "Chin", key: "chin", position: { x: 50, y: 55 }, description: "Center of the chin", gifUrl: chinGif },
  { name: "Collarbone", key: "collarbone", position: { x: 40, y: 75 }, description: "Below the collarbone", gifUrl: collarboneGif },
  { name: "Under Arm", key: "under-arm", position: { x: 85, y: 60 }, description: "4 inches below armpit", gifUrl: underArmGif },
  { name: "Top of Head", key: "top-head", position: { x: 50, y: 5 }, description: "Crown of the head", gifUrl: topHeadGif }
];

interface TappingGuideProps {
  setupStatements: string[];  // the 3 setup statements
  statementOrder: number[];   // length 8, values in {0,1,2}
  onComplete: () => void;
  onPointChange?: (pointIndex: number) => void;
}

const TappingGuide = ({ setupStatements, statementOrder, onComplete, onPointChange }: TappingGuideProps) => {
  console.log('[TappingGuide] Rendered with:', { setupStatements, statementOrder });
  
  const [currentPoint, setCurrentPoint] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(15);

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
      setTimeRemaining(15);
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
    setTimeRemaining(15);
    setIsPlaying(false);
  };

  const progress = ((currentPoint + (15 - timeRemaining) / 15) / tappingPoints.length) * 100;
  const currentTappingPoint = tappingPoints[currentPoint];
  
  // Get the statement for the current point
  const statementIdx = statementOrder[currentPoint] ?? 0;
  const statementText = setupStatements[statementIdx] || `This feeling at ${currentTappingPoint.name.toLowerCase()}`;

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

        {/* GIF Display */}
        <div className="relative bg-gradient-to-b from-primary/5 to-secondary/5 rounded-lg p-8 flex items-center justify-center min-h-[400px]">
          <div className="relative w-full max-w-md">
            <img 
              key={currentPoint}
              src={currentTappingPoint.gifUrl} 
              alt={`Tapping point: ${currentTappingPoint.name}`}
              className="w-full h-auto rounded-lg shadow-lg animate-fade-in"
            />
            
            {/* Small progress indicator overlay */}
            <div className="absolute top-4 right-4 bg-background/90 px-3 py-2 rounded-full shadow-md">
              <span className="text-sm font-semibold text-foreground">
                {currentPoint + 1}/{tappingPoints.length}
              </span>
            </div>
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
              "{statementText}"
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