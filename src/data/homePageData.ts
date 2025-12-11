
import { Book, BookOpen, Bot, FileText, CheckCircle, Flame, Sparkles } from "lucide-react";

export const bannerSlides = [
  {
    title: "AI Study Assistant",
    subtitle: "Your intelligent learning companion. Upload documents, generate questions, solve problems, and get expert explanations across all subjects.",
    background: "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600",
    primaryButton: { text: "Start Learning", link: "/ai-assistant" },
    secondaryButton: { text: "Learn More", link: "/ai-assistant" }
  },
  {
    title: "Challenge Your Friends",
    subtitle: "Battle other players in real-time PvP CBT challenges. Build your streak, climb the leaderboard, and prove you're the best!",
    background: "bg-gradient-to-r from-orange-500 via-red-500 to-pink-600",
    primaryButton: { text: "Start Challenge", link: "/cbt/streak-challenge" },
    secondaryButton: { text: "View Leaderboard", link: "/cbt/streak-leaderboard" }
  },
  {
    title: "Learn Anywhere, Anytime",
    subtitle: "Access your courses on any device with our responsive platform that adapts to your schedule and learning style.",
    background: "bg-gradient-to-r from-veno-secondary to-purple-600",
    primaryButton: { text: "Start Learning", link: "/cbt" },
    secondaryButton: { text: "View Courses", link: "/cbt" }
  },
  {
    title: "Interactive Assessment Tools",
    subtitle: "Test your knowledge and track your progress with our comprehensive suite of CBT tools and analytics.",
    background: "bg-gradient-to-r from-purple-600 to-veno-primary",
    primaryButton: { text: "Take a Test", link: "/cbt" },
    secondaryButton: { text: "View Analytics", link: "/cbt/analytics" }
  }
];

export const tutorials = [
  {
    title: "Interactive CBT",
    description: "Experience comprehensive computer-based testing with real-time feedback and performance analytics.",
    icon: Book,
    href: "/cbt",
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

