import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History } from "lucide-react";
import { ChatSession } from "./types";

interface LocalChatHistoryProps {
  chatHistory: ChatSession[];
  onLoadSession: (session: ChatSession) => void;
}

const LocalChatHistory = ({ chatHistory, onLoadSession }: LocalChatHistoryProps) => {
  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <History className="w-5 h-5 mr-2" />
          Chat History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {chatHistory.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No previous sessions
            </p>
          ) : (
            <div className="space-y-3">
              {chatHistory.map((historicalSession) => (
                <Card 
                  key={historicalSession.id}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => onLoadSession(historicalSession)}
                >
                  <CardContent className="p-3">
                    <p className="font-medium text-sm truncate">
                      {historicalSession.problem}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {historicalSession.timestamp.toLocaleDateString()}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs bg-[#94c11f]/20 text-[#7da01a] px-2 py-1 rounded">
                        {historicalSession.round} rounds
                      </span>
                      <span className="text-xs font-medium">
                        {historicalSession.initialIntensity} → {historicalSession.currentIntensity}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LocalChatHistory;