
import React from 'react';
import { ArrowLeft, StopCircle, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TestHeaderProps {
  testActive: boolean;
  toggleTestStatus: () => Promise<void>;
  deleteTest: () => Promise<void>;
  deleteLoading: boolean;
  setIsDeleteDialogOpen: (value: boolean) => void;
  isDeleteDialogOpen: boolean;
  testId: string;
}

export const TestHeader = ({
  testActive,
  toggleTestStatus,
  deleteTest,
  deleteLoading,
  setIsDeleteDialogOpen,
  isDeleteDialogOpen,
  testId
}: TestHeaderProps) => {
  const navigate = useNavigate();
  const [toggling, setToggling] = React.useState(false);

  const handleToggleStatus = async () => {
    setToggling(true);
    try {
      // Call the parent function to toggle test status
      await toggleTestStatus();
      
      // Show success message
      toast.success(testActive ? 'Test deactivated' : 'Test activated');
    } catch (error) {
      console.error("Error toggling test status:", error);
      toast.error("Failed to update test status");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
      <Button 
        variant="ghost" 
        className="flex items-center gap-2" 
        onClick={() => navigate('/cbt')}
      >
        <ArrowLeft size={16} />
        <span>Back to Tests</span>
      </Button>
      
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant={testActive ? "destructive" : "default"}
          onClick={handleToggleStatus}
          className="flex items-center gap-2"
          disabled={toggling}
        >
          {toggling ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <StopCircle size={16} />
          )}
          {testActive ? 'Deactivate Test' : 'Activate Test'}
        </Button>
        
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="flex items-center gap-2">
              <Trash size={16} />
              Delete Test
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Test</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the test and all associated data. 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={deleteTest}
                disabled={deleteLoading}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleteLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash className="h-4 w-4 mr-2" />
                )}
                {deleteLoading ? 'Deleting...' : 'Delete Test'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
