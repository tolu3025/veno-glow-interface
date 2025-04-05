import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import GoogleIcon from '@/components/ui/GoogleIcon';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Logo from '@/components/ui/logo';
import Spline from '@splinetool/react-spline';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
}

const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialMode);
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || sessionStorage.getItem('referralCode') || null;
  
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  // Handle referral code from URL
  useEffect(() => {
    if (referralCode) {
      console.log('Referral code detected:', referralCode);
      sessionStorage.setItem('referralCode', referralCode);
      setActiveTab('signup');
    }
  }, [referralCode]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      const { error } = await signIn({ email, password });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "You have successfully signed in",
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !name) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Check if the email is already in use
      const { data: existingUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
        
      if (existingUsers) {
        throw new Error('This email is already registered. Please sign in instead.');
      }
      
      const { error } = await signUp({ 
        email, 
        password, 
        options: { 
          data: { 
            full_name: name,
            referral_code: referralCode
          } 
        } 
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Please check your email to confirm your account",
      });
      
      // Automatically switch to login tab after successful signup
      setActiveTab('login');
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({
        title: "Sign up failed",
        description: error.message || "An error occurred during sign up",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      // The redirect will happen automatically
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast({
        title: "Google sign in failed",
        description: error.message || "An error occurred during Google sign in",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-veno-primary/5 to-background">
      <div className="container relative flex-1 flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-veno-primary/90" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <Logo className="h-10 w-auto" />
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                "The best educational platform I've ever used. It has transformed how I study and prepare for exams."
              </p>
              <footer className="text-sm">Sofia Davis</footer>
            </blockquote>
          </div>
          <div className="relative z-10 h-full w-full">
            <Spline scene="https://prod.spline.design/LMc58EcjolE2ESOx/scene.splinecode" />
          </div>
        </div>
        
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                {activeTab === 'login' ? 'Welcome back' : 'Create an account'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {activeTab === 'login' 
                  ? 'Enter your credentials to sign in to your account' 
                  : 'Enter your information to create an account'}
              </p>
            </div>
            
            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>
                      Enter your credentials to access your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form onSubmit={handleEmailSignIn}>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="m@example.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <Button 
                              variant="link" 
                              className="px-0 text-xs font-normal h-auto"
                              onClick={() => toast({
                                title: "Password Reset",
                                description: "Please contact support to reset your password",
                              })}
                            >
                              Forgot password?
                            </Button>
                          </div>
                          <Input 
                            id="password" 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                    >
                      <GoogleIcon className="mr-2 h-4 w-4" />
                      Sign in with Google
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="signup">
                <Card>
                  <CardHeader>
                    <CardTitle>Create an account</CardTitle>
                    <CardDescription>
                      Enter your information to create an account
                      {referralCode && (
                        <div className="mt-2 text-xs text-veno-primary">
                          You were referred by a friend! (Code: {referralCode})
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form onSubmit={handleEmailSignUp}>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input 
                            id="name" 
                            placeholder="John Doe" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email-signup">Email</Label>
                          <Input 
                            id="email-signup" 
                            type="email" 
                            placeholder="m@example.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password-signup">Password</Label>
                          <Input 
                            id="password-signup" 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? "Creating account..." : "Create Account"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                    >
                      <GoogleIcon className="mr-2 h-4 w-4" />
                      Sign up with Google
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
            
            <p className="px-8 text-center text-sm text-muted-foreground">
              By clicking continue, you agree to our{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/terms-of-service')}>
                Terms of Service
              </Button>{" "}
              and{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/privacy-policy')}>
                Privacy Policy
              </Button>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
