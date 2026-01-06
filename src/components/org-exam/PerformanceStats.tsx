import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrgExamSession } from '@/hooks/useOrgExam';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Award, Target, AlertTriangle } from 'lucide-react';

interface PerformanceStatsProps {
  sessions: OrgExamSession[];
  totalQuestions: number;
}

const GRADE_COLORS = {
  A: '#22c55e',
  B: '#84cc16',
  C: '#eab308',
  D: '#f97316',
  F: '#ef4444',
};

const getGrade = (percentage: number): string => {
  if (percentage >= 70) return 'A';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

export default function PerformanceStats({ sessions, totalQuestions }: PerformanceStatsProps) {
  const submittedSessions = sessions.filter(s => s.status === 'submitted' && s.score !== null);

  const stats = useMemo(() => {
    if (submittedSessions.length === 0) return null;

    const scores = submittedSessions.map(s => s.score || 0);
    const total = scores.reduce((sum, s) => sum + s, 0);
    const mean = total / scores.length;
    
    // Sort for median
    const sorted = [...scores].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    
    // Mode
    const frequency: Record<number, number> = {};
    scores.forEach(s => { frequency[s] = (frequency[s] || 0) + 1; });
    const maxFreq = Math.max(...Object.values(frequency));
    const mode = Number(Object.keys(frequency).find(k => frequency[Number(k)] === maxFreq));
    
    // Standard deviation
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    
    // Pass rate (40% and above)
    const passCount = submittedSessions.filter(s => {
      const pct = ((s.score || 0) / totalQuestions) * 100;
      return pct >= 40;
    }).length;
    const passRate = (passCount / submittedSessions.length) * 100;

    return { mean, median, mode, stdDev, highest, lowest, passRate, passCount };
  }, [submittedSessions, totalQuestions]);

  const gradeDistribution = useMemo(() => {
    const distribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    
    submittedSessions.forEach(s => {
      const pct = ((s.score || 0) / totalQuestions) * 100;
      const grade = getGrade(pct);
      distribution[grade]++;
    });

    return Object.entries(distribution).map(([grade, count]) => ({
      grade,
      count,
      color: GRADE_COLORS[grade as keyof typeof GRADE_COLORS],
    }));
  }, [submittedSessions, totalQuestions]);

  const scoreDistribution = useMemo(() => {
    // Create ranges: 0-10, 11-20, 21-30, etc.
    const ranges: Record<string, number> = {};
    const step = Math.max(1, Math.ceil(totalQuestions / 10));
    
    for (let i = 0; i <= totalQuestions; i += step) {
      const label = `${i}-${Math.min(i + step - 1, totalQuestions)}`;
      ranges[label] = 0;
    }

    submittedSessions.forEach(s => {
      const score = s.score || 0;
      for (let i = 0; i <= totalQuestions; i += step) {
        if (score >= i && score <= Math.min(i + step - 1, totalQuestions)) {
          const label = `${i}-${Math.min(i + step - 1, totalQuestions)}`;
          ranges[label]++;
          break;
        }
      }
    });

    return Object.entries(ranges).map(([range, count]) => ({ range, count }));
  }, [submittedSessions, totalQuestions]);

  if (submittedSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Statistics</CardTitle>
          <CardDescription>Detailed analytics for this examination</CardDescription>
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
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Class Average</p>
                <p className="text-2xl font-bold">{stats?.mean.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">
                  ({((stats?.mean || 0) / totalQuestions * 100).toFixed(0)}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Award className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Highest Score</p>
                <p className="text-2xl font-bold">{stats?.highest}</p>
                <p className="text-xs text-muted-foreground">
                  ({((stats?.highest || 0) / totalQuestions * 100).toFixed(0)}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Target className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lowest Score</p>
                <p className="text-2xl font-bold">{stats?.lowest}</p>
                <p className="text-xs text-muted-foreground">
                  ({((stats?.lowest || 0) / totalQuestions * 100).toFixed(0)}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pass Rate</p>
                <p className="text-2xl font-bold">{stats?.passRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">
                  ({stats?.passCount}/{submittedSessions.length} passed)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistical Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Statistical Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Mean</p>
              <p className="text-xl font-bold">{stats?.mean.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Median</p>
              <p className="text-xl font-bold">{stats?.median.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Mode</p>
              <p className="text-xl font-bold">{stats?.mode}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Std. Dev</p>
              <p className="text-xl font-bold">{stats?.stdDev.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Grade Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Grade Distribution</CardTitle>
            <CardDescription>Breakdown by grade category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistribution.filter(d => d.count > 0)}
                    dataKey="count"
                    nameKey="grade"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ grade, count }) => `${grade}: ${count}`}
                  >
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {gradeDistribution.map((d) => (
                <Badge 
                  key={d.grade} 
                  variant="outline" 
                  className="gap-1"
                  style={{ borderColor: d.color, color: d.color }}
                >
                  {d.grade}: {d.count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Score Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score Distribution</CardTitle>
            <CardDescription>Number of students per score range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution}>
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
