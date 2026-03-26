
import { Book, BookOpen, Bot, FileText, CheckCircle, Flame, Sparkles, GraduationCap } from "lucide-react";

export const bannerSlides = [
  {
    title: "Master Any Subject with CBT Practice",
    subtitle: "Take computer-based tests, track your progress, and improve your scores with instant feedback and detailed analytics.",
    background: "bg-gradient-to-r from-purple-600 to-veno-primary",
    primaryButton: { text: "Start Practicing", link: "/cbt" },
    secondaryButton: { text: "View Analytics", link: "/cbt/analytics" }
  },
  {
    title: "Challenge Your Friends",
    subtitle: "Battle other players in real-time PvP CBT challenges. Build your streak, climb the leaderboard, and prove you're the best!",
    background: "bg-gradient-to-r from-orange-500 via-red-500 to-pink-600",
    primaryButton: { text: "Start Challenge", link: "/cbt/streak-challenge" },
    secondaryButton: { text: "View Leaderboard", link: "/cbt/streak-leaderboard" }
  },
];

export const tutorials = [
  {
    title: "Interactive CBT",
    description: "Experience comprehensive computer-based testing with real-time feedback and performance analytics.",
    icon: Book,
    href: "/cbt",
  },
  {
    title: "Organization Exams",
    description: "Conduct secure digital exams for schools and institutions with AI-powered question generation and anti-cheat features.",
    icon: GraduationCap,
    href: "/org-exam",
  },
];

export const features = [
  {
    title: "AI Study Assistant",
    description: "Upload documents, generate questions, solve problems with step-by-step explanations across all subjects.",
    icon: Sparkles,
  },
  {
    title: "Personalized Learning Paths",
    description: "Customized study plans and recommendations based on your learning style and goals.",
    icon: Book,
  },
  {
    title: "Progress Tracking",
    description: "Monitor your learning journey with detailed analytics and performance insights.",
    icon: CheckCircle,
  },
  {
    title: "AI-Enhanced Support",
    description: "24/7 access to AI-powered learning assistance and doubt resolution.",
    icon: Bot,
  },
  {
    title: "Cross-Platform Access",
    description: "Seamlessly continue your learning across all your devices with cloud synchronization.",
    icon: BookOpen,
  },
];

export const testimonial = {
  quote: "Veno's comprehensive tutorial system and interactive learning tools have transformed my educational journey. The personalized feedback and AI assistance make complex topics much easier to understand.",
  author: {
    name: "Toluwanimi Oyetade",
    image: "/lovable-uploads/cb8d05cb-602f-45e9-a069-f187aee51c74.png",
    role: "University Student"
  }
};
