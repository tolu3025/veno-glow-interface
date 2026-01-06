import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingDown, Brain } from 'lucide-react';
import { OrgExamQuestion, OrgExamSession } from '@/hooks/useOrgExam';
import LaTeXText from '@/components/ui/latex-text';
interface QuestionAnalysisProps {
  questions: OrgExamQuestion[];
  sessions: OrgExamSession[];
}

interface QuestionStats {
  questionIndex: number;
  question: string;
  correctCount: number;
  totalAttempts: number;
  successRate: number;
}

export default function QuestionAnalysis({ questions, sessions }: QuestionAnalysisProps) {
  const submittedSessions = sessions.filter(s => s.status === 'submitted' && s.answers);

  const questionStats = useMemo((): QuestionStats[] => {
    if (questions.length === 0 || submittedSessions.length === 0) return [];

    return questions.map((q, idx) => {
      let correctCount = 0;
      let totalAttempts = 0;

      submittedSessions.forEach(session => {
        const answers = session.answers as (number | null)[] | null;
        if (answers && answers[idx] !== null && answers[idx] !== undefined) {
          totalAttempts++;
          if (answers[idx] === q.answer) {
            correctCount++;
          }
        }
      });

      return {
        questionIndex: idx,
        question: q.question,
        correctCount,
        totalAttempts,
        successRate: totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0,
      };
    });
  }, [questions, submittedSessions]);

  const sortedByDifficulty = useMemo(() => {
    return [...questionStats]
      .filter(q => q.totalAttempts > 0)
      .sort((a, b) => a.successRate - b.successRate);
  }, [questionStats]);

  const hardestQuestions = sortedByDifficulty.slice(0, 5);
  const easiestQuestions = sortedByDifficulty.slice(-3).reverse();

  // Generate AI-like insight
  const insight = useMemo(() => {
    if (hardestQuestions.length === 0) return null;
    
    const hardest = hardestQuestions[0];
    if (hardest.successRate < 30) {
      return `Students struggled most with Question ${hardest.questionIndex + 1}, with only ${hardest.successRate.toFixed(0)}% answering correctly.`;
    } else if (hardest.successRate < 50) {
      return `Question ${hardest.questionIndex + 1} proved challenging, with a ${hardest.successRate.toFixed(0)}% success rate.`;
    }
    return `Overall performance was good. The most challenging question had a ${hardest.successRate.toFixed(0)}% success rate.`;
  }, [hardestQuestions]);

  if (submittedSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Question Analysis
          </CardTitle>
          <CardDescription>Performance breakdown by question</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No submissions available for analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Insight */}
      {insight && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Performance Insight</p>
                <p className="text-sm text-muted-foreground mt-1">{insight}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hardest Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="h-5 w-5 text-destructive" />
            Most Challenging Questions
          </CardTitle>
          <CardDescription>Questions with lowest success rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hardestQuestions.map((stat) => (
              <div key={stat.questionIndex} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Badge variant="outline" className="mb-1">Q{stat.questionIndex + 1}</Badge>
                    <div className="text-sm line-clamp-2">
                      <LaTeXText>{stat.question}</LaTeXText>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-medium ${stat.successRate < 40 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {stat.successRate.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.correctCount}/{stat.totalAttempts}
                    </p>
                  </div>
                </div>
                <Progress 
                  value={stat.successRate} 
                  className={`h-2 ${stat.successRate < 40 ? '[&>div]:bg-destructive' : ''}`} 
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Questions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Questions Performance</CardTitle>
          <CardDescription>Success rate for each question</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Q#</th>
                  <th className="text-left p-2 font-medium">Question</th>
                  <th className="text-right p-2 font-medium">Correct</th>
                  <th className="text-right p-2 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {questionStats.map((stat) => (
                  <tr key={stat.questionIndex} className="border-b">
                    <td className="p-2 font-medium">{stat.questionIndex + 1}</td>
                    <td className="p-2 max-w-xs">
                      <div className="line-clamp-2">
                        <LaTeXText>{stat.question}</LaTeXText>
                      </div>
                    </td>
                    <td className="p-2 text-right text-muted-foreground">
                      {stat.correctCount}/{stat.totalAttempts}
                    </td>
                    <td className="p-2 text-right">
                      <span className={stat.successRate < 40 ? 'text-destructive font-medium' : ''}>
                        {stat.successRate.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
