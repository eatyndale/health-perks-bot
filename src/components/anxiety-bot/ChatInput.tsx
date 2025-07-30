import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { ChatState } from "./types";

interface ChatInputProps {
  chatState: ChatState;
  currentInput: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
}

const ChatInput = ({ 
  chatState, 
  currentInput, 
  onInputChange, 
  onSubmit, 
  onKeyPress, 
  isLoading 
}: ChatInputProps) => {
  if (chatState === 'gathering-feeling') {
    return (
      <div className="flex space-x-2">
        <Input
          value={currentInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder="e.g., anxious, sad, angry, frustrated..."
          className="flex-1"
        />
        <Button 
          onClick={onSubmit} 
          disabled={isLoading || !currentInput.trim()}
          size="sm"
          className="self-end"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  if (chatState === 'gathering-location') {
    return (
      <div className="flex space-x-2">
        <Input
          value={currentInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder="e.g., chest, stomach, shoulders, throat..."
          className="flex-1"
        />
        <Button 
          onClick={onSubmit} 
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
        onChange={(e) => onInputChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={chatState === 'initial' ? "Tell me what's bothering you..." : "Type your response..."}
        className="flex-1"
        rows={2}
        disabled={isLoading}
      />
      <Button 
        onClick={onSubmit} 
        disabled={isLoading || !currentInput.trim()}
        size="sm"
        className="self-end"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default ChatInput;