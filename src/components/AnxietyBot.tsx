
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Bot, Send, RotateCcw, Play } from "lucide-react";

type ChatState = 'initial' | 'gathering-feeling' | 'gathering-location' | 'gathering-intensity' | 'creating-statements' | 'tapping' | 'post-tapping' | 'complete';

interface ChatSession {
  problem: string;
  feeling: string;
  bodyLocation: string;
  initialIntensity: number;
  currentIntensity: number;
  round: number;
  setupStatements: string[];
  reminderPhrases: string[];
}

interface Message {
  type: 'bot' | 'user';
  content: string;
}

const tappingPoints = [
  { name: "Top of Head", key: "top-head" },
  { name: "Start of Eyebrow", key: "eyebrow" },
  { name: "Outer Eye", key: "outer-eye" },
  { name: "Under Eye", key: "under-eye" },
  { name: "Under Nose", key: "under-nose" },
  { name: "Chin", key: "chin" },
  { name: "Collarbone", key: "collarbone" },
  { name: "Under Arm", key: "under-arm" }
];

const AnxietyBot = () => {
  const [chatState, setChatState] = useState<ChatState>('initial');
  const [session, setSession] = useState<ChatSession>({
    problem: '',
    feeling: '',
    bodyLocation: '',
    initialIntensity: 0,
    currentIntensity: 0,
    round: 0,
    setupStatements: [],
    reminderPhrases: []
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'bot',
      content: "Hello! I'm here to help you work through your anxiety using EFT tapping techniques. What would you like to work on today?"
    }
  ]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentIntensity, setCurrentIntensity] = useState([5]);
  const [isTapping, setIsTapping] = useState(false);
  const [currentTappingPoint, setCurrentTappingPoint] = useState(0);

  const addMessage = (type: 'bot' | 'user', content: string) => {
    setMessages(prev => [...prev, { type, content }]);
  };

  const generateSetupStatements = (problem: string, feeling: string, bodyLocation: string, isSubsequent = false) => {
    const prefix = isSubsequent ? "Even though I STILL feel some of this" : "Even though I feel this";
    const remaining = isSubsequent ? "remaining" : "";
    
    return [
      `${prefix} ${feeling} in my ${bodyLocation} because ${problem}, I'd like to be at peace.`,
      `I ${isSubsequent ? 'STILL ' : ''}feel ${feeling} in my ${bodyLocation}, I'd like to relax now.`,
      `This ${remaining} ${feeling} in my ${bodyLocation}, ${problem}, but I want to let it go.`
    ];
  };

  const generateReminderPhrases = (problem: string, feeling: string, bodyLocation: string) => {
    return [
      `This ${feeling} in my ${bodyLocation}`,
      `I feel ${feeling}`,
      problem,
      `This ${feeling} in my ${bodyLocation}`,
      `I feel so ${feeling}`,
      `This ${feeling}`,
      `I want to let this go`,
      `I choose to relax`
    ];
  };

  const handleProblemSubmit = () => {
    if (!currentInput.trim()) return;
    
    addMessage('user', currentInput);
    setSession(prev => ({ ...prev, problem: currentInput }));
    addMessage('bot', "Thank you for sharing that. How does this situation make you feel? Please describe the emotion you're experiencing (e.g., anxious, worried, stressed, angry).");
    setChatState('gathering-feeling');
    setCurrentInput("");
  };

  const handleFeelingSubmit = () => {
    if (!currentInput.trim()) return;
    
    addMessage('user', currentInput);
    setSession(prev => ({ ...prev, feeling: currentInput }));
    addMessage('bot', "I understand. Where do you feel this emotion in your body? For example, in your chest, stomach, shoulders, throat, etc.");
    setChatState('gathering-location');
    setCurrentInput("");
  };

  const handleLocationSubmit = () => {
    if (!currentInput.trim()) return;
    
    addMessage('user', currentInput);
    setSession(prev => ({ ...prev, bodyLocation: currentInput }));
    addMessage('bot', "Now, on a scale of 0-10, how intense is this feeling right now? (0 being no intensity, 10 being extremely intense)");
    setChatState('gathering-intensity');
    setCurrentInput("");
  };

  const handleIntensitySubmit = () => {
    const intensity = currentIntensity[0];
    addMessage('user', `${intensity}/10`);
    
    const statements = generateSetupStatements(session.problem, session.feeling, session.bodyLocation);
    const phrases = generateReminderPhrases(session.problem, session.feeling, session.bodyLocation);
    
    setSession(prev => ({
      ...prev,
      initialIntensity: intensity,
      currentIntensity: intensity,
      round: 1,
      setupStatements: statements,
      reminderPhrases: phrases
    }));
    
    addMessage('bot', `I understand you're feeling ${session.feeling} in your ${session.bodyLocation} at a ${intensity}/10 intensity. Let's work through this together with some tapping.`);
    addMessage('bot', `First, I'll give you 3 setup statements. Choose the one that resonates most with you, then we'll begin tapping:`);
    addMessage('bot', statements.map((stmt, idx) => `${idx + 1}. "${stmt}"`).join('\n\n'));
    
    setChatState('creating-statements');
  };

  const handleStartTapping = () => {
    addMessage('bot', "Great! Now let's begin the tapping sequence. I'll guide you through each point. Start by tapping on your karate chop point (side of your hand) while repeating your chosen setup statement 3 times.");
    setChatState('tapping');
    setIsTapping(true);
    setCurrentTappingPoint(0);
  };

  const handleNextTappingPoint = () => {
    if (currentTappingPoint < tappingPoints.length - 1) {
      setCurrentTappingPoint(prev => prev + 1);
    } else {
      // Tapping sequence complete
      setIsTapping(false);
      addMessage('bot', "Excellent! You've completed the tapping sequence. Now take a deep breath in... and out. Let yourself relax for a moment.");
      addMessage('bot', "Now, thinking about the same issue, how intense does it feel on a scale of 0-10?");
      setChatState('post-tapping');
    }
  };

  const handlePostTappingIntensity = () => {
    const newIntensity = currentIntensity[0];
    addMessage('user', `${newIntensity}/10`);
    
    setSession(prev => ({ ...prev, currentIntensity: newIntensity }));
    
    if (newIntensity === 0) {
      addMessage('bot', "Wonderful! You've successfully reduced your anxiety to zero. How are you feeling now?");
      setChatState('complete');
    } else if (session.round >= 3) {
      addMessage('bot', `We've completed ${session.round} rounds. Your intensity has reduced from ${session.initialIntensity} to ${newIntensity}. Would you like to complete another round to see if we can reduce it further?`);
      setChatState('complete');
    } else {
      // Create new setup statements for subsequent round
      const newStatements = generateSetupStatements(session.problem, session.feeling, session.bodyLocation, true);
      setSession(prev => ({ 
        ...prev, 
        round: prev.round + 1,
        setupStatements: newStatements 
      }));
      
      addMessage('bot', `Great progress! Your intensity has reduced from ${session.initialIntensity} to ${newIntensity}. Let's do another round of tapping with updated statements:`);
      addMessage('bot', newStatements.map((stmt, idx) => `${idx + 1}. "${stmt}"`).join('\n\n'));
      setChatState('creating-statements');
    }
  };

  const resetSession = () => {
    setChatState('initial');
    setSession({
      problem: '',
      feeling: '',
      bodyLocation: '',
      initialIntensity: 0,
      currentIntensity: 0,
      round: 0,
      setupStatements: [],
      reminderPhrases: []
    });
    setMessages([
      {
        type: 'bot',
        content: "Hello! I'm here to help you work through your anxiety using EFT tapping techniques. What would you like to work on today?"
      }
    ]);
    setCurrentInput("");
    setIsTapping(false);
    setCurrentTappingPoint(0);
  };

  const renderInput = () => {
    switch (chatState) {
      case 'initial':
        return (
          <div className="flex space-x-2">
            <Textarea
              placeholder="Tell me what's bothering you..."
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              className="flex-1"
              rows={3}
            />
            <Button onClick={handleProblemSubmit} disabled={!currentInput.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        );
      
      case 'gathering-feeling':
        return (
          <div className="flex space-x-2">
            <Input
              placeholder="e.g., anxious, worried, angry..."
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleFeelingSubmit} disabled={!currentInput.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        );
      
      case 'gathering-location':
        return (
          <div className="flex space-x-2">
            <Input
              placeholder="e.g., chest, stomach, shoulders..."
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleLocationSubmit} disabled={!currentInput.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        );
      
      case 'gathering-intensity':
        return (
          <div className="space-y-4">
            <div className="px-4">
              <Slider
                value={currentIntensity}
                onValueChange={setCurrentIntensity}
                max={10}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>0 - No intensity</span>
                <span className="font-bold text-lg text-gray-800">{currentIntensity[0]}</span>
                <span>10 - Extreme intensity</span>
              </div>
            </div>
            <Button onClick={handleIntensitySubmit} className="w-full">
              Continue
            </Button>
          </div>
        );
      
      case 'creating-statements':
        return (
          <Button onClick={handleStartTapping} className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white">
            <Play className="w-4 h-4 mr-2" />
            Start Tapping Sequence
          </Button>
        );
      
      case 'post-tapping':
        return (
          <div className="space-y-4">
            <div className="px-4">
              <Slider
                value={currentIntensity}
                onValueChange={setCurrentIntensity}
                max={10}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>0 - No intensity</span>
                <span className="font-bold text-lg text-gray-800">{currentIntensity[0]}</span>
                <span>10 - Extreme intensity</span>
              </div>
            </div>
            <Button onClick={handlePostTappingIntensity} className="w-full">
              Continue
            </Button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Anxiety Reduction Chat</h1>
        <Button variant="outline" onClick={resetSession} className="flex items-center">
          <RotateCcw className="w-4 h-4 mr-2" />
          Start New Session
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="w-5 h-5 mr-2 text-blue-600" />
                EFT Tapping Assistant
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
                      {message.type === 'bot' ? 'Assistant' : 'You'}
                    </p>
                    <p className="text-gray-800 whitespace-pre-line">{message.content}</p>
                  </div>
                ))}
              </div>
              
              {!isTapping && renderInput()}
            </CardContent>
          </Card>
        </div>

        {/* Tapping Guide or Session Info */}
        <div>
          {isTapping ? (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Tapping Guide</CardTitle>
                <CardDescription>Follow along with the tapping sequence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">{currentTappingPoint + 1}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {tappingPoints[currentTappingPoint].name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Tap gently while saying: "{session.reminderPhrases[currentTappingPoint]}"
                  </p>
                  <Button onClick={handleNextTappingPoint} className="w-full">
                    {currentTappingPoint < tappingPoints.length - 1 ? 'Next Point' : 'Complete Sequence'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : session.round > 0 && (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Session Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Problem</p>
                    <p className="text-gray-800">{session.problem}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Feeling</p>
                    <p className="text-gray-800">{session.feeling} in {session.bodyLocation}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Intensity Progress</p>
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
                    <p className="text-sm font-medium text-gray-600">Rounds Completed</p>
                    <p className="text-2xl font-bold text-blue-600">{session.round}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnxietyBot;
