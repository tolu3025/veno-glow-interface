import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, BookOpen, PlusCircle, FileUp, Trophy } from "lucide-react";

const CBTIndex = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-9 w-9">
            <ArrowLeft size={18} />
          </Button>
          <span className="font-semibold text-lg">CBT Platform</span>
          <div className="w-9" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Choose Your Mode</h1>
            <p className="text-muted-foreground text-sm mt-1">Select how you want to practice</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/cbt/jamb')}
              className="group relative rounded-2xl p-6 text-left transition-all hover:scale-[1.03] active:scale-[0.98] bg-card border border-border shadow-sm hover:shadow-lg"
            >
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-1">JAMB Mode</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Full UTME simulation. English + 3 subjects. 190 questions, timed like the real exam.
              </p>
              <div className="mt-3">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Recommended
                </span>
              </div>
            </button>

            <button
              onClick={() => navigate('/cbt/practice')}
              className="group relative rounded-2xl p-6 text-left transition-all hover:scale-[1.03] active:scale-[0.98] bg-card border border-border shadow-sm hover:shadow-lg"
            >
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-4">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-1">Practice Mode</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pick any subject and practice at your own pace. No pressure, just learning.
              </p>
              <div className="mt-3">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Free Practice
                </span>
              </div>
            </button>
          </div>
          {/* JAMB Challenge Banner */}
          <button
            onClick={() => navigate('/cbt/jamb-challenge')}
            className="w-full rounded-2xl p-5 text-left transition-all hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30 shadow-sm hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shrink-0">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold">🔥 JAMB Challenge — Win ₦10,000!</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Compete for 2 weeks. Top 3 share the prize. Earn points from every JAMB practice!
                </p>
              </div>
            </div>
          </button>

          <div className="space-y-3 pt-2">
            <Button
              onClick={() => navigate('/cbt/create')}
              variant="outline"
              className="w-full justify-start h-auto p-4 border hover:scale-[1.01] transition-all"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <PlusCircle size={18} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Create Custom Test</p>
                  <p className="text-xs text-muted-foreground">Build your own test manually or with AI</p>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => navigate('/cbt/course-material-test')}
              variant="outline"
              className="w-full justify-start h-auto p-4 border hover:scale-[1.01] transition-all"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                  <FileUp size={18} className="text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Course Material Test</p>
                  <p className="text-xs text-muted-foreground">Upload material and generate tests with AI</p>
                </div>
              </div>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CBTIndex;
