
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
    title: "Expert-Led Tutorials",
    subtitle: "Access comprehensive tutorial materials created by subject matter experts across various fields of study.",
    background: "bg-gradient-to-r from-veno-primary to-blue-600",
    primaryButton: { text: "Browse Tutorials", link: "/tutorial" },
    secondaryButton: { text: "View Categories", link: "/tutorial" }
  },
  {
    title: "Insightful Blog Content",
    subtitle: "Stay updated with the latest educational trends and insights through our regularly updated blog.",
    background: "bg-gradient-to-r from-blue-600 to-veno-secondary",
    primaryButton: { text: "Read Articles", link: "/blog" },
    secondaryButton: { text: "Latest Posts", link: "/blog" }
  },
  {
    title: "AI-Powered Learning",
    subtitle: "Leverage our intelligent AI assistant to enhance your learning experience with personalized guidance.",
    background: "bg-gradient-to-r from-veno-secondary to-veno-primary",
    primaryButton: { text: "Chat with AI", link: "/bot" },
    secondaryButton: { text: "Learn More", link: "/bot" }
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
    title: "Video Tutorials",
    description: "Access high-quality video lessons with detailed explanations and practical examples.",
    icon: BookOpen,
    href: "/tutorial",
  },
  {
    title: "AI Learning Assistant",
    description: "Get personalized learning support and instant answers to your academic questions.",
    icon: Bot,
    href: "/bot",
  },
  {
    title: "Educational Blog",
    description: "Explore in-depth articles, study guides, and expert insights on various subjects.",
    icon: FileText,
    href: "/blog",
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

