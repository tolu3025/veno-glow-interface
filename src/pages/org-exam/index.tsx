import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  FileText, 
  Users, 
  BarChart3, 
  Clock, 
  ChevronRight,
  GraduationCap,
  RefreshCw
} from 'lucide-react';
import { useOrgExam, OrgExam } from '@/hooks/useOrgExam';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function OrgExamDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { exams, loading, fetchExams } = useOrgExam();
  const [stats, setStats] = useState({
    totalExams: 0,
    activeExams: 0,
    totalParticipants: 0,
    completedExams: 0,
  });

  useEffect(() => {
    if (exams.length > 0) {
      setStats({
        totalExams: exams.length,
        activeExams: exams.filter(e => e.status === 'active' || e.status === 'scheduled').length,
        completedExams: exams.filter(e => e.status === 'completed').length,
        totalParticipants: 0, // Would need to aggregate from sessions
      });
    }
  }, [exams]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="truncate">Organization Exams</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Create and manage formal examinations
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Button variant="outline" size="sm" onClick={() => fetchExams()}>
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button size="sm" onClick={() => navigate('/org-exam/create')}>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Create Exam</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <Card className="p-3 sm:p-0">
            <CardHeader className="hidden sm:flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="sm:pt-0 p-0 sm:p-6">
              <div className="flex sm:block items-center justify-between">
                <span className="text-sm text-muted-foreground sm:hidden">Total</span>
                <div className="text-xl sm:text-2xl font-bold">{stats.totalExams}</div>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">All examinations</p>
            </CardContent>
          </Card>

          <Card className="p-3 sm:p-0">
            <CardHeader className="hidden sm:flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="sm:pt-0 p-0 sm:p-6">
              <div className="flex sm:block items-center justify-between">
                <span className="text-sm text-muted-foreground sm:hidden">Active</span>
                <div className="text-xl sm:text-2xl font-bold">{stats.activeExams}</div>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">Currently active</p>
            </CardContent>
          </Card>

          <Card className="p-3 sm:p-0">
            <CardHeader className="hidden sm:flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="sm:pt-0 p-0 sm:p-6">
              <div className="flex sm:block items-center justify-between">
                <span className="text-sm text-muted-foreground sm:hidden">Done</span>
                <div className="text-xl sm:text-2xl font-bold">{stats.completedExams}</div>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">Finished exams</p>
            </CardContent>
          </Card>

          <Card className="p-3 sm:p-0">
            <CardHeader className="hidden sm:flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="sm:pt-0 p-0 sm:p-6">
              <div className="flex sm:block items-center justify-between">
                <span className="text-sm text-muted-foreground sm:hidden">Students</span>
                <div className="text-xl sm:text-2xl font-bold">{stats.totalParticipants}</div>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">Total examined</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Exams */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Examinations</CardTitle>
            <CardDescription>
              Your most recently created exams
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : exams.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No examinations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first examination to get started
                </p>
                <Button onClick={() => navigate('/org-exam/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Exam
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {exams.slice(0, 10).map((exam) => (
                  <ExamListItem 
                    key={exam.id} 
                    exam={exam} 
                    onClick={() => navigate(`/org-exam/manage/${exam.id}`)} 
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ExamListItem({ exam, onClick }: { exam: OrgExam; onClick: () => void }) {
  return (
    <div 
      className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors gap-2"
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-medium text-sm sm:text-base truncate">{exam.title}</h4>
          <Badge className={`${statusColors[exam.status] || ''} text-xs`}>
            {exam.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 mt-1 text-xs sm:text-sm text-muted-foreground flex-wrap">
          <span className="truncate">{exam.subject}</span>
          <span className="hidden sm:inline">•</span>
          <span>{exam.question_count}Q</span>
          <span>•</span>
          <span>{exam.time_limit}m</span>
          {exam.access_code && (
            <>
              <span className="hidden sm:inline">•</span>
              <span className="font-mono text-xs bg-muted px-1.5 sm:px-2 py-0.5 rounded hidden sm:inline">
                {exam.access_code}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <span className="text-xs sm:text-sm text-muted-foreground hidden md:block">
          {format(new Date(exam.created_at), 'MMM d, yyyy')}
        </span>
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
      </div>
    </div>
  );
}
