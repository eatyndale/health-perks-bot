import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionnaireResponse, QuestionnaireSession } from "./types";

interface QuestionnaireProps {
  onComplete: (session: QuestionnaireSession) => void;
}

const questions = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead or of hurting yourself in some way"
];

const answerLabels = [
  "Not at all",
  "Several days", 
  "More than half the days",
  "Nearly every day"
];

const getSeverity = (score: number): QuestionnaireSession['severity'] => {
  if (score <= 4) return 'Minimal';
  if (score <= 9) return 'Mild';
  if (score <= 14) return 'Moderate';
  if (score <= 19) return 'Moderately severe';
  return 'Severe';
};

const Questionnaire = ({ onComplete }: QuestionnaireProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<QuestionnaireResponse[]>([]);

  const handleAnswer = (answer: number) => {
    const newResponse: QuestionnaireResponse = {
      question: currentQuestion,
      answer
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Complete questionnaire
      const totalScore = updatedResponses.reduce((sum, response) => sum + response.answer, 0);
      const severity = getSeverity(totalScore);
      
      const session: QuestionnaireSession = {
        responses: updatedResponses,
        totalScore,
        severity,
        isComplete: true
      };

      onComplete(session);
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Anxiety Assessment</CardTitle>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-center text-gray-600">
          Question {currentQuestion + 1} of {questions.length}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Over the last 2 weeks, how often have you been bothered by:
          </p>
          <h3 className="text-lg font-medium leading-relaxed">
            {questions[currentQuestion]}
          </h3>
        </div>

        <div className="space-y-3">
          {answerLabels.map((label, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full h-auto p-4 text-left justify-start hover:bg-primary/10"
              onClick={() => handleAnswer(index)}
            >
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center">
                  <span className="text-sm font-bold">{index}</span>
                </div>
                <span>{label}</span>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default Questionnaire;