import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, Gamepad2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  {
    icon: BookOpen,
    gradient: "from-primary to-primary/80",
    title: "Practice CBT Tests",
    description: "Access thousands of questions across multiple subjects. Track your scores and improve with detailed explanations.",
  },
  {
    icon: Sparkles,
    gradient: "from-pink-500 to-rose-500",
    title: "AI Study Assistant",
    description: "Upload documents, ask questions, and get step-by-step solutions powered by AI — available 24/7.",
  },
  {
    icon: Gamepad2,
    gradient: "from-green-500 to-emerald-500",
    title: "Challenge Friends",
    description: "Battle other students in real-time PvP quizzes. Build streaks and climb the leaderboard!",
  },
];

const ONBOARDING_KEY = "veno_onboarding_seen";

export const WelcomeModal = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen) {
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setOpen(false);
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
      navigate("/cbt");
    }
  };

  const current = steps[step];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 gap-0">
        <div className="p-8 flex flex-col items-center text-center">
          {/* Step dots */}
          <div className="flex gap-2 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${current.gradient} flex items-center justify-center mb-5`}>
                <current.icon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2">{current.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                {current.description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 mt-8 w-full">
            <Button variant="ghost" className="flex-1" onClick={handleClose}>
              Skip
            </Button>
            <Button className="flex-1 gap-2" onClick={handleNext}>
              {step < steps.length - 1 ? "Next" : "Get Started"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
