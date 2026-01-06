import { forwardRef } from 'react';
import { OrgExam, OrgExamSession } from '@/hooks/useOrgExam';
import { format } from 'date-fns';

interface OfficialExamRecordProps {
  exam: OrgExam;
  session: OrgExamSession;
  organizationName?: string;
}

const getGradeInfo = (score: number, total: number): { grade: string; label: string } => {
  const percentage = (score / total) * 100;
  if (percentage >= 70) return { grade: 'A', label: 'Distinction' };
  if (percentage >= 60) return { grade: 'B', label: 'Credit' };
  if (percentage >= 50) return { grade: 'C', label: 'Credit' };
  if (percentage >= 40) return { grade: 'D', label: 'Pass' };
  return { grade: 'F', label: 'Fail' };
};

const OfficialExamRecord = forwardRef<HTMLDivElement, OfficialExamRecordProps>(
  ({ exam, session, organizationName = 'VenoBot Examination System' }, ref) => {
    const score = session.score || 0;
    const totalQuestions = session.total_questions || exam.question_count;
    const percentage = (score / totalQuestions) * 100;
    const gradeInfo = getGradeInfo(score, totalQuestions);

    return (
      <div ref={ref} className="p-8 bg-white text-black max-w-2xl mx-auto border border-black print:border-2">
        {/* Official Header */}
        <div className="text-center mb-8 border-b-2 border-black pb-6">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
            Official Academic Record
          </p>
          <h1 className="text-2xl font-bold uppercase tracking-wide">
            {organizationName}
          </h1>
          <p className="text-sm mt-2 text-gray-600">
            Examination Performance Record
          </p>
        </div>

        {/* Record Details */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Left Column - Candidate */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm uppercase tracking-wide border-b pb-1">
              Candidate Information
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-gray-500">Full Name</p>
                <p className="font-medium">{session.student_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email Address</p>
                <p className="font-medium text-xs">{session.student_email}</p>
              </div>
              {session.student_id && (
                <div>
                  <p className="text-xs text-gray-500">Student ID</p>
                  <p className="font-medium">{session.student_id}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Exam */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm uppercase tracking-wide border-b pb-1">
              Examination Details
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-gray-500">Examination Title</p>
                <p className="font-medium">{exam.title}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Subject</p>
                <p className="font-medium">{exam.subject}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date of Examination</p>
                <p className="font-medium">
                  {session.submitted_at
                    ? format(new Date(session.submitted_at), 'dd MMMM yyyy')
                    : format(new Date(), 'dd MMMM yyyy')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Section */}
        <div className="border-2 border-black mb-8">
          <div className="bg-gray-100 px-4 py-2 border-b-2 border-black">
            <h3 className="font-bold text-sm uppercase tracking-wide text-center">
              Examination Performance
            </h3>
          </div>
          <div className="p-6">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b">
                  <td className="py-2 text-gray-600">Total Questions</td>
                  <td className="py-2 text-right font-medium">{totalQuestions}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-gray-600">Correct Answers</td>
                  <td className="py-2 text-right font-medium">{score}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-gray-600">Percentage Score</td>
                  <td className="py-2 text-right font-medium">{percentage.toFixed(2)}%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-gray-600">Grade Obtained</td>
                  <td className="py-2 text-right font-bold text-lg">{gradeInfo.grade}</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">Classification</td>
                  <td className="py-2 text-right font-medium">{gradeInfo.label}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Verification Note */}
        <div className="text-center text-xs text-gray-500 mb-6">
          <p>This record is generated electronically and is valid without signature.</p>
          <p>Record ID: {session.id.slice(0, 8).toUpperCase()}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end text-xs text-gray-500 border-t pt-4">
          <div>
            <p>Generated: {format(new Date(), 'dd MMM yyyy, HH:mm')}</p>
          </div>
          <div className="text-right">
            <p>VenoBot Examination System</p>
            <p>Tamper-Protected Record</p>
          </div>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 20mm;
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

OfficialExamRecord.displayName = 'OfficialExamRecord';

export default OfficialExamRecord;
