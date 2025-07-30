import { Button } from "@/components/ui/button";
import Questionnaire from "./Questionnaire";
import { QuestionnaireSession } from "./types";

interface QuestionnaireViewProps {
  onComplete: (session: QuestionnaireSession) => void;
  onSkip: () => void;
}

const QuestionnaireView = ({ onComplete, onSkip }: QuestionnaireViewProps) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Anxiety Assessment</h1>
        <p className="text-gray-600">Let's start by understanding your current mental health state</p>
        <div className="mt-4">
          <Button 
            variant="outline" 
            onClick={onSkip}
            className="mr-2"
          >
            Skip Assessment
          </Button>
        </div>
      </div>
      <Questionnaire onComplete={onComplete} />
    </div>
  );
};

export default QuestionnaireView;