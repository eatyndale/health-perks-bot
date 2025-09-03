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
import { AnimatedBodyIllustration } from "./anxiety-bot/AnimatedBodyIllustration";


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
    crisisDetected,
    currentTappingPoint,
    setCurrentTappingPoint,
    intensityHistory
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
    },
    onTypoCorrection: (original, corrected) => {
      if (original !== corrected) {
        toast({
          title: "Input Corrected",
          description: `"${original}" → "${corrected}"`,
          duration: 3000,
        });
      }
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
    if (!currentInput.trim() && !['gathering-pre-intensity', 'gathering-post-intensity'].includes(chatState)) return;

    let messageToSend = currentInput;
    let additionalContext: any = {};

    // Handle intensity submission
    if (chatState === 'gathering-pre-intensity' || chatState === 'gathering-post-intensity') {
      messageToSend = `${currentIntensity[0]}/10`;
      if (chatState === 'gathering-pre-intensity') {
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
    setChatState('tapping-point');
    setIsTapping(true);
    setCurrentTappingPoint(0);
  };

  const handleTappingComplete = () => {
    setIsTapping(false);
    setChatState('gathering-post-intensity');
  };



  // Helper function to check if failsafe buttons should be shown
  const shouldShowFailsafeButtons = () => {
    // Show by default, only hide when in tapping-point state (which has its own interface)
    return chatState !== 'tapping-point';
  };

  // Render failsafe buttons
  const renderFailsafeButtons = () => {
    if (!shouldShowFailsafeButtons()) return null;

    return (
      <div className="border-t pt-4 mt-4 space-y-2">
        <div className="text-xs text-muted-foreground text-center mb-3">
          Manual Controls
        </div>
        
        {/* Start Visual Tapping Button */}
        <Button
          onClick={() => {
            if (sessionContext.initialIntensity === undefined) {
              setChatState('gathering-pre-intensity');
            } else {
              setChatState('tapping-point');
              setCurrentTappingPoint(0);
            }
          }}
          variant="outline"
          className="w-full text-sm"
        >
          🎯 Start Visual Tapping Session
        </Button>

        {/* Collect Intensity Button */}
        {chatState !== 'gathering-pre-intensity' && (
          <Button
            onClick={() => setChatState('gathering-pre-intensity')}
            variant="outline" 
            className="w-full text-sm"
          >
            📊 Rate Initial Intensity
          </Button>
        )}

        {/* Resume Tapping Button */}
        {sessionContext.initialIntensity !== undefined && chatState !== 'tapping-point' && 
         chatState !== 'gathering-post-intensity' && chatState !== 'tapping-breathing' && (
          <Button
            onClick={() => {
              setChatState('tapping-point');
              setCurrentTappingPoint(0);
            }}
            variant="outline"
            className="w-full text-sm"
          >
            👆 Resume Tapping
          </Button>
        )}

        {/* Collect Post-Intensity Button */}
        {sessionContext.initialIntensity !== undefined && chatState !== 'gathering-post-intensity' && 
         chatState !== 'tapping-point' && chatState !== 'tapping-breathing' && (
          <Button
            onClick={() => setChatState('gathering-post-intensity')}
            variant="outline"
            className="w-full text-sm"
          >
            📈 Rate Current Intensity
          </Button>
        )}
      </div>
    );
  };

  const renderInput = () => {
    // Debug: log current state
    console.log('Current chat state:', chatState);
    console.log('Session context:', sessionContext);
    
    // Progressive tapping states with intensity sliders
    if (chatState === 'gathering-pre-intensity' || chatState === 'gathering-post-intensity') {
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
            {intensityHistory.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Previous ratings: {intensityHistory.join(' → ')}
              </div>
            )}
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
            {isLoading ? 'Processing...' : 'Submit Rating'}
          </Button>
        </div>
      );
    }

    // Progressive setup statement states
    if (chatState === 'setup-statement-1' || chatState === 'setup-statement-2' || chatState === 'setup-statement-3') {
      return (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Setup Statement {chatState.split('-')[2]} of 3
          </div>
          <ChatInput
            chatState={chatState}
            currentInput={currentInput}
            onInputChange={setCurrentInput}
            onSubmit={handleSubmit}
            onKeyPress={handleKeyPress}
            isLoading={isLoading}
          />
        </div>
      );
    }

    // Progressive tapping point state with animated illustration
    if (chatState === 'tapping-point') {
      const tappingPoints = [
        { id: 'eyebrow', name: 'Eyebrow', x: 42, y: 22, description: 'Beginning of eyebrow' },
        { id: 'side_of_eye', name: 'Side of Eye', x: 58, y: 24, description: 'Temple area' },
        { id: 'under_eye', name: 'Under Eye', x: 50, y: 28, description: 'Bone under eye' },
        { id: 'under_nose', name: 'Under Nose', x: 50, y: 32, description: 'Between nose and lip' },
        { id: 'chin', name: 'Chin', x: 50, y: 38, description: 'Center of chin' },
        { id: 'collarbone', name: 'Collarbone', x: 50, y: 48, description: 'Below collarbone' },
        { id: 'under_arm', name: 'Under Arm', x: 35, y: 55, description: '4 inches below armpit' },
        { id: 'top_of_head', name: 'Top of Head', x: 50, y: 15, description: 'Crown of head' }
      ];
      
      const currentPoint = tappingPoints[currentTappingPoint];
      const latestBotMessage = messages.filter(m => m.type === 'bot').pop();
      
      return (
        <div className="space-y-6">
          <AnimatedBodyIllustration
            currentPoint={currentPoint}
            aiText={latestBotMessage?.content || sessionContext.reminderPhrases?.[0] || "Tap gently while repeating the reminder phrase"}
            isActive={true}
            onTap={() => {
              if (currentTappingPoint < 7) {
                setCurrentTappingPoint(prev => prev + 1);
                sendMessage(`Completed tapping ${currentPoint?.name}`, 'tapping-point');
              } else {
                setChatState('tapping-breathing');
              }
            }}
          />
          
          <div className="text-center space-y-4">
            <div className="text-sm text-muted-foreground">
              Tapping Point {currentTappingPoint + 1} of 8
            </div>
            
            <Button 
              onClick={() => {
                if (currentTappingPoint < 7) {
                  setCurrentTappingPoint(prev => prev + 1);
                  sendMessage(`Completed tapping ${currentPoint?.name}`, 'tapping-point');
                } else {
                  setChatState('tapping-breathing');
                }
              }}
              disabled={isLoading} 
              className="w-full"
            >
              {currentTappingPoint < 7 ? 'Next Tapping Point' : 'Complete This Round'}
            </Button>
          </div>
        </div>
      );
    }

    // Breathing state
    if (chatState === 'tapping-breathing') {
      return (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-lg font-semibold mb-4">
              Take a Deep Breath
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                How are you feeling now? (0-10):
              </label>
              <IntensitySlider
                value={currentIntensity}
                onValueChange={setCurrentIntensity}
                className="w-full"
              />
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
            {isLoading ? 'Processing...' : 'Continue'}
          </Button>
        </div>
      );
    }

    // Legacy creating statements (for backward compatibility)
    if (chatState === 'creating-statements') {
      return (
        <SetupStatements
          statements={sessionContext.setupStatements || []}
          selectedIndex={selectedSetupStatement}
          onSelect={handleSetupStatementSelect}
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
      <div className="space-y-4">
        <ChatInput
          chatState={chatState}
          currentInput={currentInput}
          onInputChange={setCurrentInput}
          onSubmit={handleSubmit}
          onKeyPress={handleKeyPress}
          isLoading={isLoading}
        />
        {renderFailsafeButtons()}
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
              intensityReadings: [],
              round: sessionContext.round || 0,
              setupStatements: sessionContext.setupStatements || [],
              reminderPhrases: sessionContext.reminderPhrases || [],
              currentTappingPoint: undefined,
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