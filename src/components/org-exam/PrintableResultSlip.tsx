import { forwardRef } from 'react';
import { OrgExam, OrgExamSession } from '@/hooks/useOrgExam';
import { format } from 'date-fns';

interface PrintableResultSlipProps {
  exam: OrgExam;
  session: OrgExamSession;
}

const getGradeInfo = (score: number, total: number): { grade: string; label: string } => {
  const percentage = (score / total) * 100;
  if (percentage >= 70) return { grade: 'A', label: 'Distinction' };
  if (percentage >= 60) return { grade: 'B', label: 'Credit' };
  if (percentage >= 50) return { grade: 'C', label: 'Credit' };
  if (percentage >= 40) return { grade: 'D', label: 'Pass' };
  return { grade: 'F', label: 'Fail' };
};

const PrintableResultSlip = forwardRef<HTMLDivElement, PrintableResultSlipProps>(
  ({ exam, session }, ref) => {
    const score = session.score || 0;
    const totalQuestions = session.total_questions || exam.question_count;
    const percentage = (score / totalQuestions) * 100;
    const gradeInfo = getGradeInfo(score, totalQuestions);

    return (
      <div ref={ref} className="p-8 bg-white text-black max-w-md mx-auto print:p-6">
        {/* Header */}
        <div className="text-center mb-6 border-b-2 border-black pb-4">
          <h1 className="text-xl font-bold uppercase tracking-wide">
            Examination Result Slip
          </h1>
          <p className="text-sm mt-1 text-gray-600">Official Academic Record</p>
        </div>

        {/* Candidate Information */}
        <div className="mb-6 space-y-2 text-sm">
          <div className="flex justify-between border-b border-gray-300 pb-1">
            <span className="text-gray-600">Candidate Name:</span>
            <span className="font-medium">{session.student_name}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 pb-1">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium text-xs">{session.student_email}</span>
          </div>
          {session.student_id && (
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="text-gray-600">Student ID:</span>
              <span className="font-medium">{session.student_id}</span>
            </div>
          )}
        </div>

        {/* Exam Information */}
        <div className="mb-6 space-y-2 text-sm">
          <div className="flex justify-between border-b border-gray-300 pb-1">
            <span className="text-gray-600">Examination:</span>
            <span className="font-medium text-right max-w-[200px]">{exam.title}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 pb-1">
            <span className="text-gray-600">Subject:</span>
            <span className="font-medium">{exam.subject}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 pb-1">
            <span className="text-gray-600">Date Conducted:</span>
            <span className="font-medium">
              {session.submitted_at 
                ? format(new Date(session.submitted_at), 'dd MMMM yyyy')
                : format(new Date(), 'dd MMMM yyyy')}
            </span>
          </div>
        </div>

        {/* Score Box */}
        <div className="border-2 border-black p-4 mb-6 text-center">
          <p className="text-sm text-gray-600 mb-2">RESULT</p>
          <div className="flex justify-center items-center gap-6">
            <div>
              <p className="text-3xl font-bold">{score}/{totalQuestions}</p>
              <p className="text-sm text-gray-600">Score</p>
            </div>
            <div className="h-12 w-px bg-black"></div>
            <div>
              <p className="text-3xl font-bold">{percentage.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Percentage</p>
            </div>
            <div className="h-12 w-px bg-black"></div>
            <div>
              <p className="text-3xl font-bold">{gradeInfo.grade}</p>
              <p className="text-sm text-gray-600">{gradeInfo.label}</p>
            </div>
          </div>
        </div>

        {/* Time Information */}
        {session.time_taken && (
          <div className="text-sm text-center mb-6">
            <span className="text-gray-600">Time Taken: </span>
            <span className="font-medium">
              {Math.floor(session.time_taken / 60)}m {session.time_taken % 60}s
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-black text-xs text-center text-gray-600">
          <p>Generated via VenoBot</p>
          <p className="mt-1">{format(new Date(), 'dd MMMM yyyy, HH:mm')}</p>
          <p className="mt-2 italic">This is an official academic record</p>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            @page {
              size: A5;
              margin: 10mm;
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

PrintableResultSlip.displayName = 'PrintableResultSlip';

export default PrintableResultSlip;
