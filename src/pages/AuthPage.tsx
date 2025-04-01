
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { VenoLogo } from '@/components/ui/logo';

// Define the props for the AuthPage component
interface AuthPageProps {
  initialMode?: 'signin' | 'signup';
}

const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'signin' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract referral code from URL query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const refCode = searchParams.get('ref');
    
    if (refCode) {
      // Store the referral code in state and session storage
      setReferralCode(refCode);
      sessionStorage.setItem('referralCode', refCode);
      console.log('Referral code detected:', refCode);
      
      // If there's a referral code, default to signup mode
      setMode('signup');
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        // For signup, check if there's a stored referral code
        const storedReferralCode = referralCode || sessionStorage.getItem('referralCode');
        
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              referred_by: storedReferralCode || null,
            }
          }
        });

        if (error) throw error;
        
        // Record the referral if a referral code exists
        if (storedReferralCode && data.user) {
          try {
            const { error: referralError } = await supabase
              .from('user_referrals')
              .insert({
                referrer_id: storedReferralCode,
                referred_id: data.user.id,
                status: 'pending'
              });
            
            if (referralError) throw referralError;
            
            console.log('Referral recorded successfully');
            // Clear the stored referral code
            sessionStorage.removeItem('referralCode');
          } catch (referralError) {
            console.error('Error recording referral:', referralError);
          }
        }
        
        toast.success('Account created! Check your email for verification instructions.');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
      console.error('Auth error:', error);
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
        </div>
        
        <div className="bg-card border rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 rounded-md border border-border bg-background"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 rounded-md border border-border bg-background"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-2 px-4 bg-veno-primary text-white rounded-md hover:bg-veno-primary/90 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
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
    </div>
  );
};

export default AuthPage;
