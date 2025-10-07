import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Heart } from "lucide-react";
import { supabaseService } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";

interface AuthFormProps {
  onSuccess: () => void;
  onBack: () => void;
  message?: string;
}

const AuthForm = ({ onSuccess, onBack, message }: AuthFormProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let result;
      if (isLogin) {
        result = await supabaseService.signIn(email, password);
        if (result.error) {
          throw new Error(result.error.message);
        }
        onSuccess();
      } else {
        result = await supabaseService.signUp(name, email, password);
        if (result.error) {
          throw new Error(result.error.message);
        }
        toast({
          title: "Confirmation email sent!",
          description: "Please check your inbox to verify your account.",
        });
        // Don't call onSuccess immediately for signup, let user verify email
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabaseService.resetPasswordForEmail(email);
      if (error) {
        throw new Error(error.message);
      }
      
      setResetEmailSent(true);
      toast({
        title: "Password reset email sent!",
        description: "Check your inbox for the reset link.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 hover:bg-white/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isForgotPassword ? "Reset Password" : (isLogin ? "Welcome Back" : "Create Account")}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isForgotPassword 
                ? "Enter your email to receive a password reset link"
                : (message || (isLogin 
                  ? "Sign in to continue your anxiety reduction journey" 
                  : "Start your journey to inner peace today"
                ))
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isForgotPassword ? (
              <>
                {resetEmailSent ? (
                  <div className="text-center space-y-4">
                    <div className="text-green-600 p-4 bg-green-50 rounded-lg">
                      <p className="font-medium">Email sent successfully!</p>
                      <p className="text-sm mt-2">Check your inbox for the password reset link.</p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setResetEmailSent(false);
                        setEmail("");
                      }}
                      className="text-primary hover:text-primary/80"
                    >
                      Back to Sign In
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="border-gray-300 focus:border-primary"
                      />
                    </div>
                    {error && (
                      <div className="text-red-600 text-sm text-center p-2 bg-red-50 rounded">
                        {error}
                      </div>
                    )}
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {loading ? "..." : "Send Reset Link"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setError("");
                      }}
                      className="w-full text-primary hover:text-primary/80"
                    >
                      Back to Sign In
                    </Button>
                  </form>
                )}
              </>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="border-gray-300 focus:border-primary"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-gray-300 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password">Password</Label>
                      {isLogin && (
                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(true)}
                          className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="border-gray-300 focus:border-primary"
                    />
                  </div>
                  {error && (
                    <div className="text-red-600 text-sm text-center p-2 bg-red-50 rounded">
                      {error}
                    </div>
                  )}
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {loading ? "..." : (isLogin ? "Sign In" : "Create Account")}
                  </Button>
                </form>
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError("");
                    }}
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    {isLogin 
                      ? "Don't have an account? Sign up" 
                      : "Already have an account? Sign in"
                    }
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthForm;
