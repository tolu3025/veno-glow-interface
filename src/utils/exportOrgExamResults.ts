import { OrgExam, OrgExamSession } from '@/hooks/useOrgExam';
import { format } from 'date-fns';

const getGrade = (score: number, total: number): string => {
  const percentage = (score / total) * 100;
  if (percentage >= 70) return 'A';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

const getGradeLabel = (score: number, total: number): string => {
  const percentage = (score / total) * 100;
  if (percentage >= 70) return 'Distinction';
  if (percentage >= 60) return 'Credit';
  if (percentage >= 50) return 'Credit';
  if (percentage >= 40) return 'Pass';
  return 'Fail';
};

export function exportResultsToCSV(exam: OrgExam, sessions: OrgExamSession[]): void {
  const totalQuestions = exam.question_count;
  
  // Filter to submitted sessions only
  const submittedSessions = sessions.filter(s => s.status === 'submitted');
  
  if (submittedSessions.length === 0) {
    throw new Error('No submitted results to export');
  }

  // CSV Headers
  const headers = [
    'S/N',
    'Student Name',
    'Email',
    'Student ID',
    'Score',
    'Total Questions',
    'Percentage',
    'Grade',
    'Classification',
    'Time Taken (seconds)',
    'Submitted At',
    'Status',
  ];

  // Sort by score descending
  const sortedSessions = [...submittedSessions].sort((a, b) => (b.score || 0) - (a.score || 0));

  // CSV Rows
  const rows = sortedSessions.map((session, idx) => {
    const score = session.score || 0;
    const percentage = ((score / totalQuestions) * 100).toFixed(2);
    const grade = getGrade(score, totalQuestions);
    const classification = getGradeLabel(score, totalQuestions);

    return [
      idx + 1,
      `"${session.student_name}"`,
      session.student_email,
      session.student_id || '-',
      score,
      totalQuestions,
      `${percentage}%`,
      grade,
      classification,
      session.time_taken || '-',
      session.submitted_at ? format(new Date(session.submitted_at), 'yyyy-MM-dd HH:mm:ss') : '-',
      session.status,
    ];
  });

  // Build CSV content
  const csvContent = [
    // Metadata
    `# Examination Results Export`,
    `# Exam Title: ${exam.title}`,
    `# Subject: ${exam.subject}`,
    `# Total Questions: ${totalQuestions}`,
    `# Export Date: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`,
    `# Total Candidates: ${submittedSessions.length}`,
    '',
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const filename = `${exam.title.replace(/[^a-z0-9]/gi, '_')}_results_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateResultsSummary(exam: OrgExam, sessions: OrgExamSession[]): {
  totalSubmissions: number;
  passRate: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  gradeDistribution: Record<string, number>;
} {
  const totalQuestions = exam.question_count;
  const submittedSessions = sessions.filter(s => s.status === 'submitted' && s.score !== null);
  
  if (submittedSessions.length === 0) {
    return {
      totalSubmissions: 0,
      passRate: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
    };
  }

  const scores = submittedSessions.map(s => s.score || 0);
  const total = scores.reduce((sum, s) => sum + s, 0);
  
  const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  let passCount = 0;

  submittedSessions.forEach(s => {
    const score = s.score || 0;
    const grade = getGrade(score, totalQuestions);
    gradeDistribution[grade]++;
    if (grade !== 'F') passCount++;
  });

  return {
    totalSubmissions: submittedSessions.length,
    passRate: (passCount / submittedSessions.length) * 100,
    averageScore: total / submittedSessions.length,
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
    gradeDistribution,
  };
}
