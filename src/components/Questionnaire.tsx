
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface QuestionnaireProps {
  onComplete: (isAtRisk: boolean) => void;
}

const phq9Questions = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed. Or the opposite being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead, or of hurting yourself"
];

const responseOptions = [
  { value: "0", label: "Not at all" },
  { value: "1", label: "Several days" },
  { value: "2", label: "More than half the days" },
  { value: "3", label: "Nearly every day" }
];

const Questionnaire = ({ onComplete }: QuestionnaireProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < phq9Questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    
    setTimeout(() => {
      // Calculate PHQ-9 score
      const totalScore = Object.values(answers).reduce((sum, answer) => sum + parseInt(answer), 0);
      console.log("PHQ-9 Score:", totalScore);
      
      // Check if at risk (score of 9 indicates moderate depression, suggesting risk)
      const isAtRisk = totalScore >= 9 || answers[8] === "1" || answers[8] === "2" || answers[8] === "3"; // Question 9 is about self-harm thoughts
      
      onComplete(isAtRisk);
    }, 1000);
  };

  const progress = ((currentQuestion + 1) / phq9Questions.length) * 100;
  const isLastQuestion = currentQuestion === phq9Questions.length - 1;
  const canProceed = answers[currentQuestion] !== undefined;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Health Assessment</h2>
          <span className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {phq9Questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            Over the last 2 weeks, how often have you been bothered by:
          </CardTitle>
          <CardDescription className="text-base font-medium text-gray-700">
            {phq9Questions[currentQuestion]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQuestion] || ""}
            onValueChange={handleAnswer}
            className="space-y-4"
          >
            {responseOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label 
                  htmlFor={option.value} 
                  className="flex-1 cursor-pointer text-base font-medium"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!canProceed || isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white flex items-center"
            >
              {isSubmitting ? (
                "Processing..."
              ) : isLastQuestion ? (
                "Complete Assessment"
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {currentQuestion === phq9Questions.length - 1 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> This assessment helps us understand your current state. 
            If you're experiencing thoughts of self-harm, please reach out to a mental health professional immediately.
          </p>
        </div>
      )}
    </div>
  );
};

export default Questionnaire;
