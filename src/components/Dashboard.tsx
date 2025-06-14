
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, LogOut, User, Activity } from "lucide-react";
import Questionnaire from "@/components/Questionnaire";
import AnxietyBot from "@/components/AnxietyBot";

type DashboardState = 'welcome' | 'questionnaire' | 'bot' | 'at-risk';

const Dashboard = () => {
  const [currentState, setCurrentState] = useState<DashboardState>('welcome');
  const [userProfile, setUserProfile] = useState({
    name: "User",
    questionnairesCompleted: false,
    isAtRisk: false
  });

  const handleQuestionnaireComplete = (isAtRisk: boolean) => {
    setUserProfile(prev => ({
      ...prev,
      questionnairesCompleted: true,
      isAtRisk
    }));
    
    if (isAtRisk) {
      setCurrentState('at-risk');
    } else {
      setCurrentState('bot');
    }
  };

  const renderCurrentView = () => {
    switch (currentState) {
      case 'questionnaire':
        return <Questionnaire onComplete={handleQuestionnaireComplete} />;
      case 'bot':
        return <AnxietyBot />;
      case 'at-risk':
        return (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">We're Here to Support You</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Based on your responses, we recommend connecting with a mental health professional. 
              You're not alone, and help is available.
            </p>
            <div className="space-y-4">
              <Card className="border-l-4 border-l-red-500 bg-red-50">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Crisis Support</h3>
                  <p className="text-sm text-gray-600 mb-3">If you're in immediate danger, please call emergency services.</p>
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    Get Immediate Help
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500 bg-blue-50">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Professional Support</h3>
                  <p className="text-sm text-gray-600 mb-3">Connect with licensed therapists and counselors.</p>
                  <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                    Find a Therapist
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      default:
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to Your Anxiety Reduction Journey
              </h1>
              <p className="text-xl text-gray-600">
                Let's start by understanding your current state and goals.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentState('questionnaire')}>
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle>Complete Assessment</CardTitle>
                  <CardDescription>
                    Help us understand your anxiety patterns with a quick questionnaire
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Start Assessment</Button>
                </CardContent>
              </Card>
              
              <Card className="opacity-50">
                <CardHeader>
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Activity className="w-6 h-6 text-gray-400" />
                  </div>
                  <CardTitle className="text-gray-500">Anxiety Reduction Bot</CardTitle>
                  <CardDescription>
                    Complete the assessment first to unlock personalized anxiety reduction sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button disabled className="w-full">Complete Assessment First</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">AnxietyBot</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Hello, {userProfile.name}</span>
            <Button variant="ghost" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {renderCurrentView()}
      </main>
    </div>
  );
};

export default Dashboard;
