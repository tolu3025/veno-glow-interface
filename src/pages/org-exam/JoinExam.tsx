import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, ArrowRight, Loader2 } from 'lucide-react';
import { useOrgExam } from '@/hooks/useOrgExam';
import { toast } from 'sonner';

export default function JoinOrgExam() {
  const navigate = useNavigate();
  const { getExamByAccessCode } = useOrgExam();
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!accessCode.trim()) {
      toast.error('Please enter an access code');
      return;
    }

    setLoading(true);
    try {
      const exam = await getExamByAccessCode(accessCode.trim().toUpperCase());
      if (exam) {
        navigate(`/org-exam/take/${accessCode.trim().toUpperCase()}`);
      } else {
        toast.error('Invalid access code or exam not available');
      }
    } catch (error) {
      console.error('Error checking exam:', error);
      toast.error('Failed to verify access code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Join Examination</CardTitle>
          <CardDescription>
            Enter the access code provided by your institution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Access Code</Label>
            <Input
              id="code"
              placeholder="Enter 8-character code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              className="text-center text-lg font-mono tracking-widest"
              maxLength={8}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
          </div>
          <Button className="w-full" onClick={handleJoin} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            The access code is case-insensitive
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
