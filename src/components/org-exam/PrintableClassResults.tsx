import { forwardRef } from 'react';
import { OrgExam, OrgExamSession } from '@/hooks/useOrgExam';
import { format } from 'date-fns';

interface PrintableClassResultsProps {
  exam: OrgExam;
  sessions: OrgExamSession[];
}

const getGrade = (score: number, total: number): string => {
  const percentage = (score / total) * 100;
  if (percentage >= 70) return 'A';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

const PrintableClassResults = forwardRef<HTMLDivElement, PrintableClassResultsProps>(
  ({ exam, sessions }, ref) => {
    const submittedSessions = sessions
      .filter(s => s.status === 'submitted')
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    const totalQuestions = exam.question_count;

    return (
      <div ref={ref} className="p-8 bg-white text-black min-h-screen print:p-4">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wide">
            Examination Results Sheet
          </h1>
          <p className="text-lg mt-2">{exam.title}</p>
        </div>

        {/* Exam Info */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p><strong>Subject:</strong> {exam.subject}</p>
            <p><strong>Academic Level:</strong> {exam.academic_level?.replace('_', ' ').toUpperCase()}</p>
            <p><strong>Duration:</strong> {exam.time_limit} minutes</p>
          </div>
          <div className="text-right">
            <p><strong>Total Questions:</strong> {totalQuestions}</p>
            <p><strong>Date:</strong> {format(new Date(), 'dd MMMM yyyy')}</p>
            <p><strong>Total Candidates:</strong> {submittedSessions.length}</p>
          </div>
        </div>

        {/* Results Table */}
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 text-left w-12">S/N</th>
              <th className="border border-black p-2 text-left">Student Name</th>
              <th className="border border-black p-2 text-left">Registration No.</th>
              <th className="border border-black p-2 text-center w-24">Score</th>
              <th className="border border-black p-2 text-center w-20">%</th>
              <th className="border border-black p-2 text-center w-16">Grade</th>
            </tr>
          </thead>
          <tbody>
            {submittedSessions.map((session, idx) => {
              const score = session.score || 0;
              const percentage = (score / totalQuestions) * 100;
              const grade = getGrade(score, totalQuestions);

              return (
                <tr key={session.id}>
                  <td className="border border-black p-2">{idx + 1}</td>
                  <td className="border border-black p-2">{session.student_name}</td>
                  <td className="border border-black p-2">{session.student_id || session.student_email}</td>
                  <td className="border border-black p-2 text-center">{score}/{totalQuestions}</td>
                  <td className="border border-black p-2 text-center">{percentage.toFixed(1)}%</td>
                  <td className="border border-black p-2 text-center font-bold">{grade}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-sm border-t border-black pt-4">
          <div>
            <p><strong>Pass Rate:</strong> {
              submittedSessions.length > 0 
                ? ((submittedSessions.filter(s => getGrade(s.score || 0, totalQuestions) !== 'F').length / submittedSessions.length) * 100).toFixed(1)
                : 0
            }%</p>
          </div>
          <div className="text-center">
            <p><strong>Class Average:</strong> {
              submittedSessions.length > 0
                ? (submittedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / submittedSessions.length).toFixed(1)
                : 0
            }</p>
          </div>
          <div className="text-right">
            <p><strong>Highest Score:</strong> {
              submittedSessions.length > 0
                ? Math.max(...submittedSessions.map(s => s.score || 0))
                : 0
            }</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-black text-xs text-center text-gray-600">
          <p>Generated via VenoBot • {format(new Date(), 'dd MMMM yyyy, HH:mm')}</p>
          <p className="mt-1">This is an official examination record</p>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        `}</style>
      </div>
    );
  }
);

PrintableClassResults.displayName = 'PrintableClassResults';

export default PrintableClassResults;
