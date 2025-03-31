
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { VenoLogo } from '@/components/ui/logo';
import { Trophy, HelpCircle, FileText, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  
  // Find participant rank (position) among all participants
  const findRank = () => {
    if (!publicResults || publicResults.length === 0) return "N/A";
    
    // Sort results by score (highest first)
    const sortedResults = [...publicResults].sort((a, b) => 
      (b.score / b.total_questions) - (a.score / a.total_questions)
    );
    
    // Find current user's position
    const userEmail = testTakerInfo?.email || user?.email;
    const position = sortedResults.findIndex(result => result.participant_email === userEmail) + 1;
    
    if (position === 0) return "N/A";
    if (position === 1) return "1st";
    if (position === 2) return "2nd";
    if (position === 3) return "3rd";
    return `${position}th`;
  }
  
  // Enhanced function to download comprehensive results PDF
  const downloadResultsPDF = async () => {
    if (!resultRef.current) return;
    
    toast({
      title: "Preparing Certificate",
      description: "We're generating your results certificate...",
    });
    
    try {
      // Create a new PDF document
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
      pdf.text("Test Results Certificate", 105, 12, { align: 'center' });
      
      // Add participant information
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(16);
      pdf.text(`${testDetails?.title || location?.state?.subject || testId} Quiz`, 105, 30, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.text(`Name: ${testTakerInfo?.name || user?.user_metadata?.full_name || 'Anonymous'}`, 20, 45);
      pdf.text(`Email: ${testTakerInfo?.email || user?.email || 'Not provided'}`, 20, 53);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 61);
      pdf.text(`Time Taken: ${formatTime(timeTaken)}`, 20, 69);
      
      // Add score information
      pdf.setFontSize(14);
      pdf.text(`Score: ${score}/${questions.length} (${percentage}%)`, 20, 85);
      
      const rank = findRank();
      if (rank !== "N/A") {
        pdf.text(`Rank: ${rank} among all participants`, 20, 93);
      }
      
      // Add result message
      let statusColor;
      if (percentage >= 80) {
        statusColor = [0, 128, 0]; // Green
      } else if (percentage >= 60) {
        statusColor = [255, 165, 0]; // Orange
      } else {
        statusColor = [255, 0, 0]; // Red
      }
      
      pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      pdf.setFontSize(16);
      pdf.text(`Status: ${resultMessage}`, 20, 105);
      
      // Reset color for signature
      pdf.setTextColor(0, 0, 0);
      
      // Add signature line
      pdf.setDrawColor(0, 0, 0);
      pdf.line(20, 160, 80, 160);
      pdf.setFontSize(12);
      pdf.text("Examiner's Signature", 20, 170);
      
      // Add certificate border
      pdf.setDrawColor(65, 84, 241);
      pdf.setLineWidth(2);
      pdf.rect(10, 10, pdf.internal.pageSize.getWidth() - 20, pdf.internal.pageSize.getHeight() - 20);
      
      // Add logo at bottom
      pdf.setFontSize(10);
      pdf.text("Veno Education", 105, 250, { align: 'center' });
      pdf.text("Certificate of Achievement", 105, 255, { align: 'center' });
      
      // Save the PDF
      pdf.save(`${testDetails?.title || 'Test'}_Certificate.pdf`);
      
      toast({
        title: "Certificate Ready",
        description: "Your results certificate has been downloaded.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate certificate. Please try again.",
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
            <div className="flex flex-col w-full gap-4">
              <Button 
                variant="default"
                className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
                onClick={downloadResultsPDF}
              >
                <FileText className="h-4 w-4 mr-2" />
                Download Certificate
              </Button>
              
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
