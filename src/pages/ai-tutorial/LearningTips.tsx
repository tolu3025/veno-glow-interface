import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Brain, Clock, Target, BookOpen, CheckCircle2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const LearningTips = () => {
  const tips = [
    {
      category: 'Study Techniques',
      icon: Brain,
      color: 'bg-purple-500',
      items: [
        {
          title: 'Spaced Repetition',
          description: 'Review material at increasing intervals to enhance long-term retention. Use flashcards or apps like Anki.',
          difficulty: 'Beginner'
        },
        {
          title: 'Active Recall',
          description: 'Test yourself regularly instead of passively re-reading notes. This strengthens memory connections.',
          difficulty: 'Beginner'
        },
        {
          title: 'Feynman Technique',
          description: 'Explain concepts in simple terms as if teaching someone else. Identifies gaps in understanding.',
          difficulty: 'Intermediate'
        }
      ]
    },
    {
      category: 'Time Management',
      icon: Clock,
      color: 'bg-blue-500',
      items: [
        {
          title: 'Pomodoro Technique',
          description: 'Study for 25 minutes, take a 5-minute break. After 4 sessions, take a longer 15-30 minute break.',
          difficulty: 'Beginner'
        },
        {
          title: 'Time Blocking',
          description: 'Schedule specific time slots for different subjects or tasks. Helps maintain focus and structure.',
          difficulty: 'Beginner'
        },
        {
          title: 'Eisenhower Matrix',
          description: 'Prioritize tasks by urgency and importance. Focus on important tasks first.',
          difficulty: 'Intermediate'
        }
      ]
    },
    {
      category: 'Goal Setting',
      icon: Target,
      color: 'bg-green-500',
      items: [
        {
          title: 'SMART Goals',
          description: 'Set Specific, Measurable, Achievable, Relevant, and Time-bound goals for better results.',
          difficulty: 'Beginner'
        },
        {
          title: 'Weekly Reviews',
          description: 'Assess your progress weekly and adjust your study plan accordingly.',
          difficulty: 'Beginner'
        },
        {
          title: 'Milestone Tracking',
          description: 'Break large goals into smaller milestones and celebrate achievements along the way.',
          difficulty: 'Intermediate'
        }
      ]
    },
    {
      category: 'Memory Enhancement',
      icon: Lightbulb,
      color: 'bg-yellow-500',
      items: [
        {
          title: 'Mnemonics',
          description: 'Create memory aids like acronyms, rhymes, or visual associations for complex information.',
          difficulty: 'Beginner'
        },
        {
          title: 'Mind Mapping',
          description: 'Create visual diagrams to connect concepts and ideas, enhancing understanding and recall.',
          difficulty: 'Beginner'
        },
        {
          title: 'Method of Loci',
          description: 'Associate information with physical locations to create a mental "memory palace".',
          difficulty: 'Advanced'
        }
      ]
    },
    {
      category: 'Reading & Note-Taking',
      icon: BookOpen,
      color: 'bg-orange-500',
      items: [
        {
          title: 'SQ3R Method',
          description: 'Survey, Question, Read, Recite, Review - a systematic approach to reading comprehension.',
          difficulty: 'Intermediate'
        },
        {
          title: 'Cornell Notes',
          description: 'Divide notes into cues, notes, and summary sections for better organization and review.',
          difficulty: 'Beginner'
        },
        {
          title: 'Skimming & Scanning',
          description: 'Quickly identify key information before deep reading to save time and improve focus.',
          difficulty: 'Beginner'
        }
      ]
    },
    {
      category: 'Focus & Productivity',
      icon: Zap,
      color: 'bg-red-500',
      items: [
        {
          title: 'Environment Setup',
          description: 'Create a dedicated study space free from distractions with good lighting and comfort.',
          difficulty: 'Beginner'
        },
        {
          title: 'Digital Detox',
          description: 'Use apps or techniques to limit phone and social media usage during study sessions.',
          difficulty: 'Beginner'
        },
        {
          title: 'Batching Tasks',
          description: 'Group similar tasks together to maintain focus and reduce context switching.',
          difficulty: 'Intermediate'
        }
      ]
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'Advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Learning Tips & Study Strategies
          </h1>
          <p className="text-muted-foreground text-lg">
            Master effective study techniques to enhance your learning and academic performance
          </p>
        </div>

        <div className="space-y-8">
          {tips.map((category, idx) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-lg ${category.color} flex items-center justify-center`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{category.category}</CardTitle>
                        <CardDescription>
                          {category.items.length} techniques to master
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {category.items.map((item, itemIdx) => (
                        <motion.div
                          key={item.title}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.1 + itemIdx * 0.05 }}
                        >
                          <Card className="h-full hover:shadow-md transition-shadow">
                            <CardHeader>
                              <div className="flex items-start justify-between mb-2">
                                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                                <Badge className={getDifficultyColor(item.difficulty)}>
                                  {item.difficulty}
                                </Badge>
                              </div>
                              <CardTitle className="text-lg">{item.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {item.description}
                              </p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
          <CardHeader>
            <CardTitle className="text-xl">Pro Tip</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Combine multiple techniques for maximum effectiveness. For example, use the Pomodoro Technique 
              for time management while applying Active Recall and Spaced Repetition for better retention.
              Remember: consistency is more important than intensity!
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LearningTips;
