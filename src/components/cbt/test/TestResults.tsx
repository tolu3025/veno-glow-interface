
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { VenoLogo } from '@/components/ui/logo';
import { Trophy, HelpCircle, FileText, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useReactToPrint } from 'react-to-print';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from '@/hooks/use-toast';

interface TestResultsProps {
  score: number;
  questions: any[];
  testDetails: any;
  timeRemaining: number;
  location: any;
  testId: string;
  publicResults: any[];
  testTakerInfo: any;
  user: any;
  onReviewAnswers: () => void;
  onFinish: () => void;
  onTryAgain: () => void;
  formatTime: (seconds: number) => string;
}

const TestResults: React.FC<TestResultsProps> = ({
  score,
  questions,
  testDetails,
  timeRemaining,
  location,
  testId,
  publicResults,
  testTakerInfo,
  user,
  onReviewAnswers,
  onFinish,
  onTryAgain,
  formatTime,
}) => {
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  let resultMessage = "Good effort!";
  let resultClass = "text-amber-500";
  
  if (percentage >= 80) {
    resultMessage = "Excellent work!";
    resultClass = "text-green-500";
  } else if (percentage < 50) {
    resultMessage = "Keep practicing!";
    resultClass = "text-rose-500";
  }

  const timeLimit = testDetails?.time_limit || location?.state?.settings?.timeLimit || 15;
  const timeTaken = timeLimit * 60 - timeRemaining;
  const timeEfficiency = Math.round((timeTaken / (timeLimit * 60)) * 100);
  
  const resultRef = useRef<HTMLDivElement>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  // Function to print the certificate
  const handlePrint = useReactToPrint({
    content: () => certificateRef.current,
    documentTitle: `Certificate - ${testDetails?.title || 'Test'} Result`,
    removeAfterPrint: true,
    pageStyle: `
      @page { 
        size: letter landscape; 
        margin: 0.5cm; 
      }
      @media print {
        body, html { 
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          background-color: white;
        }
        * {
          color-adjust: exact !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `,
  });
  
  // Function to download detailed results as PDF
  const downloadDetailedResultsPDF = async () => {
    if (!resultRef.current) return;
    
    toast({
      title: "Preparing PDF",
      description: "Please wait while we generate your results...",
    });
    
    try {
      const canvas = await html2canvas(resultRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      // Add header
      pdf.setFillColor(65, 84, 241);
      pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.text("Test Results Summary", 105, 12, { align: 'center' });
      
      // Add participant information
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.text(`Participant: ${testTakerInfo?.name || user?.user_metadata?.full_name || 'Anonymous'}`, 14, 30);
      pdf.text(`Email: ${testTakerInfo?.email || user?.email || 'Not provided'}`, 14, 38);
      pdf.text(`Test: ${testDetails?.title || location?.state?.subject || testId || 'Assessment'}`, 14, 46);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, 14, 54);
      pdf.text(`Score: ${score}/${questions.length} (${percentage}%)`, 14, 62);
      pdf.text(`Time taken: ${formatTime(timeTaken)}`, 14, 70);
      
      // Add horizontal line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(14, 74, 196, 74);
      
      // Add results image
      const imgWidth = pdf.internal.pageSize.getWidth() - 28; // 14mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 14, 80, imgWidth, imgHeight);
      
      // Add signature line at the bottom
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.line(14, pageHeight - 30, 70, pageHeight - 30);
      pdf.text("Examiner's Signature", 14, pageHeight - 24);
      
      pdf.save(`${testDetails?.title || 'Test'}_Results.pdf`);
      
      toast({
        title: "PDF Downloaded",
        description: "Your detailed results have been saved as a PDF",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div ref={resultRef}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <VenoLogo className="h-6 w-6" />
              <CardTitle>Quiz Results</CardTitle>
            </div>
            <CardDescription>
              {testDetails?.title || location?.state?.subject || testId} Quiz
            </CardDescription>
          </CardHeader>
          <CardContent className="py-6">
            <div className="text-center mb-8">
              <Trophy className="mx-auto h-12 w-12 text-veno-primary mb-4" />
              <h2 className="text-3xl font-bold mb-2">{percentage}%</h2>
              <p className={`text-lg font-medium ${resultClass} mb-2`}>
                {resultMessage}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                You answered {score} out of {questions.length} questions correctly
              </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 mb-8">
              <div className="bg-secondary/30 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Quiz Statistics</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Score:</span>
                    <span className="font-medium">{score}/{questions.length}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Percentage:</span>
                    <span className="font-medium">{percentage}%</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Correct answers:</span>
                    <span className="font-medium text-green-600">{score}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Wrong answers:</span>
                    <span className="font-medium text-red-600">{questions.length - score}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Time taken:</span>
                    <span className="font-medium">
                      {formatTime(timeTaken)}
                    </span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-secondary/30 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Performance Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Accuracy</span>
                      <span>{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Time Efficiency</span>
                      <span>{timeEfficiency}%</span>
                    </div>
                    <Progress value={timeEfficiency} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
            
            {testDetails?.results_visibility === 'public' && publicResults.length > 0 && (
              <div className="bg-secondary/30 p-4 rounded-lg mb-6">
                <h3 className="font-medium mb-3">Leaderboard</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead className="text-right">Time (min)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {publicResults.map((result, index) => (
                        <TableRow key={result.id} className={
                          (result.participant_email === (testTakerInfo?.email || user?.email)) 
                            ? "bg-veno-primary/10" 
                            : ""
                        }>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            {result.participant_name || "Anonymous"}
                            {(result.participant_email === (testTakerInfo?.email || user?.email)) && 
                              " (You)"}
                          </TableCell>
                          <TableCell className="text-right">
                            {result.score}/{result.total_questions}
                          </TableCell>
                          <TableCell className="text-right">
                            {Math.floor(result.time_taken / 60)}:{(result.time_taken % 60).toString().padStart(2, '0')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            
            <div className="bg-secondary/30 p-4 rounded-lg text-center">
              <h3 className="font-medium mb-2">Review Your Answers</h3>
              <p className="text-sm text-muted-foreground mb-2">
                See all questions, your answers, and the correct answers
              </p>
              <Button 
                onClick={onReviewAnswers}
                variant="outline" 
                className="text-veno-primary border-veno-primary/30"
              >
                <HelpCircle className="h-4 w-4 mr-2" /> 
                View Detailed Review
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={onFinish}>
                Back to Tests
              </Button>
              {(testDetails?.allow_retakes || testId === 'subject') && (
                <Button 
                  className="flex-1 bg-veno-primary hover:bg-veno-primary/90" 
                  onClick={onTryAgain}
                >
                  Try Again
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button 
                variant="outline" 
                className="flex items-center justify-center" 
                onClick={handlePrint}
              >
                <FileText className="h-4 w-4 mr-2" />
                Print Certificate
              </Button>
              
              <Button 
                variant="default"
                className="flex items-center justify-center bg-blue-600 hover:bg-blue-700"
                onClick={downloadDetailedResultsPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Results
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="hidden">
        <div ref={certificateRef} className="certificate-container p-8 bg-white">
          <div className="max-w-4xl mx-auto border-8 border-double border-blue-600 p-8 text-center">
            <h1 className="text-3xl font-bold text-blue-800 mb-2">Certificate of Completion</h1>
            <div className="text-lg mb-6">This certifies that</div>
            <h2 className="text-2xl font-bold mb-6">{testTakerInfo?.name || user?.user_metadata?.full_name || 'Anonymous'}</h2>
            <div className="text-lg mb-2">has successfully completed</div>
            <h3 className="text-xl font-bold mb-6">{testDetails?.title || location?.state?.subject || testId}</h3>
            <div className="mb-6">
              <span className="text-lg font-semibold">Score: {score}/{questions.length} ({percentage}%)</span>
            </div>
            <div className="text-sm mb-8">
              Date: {new Date().toLocaleDateString()}
            </div>
            <div className="flex justify-between items-end mt-12 pt-8">
              <div className="text-center border-t border-gray-300 inline-block px-8">
                <p className="text-sm pt-1">Examiner's Signature</p>
              </div>
              <div className="flex items-center">
                <VenoLogo className="h-12 w-12 mr-2" />
                <span className="text-xl font-bold">Veno Education</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResults;
