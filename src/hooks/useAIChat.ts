import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseService, UserProfile } from '@/services/supabaseService';
import { ChatState, Message } from '@/components/anxiety-bot/types';
import { SecureStorage } from '@/utils/secureStorage';

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

export const useAIChat = ({ onStateChange, onSessionUpdate, onCrisisDetected }: UseAIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatSession, setCurrentChatSession] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sessionContext, setSessionContext] = useState<SessionContext>({});
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [crisisDetected, setCrisisDetected] = useState(false);

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

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userMessage,
      timestamp: new Date(),
      sessionId: currentChatSession
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    // Update session context
    const updatedContext = { ...sessionContext, ...additionalContext };
    setSessionContext(updatedContext);
    onSessionUpdate(updatedContext);

    try {
      // Call AI function
      const { data, error } = await supabase.functions.invoke('eft-chat', {
        body: {
          message: userMessage,
          chatState,
          userName: userProfile.first_name,
          sessionContext: updatedContext,
          conversationHistory: conversationHistory.slice(-10) // Last 10 messages for context
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
    // Determine next state based on AI response content and current state
    const response = aiResponse.toLowerCase();
    
    // State-based transitions to ensure proper flow
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
        // After intensity rating, always go to creating statements
        return 'creating-statements';
      case 'creating-statements':
        // After setup statements are created, go to tapping
        if (response.includes('even though') || response.includes('setup statement')) {
          return 'tapping';
        }
        break;
      case 'tapping':
        // After tapping is complete, go to post-tapping
        return 'post-tapping';
      case 'post-tapping':
        if (response.includes('amazing work') || response.includes('meditation library')) {
          return 'advice';
        }
        // If intensity is still high, create new statements
        if (sessionContext.currentIntensity && sessionContext.currentIntensity > 3) {
          return 'creating-statements';
        }
        break;
      case 'advice':
        return 'complete';
    }
    
    // Fallback pattern matching for edge cases
    if (response.includes('what\'s the utmost negative emotion') || response.includes('what are you feeling')) {
      return 'gathering-feeling';
    }
    if (response.includes('where do you feel it') || response.includes('feel it in your body')) {
      return 'gathering-location';
    }
    if (response.includes('rate') && response.includes('scale') && (response.includes('0') && response.includes('10'))) {
      return 'gathering-intensity';
    }
    if (response.includes('how do you feel now') || response.includes('what\'s your intensity now')) {
      return 'post-tapping';
    }
    if (response.includes('amazing work') || response.includes('meditation library')) {
      return 'advice';
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
    crisisDetected
  };
};