import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { VenoLogo } from '@/components/ui/logo';
import { Eye, EyeOff, LogIn, User, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GoogleIcon } from '@/components/ui/GoogleIcon';
import { useAuth } from '@/providers/AuthProvider';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

interface AuthPageProps {
  initialMode?: 'signin' | 'signup';
}

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'signin' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword, signIn, signUp } = useAuth();

  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const refCode = searchParams.get('ref');
    
    if (refCode) {
      setReferralCode(refCode);
      sessionStorage.setItem('referralCode', refCode);
      console.log('Referral code detected:', refCode);
      setMode('signup');
    }
    
    const isReset = searchParams.get('reset') === 'true';
    if (isReset) {
      toast.info("Enter your new password to complete the reset process");
    }
    
    const isConfirmation = searchParams.get('confirmation') === 'true';
    if (isConfirmation) {
      const confirmEmail = searchParams.get('email');
      if (confirmEmail) {
        setEmail(confirmEmail);
        setMode('signin');
        setConfirmMessage("Your email is being confirmed. Please sign in to continue.");
      }
    }
    
    // Set up auth state change listener for email confirmation
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event);
      if (event === 'SIGNED_IN') {
        console.log("User signed in:", session?.user);
        toast.success("Successfully signed in!");
        
        // Get the previous location or default to dashboard
        const from = location.state?.from?.pathname || '/';
        navigate(from);
      } else if (event === 'USER_UPDATED') {
        console.log("User was updated");
        toast.success("Your profile has been updated");
      } else if (event === 'PASSWORD_RECOVERY') {
        toast.info("Please check your email for password reset instructions");
      }
    });
    
    // Check for email confirmation in URL
    const handleEmailConfirmation = async () => {
      if (location.hash && location.hash.includes('access_token')) {
        setIsLoading(true);
        try {
          const hashParams = new URLSearchParams(location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) throw error;
            
            if (data.session) {
              toast.success("Email confirmed successfully!");
              navigate('/');
            }
          }
        } catch (error: any) {
          console.error("Error handling email confirmation:", error);
          toast.error(error.message || "Failed to confirm email");
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    handleEmailConfirmation();

    return () => {
      subscription.unsubscribe();
    };
  }, [location, navigate]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        }
      });
      
      if (error) throw error;
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in with Google');
      console.error('Google auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setConfirmMessage(null);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        
        toast.success('Welcome back!');
        // Navigate to the previous location or the homepage
        const from = location.state?.from?.pathname || '/';
        navigate(from);
      } else {
        // Sign up with custom flow
        const storedReferralCode = referralCode || sessionStorage.getItem('referralCode');
        
        const { error, confirmEmailSent } = await signUp(email, password);

        if (error) {
          if (error.message.includes("already registered")) {
            setMode('signin');
            setConfirmMessage("This email is already registered. Please sign in instead.");
          } else {
            throw error;
          }
        } else if (confirmEmailSent) {
          setConfirmMessage("Account created! Please check your email for verification instructions.");
          toast.success('Account created! Please check your email for verification instructions.');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (values: z.infer<typeof forgotPasswordSchema>) => {
    try {
      setIsLoading(true);
      const { error } = await resetPassword(values.email);
      if (error) throw error;
      
      toast.success('Password reset instructions sent to your email!');
      setForgotPasswordOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset instructions');
      console.error('Reset password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <VenoLogo className="h-16 w-16" />
          </div>
          <h1 className="text-2xl font-bold">{mode === 'signin' ? 'Sign In' : 'Create Account'}</h1>
          <p className="text-muted-foreground mt-2">
            {mode === 'signin' 
              ? 'Welcome back! Enter your details to continue.' 
              : 'Join our community and start learning today.'}
          </p>
          {referralCode && mode === 'signup' && (
            <p className="text-veno-primary text-sm mt-1">
              You've been referred by a friend!
            </p>
          )}
          {confirmMessage && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-md">
              {confirmMessage}
            </div>
          )}
        </div>
        
        <div className="bg-card border rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            {mode === 'signin' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-sm text-veno-primary hover:underline"
                >
                  Forgot your password?
                </button>
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full py-2 px-4 bg-veno-primary text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : (
                <span className="flex items-center justify-center">
                  {mode === 'signin' ? (
                    <><LogIn size={16} className="mr-2" /> Sign In</>
                  ) : (
                    <><UserPlus size={16} className="mr-2" /> Sign Up</>
                  )}
                </span>
              )}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <GoogleIcon className="mr-2" />
              {mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            {mode === 'signin' ? (
              <p>
                Don't have an account?{' '}
                <button 
                  onClick={() => setMode('signup')} 
                  className="text-veno-primary hover:underline"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button 
                  onClick={() => setMode('signin')} 
                  className="text-veno-primary hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
      
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you instructions to reset your password.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...forgotPasswordForm}>
            <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
              <FormField
                control={forgotPasswordForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setForgotPasswordOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Reset Instructions'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuthPage;
