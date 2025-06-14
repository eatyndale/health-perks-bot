
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

interface SessionCompleteProps {
  onNewSession: () => void;
  onViewHistory: () => void;
}

const SessionComplete = ({ onNewSession, onViewHistory }: SessionCompleteProps) => {
  return (
    <div className="text-center space-y-4 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
      <div className="w-16 h-16 bg-gradient-to-r from-[#94c11f] to-green-500 rounded-full flex items-center justify-center mx-auto">
        <Heart className="w-8 h-8 text-white" />
      </div>
      <h4 className="font-bold text-xl text-gray-900">Session Complete! 🌟</h4>
      <p className="text-gray-600">
        Your session has been saved to your chat history. You can always come back to review your progress.
      </p>
      <div className="flex gap-3 justify-center mt-4">
        <Button 
          onClick={onNewSession} 
          className="bg-gradient-to-r from-[#94c11f] to-green-600 hover:from-[#7da01a] hover:to-green-700 text-white"
        >
          Start New Session
        </Button>
        <Button variant="outline" onClick={onViewHistory}>
          View History
        </Button>
      </div>
    </div>
  );
};

export default SessionComplete;
