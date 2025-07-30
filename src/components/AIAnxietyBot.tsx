import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, History, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAIChat } from "@/hooks/useAIChat";
import { ChatState, QuestionnaireSession } from "./anxiety-bot/types";
import { supabaseService } from "@/services/supabaseService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import ChatHistory from "./anxiety-bot/ChatHistory";
import SessionProgress from "./anxiety-bot/SessionProgress";
import Questionnaire from "./anxiety-bot/Questionnaire";
import IntensitySlider from "./anxiety-bot/IntensitySlider";
import TappingGuide from "./anxiety-bot/TappingGuide";

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

const AIAnxietyBot = () => {
  const { toast } = useToast();
  const [chatState, setChatState] = useState<ChatState>('questionnaire');
  const [currentInput, setCurrentInput] = useState("");
  const [currentIntensity, setCurrentIntensity] = useState([5]);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isTapping, setIsTapping] = useState(false);
  const [currentTappingPoint, setCurrentTappingPoint] = useState(0);
  const [selectedSetupStatement, setSelectedSetupStatement] = useState<number | null>(null);
  const [questionnaireSession, setQuestionnaireSession] = useState<QuestionnaireSession | null>(null);

  const { 
    messages, 
    isLoading, 
    sendMessage, 
    startNewSession, 
    sessionContext,
    userProfile 
  } = useAIChat({
    onStateChange: setChatState,
    onSessionUpdate: (context) => {
      // Update local state based on AI conversation
    }
  });

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    if (showHistory) {
      loadChatHistory();
    }
  }, [showHistory]);

  const loadChatHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { sessions } = await supabaseService.getChatSessions(user.id);
        setChatHistory(sessions || []);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleQuestionnaireComplete = (session: QuestionnaireSession) => {
    setQuestionnaireSession(session);
    setChatState('initial');
    toast({
      title: "Assessment Complete",
      description: `Your anxiety level: ${session.severity} (Score: ${session.totalScore}/27)`,
    });
  };

  const handleSubmit = async () => {
    if (!currentInput.trim() && !['gathering-intensity', 'post-tapping'].includes(chatState)) return;

    let messageToSend = currentInput;
    let additionalContext: any = {};

    // Handle intensity submission
    if (chatState === 'gathering-intensity' || chatState === 'post-tapping') {
      messageToSend = `${currentIntensity[0]}/10`;
      if (chatState === 'gathering-intensity') {
        additionalContext.initialIntensity = currentIntensity[0];
        additionalContext.currentIntensity = currentIntensity[0];
      } else {
        additionalContext.currentIntensity = currentIntensity[0];
      }
    }

    // Determine next state based on current state
    let nextState = chatState;
    switch (chatState) {
      case 'initial':
        nextState = 'gathering-feeling';
        additionalContext.problem = currentInput;
        break;
      case 'gathering-feeling':
        nextState = 'gathering-location';
        additionalContext.feeling = currentInput;
        break;
      case 'gathering-location':
        nextState = 'gathering-intensity';
        additionalContext.bodyLocation = currentInput;
        break;
      case 'gathering-intensity':
        nextState = 'creating-statements';
        break;
      case 'post-tapping':
        nextState = currentIntensity[0] === 0 ? 'advice' : 'creating-statements';
        break;
    }

    await sendMessage(messageToSend, chatState, additionalContext);
    setChatState(nextState);
    setCurrentInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSetupStatementSelect = async (index: number) => {
    setSelectedSetupStatement(index);
    const statement = sessionContext.setupStatements?.[index] || "Selected setup statement";
    await sendMessage(`I choose: "${statement}"`, 'creating-statements');
    setChatState('tapping');
    setIsTapping(true);
    setCurrentTappingPoint(0);
  };

  const handleTappingComplete = () => {
    setIsTapping(false);
    setChatState('post-tapping');
  };

  const renderSetupStatements = () => {
    if (!sessionContext.setupStatements?.length) return null;

    return (
      <div className="space-y-3 mt-4">
        <p className="font-medium text-sm">Choose your setup statement:</p>
        {sessionContext.setupStatements.map((statement, index) => (
          <Button
            key={index}
            variant={selectedSetupStatement === index ? "default" : "outline"}
            className="w-full text-left h-auto p-4 whitespace-normal"
            onClick={() => handleSetupStatementSelect(index)}
          >
            {statement}
          </Button>
        ))}
      </div>
    );
  };


  const renderInput = () => {
    // Debug: log current state
    console.log('Current chat state:', chatState);
    
    if (chatState === 'gathering-intensity' || chatState === 'post-tapping') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Rate your intensity (0-10):
            </label>
            <IntensitySlider
              value={currentIntensity}
              onValueChange={setCurrentIntensity}
              className="w-full"
            />
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
            {isLoading ? 'Processing...' : 'Submit Rating'}
          </Button>
        </div>
      );
    }

    if (chatState === 'creating-statements') {
      return renderSetupStatements();
    }

    if (chatState === 'tapping') {
      return (
        <TappingGuide
          reminderPhrases={sessionContext.reminderPhrases || []}
          onComplete={handleTappingComplete}
          onPointChange={setCurrentTappingPoint}
        />
      );
    }

    if (chatState === 'advice' || chatState === 'complete') {
      return (
        <div className="space-y-2">
          <Button onClick={startNewSession} className="w-full">
            Start New Session
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowHistory(true)} 
            className="w-full"
          >
            View Chat History
          </Button>
        </div>
      );
    }

    if (chatState === 'gathering-location') {
      return (
        <div className="flex space-x-2">
          <Input
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., chest, stomach, shoulders, throat..."
            className="flex-1"
          />
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !currentInput.trim()}
            size="sm"
            className="self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex space-x-2">
        <Textarea
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your response..."
          className="flex-1"
          rows={2}
        />
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading || !currentInput.trim()}
          size="sm"
          className="self-end"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  const loadHistorySession = (historicalSession: any) => {
    setShowHistory(false);
    toast({
      title: "Session Loaded",
      description: `Loaded session from ${new Date(historicalSession.created_at).toLocaleDateString()}`,
    });
  };

  if (chatState === 'questionnaire') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Anxiety Assessment</h1>
          <p className="text-gray-600">Let's start by understanding your current mental health state</p>
        </div>
        <Questionnaire onComplete={handleQuestionnaireComplete} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Anxiety Support Chat</h1>
          {questionnaireSession && (
            <p className="text-sm text-gray-600">
              Assessment: {questionnaireSession.severity} (Score: {questionnaireSession.totalScore}/27)
            </p>
          )}
          {/* Debug display */}
          <p className="text-xs text-red-500">Debug: Current state = {chatState}</p>
        </div>
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
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>EFT Tapping Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] mb-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              {renderInput()}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          {showHistory ? (
            <ChatHistory 
              chatHistory={chatHistory}
              onLoadSession={loadHistorySession}
            />
          ) : (
            <SessionProgress session={{
              id: '',
              timestamp: new Date(),
              problem: sessionContext.problem || '',
              feeling: sessionContext.feeling || '',
              bodyLocation: sessionContext.bodyLocation || '',
              initialIntensity: sessionContext.initialIntensity || 0,
              currentIntensity: sessionContext.currentIntensity || 0,
              round: sessionContext.round || 0,
              setupStatements: sessionContext.setupStatements || [],
              reminderPhrases: sessionContext.reminderPhrases || [],
              isComplete: chatState === 'complete'
            }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAnxietyBot;