import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GraduationCap, FileText, Sparkles, ArrowRight, X } from 'lucide-react';

const POPUP_SHOWN_KEY = 'course-material-feature-popup-shown';
const POPUP_SHOWN_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CourseMaterialFeaturePopupProps {
  onClose?: () => void;
}

export const CourseMaterialFeaturePopup: React.FC<CourseMaterialFeaturePopupProps> = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if popup was shown recently
    const shownAt = localStorage.getItem(POPUP_SHOWN_KEY);
    if (shownAt) {
      const shownTime = parseInt(shownAt, 10);
      if (Date.now() - shownTime < POPUP_SHOWN_DURATION) {
        console.log('CourseMaterialFeaturePopup: Already shown recently, skipping');
        return;
      }
    }

    // Show popup after a short delay
    console.log('CourseMaterialFeaturePopup: Will show in 2 seconds');
    const timer = setTimeout(() => {
      console.log('CourseMaterialFeaturePopup: Opening now');
      setIsOpen(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(POPUP_SHOWN_KEY, Date.now().toString());
    onClose?.();
  };

  const handleTryNow = () => {
    handleClose();
    navigate('/cbt/course-material-test');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0">
        <div className="relative">
          {/* Gradient Header */}
          <div className="bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-6 text-white">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white/80 hover:text-white hover:bg-white/20"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="flex justify-center mb-4"
            >
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <GraduationCap className="h-8 w-8" />
              </div>
            </motion.div>
            
            <DialogHeader className="text-center space-y-2">
              <DialogTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" />
                New Feature Alert!
              </DialogTitle>
              <DialogDescription className="text-white/90">
                Generate exam questions from your class PDFs
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <FileText className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Upload Your Documents</p>
                  <p className="text-xs text-muted-foreground">
                    Share PDFs, DOCX, or PPT files from WhatsApp, Telegram, or your device
                  </p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">AI-Generated Questions</p>
                  <p className="text-xs text-muted-foreground">
                    Get 20 exam-style questions: MCQs, short answers, and essays
                  </p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Nigerian Academic Style</p>
                  <p className="text-xs text-muted-foreground">
                    Questions follow WAEC, JAMB, and University standards
                  </p>
                </div>
              </motion.div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button className="flex-1 gap-2" onClick={handleTryNow}>
                Try It Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseMaterialFeaturePopup;
