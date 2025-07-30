import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAIChat } from "@/hooks/useAIChat";
import { ChatState, QuestionnaireSession } from "./anxiety-bot/types";
import { supabaseService } from "@/services/supabaseService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import ChatHistory from "./anxiety-bot/ChatHistory";
import SessionProgress from "./anxiety-bot/SessionProgress";
import IntensitySlider from "./anxiety-bot/IntensitySlider";
import TappingGuide from "./anxiety-bot/TappingGuide";
import CrisisSupport from "./anxiety-bot/CrisisSupport";
import ChatMessage from "./anxiety-bot/ChatMessage";
import LoadingIndicator from "./anxiety-bot/LoadingIndicator";
import SetupStatements from "./anxiety-bot/SetupStatements";
import ChatInput from "./anxiety-bot/ChatInput";
import SessionActions from "./anxiety-bot/SessionActions";
import ChatHeader from "./anxiety-bot/ChatHeader";
import QuestionnaireView from "./anxiety-bot/QuestionnaireView";


const AIAnxietyBot = () => {
  const { toast } = useToast();
  const [chatState, setChatState] = useState<ChatState>(() => {
    const hasCompletedAssessment = localStorage.getItem('hasCompletedAssessment');
    return hasCompletedAssessment ? 'initial' : 'questionnaire';
  });
  const [currentInput, setCurrentInput] = useState("");
  const [currentIntensity, setCurrentIntensity] = useState([5]);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isTapping, setIsTapping] = useState(false);
  const [currentTappingPoint, setCurrentTappingPoint] = useState(0);
  const [selectedSetupStatement, setSelectedSetupStatement] = useState<number | null>(null);
  const [questionnaireSession, setQuestionnaireSession] = useState<QuestionnaireSession | null>(null);
  const [showCrisisSupport, setShowCrisisSupport] = useState(false);

  const { 
    messages, 
    isLoading, 
    sendMessage, 
    startNewSession, 
    sessionContext,
    userProfile,
    crisisDetected
  } = useAIChat({
    onStateChange: (newState) => {
      console.log('State change:', chatState, '->', newState);
      setChatState(newState);
    },
    onSessionUpdate: (context) => {
      // Update local state based on AI conversation
    },
    onCrisisDetected: () => {
      setShowCrisisSupport(true);
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
    localStorage.setItem('hasCompletedAssessment', 'true');
    setChatState('initial');
    toast({
      title: "Assessment Complete",
      description: `Your anxiety level: ${session.severity} (Score: ${session.totalScore}/27)`,
    });
  };

  const handleSkipAssessment = () => {
    setChatState('initial');
    toast({
      title: "Assessment Skipped",
      description: "You can take the assessment later from the menu.",
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

    // Add context based on current state
    switch (chatState) {
      case 'initial':
        additionalContext.problem = currentInput;
        break;
      case 'gathering-feeling':
        additionalContext.feeling = currentInput;
        break;
      case 'gathering-location':
        additionalContext.bodyLocation = currentInput;
        break;
    }

    await sendMessage(messageToSend, chatState, additionalContext);
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
      return (
        <SetupStatements
          statements={sessionContext.setupStatements || []}
          selectedIndex={selectedSetupStatement}
          onSelect={handleSetupStatementSelect}
        />
      );
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
        <SessionActions 
          onStartNewSession={startNewSession}
          onShowHistory={() => setShowHistory(true)}
        />
      );
    }

    return (
      <ChatInput
        chatState={chatState}
        currentInput={currentInput}
        onInputChange={setCurrentInput}
        onSubmit={handleSubmit}
        onKeyPress={handleKeyPress}
        isLoading={isLoading}
      />
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
      <QuestionnaireView 
        onComplete={handleQuestionnaireComplete}
        onSkip={handleSkipAssessment}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ChatHeader 
        questionnaireSession={questionnaireSession}
        chatState={chatState}
        showHistory={showHistory}
        onToggleHistory={() => setShowHistory(!showHistory)}
        onStartNewSession={startNewSession}
      />

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
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {isLoading && <LoadingIndicator />}
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
      
      {/* Crisis Support Modal */}
      {showCrisisSupport && (
        <CrisisSupport onClose={() => setShowCrisisSupport(false)} />
      )}
    </div>
  );
};

export default AIAnxietyBot;