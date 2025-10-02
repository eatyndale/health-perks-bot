import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseService, UserProfile } from '@/services/supabaseService';
import { ChatState, Message } from '@/components/anxiety-bot/types';
import { SecureStorage } from '@/utils/secureStorage';
import { SpellChecker } from '@/utils/spellChecker';

interface SessionContext {
  problem?: string;
  feeling?: string;
  bodyLocation?: string;
  initialIntensity?: number;
  currentIntensity?: number;
  round?: number;
  setupStatements?: string[];
  reminderPhrases?: string[];
}

interface UseAIChatProps {
  onStateChange: (state: ChatState) => void;
  onSessionUpdate: (context: SessionContext) => void;
  onCrisisDetected?: () => void;
  onTypoCorrection?: (original: string, corrected: string) => void;
}

// Helper function to extract setup statements from AI response
const extractSetupStatements = (response: string): string[] => {
  const statements: string[] = [];
  const lines = response.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('"Even though') && trimmed.endsWith('"')) {
      // Remove quotes and add to statements
      statements.push(trimmed.slice(1, -1));
    } else if (trimmed.startsWith('Even though')) {
      // Direct statement without quotes
      statements.push(trimmed);
    }
  }
  
  return statements;
};

export const useAIChat = ({ onStateChange, onSessionUpdate, onCrisisDetected, onTypoCorrection }: UseAIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatSession, setCurrentChatSession] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sessionContext, setSessionContext] = useState<SessionContext>({});
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [currentTappingPoint, setCurrentTappingPoint] = useState(0);
  const [intensityHistory, setIntensityHistory] = useState<number[]>([]);

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (userProfile) {
      initializeChatSession();
    }
  }, [userProfile]);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { profile } = await supabaseService.getProfile(user.id);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const initializeChatSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { session } = await supabaseService.getOrCreateChatSession(user.id);
        if (session) {
          setCurrentChatSession(session.id);
          
          // Load existing messages if any
          if (session.messages && Array.isArray(session.messages) && session.messages.length > 0) {
            const existingMessages = session.messages.map((msg: any, index: number) => ({
              id: msg.id || `msg-${index}`,
              type: msg.type,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              sessionId: session.id
            }));
            setMessages(existingMessages);
            setConversationHistory(existingMessages);
          } else {
            // Only add greeting if no existing messages
            createInitialGreeting(session.id);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing chat session:', error);
    }
  };

  const createInitialGreeting = (sessionId: string) => {
    const greetingMessage: Message = {
      id: `greeting-${Date.now()}`,
      type: 'bot',
      content: `Hello ${userProfile?.first_name || 'there'}! I'm here to help you work through anxiety using EFT tapping techniques. What would you like to work on today?`,
      timestamp: new Date(),
      sessionId: sessionId
    };
    setMessages([greetingMessage]);
    setConversationHistory([greetingMessage]);
  };

  const sendMessage = useCallback(async (
    userMessage: string, 
    chatState: ChatState,
    additionalContext?: Partial<SessionContext>
  ) => {
    if (!userProfile || !currentChatSession) return;

    setIsLoading(true);

    // Enhanced typo correction and validation
    const correctionResult = SpellChecker.correctWithFuzzyMatching(userMessage);
    let processedMessage = correctionResult.corrected;
    
    // Notify about corrections if any were made
    if (correctionResult.changes.length > 0 && onTypoCorrection) {
      onTypoCorrection(userMessage, processedMessage);
    }

    // Add user message (showing original message to user, but using corrected version for AI)
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userMessage, // Keep original for display
      timestamp: new Date(),
      sessionId: currentChatSession
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    // Update session context with intensity tracking
    const updatedContext = { ...sessionContext, ...additionalContext };
    
    // Track intensity changes
    if (additionalContext?.currentIntensity !== undefined) {
      const newHistory = [...intensityHistory, additionalContext.currentIntensity];
      setIntensityHistory(newHistory);
    }
    
    setSessionContext(updatedContext);
    onSessionUpdate(updatedContext);

    try {
      // Call AI function with enhanced context
      const { data, error } = await supabase.functions.invoke('eft-chat', {
        body: {
          message: processedMessage, // Use corrected message for AI processing
          chatState,
          userName: userProfile.first_name,
          sessionContext: updatedContext,
          conversationHistory: conversationHistory.slice(-20), // Increased context window
          currentTappingPoint,
          intensityHistory
        }
      });

      if (error) throw error;

      // Add AI response
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        type: 'bot',
        content: data.response,
        timestamp: new Date(),
        sessionId: currentChatSession
      };

      const finalMessages = [...updatedMessages, aiMsg];
      setMessages(finalMessages);
      setConversationHistory(finalMessages);

      // Extract setup statements if we're in creating-statements state
      if (chatState === 'creating-statements' || data.response.includes('Even though')) {
        const setupStatements = extractSetupStatements(data.response);
        if (setupStatements.length > 0) {
          updatedContext.setupStatements = setupStatements;
          setSessionContext(updatedContext);
          onSessionUpdate(updatedContext);
        }
      }

      // Handle state transitions based on AI response and current state
      const nextState = determineNextState(chatState, data.response);
      if (nextState && nextState !== chatState) {
        onStateChange(nextState);
      }

      // Update chat session in database
      // Generate session name based on emotions if we have session context
      let sessionName;
      if (updatedContext.feeling || updatedContext.problem) {
        sessionName = supabaseService.generateSessionName(
          updatedContext.feeling || 'anxiety', 
          updatedContext.problem
        );
      }
      
      await supabaseService.updateChatSession(currentChatSession, {
        messages: finalMessages,
        crisis_detected: data.crisisDetected || false,
        session_name: sessionName
      });

      // Handle crisis detection
      if (data.crisisDetected) {
        setCrisisDetected(true);
        onCrisisDetected?.();
        onStateChange('complete'); // End session and show crisis resources
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        type: 'bot',
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        sessionId: currentChatSession
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, userProfile, currentChatSession, sessionContext, conversationHistory, onStateChange, onSessionUpdate, onCrisisDetected]);

  const determineNextState = (currentState: ChatState, aiResponse: string): ChatState | null => {
    // Enhanced state transitions for progressive flow
    const response = aiResponse.toLowerCase();
    
    // Progressive state-based transitions
    switch (currentState) {
      case 'initial':
        if (response.includes('what\'s the utmost negative emotion') || response.includes('what are you feeling')) {
          return 'gathering-feeling';
        }
        break;
      case 'gathering-feeling':
        if (response.includes('where do you feel it') || response.includes('feel it in your body')) {
          return 'gathering-location';
        }
        break;
      case 'gathering-location':
        if (response.includes('rate') && response.includes('scale') && (response.includes('0') && response.includes('10'))) {
          return 'gathering-intensity';
        }
        break;
      case 'gathering-intensity':
        return 'setup-statement-1'; // Start progressive setup statements
      case 'setup-statement-1':
        if (response.includes('repeat it') || response.includes('tapping the side')) {
          return 'setup-statement-2';
        }
        break;
      case 'setup-statement-2':
        if (response.includes('repeat it') || response.includes('tapping the side')) {
          return 'setup-statement-3';
        }
        break;
      case 'setup-statement-3':
        // After third statement, always move to tapping - make it more reliable
        if (response.includes('tapping point') || 
            response.includes('move through') || 
            response.includes('now we') ||
            response.includes('great!') ||
            response.includes('perfect')) {
          return 'tapping-point';
        }
        break;
      case 'tapping-point':
        // Progress through tapping points one by one
        if (currentTappingPoint < 7) {
          return 'tapping-point'; // Continue with next point
        } else {
          return 'tapping-breathing'; // All points done, move to breathing
        }
        break;
      case 'tapping-breathing':
        if (response.includes('how are you feeling') || response.includes('ready to rate')) {
          return 'post-tapping';
        }
        break;
      case 'post-tapping':
        if (response.includes('amazing work') || response.includes('meditation library')) {
          return 'advice';
        }
        // If intensity is still high, restart the setup process
        if (sessionContext.currentIntensity && sessionContext.currentIntensity > 3) {
          return 'setup-statement-1';
        }
        break;
      case 'advice':
        return 'complete';
    }
    
    return null;
  };

  const startNewSession = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { session } = await supabaseService.getOrCreateChatSession(user.id);
        if (session) {
          setCurrentChatSession(session.id);
          setMessages([]);
          setConversationHistory([]);
          setSessionContext({});
          
          // Add initial greeting
          createInitialGreeting(session.id);
        }
      }
    } catch (error) {
      console.error('Error starting new session:', error);
    }
  }, [userProfile]);

  return {
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
  };
};