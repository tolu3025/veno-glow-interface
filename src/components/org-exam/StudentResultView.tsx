import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Clock, Award, BookOpen } from 'lucide-react';

interface StudentResultViewProps {
  studentName: string;
  studentEmail: string;
  studentId?: string | null;
  examTitle: string;
  subject: string;
  score: number;
  totalQuestions: number;
  timeTaken?: number | null;
  submittedAt?: string | null;
  showResults?: boolean;
}

// Grade boundaries (Nigerian academic standards)
const getGradeInfo = (percentage: number): { grade: string; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
  if (percentage >= 70) return { grade: 'A', label: 'Distinction', variant: 'default' };
  if (percentage >= 60) return { grade: 'B', label: 'Credit', variant: 'default' };
  if (percentage >= 50) return { grade: 'C', label: 'Credit', variant: 'secondary' };
  if (percentage >= 40) return { grade: 'D', label: 'Pass', variant: 'secondary' };
  return { grade: 'F', label: 'Fail', variant: 'destructive' };
};

export default function StudentResultView({
  studentName,
  studentEmail,
  studentId,
  examTitle,
  subject,
  score,
  totalQuestions,
  timeTaken,
  submittedAt,
  showResults = true,
}: StudentResultViewProps) {
  const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
  const gradeInfo = getGradeInfo(percentage);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4">
          <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-500" />
        </div>
        <CardTitle className="text-xl">Examination Completed</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Your responses have been recorded successfully
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Candidate Information */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Candidate</span>
            <span className="font-medium">{studentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium text-xs sm:text-sm truncate max-w-[200px]">{studentEmail}</span>
          </div>
          {studentId && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Student ID</span>
              <span className="font-medium">{studentId}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Exam Information */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Examination</span>
            <span className="font-medium text-right max-w-[200px] truncate">{examTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subject</span>
            <span className="font-medium">{subject}</span>
          </div>
          {submittedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submitted</span>
              <span className="font-medium">
                {new Date(submittedAt).toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </div>

        {showResults && (
          <>
            <Separator />

            {/* Score Display */}
            <div className="bg-muted/50 rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Results Summary</p>
              <div className="flex items-center justify-center gap-4">
                <div>
                  <p className="text-4xl font-bold">{score}/{totalQuestions}</p>
                  <p className="text-lg text-muted-foreground">{percentage.toFixed(1)}%</p>
                </div>
                <div className="text-left">
                  <Badge variant={gradeInfo.variant} className="text-lg px-3 py-1">
                    Grade {gradeInfo.grade}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">{gradeInfo.label}</p>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Questions</p>
                  <p className="font-medium">{totalQuestions}</p>
                </div>
              </div>
              {timeTaken !== null && timeTaken !== undefined && (
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Time Spent</p>
                    <p className="font-medium">{formatTime(timeTaken)}</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {!showResults && (
          <div className="bg-muted/50 rounded-lg p-6 text-center">
            <Award className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Results will be released by your institution
            </p>
          </div>
        )}

        {/* Footer Note */}
        <p className="text-xs text-center text-muted-foreground">
          This is a tamper-protected academic record
        </p>
      </CardContent>
    </Card>
  );
}
