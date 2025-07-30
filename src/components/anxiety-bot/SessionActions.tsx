import { Button } from "@/components/ui/button";

interface SessionActionsProps {
  onStartNewSession: () => void;
  onShowHistory: () => void;
}

const SessionActions = ({ onStartNewSession, onShowHistory }: SessionActionsProps) => {
  return (
    <div className="space-y-2">
      <Button onClick={onStartNewSession} className="w-full">
        Start New Session
      </Button>
      <Button 
        variant="outline" 
        onClick={onShowHistory} 
        className="w-full"
      >
        View Chat History
      </Button>
    </div>
  );
};

export default SessionActions;