import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  ChevronRight,
  History,
  Download,
  Eye
} from 'lucide-react';
import { useOrgExam, OrgExam } from '@/hooks/useOrgExam';
import { format } from 'date-fns';
import ExamArchiveSearch, { SearchFilters } from '@/components/org-exam/ExamArchiveSearch';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function ExamHistory() {
  const navigate = useNavigate();
  const { exams, loading } = useOrgExam();
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    subject: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  // Get unique subjects from exams
  const subjects = useMemo(() => {
    const subjectSet = new Set(exams.map(e => e.subject));
    return Array.from(subjectSet).sort();
  }, [exams]);

  // Filter exams based on search criteria
  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      // Query filter (title)
      if (filters.query && !exam.title.toLowerCase().includes(filters.query.toLowerCase())) {
        return false;
      }
      
      // Subject filter
      if (filters.subject && exam.subject !== filters.subject) {
        return false;
      }
      
      // Status filter
      if (filters.status && exam.status !== filters.status) {
        return false;
      }
      
      // Date range filter
      if (filters.dateFrom) {
        const examDate = new Date(exam.created_at);
        const fromDate = new Date(filters.dateFrom);
        if (examDate < fromDate) return false;
      }
      
      if (filters.dateTo) {
        const examDate = new Date(exam.created_at);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (examDate > toDate) return false;
      }
      
      return true;
    });
  }, [exams, filters]);

  // Group exams by month/year
  const groupedExams = useMemo(() => {
    const groups: Record<string, OrgExam[]> = {};
    
    filteredExams.forEach(exam => {
      const key = format(new Date(exam.created_at), 'MMMM yyyy');
      if (!groups[key]) groups[key] = [];
      groups[key].push(exam);
    });
    
    return groups;
  }, [filteredExams]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/org-exam')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <History className="h-6 w-6" />
              Examination History
            </h1>
            <p className="text-sm text-muted-foreground">
              View and manage past examinations
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-6">
          <ExamArchiveSearch 
            onSearch={setFilters} 
            subjects={subjects}
          />
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredExams.length} of {exams.length} examinations
        </div>

        {/* Exam List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredExams.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No examinations found</h3>
              <p className="text-muted-foreground mb-4">
                {exams.length === 0 
                  ? 'Create your first examination to get started'
                  : 'Try adjusting your search filters'}
              </p>
              {exams.length === 0 && (
                <Button onClick={() => navigate('/org-exam/create')}>
                  Create Exam
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedExams).map(([monthYear, monthExams]) => (
              <div key={monthYear}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  {monthYear}
                </h3>
                <div className="space-y-3">
                  {monthExams.map((exam) => (
                    <Card 
                      key={exam.id} 
                      className="hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/org-exam/manage/${exam.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="font-medium truncate">{exam.title}</h4>
                              <Badge className={statusColors[exam.status]}>
                                {exam.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                              <span>{exam.subject}</span>
                              <span>•</span>
                              <span>{exam.question_count} questions</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {exam.time_limit}m
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Created {format(new Date(exam.created_at), 'PPP')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/org-exam/manage/${exam.id}`);
                              }}
                            >
                              <Eye className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
