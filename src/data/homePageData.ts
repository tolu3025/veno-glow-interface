
import { Book, BookOpen, Bot, FileText, CheckCircle } from "lucide-react";

export const bannerSlides = [
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
  },
  {
    title: "Educational Resources",
    subtitle: "Discover comprehensive tutorials and educational content designed to enhance your learning experience.",
    background: "bg-gradient-to-r from-blue-600 to-veno-secondary",
    primaryButton: { text: "Browse Resources", link: "/tutorial/categories" },
    secondaryButton: { text: "View Tutorials", link: "/tutorial/info" }
  }
];

export const tutorials = [
  {
    title: "Interactive CBT",
    description: "Experience comprehensive computer-based testing with real-time feedback and performance analytics.",
    icon: Book,
    href: "/cbt",
  },
  {
    title: "Tutorial Categories",
    description: "Explore comprehensive learning resources and educational content across various subjects.",
    icon: BookOpen,
    href: "/tutorial/categories",
  },
  {
    title: "Learning Materials",
    description: "Access study materials and resources designed to enhance your learning experience.",
    icon: FileText,
    href: "/tutorial/info",
  },
];

export const features = [
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

