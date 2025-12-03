import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, BookOpen, ArrowLeft, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VenoLogo } from '@/components/ui/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

const NoQuestionsState: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isPublicAccess = location.pathname.startsWith('/test/');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border-amber-200 dark:border-amber-800/50">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-10 w-10 text-amber-500" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <VenoLogo className="h-5 w-5" />
              <CardTitle>No Questions Available</CardTitle>
            </div>
            <CardDescription>
              This test doesn't have any questions yet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 mt-0.5 text-amber-500 shrink-0" />
                <div>
                  {isPublicAccess ? (
                    <p>The test creator hasn't added any questions to this test yet. Please contact them or try again later.</p>
                  ) : (
                    <p>You need to add questions to your test before it can be taken. Go to the test management page to add questions.</p>
                  )}
                </div>
              </div>
            </div>
            
            {!isPublicAccess && (
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-sm border border-blue-200 dark:border-blue-800/50">
                <p className="text-blue-700 dark:text-blue-400 font-medium mb-2">How to add questions:</p>
                <ol className="text-blue-600 dark:text-blue-300 space-y-1 text-xs list-decimal list-inside">
                  <li>Go to "My Tests" section</li>
                  <li>Click on your test to manage it</li>
                  <li>Use "Add Question" to create questions</li>
                  <li>Share the test link after adding questions</li>
                </ol>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate('/cbt')} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tests
              </Button>
              
              {!isPublicAccess && (
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/cbt')}
                  className="w-full"
                >
                  <PenLine className="h-4 w-4 mr-2" />
                  Manage My Tests
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default NoQuestionsState;
