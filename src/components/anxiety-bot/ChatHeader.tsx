import { Button } from "@/components/ui/button";
import { RotateCcw, History } from "lucide-react";
import { QuestionnaireSession } from "./types";

interface ChatHeaderProps {
  questionnaireSession: QuestionnaireSession | null;
  chatState: string;
  showHistory: boolean;
  onToggleHistory: () => void;
  onStartNewSession: () => void;
}

const ChatHeader = ({ 
  questionnaireSession, 
  chatState, 
  showHistory, 
  onToggleHistory, 
  onStartNewSession 
}: ChatHeaderProps) => {
  return (
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
          onClick={onToggleHistory}
          className="flex items-center"
        >
          <History className="w-4 h-4 mr-2" />
          Chat History
        </Button>
        <Button variant="outline" onClick={onStartNewSession} className="flex items-center">
          <RotateCcw className="w-4 h-4 mr-2" />
          New Session
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;