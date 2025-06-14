
export type ChatState = 'initial' | 'gathering-feeling' | 'gathering-location' | 'gathering-intensity' | 'creating-statements' | 'tapping' | 'post-tapping' | 'advice' | 'complete';

export interface ChatSession {
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

export interface Message {
  id: string;
  type: 'bot' | 'user' | 'system';
  content: string;
  timestamp: Date;
  sessionId?: string;
}
