
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Lock, User, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isLogin && !agreedToTerms) {
        toast({
          title: "Agreement Required",
          description: "Please agree to the terms and conditions to continue.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        
        // Show forgot password option after failed login
        if (isLogin && error.message.includes("Invalid login credentials")) {
          setShowForgotPassword(true);
        }
      } else {
        toast({
          title: "Success",
          description: isLogin ? "Signed in successfully!" : "Account created successfully! Please check your email to confirm your account.",
        });
        if (isLogin) {
          navigate("/automations");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reset Email Sent",
          description: "Please check your email for password reset instructions.",
        });
        setShowForgotPassword(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-300/20 to-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-purple-300/20 to-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <Card 
          className="w-full max-w-lg bg-white/70 backdrop-blur-md border-0 rounded-3xl relative z-10"
          style={{
            boxShadow: '0 0 50px rgba(92, 142, 246, 0.2), 0 0 100px rgba(154, 94, 255, 0.1)'
          }}
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100/30 to-purple-100/30 pointer-events-none"></div>
          
          <CardHeader className="text-center relative z-10">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <img 
                src="/lovable-uploads/6b9580a6-e2cd-4056-95a9-7f730cbf6025.png" 
                alt="Yusrai Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Reset Password
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your email to reset your password
            </CardDescription>
          </CardHeader>
          
          <CardContent className="relative z-10">
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 rounded-xl bg-white/80 backdrop-blur-sm border-0 shadow-lg focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              
              <Button
                type="submit"
                disabled={resetLoading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {resetLoading ? "Sending..." : "Send Reset Email"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => setShowForgotPassword(false)}
                className="text-blue-600 hover:text-purple-600 rounded-xl"
              >
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-300/20 to-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-purple-300/20 to-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <Card 
        className="w-full max-w-lg bg-white/70 backdrop-blur-md border-0 rounded-3xl relative z-10"
        style={{
          boxShadow: '0 0 50px rgba(92, 142, 246, 0.2), 0 0 100px rgba(154, 94, 255, 0.1)'
        }}
      >
        {/* Subtle glow effect inside card */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100/30 to-purple-100/30 pointer-events-none"></div>
        
        <CardHeader className="text-center relative z-10">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <img 
              src="/lovable-uploads/6b9580a6-e2cd-4056-95a9-7f730cbf6025.png" 
              alt="Yusrai Logo" 
              className="w-12 h-12 object-contain"
            />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-gray-600 text-lg">
            {isLogin ? "Sign in to your account" : "Sign up to get started"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  className="pl-10 rounded-xl bg-white/80 backdrop-blur-sm border-0 shadow-lg focus:ring-2 focus:ring-blue-500/50 h-12"
                />
              </div>
            )}
            
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 rounded-xl bg-white/80 backdrop-blur-sm border-0 shadow-lg focus:ring-2 focus:ring-blue-500/50 h-12"
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 rounded-xl bg-white/80 backdrop-blur-sm border-0 shadow-lg focus:ring-2 focus:ring-blue-500/50 h-12"
              />
            </div>

            {!isLogin && (
              <div className="flex items-start space-x-3 p-4 bg-white/50 rounded-xl">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  className="mt-1"
                />
                <div className="text-sm text-gray-600 leading-relaxed">
                  <label htmlFor="terms" className="cursor-pointer">
                    By clicking this, you are agreeing with our{" "}
                    <a href="/terms-conditions" className="text-blue-600 hover:text-blue-800 underline">
                      Terms & Conditions
                    </a>
                    ,{" "}
                    <a href="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline">
                      Privacy Policy
                    </a>
                    ,{" "}
                    <a href="/disclaimer" className="text-blue-600 hover:text-blue-800 underline">
                      Disclaimer
                    </a>
                    ,{" "}
                    <a href="/cookie-policy" className="text-blue-600 hover:text-blue-800 underline">
                      Cookie Policy
                    </a>
                    . If you have any questions, contact our{" "}
                    <a href="/support" className="text-blue-600 hover:text-blue-800 underline">
                      Support
                    </a>
                    .
                  </label>
                </div>
              </div>
            )}
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              style={{
                boxShadow: '0 0 30px rgba(92, 142, 246, 0.3)'
              }}
            >
              {loading ? "Loading..." : (isLogin ? "Sign In" : "Sign Up")}
            </Button>
          </form>
          
          {showForgotPassword && isLogin && (
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={() => setShowForgotPassword(true)}
                className="text-blue-600 hover:text-purple-600 rounded-xl"
              >
                Forgot Password?
              </Button>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:text-purple-600 rounded-xl text-lg"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
