
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Info } from "lucide-react";

interface InstructionPopupProps {
  id: string;
  title: string;
  description: React.ReactNode;
  actionText?: string;
  actionUrl?: string;
}

export function InstructionPopup({ id, title, description, actionText, actionUrl }: InstructionPopupProps) {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  
  useEffect(() => {
    // Check if this popup has been dismissed before
    const hasBeenShown = localStorage.getItem(`popup-${id}-dismissed`);
    
    if (!hasBeenShown) {
      // Wait a bit before showing the popup for better UX
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [id]);
  
  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(`popup-${id}-dismissed`, 'true');
    }
    setOpen(false);
  };
  
  const handleAction = () => {
    if (dontShowAgain) {
      localStorage.setItem(`popup-${id}-dismissed`, 'true');
    }
    if (actionUrl) {
      window.location.href = actionUrl;
    }
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" /> 
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 py-4">
          <Checkbox 
            id="dontShowAgain" 
            checked={dontShowAgain} 
            onCheckedChange={(checked) => setDontShowAgain(checked === true)}
          />
          <label
            htmlFor="dontShowAgain"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Don't show this again
          </label>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={handleClose}>
            Dismiss
          </Button>
          {actionText && actionUrl && (
            <Button onClick={handleAction}>
              {actionText}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
