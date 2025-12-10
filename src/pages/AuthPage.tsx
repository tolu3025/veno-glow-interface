
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VenoLogo } from '@/components/ui/logo';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { GoogleIcon } from '@/components/ui/GoogleIcon';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
}

const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Get the return URL from query params or location state
  const returnTo = searchParams.get('returnTo') || location.state?.from?.pathname || '/cbt';

  useEffect(() => {
    if (user) {
      console.log('User authenticated, redirecting to:', returnTo);
      navigate(returnTo);
    }
  }, [user, navigate, returnTo]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}${returnTo}`;
      console.log('Google sign in redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error('Google sign in error:', error);
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Unexpected Google sign in error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const sendCustomEmail = async (userEmail: string, actionUrl: string, type: 'confirmation' | 'password_reset') => {
    try {
      console.log(`Sending custom ${type} email to:`, userEmail);
      const { error } = await supabase.functions.invoke('brevo-email-confirmation', {
        body: {
          email: userEmail,
          name: userEmail.split('@')[0],
          confirmationUrl: actionUrl,
          type: type,
        },
      });

      if (error) {
        console.error(`Error sending custom ${type} email:`, error);
      } else {
        console.log(`Custom ${type} email sent successfully`);
      }
    } catch (err) {
      console.error(`Failed to send custom ${type} email:`, err);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/auth?mode=reset`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast.error(error.message);
      } else {
        // Send custom password reset email
        await sendCustomEmail(email, redirectUrl, 'password_reset');
        setResetEmailSent(true);
        toast.success('Password reset email sent! Check your inbox.');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          toast.error('Passwords do not match');
          setLoading(false);
          return;
        }

        const redirectUrl = `${window.location.origin}${returnTo}`;
        console.log('Sign up redirect URL:', redirectUrl);
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Email already registered. Try signing in instead.');
          } else {
            toast.error(error.message);
          }
        } else {
          // Send custom confirmation email via Brevo
          if (data?.user?.id) {
            const confirmationUrl = `https://oavauprgngpftanumlzs.supabase.co/auth/v1/verify?token=${data.user.id}&type=signup&redirect_to=${encodeURIComponent(redirectUrl)}`;
            await sendCustomEmail(email, confirmationUrl, 'confirmation');
          }
          toast.success('Please check your email to confirm your account');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Successfully signed in!');
          console.log('Login successful, redirecting to:', returnTo);
          navigate(returnTo);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password View
  if (mode === 'forgot-password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
        <Card className="w-full max-w-md border-primary/20">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center gap-2 mb-4">
              <VenoLogo className="h-8 w-8" />
              <span className="text-2xl font-bold">VenoBot</span>
            </div>
            <CardTitle className="text-2xl text-center">
              {resetEmailSent ? 'Check Your Email' : 'Reset Password'}
            </CardTitle>
            <CardDescription className="text-center">
              {resetEmailSent 
                ? 'We sent a password reset link to your email' 
                : 'Enter your email to receive a password reset link'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {resetEmailSent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-3xl">📧</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setResetEmailSent(false)}
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Send Reset Link
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter>
            <button
              onClick={() => {
                setMode('login');
                setResetEmailSent(false);
              }}
              className="text-primary hover:underline font-medium text-sm w-full text-center flex items-center justify-center gap-2"
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center gap-2 mb-4">
            <VenoLogo className="h-8 w-8" />
            <span className="text-2xl font-bold">VenoBot</span>
          </div>
          <CardTitle className="text-2xl text-center">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === 'login' 
              ? 'Sign in to your account to continue' 
              : 'Sign up to get started'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-4 w-4" />
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {mode === 'login' ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>

        <CardFooter>
          <p className="text-center text-sm text-muted-foreground w-full">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-primary hover:underline font-medium"
              disabled={loading}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthPage;
