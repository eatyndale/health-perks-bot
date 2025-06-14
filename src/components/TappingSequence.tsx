
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Play, Pause, SkipForward, CheckCircle } from "lucide-react";

interface AnxietySession {
  problem: string;
  feeling: string;
  bodyLocation: string;
  initialIntensity: number;
  currentIntensity: number;
  round: number;
}

interface TappingSequenceProps {
  session: AnxietySession;
  onComplete: (newIntensity: number) => void;
}

const tappingPoints = [
  { name: "Top of Head", description: "Tap on the crown of your head" },
  { name: "Eyebrow", description: "Start of the eyebrow, above the nose" },
  { name: "Side of Eye", description: "On the bone at the outer corner of the eye" },
  { name: "Under Eye", description: "On the bone under the eye" },
  { name: "Under Nose", description: "Between the nose and upper lip" },
  { name: "Chin", description: "In the crease between the lower lip and chin" },
  { name: "Collarbone", description: "Just below the collarbone" },
  { name: "Under Arm", description: "About 4 inches below the armpit" }
];

const TappingSequence = ({ session, onComplete }: TappingSequenceProps) => {
  const [currentPhase, setCurrentPhase] = useState<'setup' | 'tapping' | 'breathing' | 'rating'>('setup');
  const [currentPoint, setCurrentPoint] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timer, setTimer] = useState(0);
  const [newIntensity, setNewIntensity] = useState([session.currentIntensity]);

  const generateSetupStatements = () => {
    const statements = [
      `Even though I feel this ${session.feeling} in my ${session.bodyLocation} because ${session.problem}, I deeply and completely accept myself.`,
      `I feel ${session.feeling} in my ${session.bodyLocation}, ${session.problem}, but I choose to be at peace now.`,
      `This ${session.feeling} in my ${session.bodyLocation}, ${session.problem}, I want to let this go and feel calm.`
    ];
    
    if (session.round > 1) {
      return statements.map(statement => statement.replace('I feel', 'I STILL feel').replace('Even though I feel', 'Even though I STILL feel'));
    }
    
    return statements;
  };

  const generateReminderPhrases = () => [
    `This ${session.feeling} in my ${session.bodyLocation}`,
    `I feel ${session.feeling}`,
    session.problem,
    `This ${session.feeling} in my ${session.bodyLocation}`,
    `I feel so ${session.feeling}`,
    session.problem,
    `This ${session.feeling}`,
    `Releasing this ${session.feeling}`
  ];

  const setupStatements = generateSetupStatements();
  const reminderPhrases = generateReminderPhrases();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentPhase === 'tapping') {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev >= 30) { // 30 seconds per point
            if (currentPoint < tappingPoints.length - 1) {
              setCurrentPoint(prev => prev + 1);
              return 0;
            } else {
              setIsPlaying(false);
              setCurrentPhase('breathing');
              return 0;
            }
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentPhase, currentPoint]);

  const startTapping = () => {
    setCurrentPhase('tapping');
    setCurrentPoint(0);
    setTimer(0);
    setIsPlaying(true);
  };

  const pauseResume = () => {
    setIsPlaying(!isPlaying);
  };

  const nextPoint = () => {
    if (currentPoint < tappingPoints.length - 1) {
      setCurrentPoint(prev => prev + 1);
      setTimer(0);
    } else {
      setIsPlaying(false);
      setCurrentPhase('breathing');
    }
  };

  const completeBreathing = () => {
    setCurrentPhase('rating');
  };

  const submitRating = () => {
    onComplete(newIntensity[0]);
  };

  const renderSetupPhase = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Setup Statements</h3>
        <p className="text-gray-600 mb-4">
          Read each statement aloud while tapping on the side of your hand (karate chop point):
        </p>
        <div className="space-y-3">
          {setupStatements.map((statement, index) => (
            <div key={index} className="p-4 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
              <p className="font-medium">"{statement}"</p>
            </div>
          ))}
        </div>
      </div>
      <Button onClick={startTapping} className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white">
        <Play className="w-4 h-4 mr-2" />
        Start Tapping Sequence
      </Button>
    </div>
  );

  const renderTappingPhase = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">
          Tapping Point {currentPoint + 1} of {tappingPoints.length}
        </h3>
        <h4 className="text-2xl font-bold text-blue-600 mb-2">
          {tappingPoints[currentPoint].name}
        </h4>
        <p className="text-gray-600 mb-4">
          {tappingPoints[currentPoint].description}
        </p>
        <div className="text-3xl font-bold text-green-600 mb-2">
          {30 - timer}s
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${(timer / 30) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-l-yellow-500">
        <p className="font-medium">Repeat while tapping:</p>
        <p className="text-lg mt-2">"{reminderPhrases[currentPoint]}"</p>
      </div>

      <div className="flex gap-3">
        <Button onClick={pauseResume} className="flex-1" variant="outline">
          {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {isPlaying ? 'Pause' : 'Resume'}
        </Button>
        <Button onClick={nextPoint} className="flex-1">
          <SkipForward className="w-4 h-4 mr-2" />
          Next Point
        </Button>
      </div>
    </div>
  );

  const renderBreathingPhase = () => (
    <div className="space-y-6 text-center">
      <div>
        <h3 className="text-lg font-semibold mb-4">Deep Breathing</h3>
        <p className="text-gray-600 mb-6">
          Take a moment to breathe deeply and notice any changes in how you feel.
        </p>
        <div className="text-6xl mb-6">🫁</div>
        <p className="text-lg text-blue-600 font-medium">
          Inhale slowly... Hold... Exhale slowly...
        </p>
      </div>
      <Button onClick={completeBreathing} className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white">
        <CheckCircle className="w-4 h-4 mr-2" />
        I'm Ready to Rate My Feeling
      </Button>
    </div>
  );

  const renderRatingPhase = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Rate Your Current Intensity</h3>
        <p className="text-gray-600 mb-6">
          How intense is the {session.feeling} in your {session.bodyLocation} now?
        </p>
        <div className="px-4 mb-6">
          <Slider
            value={newIntensity}
            onValueChange={setNewIntensity}
            max={10}
            min={0}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>0 - No intensity</span>
            <span className="font-bold text-2xl text-gray-800">{newIntensity[0]}</span>
            <span>10 - Extreme intensity</span>
          </div>
        </div>
        
        {newIntensity[0] < session.currentIntensity && (
          <div className="p-4 bg-green-50 rounded-lg border-l-4 border-l-green-500">
            <p className="font-medium text-green-800">
              Great progress! You've reduced your intensity from {session.currentIntensity} to {newIntensity[0]}.
            </p>
          </div>
        )}
      </div>
      
      <Button onClick={submitRating} className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white">
        Continue
      </Button>
    </div>
  );

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>EFT Tapping Sequence - Round {session.round}</CardTitle>
        <CardDescription>
          Follow the guided tapping sequence to reduce your anxiety
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentPhase === 'setup' && renderSetupPhase()}
        {currentPhase === 'tapping' && renderTappingPhase()}
        {currentPhase === 'breathing' && renderBreathingPhase()}
        {currentPhase === 'rating' && renderRatingPhase()}
      </CardContent>
    </Card>
  );
};

export default TappingSequence;
