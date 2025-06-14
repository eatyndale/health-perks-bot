
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Bot, Send, RotateCcw } from "lucide-react";
import TappingSequence from "@/components/TappingSequence";

type BotState = 'initial' | 'gathering-info' | 'tapping' | 'complete';

interface AnxietySession {
  problem: string;
  feeling: string;
  bodyLocation: string;
  initialIntensity: number;
  currentIntensity: number;
  round: number;
}

const AnxietyBot = () => {
  const [botState, setBotState] = useState<BotState>('initial');
  const [session, setSession] = useState<AnxietySession>({
    problem: '',
    feeling: '',
    bodyLocation: '',
    initialIntensity: 5,
    currentIntensity: 5,
    round: 0
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: "Hello! I'm here to help you work through your anxiety using EFT tapping techniques. What would you like to work on today?"
    }
  ]);

  const handleProblemSubmit = (problem: string) => {
    setSession(prev => ({ ...prev, problem }));
    setMessages(prev => [...prev, 
      { type: 'user', content: problem },
      { type: 'bot', content: "Thank you for sharing that. How does this situation make you feel? Please describe the emotion you're experiencing." }
    ]);
    setCurrentStep(1);
  };

  const handleFeelingSubmit = (feeling: string) => {
    setSession(prev => ({ ...prev, feeling }));
    setMessages(prev => [...prev,
      { type: 'user', content: feeling },
      { type: 'bot', content: "I understand. Where do you feel this emotion in your body? For example, in your chest, stomach, shoulders, etc." }
    ]);
    setCurrentStep(2);
  };

  const handleBodyLocationSubmit = (bodyLocation: string) => {
    setSession(prev => ({ ...prev, bodyLocation }));
    setMessages(prev => [...prev,
      { type: 'user', content: bodyLocation },
      { type: 'bot', content: "Now, on a scale of 0-10, how intense is this feeling right now? (0 being no intensity, 10 being extremely intense)" }
    ]);
    setCurrentStep(3);
  };

  const handleIntensitySubmit = (intensity: number) => {
    setSession(prev => ({ 
      ...prev, 
      initialIntensity: intensity,
      currentIntensity: intensity,
      round: 1
    }));
    setBotState('tapping');
    setMessages(prev => [...prev,
      { type: 'user', content: `${intensity}/10` },
      { type: 'bot', content: `I understand you're feeling ${session.feeling} in your ${session.bodyLocation} at a ${intensity}/10 intensity. Let's work through this together with some tapping. I'll guide you through the process.` }
    ]);
  };

  const handleTappingComplete = (newIntensity: number) => {
    setSession(prev => ({ ...prev, currentIntensity: newIntensity }));
    
    if (newIntensity === 0) {
      setBotState('complete');
      setMessages(prev => [...prev,
        { type: 'bot', content: "Wonderful! You've successfully reduced your anxiety to zero. How are you feeling now?" }
      ]);
    } else if (session.round >= 3) {
      setMessages(prev => [...prev,
        { type: 'bot', content: `We've completed ${session.round} rounds. Your intensity has reduced from ${session.initialIntensity} to ${newIntensity}. Would you like to complete another round to see if we can reduce it further?` }
      ]);
    } else {
      setSession(prev => ({ ...prev, round: prev.round + 1 }));
      setBotState('tapping');
      setMessages(prev => [...prev,
        { type: 'bot', content: `Great progress! Your intensity has reduced from ${session.initialIntensity} to ${newIntensity}. Let's do another round of tapping to reduce it further.` }
      ]);
    }
  };

  const resetSession = () => {
    setBotState('initial');
    setCurrentStep(0);
    setSession({
      problem: '',
      feeling: '',
      bodyLocation: '',
      initialIntensity: 5,
      currentIntensity: 5,
      round: 0
    });
    setMessages([
      {
        type: 'bot',
        content: "Hello! I'm here to help you work through your anxiety using EFT tapping techniques. What would you like to work on today?"
      }
    ]);
  };

  const renderInputForm = () => {
    switch (currentStep) {
      case 0:
        return <ProblemInput onSubmit={handleProblemSubmit} />;
      case 1:
        return <FeelingInput onSubmit={handleFeelingSubmit} />;
      case 2:
        return <BodyLocationInput onSubmit={handleBodyLocationSubmit} />;
      case 3:
        return <IntensityInput onSubmit={handleIntensitySubmit} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Anxiety Reduction Session</h1>
        <Button variant="outline" onClick={resetSession} className="flex items-center">
          <RotateCcw className="w-4 h-4 mr-2" />
          Start New Session
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Chat Interface */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bot className="w-5 h-5 mr-2 text-blue-600" />
              Anxiety Bot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    message.type === 'bot'
                      ? 'bg-blue-50 border-l-4 border-l-blue-500'
                      : 'bg-green-50 border-l-4 border-l-green-500'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {message.type === 'bot' ? 'Bot' : 'You'}
                  </p>
                  <p className="text-gray-800">{message.content}</p>
                </div>
              ))}
            </div>
            {botState === 'initial' && renderInputForm()}
          </CardContent>
        </Card>

        {/* Tapping Sequence */}
        {botState === 'tapping' && (
          <TappingSequence
            session={session}
            onComplete={handleTappingComplete}
          />
        )}

        {/* Session Summary */}
        {(botState === 'complete' || session.round > 0) && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Session Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Problem</Label>
                  <p className="text-gray-800">{session.problem}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Feeling</Label>
                  <p className="text-gray-800">{session.feeling} in {session.bodyLocation}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Intensity Progress</Label>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-500">{session.initialIntensity}</div>
                      <div className="text-xs text-gray-500">Initial</div>
                    </div>
                    <div className="flex-1 h-2 bg-gradient-to-r from-red-500 to-green-500 rounded"></div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">{session.currentIntensity}</div>
                      <div className="text-xs text-gray-500">Current</div>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Rounds Completed</Label>
                  <p className="text-2xl font-bold text-blue-600">{session.round}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Input Components
const ProblemInput = ({ onSubmit }: { onSubmit: (problem: string) => void }) => {
  const [problem, setProblem] = useState('');

  return (
    <div className="space-y-4">
      <Label htmlFor="problem">What's on your mind?</Label>
      <Textarea
        id="problem"
        placeholder="Describe what's causing you anxiety..."
        value={problem}
        onChange={(e) => setProblem(e.target.value)}
        className="min-h-20"
      />
      <Button
        onClick={() => problem.trim() && onSubmit(problem)}
        disabled={!problem.trim()}
        className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
      >
        <Send className="w-4 h-4 mr-2" />
        Share
      </Button>
    </div>
  );
};

const FeelingInput = ({ onSubmit }: { onSubmit: (feeling: string) => void }) => {
  const [feeling, setFeeling] = useState('');

  return (
    <div className="space-y-4">
      <Label htmlFor="feeling">How does this make you feel?</Label>
      <Input
        id="feeling"
        placeholder="e.g., anxious, worried, stressed..."
        value={feeling}
        onChange={(e) => setFeeling(e.target.value)}
      />
      <Button
        onClick={() => feeling.trim() && onSubmit(feeling)}
        disabled={!feeling.trim()}
        className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
      >
        <Send className="w-4 h-4 mr-2" />
        Continue
      </Button>
    </div>
  );
};

const BodyLocationInput = ({ onSubmit }: { onSubmit: (location: string) => void }) => {
  const [location, setLocation] = useState('');

  return (
    <div className="space-y-4">
      <Label htmlFor="location">Where do you feel this in your body?</Label>
      <Input
        id="location"
        placeholder="e.g., chest, stomach, shoulders..."
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <Button
        onClick={() => location.trim() && onSubmit(location)}
        disabled={!location.trim()}
        className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
      >
        <Send className="w-4 h-4 mr-2" />
        Continue
      </Button>
    </div>
  );
};

const IntensityInput = ({ onSubmit }: { onSubmit: (intensity: number) => void }) => {
  const [intensity, setIntensity] = useState([5]);

  return (
    <div className="space-y-4">
      <Label>Rate the intensity (0-10)</Label>
      <div className="px-4">
        <Slider
          value={intensity}
          onValueChange={setIntensity}
          max={10}
          min={0}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>0 - No intensity</span>
          <span className="font-bold text-lg text-gray-800">{intensity[0]}</span>
          <span>10 - Extreme intensity</span>
        </div>
      </div>
      <Button
        onClick={() => onSubmit(intensity[0])}
        className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
      >
        <Send className="w-4 h-4 mr-2" />
        Start Tapping
      </Button>
    </div>
  );
};

export default AnxietyBot;
