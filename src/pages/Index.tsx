
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Brain, Users, Shield } from "lucide-react";
import AuthForm from "@/components/AuthForm";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(false);

  const handleStartJourney = () => {
    setShowAssessment(true);
  };

  const handleStartAssessment = () => {
    if (!isAuthenticated) {
      setRequiresAuth(true);
      setShowAuth(true);
    } else {
      // Continue with assessment - this will be handled by Dashboard
      setIsAuthenticated(true);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuth(false);
    setRequiresAuth(false);
  };

  const handleProceedToChat = () => {
    if (!isAuthenticated) {
      setRequiresAuth(true);
      setShowAuth(true);
    } else {
      setIsAuthenticated(true);
    }
  };

  if (isAuthenticated) {
    return <Dashboard onSignOut={() => setIsAuthenticated(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-lime-50">
      {showAuth ? (
        <AuthForm 
          onSuccess={handleAuthSuccess} 
          onBack={() => {
            setShowAuth(false);
            setRequiresAuth(false);
            setShowAssessment(false);
          }}
          message={requiresAuth ? "Please sign in to continue with your assessment" : undefined}
        />
      ) : showAssessment ? (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Ready to Begin?</h1>
            <p className="text-lg text-gray-600 mb-8">
              Choose how you'd like to start your wellness journey
            </p>
            
            <div className="grid gap-6 mb-8">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleStartAssessment}>
                <CardHeader>
                  <CardTitle>Take Assessment First</CardTitle>
                  <CardDescription>
                    Complete a brief questionnaire to help us understand your wellness needs and provide personalized support
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-gradient-to-r from-[#94c11f] to-lime-500 hover:from-[#7ba018] hover:to-lime-600 text-white">
                    Start Assessment
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleProceedToChat}>
                <CardHeader>
                  <CardTitle>Go Directly to Chat</CardTitle>
                  <CardDescription>
                    Skip the assessment and start working with our wellness bot right away
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full border-[#94c11f] text-[#94c11f] hover:bg-green-50">
                    Start Chatting
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <Button variant="ghost" onClick={() => setShowAssessment(false)}>
              Back to Home
            </Button>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="flex justify-center mb-6">
              <img 
                src="/lovable-uploads/dc1752d1-69ff-42d2-b27b-969c6510b75d.png" 
                alt="HealthPerks" 
                className="h-16"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Find Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#94c11f] to-lime-500"> Inner Peace</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Your personal wellness companion using proven techniques to help you find calm and clarity in the workplace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleStartJourney}
                size="lg" 
                className="bg-gradient-to-r from-[#94c11f] to-lime-500 hover:from-[#7ba018] hover:to-lime-600 text-white px-8 py-3 rounded-full transition-all duration-300 hover:scale-105"
              >
                Start Your Journey
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-gray-300 hover:border-[#94c11f] px-8 py-3 rounded-full transition-all duration-300"
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              {
                icon: Brain,
                title: "Science-Based",
                description: "Built on proven wellness techniques and psychological research"
              },
              {
                icon: Heart,
                title: "Personalized",
                description: "Tailored approach based on your specific wellness patterns"
              },
              {
                icon: Shield,
                title: "Safe & Secure",
                description: "Your wellness data is protected with enterprise-grade security"
              },
              {
                icon: Users,
                title: "Professional Support",
                description: "Crisis intervention and professional referrals when needed"
              }
            ].map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/70 backdrop-blur-sm">
                <CardHeader className="text-center pb-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#94c11f] to-lime-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* How It Works */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                {
                  step: "1",
                  title: "Complete Assessment",
                  description: "Answer a few questions to help us understand your wellness patterns"
                },
                {
                  step: "2",
                  title: "Identify Triggers",
                  description: "Work with our bot to pinpoint what's causing your stress"
                },
                {
                  step: "3",
                  title: "Guided Sessions",
                  description: "Follow personalized wellness sequences to reduce stress and anxiety"
                }
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#94c11f] to-lime-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-gradient-to-r from-green-200 to-lime-200 transform -translate-y-1/2"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-[#94c11f] to-lime-500 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Feeling Better?</h2>
            <p className="text-xl mb-8 opacity-90">Join thousands who have found relief through our wellness program.</p>
            <Button 
              onClick={handleStartJourney}
              size="lg" 
              variant="secondary"
              className="bg-white text-[#94c11f] hover:bg-gray-100 px-8 py-3 rounded-full transition-all duration-300 hover:scale-105"
            >
              Get Started Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
