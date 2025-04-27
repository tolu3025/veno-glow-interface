
import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TestAttempt {
  id: string;
  participant_name: string;
  participant_email: string;
  score: number;
  total_questions: number;
  completed_at: string;
  disqualified?: boolean;
}

interface ParticipantsListProps {
  testAttempts: TestAttempt[];
  downloadParticipantPDF: (attempt: TestAttempt) => Promise<void>;
  disqualifyParticipant: (id: string) => Promise<void>;
  reinstateParticipant: (id: string) => Promise<void>;
  disqualifying: string | null;
  refreshing: boolean;
  refreshData: () => Promise<void>;
}

export const ParticipantsList = ({
  testAttempts,
  downloadParticipantPDF,
  disqualifyParticipant,
  reinstateParticipant,
  disqualifying,
  refreshing,
  refreshData
}: ParticipantsListProps) => {
  return (
    <>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold">Participants ({testAttempts.length})</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={refreshData}
          disabled={refreshing}
          className="flex items-center gap-1"
        >
          {refreshing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          Refresh
        </Button>
      </div>
      
      {testAttempts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-4">
              No one has taken this test yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testAttempts.map((attempt) => (
                  <TableRow 
                    key={attempt.id} 
                    className={attempt.disqualified ? "bg-destructive/10" : ""}
                  >
                    <TableCell className="font-medium">
                      {attempt.participant_name || 'Anonymous'}
                    </TableCell>
                    <TableCell>{attempt.participant_email || 'N/A'}</TableCell>
                    <TableCell className="text-center">
                      <div className="font-medium">
                        {attempt.score}/{attempt.total_questions}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round((attempt.score / attempt.total_questions) * 100)}%
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col md:flex-row gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadParticipantPDF(attempt)}
                          className="text-blue-600"
                        >
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Download PDF
                        </Button>
                        
                        {attempt.disqualified ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                Reinstate
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reinstate Participant</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will reinstate the participant's results. Are you sure?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => reinstateParticipant(attempt.id)}
                                >
                                  Reinstate
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                {disqualifying === attempt.id ? 
                                  <Loader2 className="h-4 w-4 animate-spin" /> : 
                                  'Disqualify'
                                }
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Disqualify Participant</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will mark the participant's results as disqualified. Are you sure?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => disqualifyParticipant(attempt.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Disqualify
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
};
