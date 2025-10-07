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
  statementOrder?: number[];
}

interface Directive {
  next_state?: string;
  tapping_point?: number | null;
  setup_statements?: string[] | null;
  statement_order?: number[] | null;
  say_index?: number | null;
  collect?: string | null;
  notes?: string;
}

interface UseAIChatProps {
  onStateChange: (state: ChatState) => void;
  onSessionUpdate: (context: SessionContext) => void;
  onCrisisDetected?: () => void;
  onTypoCorrection?: (original: string, corrected: string) => void;
}

// Directive parsing - improved regex for robustness
const DIRECTIVE_RE = /<<DIRECTIVE\s+(\{[\s\S]*?\})>>/;

function parseDirective(text: string): Directive | null {
  console.log('[parseDirective] Attempting to parse directive from text:', text.substring(text.length - 200));
  const m = text.match(DIRECTIVE_RE);
  if (!m) {
    console.log('[parseDirective] No directive found in response');
    return null;
  }
  try {
    const parsed = JSON.parse(m[1]);
    console.log('[parseDirective] Successfully parsed directive:', parsed);
    return parsed;
  } catch (e) {
    console.error('[parseDirective] Failed to parse directive JSON:', e);
    return null;
  }
}

// Helper function to extract setup statements from AI response (legacy fallback)
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

      // Parse directive and strip it from visible content
      const directive = parseDirective(data.response);
      const visibleContent = directive 
        ? data.response.replace(DIRECTIVE_RE, '').trim() 
        : data.response;

      console.log('[useAIChat] AI Response received. Has directive:', !!directive);
      console.log('[useAIChat] Current state:', chatState);

      // Add AI response with stripped content
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        type: 'bot',
        content: visibleContent,
        timestamp: new Date(),
        sessionId: currentChatSession
      };

      const finalMessages = [...updatedMessages, aiMsg];
      setMessages(finalMessages);
      setConversationHistory(finalMessages);

      // Apply directive-first flow
      if (directive) {
        const next = directive.next_state;
        console.log('[useAIChat] Directive next_state:', next);
        console.log('[useAIChat] Directive tapping_point:', directive.tapping_point);
        
        // Start-of-round: store statements + order
        if (next === 'tapping-point' && directive.tapping_point === 0) {
          const setupStatements = directive.setup_statements ?? updatedContext.setupStatements ?? [];
          const statementOrder = directive.statement_order ?? updatedContext.statementOrder ?? [];
          console.log('[useAIChat] Storing setup statements:', setupStatements);
          console.log('[useAIChat] Storing statement order:', statementOrder);
          updatedContext.setupStatements = setupStatements;
          updatedContext.statementOrder = statementOrder;
          setSessionContext(updatedContext);
          onSessionUpdate(updatedContext);
        }

        // Point advancement: update current tapping point
        if (next === 'tapping-point' && typeof directive.tapping_point === 'number') {
          console.log('[useAIChat] Setting tapping point to:', directive.tapping_point);
          setCurrentTappingPoint(directive.tapping_point);
        }

        // State transition
        if (next && next !== chatState) {
          console.log('[useAIChat] Transitioning state from', chatState, 'to', next);
          onStateChange(next as ChatState);
        }
      } else {
        console.log('[useAIChat] No directive found, using fallback logic');
        
        // Fallback: legacy state detection
        // Extract setup statements if we're in creating-statements state
        if (chatState === 'creating-statements' || visibleContent.includes('Even though')) {
          const setupStatements = extractSetupStatements(visibleContent);
          if (setupStatements.length > 0) {
            console.log('[useAIChat] Extracted setup statements (fallback):', setupStatements);
            updatedContext.setupStatements = setupStatements;
            setSessionContext(updatedContext);
            onSessionUpdate(updatedContext);
          }
        }

        // Handle state transitions based on AI response and current state (use visibleContent)
        const nextState = determineNextState(chatState, visibleContent);
        if (nextState && nextState !== chatState) {
          console.log('[useAIChat] Fallback state transition from', chatState, 'to', nextState);
          onStateChange(nextState);
        }
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
    console.log('[determineNextState] FALLBACK LOGIC - Current state:', currentState);
    console.log('[determineNextState] AI response preview:', aiResponse.substring(0, 150));
    
    const response = aiResponse.toLowerCase();
    
    // Explicit state machine with keyword detection
    switch (currentState) {
      case 'initial':
        if (response.includes('what\'s the utmost negative emotion') || 
            response.includes('what are you feeling') ||
            response.includes('feeling right now')) {
          console.log('[determineNextState] Transition: initial → gathering-feeling');
          return 'gathering-feeling';
        }
        break;
        
      case 'gathering-feeling':
        if (response.includes('where do you feel it') || 
            response.includes('feel it in your body') ||
            response.includes('where in your body')) {
          console.log('[determineNextState] Transition: gathering-feeling → gathering-location');
          return 'gathering-location';
        }
        break;
        
      case 'gathering-location':
        if ((response.includes('rate') || response.includes('scale')) && 
            (response.includes('0') || response.includes('10'))) {
          console.log('[determineNextState] Transition: gathering-location → gathering-intensity');
          return 'gathering-intensity';
        }
        break;
        
      case 'gathering-intensity':
        console.log('[determineNextState] Transition: gathering-intensity → setup-statement-1');
        return 'setup-statement-1';
        
      case 'setup-statement-1':
        if (response.includes('repeat it') || 
            response.includes('tapping the side') ||
            response.includes('karate chop')) {
          console.log('[determineNextState] Transition: setup-statement-1 → setup-statement-2');
          return 'setup-statement-2';
        }
        break;
        
      case 'setup-statement-2':
        if (response.includes('repeat it') || 
            response.includes('tapping the side') ||
            response.includes('karate chop')) {
          console.log('[determineNextState] Transition: setup-statement-2 → setup-statement-3');
          return 'setup-statement-3';
        }
        break;
        
      case 'setup-statement-3':
        // CRITICAL: This should transition to tapping-point with statements
        if (response.includes('move through the tapping points') || 
            response.includes('tapping points') ||
            response.includes('top of the head')) {
          console.log('[determineNextState] Transition: setup-statement-3 → tapping-point');
          console.log('[determineNextState] ⚠️ WARNING: Using fallback - directive should have handled this!');
          return 'tapping-point';
        }
        break;
        
      case 'tapping-point':
        if (currentTappingPoint < 7) {
          console.log('[determineNextState] Continue tapping-point, current point:', currentTappingPoint);
          return 'tapping-point';
        } else {
          console.log('[determineNextState] Transition: tapping-point → tapping-breathing');
          return 'tapping-breathing';
        }
        
      case 'tapping-breathing':
        if (response.includes('how are you feeling') || 
            response.includes('ready to rate') ||
            response.includes('deep breath')) {
          console.log('[determineNextState] Transition: tapping-breathing → post-tapping');
          return 'post-tapping';
        }
        break;
        
      case 'post-tapping':
        // Check if intensity is still high
        if (sessionContext.currentIntensity && sessionContext.currentIntensity > 3) {
          console.log('[determineNextState] High intensity, restarting: post-tapping → setup-statement-1');
          return 'setup-statement-1';
        }
        if (response.includes('amazing work') || 
            response.includes('meditation library') ||
            response.includes('well done')) {
          console.log('[determineNextState] Transition: post-tapping → advice');
          return 'advice';
        }
        break;
        
      case 'advice':
        console.log('[determineNextState] Transition: advice → complete');
        return 'complete';
    }
    
    console.log('[determineNextState] No transition detected, staying in:', currentState);
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