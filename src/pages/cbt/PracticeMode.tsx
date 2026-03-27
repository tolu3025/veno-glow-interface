import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import QuizSection from '@/components/cbt/QuizSection';

const PracticeMode = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cbt')}>
            <ArrowLeft size={18} />
          </Button>
          <span className="font-semibold text-lg">Practice Mode</span>
          <div className="w-9" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <QuizSection />
      </div>
    </div>
  );
};

export default PracticeMode;
