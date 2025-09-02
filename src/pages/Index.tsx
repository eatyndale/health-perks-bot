
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseService } from "@/services/supabaseService";
import type { User, Session } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Brain, Users, Shield } from "lucide-react";
import AuthForm from "@/components/AuthForm";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleStartJourney = () => {
    setShowAssessment(true);
  };

  const handleStartAssessment = () => {
    if (!user) {
      setRequiresAuth(true);
      setShowAuth(true);
    }
    // If user is authenticated, Dashboard component will handle assessment
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    setRequiresAuth(false);
  };

  const handleProceedToChat = () => {
    if (!user) {
      setRequiresAuth(true);
      setShowAuth(true);
    }
    // If user is authenticated, Dashboard component will handle chat
  };

  const handleSignOut = async () => {
    await supabaseService.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Dashboard onSignOut={handleSignOut} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
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
                  <Button className="w-full bg-[#4dbad1] hover:bg-[#3da3ba] text-white">
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
                  <Button variant="outline" className="w-full border-[#4dbad1] text-[#4dbad1] hover:bg-[#4dbad1]/10">
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
                src="/lovable-uploads/2323e4a7-8630-4879-88a4-0b0c0be5aba7.png" 
                alt="Tapaway" 
                className="h-16"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Find Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4dbad1] to-[#3da3ba]"> Inner Peace</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Your personal wellness companion using proven techniques to help you find calm and clarity in the workplace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleStartJourney}
                size="lg" 
                className="bg-[#4dbad1] hover:bg-[#3da3ba] text-white px-8 py-3 rounded-full transition-all duration-300 hover:scale-105"
              >
                Start Your Journey
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-gray-300 hover:border-[#4dbad1] px-8 py-3 rounded-full transition-all duration-300"
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
                image: "/lovable-uploads/20700410-71b5-4ebf-a90d-69f0d058c56d.png",
                title: "Science-Based",
                description: "Built on proven wellness techniques and psychological research"
              },
              {
                icon: Heart,
                image: "/lovable-uploads/6e98e6d1-0de5-4a3b-bed3-bd379424897e.png",
                title: "Personalized",
                description: "Tailored approach based on your specific wellness patterns"
              },
              {
                icon: Shield,
                image: "/lovable-uploads/9c18ca02-3714-48e2-8810-0a8c6f5b1857.png",
                title: "Safe & Secure",
                description: "Your wellness data is protected with enterprise-grade security"
              },
              {
                icon: Users,
                image: "/lovable-uploads/173cc014-fcdd-411d-832e-83bd13dc5d27.png",
                title: "Professional Support",
                description: "Crisis intervention and professional referrals when needed"
              }
            ].map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white/70 backdrop-blur-sm group">
                <CardHeader className="text-center pb-2">
                  <div className="relative w-20 h-20 mx-auto mb-4 transition-transform duration-300 group-hover:scale-110">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-full object-contain animate-fade-in"
                    />
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
                  <div className="w-12 h-12 bg-[#4dbad1] rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-[#4dbad1]/30 transform -translate-y-1/2"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-[#4dbad1] rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Feeling Better?</h2>
            <p className="text-xl mb-8 opacity-90">Join thousands who have found relief through our wellness program.</p>
            <Button 
              onClick={handleStartJourney}
              size="lg" 
              variant="secondary"
              className="bg-white text-[#4dbad1] hover:bg-gray-100 px-8 py-3 rounded-full transition-all duration-300 hover:scale-105"
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
