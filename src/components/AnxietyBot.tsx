import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, RotateCcw, Play, History, MessageCircle, Heart, Lightbulb } from "lucide-react";

type ChatState = 'initial' | 'gathering-feeling' | 'gathering-location' | 'gathering-intensity' | 'creating-statements' | 'tapping' | 'post-tapping' | 'advice' | 'complete';

interface ChatSession {
  id: string;
  timestamp: Date;
  problem: string;
  feeling: string;
  bodyLocation: string;
  initialIntensity: number;
  currentIntensity: number;
  round: number;
  setupStatements: string[];
  reminderPhrases: string[];
  isComplete: boolean;
}

interface Message {
  id: string;
  type: 'bot' | 'user' | 'system';
  content: string;
  timestamp: Date;
  sessionId?: string;
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
    id: '',
    timestamp: new Date(),
    problem: '',
    feeling: '',
    bodyLocation: '',
    initialIntensity: 0,
    currentIntensity: 0,
    round: 0,
    setupStatements: [],
    reminderPhrases: [],
    isComplete: false
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentIntensity, setCurrentIntensity] = useState([5]);
  const [isTapping, setIsTapping] = useState(false);
  const [currentTappingPoint, setCurrentTappingPoint] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSetupStatement, setSelectedSetupStatement] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load chat history from localStorage
    const savedHistory = localStorage.getItem('anxietyBot-chatHistory');
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
    
    // Initialize first session
    startNewSession();
  }, []);

  const startNewSession = () => {
    const newSessionId = Date.now().toString();
    const newSession: ChatSession = {
      id: newSessionId,
      timestamp: new Date(),
      problem: '',
      feeling: '',
      bodyLocation: '',
      initialIntensity: 0,
      currentIntensity: 0,
      round: 0,
      setupStatements: [],
      reminderPhrases: [],
      isComplete: false
    };
    
    setSession(newSession);
    setChatState('initial');
    setMessages([
      {
        id: `${newSessionId}-welcome`,
        type: 'bot',
        content: "Hello! I'm here to help you work through your anxiety using EFT tapping techniques. What would you like to work on today?",
        timestamp: new Date(),
        sessionId: newSessionId
      }
    ]);
    setCurrentInput("");
    setIsTapping(false);
    setCurrentTappingPoint(0);
    setSelectedSetupStatement(null);
  };

  const addMessage = (type: 'bot' | 'user' | 'system', content: string) => {
    const newMessage: Message = {
      id: `${session.id}-${Date.now()}`,
      type,
      content,
      timestamp: new Date(),
      sessionId: session.id
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const saveSessionToHistory = () => {
    const updatedHistory = [...chatHistory, { ...session, isComplete: true }];
    setChatHistory(updatedHistory);
    localStorage.setItem('anxietyBot-chatHistory', JSON.stringify(updatedHistory));
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

  const generateAdvice = (session: ChatSession) => {
    const improvement = session.initialIntensity - session.currentIntensity;
    const improvementPercentage = Math.round((improvement / session.initialIntensity) * 100);
    
    let advice = [];
    
    if (session.currentIntensity === 0) {
      advice = [
        "🎉 Congratulations! You've successfully reduced your anxiety to zero. This is a wonderful achievement!",
        "💡 **Maintain Your Progress**: Practice the tapping sequence you just learned whenever similar feelings arise.",
        "🌱 **Daily Practice**: Consider doing a quick 5-minute tapping session each morning to maintain emotional balance.",
        "📝 **Keep a Journal**: Write down what triggered this anxiety so you can recognize patterns in the future.",
        "🤝 **Share Your Success**: Let someone you trust know about this positive step you've taken for your mental health."
      ];
    } else if (improvementPercentage >= 70) {
      advice = [
        `✨ Excellent progress! You've reduced your anxiety by ${improvementPercentage}% (from ${session.initialIntensity} to ${session.currentIntensity}).`,
        "🔄 **Continue Tapping**: The remaining intensity can likely be reduced with another session later today.",
        "⏰ **Timing Matters**: Try tapping again in 2-3 hours when you're in a calm environment.",
        "🧘 **Breathing Practice**: Complement your tapping with deep breathing exercises throughout the day.",
        "💪 **Build the Habit**: Regular tapping practice makes each session more effective."
      ];
    } else if (improvementPercentage >= 40) {
      advice = [
        `👍 Good progress! You've reduced your anxiety by ${improvementPercentage}% (from ${session.initialIntensity} to ${session.currentIntensity}).`,
        "🎯 **Be Patient**: Sometimes our bodies need time to release deep-seated emotions.",
        "🔍 **Explore Deeper**: Consider if there are underlying concerns connected to this issue.",
        "🤲 **Self-Compassion**: Be gentle with yourself - healing is a process, not a destination.",
        "📞 **Professional Support**: If anxiety persists, consider speaking with a counselor or therapist."
      ];
    } else {
      advice = [
        `🌟 Every step counts! You've made some progress, reducing your anxiety from ${session.initialIntensity} to ${session.currentIntensity}.`,
        "🔬 **Try Different Approaches**: Sometimes different tapping styles or phrases work better.",
        "🏥 **Consider Professional Help**: Persistent high anxiety may benefit from professional support.",
        "👥 **Support Network**: Reach out to friends, family, or support groups.",
        "📚 **Learn More**: Explore additional EFT resources, books, or guided sessions online.",
        "⚕️ **Medical Check**: If anxiety is severe or interfering with daily life, consult a healthcare provider."
      ];
    }
    
    return advice;
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
    addMessage('bot', "Now, on a scale of 0-10, how intense is this feeling right now?");
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
    addMessage('system', 'setup-statements');
    
    setChatState('creating-statements');
  };

  const handleSetupStatementSelect = (index: number) => {
    setSelectedSetupStatement(index);
    const selectedStatement = session.setupStatements[index];
    addMessage('user', `I choose: "${selectedStatement}"`);
    addMessage('bot', "Perfect! Now let's begin the tapping sequence. I'll guide you through each point. Start by tapping on your karate chop point (side of your hand) while repeating your chosen setup statement 3 times.");
    addMessage('system', 'tapping-guide');
    setChatState('tapping');
    setIsTapping(true);
    setCurrentTappingPoint(0);
  };

  const handleNextTappingPoint = () => {
    if (currentTappingPoint < tappingPoints.length - 1) {
      setCurrentTappingPoint(prev => prev + 1);
    } else {
      setIsTapping(false);
      addMessage('bot', "Excellent! You've completed the tapping sequence. Take a deep breath in... and out. Let yourself relax for a moment.");
      addMessage('bot', "Now, thinking about the same issue, how intense does it feel on a scale of 0-10?");
      setChatState('post-tapping');
    }
  };

  const handlePostTappingIntensity = () => {
    const newIntensity = currentIntensity[0];
    addMessage('user', `${newIntensity}/10`);
    
    setSession(prev => ({ ...prev, currentIntensity: newIntensity }));
    
    if (newIntensity === 0) {
      addMessage('bot', "🎉 Wonderful! You've successfully reduced your anxiety to zero. Let me share some personalized advice to help you maintain this progress:");
      addMessage('system', 'advice');
      setChatState('advice');
    } else if (session.round >= 3) {
      addMessage('bot', `We've completed ${session.round} rounds. Your intensity has reduced from ${session.initialIntensity} to ${newIntensity}. Let me provide some guidance on your progress:`);
      addMessage('system', 'advice');
      setChatState('advice');
    } else {
      const newStatements = generateSetupStatements(session.problem, session.feeling, session.bodyLocation, true);
      setSession(prev => ({ 
        ...prev, 
        round: prev.round + 1,
        setupStatements: newStatements 
      }));
      
      addMessage('bot', `Great progress! Your intensity has reduced from ${session.initialIntensity} to ${newIntensity}. Let's do another round of tapping with updated statements:`);
      addMessage('system', 'setup-statements');
      setChatState('creating-statements');
    }
  };

  const handleAdviceComplete = () => {
    saveSessionToHistory();
    addMessage('bot', "Thank you for using the EFT tapping assistant! Feel free to start a new session whenever you need support. Remember, healing is a journey, and you're doing great! 🌟");
    
    setTimeout(() => {
      addMessage('system', 'session-complete');
    }, 1000);
    
    setChatState('complete');
  };

  const handleNewSessionFromComplete = () => {
    startNewSession();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    switch (chatState) {
      case 'initial':
        handleProblemSubmit();
        break;
      case 'gathering-feeling':
        handleFeelingSubmit();
        break;
      case 'gathering-location':
        handleLocationSubmit();
        break;
      case 'gathering-intensity':
        handleIntensitySubmit();
        break;
      case 'post-tapping':
        handlePostTappingIntensity();
        break;
    }
  };

  const loadHistorySession = (historicalSession: ChatSession) => {
    setShowHistory(false);
    // This could be expanded to show a detailed view of the historical session
    addMessage('system', `Loaded session from ${historicalSession.timestamp.toLocaleDateString()}: ${historicalSession.problem}`);
  };

  const renderMessage = (message: Message) => {
    if (message.type === 'system') {
      if (message.content === 'setup-statements') {
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium text-blue-600 mb-2">Choose the setup statement that resonates most with you:</p>
            {session.setupStatements.map((statement, index) => (
              <Button
                key={index}
                variant={selectedSetupStatement === index ? "default" : "outline"}
                className="w-full text-left justify-start h-auto p-3 whitespace-normal"
                onClick={() => handleSetupStatementSelect(index)}
                disabled={selectedSetupStatement !== null}
              >
                <span className="font-bold mr-2">{index + 1}.</span>
                "{statement}"
              </Button>
            ))}
          </div>
        );
      }
      
      if (message.content === 'tapping-guide' && isTapping) {
        return (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">{currentTappingPoint + 1}</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                {tappingPoints[currentTappingPoint].name}
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Tap gently while saying:
              </p>
              <div className="bg-white p-2 rounded border mb-4">
                <em>"{session.reminderPhrases[currentTappingPoint]}"</em>
              </div>
              <Button onClick={handleNextTappingPoint} className="w-full">
                {currentTappingPoint < tappingPoints.length - 1 ? 'Next Point' : 'Complete Sequence'}
              </Button>
            </div>
          </div>
        );
      }

      if (message.content === 'advice') {
        const advice = generateAdvice(session);
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-l-4 border-l-green-500">
              <div className="flex items-center mb-3">
                <Heart className="w-5 h-5 text-green-600 mr-2" />
                <h4 className="font-bold text-gray-900">Your Personalized Guidance</h4>
              </div>
              <div className="space-y-3">
                {advice.map((tip, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Lightbulb className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-800 text-sm leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={handleAdviceComplete} className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white">
              Complete Session
            </Button>
          </div>
        );
      }

      if (message.content === 'session-complete') {
        return (
          <div className="text-center space-y-4 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h4 className="font-bold text-xl text-gray-900">Session Complete! 🌟</h4>
            <p className="text-gray-600">
              Your session has been saved to your chat history. You can always come back to review your progress.
            </p>
            <div className="flex gap-3 justify-center mt-4">
              <Button onClick={handleNewSessionFromComplete} className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white">
                Start New Session
              </Button>
              <Button variant="outline" onClick={() => setShowHistory(true)}>
                View History
              </Button>
            </div>
          </div>
        );
      }
      
      return null;
    }

    return (
      <div className={`p-3 rounded-lg ${
        message.type === 'bot'
          ? 'bg-blue-50 border-l-4 border-l-blue-500'
          : 'bg-green-50 border-l-4 border-l-green-500 ml-8'
      }`}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-gray-600">
            {message.type === 'bot' ? 'Assistant' : 'You'}
          </p>
          <p className="text-xs text-gray-400">
            {message.timestamp.toLocaleTimeString()}
          </p>
        </div>
        <p className="text-gray-800 whitespace-pre-line">{message.content}</p>
      </div>
    );
  };

  const renderInput = () => {
    if (isTapping || chatState === 'creating-statements' || chatState === 'advice' || chatState === 'complete') return null;

    switch (chatState) {
      case 'initial':
        return (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            placeholder="Tell me what's bothering you..."
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="min-h-[80px] resize-none"
            rows={3}
          />
        );
      
      case 'gathering-feeling':
        return (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            placeholder="e.g., anxious, worried, angry..."
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        );
      
      case 'gathering-location':
        return (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            placeholder="e.g., chest, stomach, shoulders..."
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        );
      
      case 'gathering-intensity':
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
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center"
          >
            <History className="w-4 h-4 mr-2" />
            Chat History
          </Button>
          <Button variant="outline" onClick={startNewSession} className="flex items-center">
            <RotateCcw className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm h-[600px] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center">
                <Bot className="w-5 h-5 mr-2 text-blue-600" />
                EFT Tapping Assistant
              </CardTitle>
              <CardDescription>
                Current session: {session.problem || 'New session'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id}>
                      {renderMessage(message)}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {/* Input Area */}
              <div className="flex-shrink-0 mt-4 pt-4 border-t">
                <div className="space-y-3">
                  {renderInput()}
                  {!isTapping && chatState !== 'creating-statements' && (
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSubmit} 
                        disabled={!currentInput.trim() && !['gathering-intensity', 'post-tapping'].includes(chatState)}
                        className="flex items-center"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat History Sidebar */}
        <div>
          {showHistory ? (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Chat History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {chatHistory.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">
                      No previous sessions
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {chatHistory.map((historicalSession) => (
                        <Card 
                          key={historicalSession.id}
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => loadHistorySession(historicalSession)}
                        >
                          <CardContent className="p-3">
                            <p className="font-medium text-sm truncate">
                              {historicalSession.problem}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {historicalSession.timestamp.toLocaleDateString()}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {historicalSession.round} rounds
                              </span>
                              <span className="text-xs font-medium">
                                {historicalSession.initialIntensity} → {historicalSession.currentIntensity}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Session Progress</CardTitle>
              </CardHeader>
              <CardContent>
                {session.problem ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Problem</p>
                      <p className="text-gray-800 text-sm">{session.problem}</p>
                    </div>
                    {session.feeling && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Feeling</p>
                        <p className="text-gray-800 text-sm">{session.feeling} in {session.bodyLocation}</p>
                      </div>
                    )}
                    {session.round > 0 && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Intensity Progress</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="text-center">
                              <div className="text-xl font-bold text-red-500">{session.initialIntensity}</div>
                              <div className="text-xs text-gray-500">Initial</div>
                            </div>
                            <div className="flex-1 h-2 bg-gradient-to-r from-red-500 to-green-500 rounded"></div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-green-500">{session.currentIntensity}</div>
                              <div className="text-xs text-gray-500">Current</div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Rounds Completed</p>
                          <p className="text-xl font-bold text-blue-600">{session.round}</p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Start a conversation to see your progress</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnxietyBot;
