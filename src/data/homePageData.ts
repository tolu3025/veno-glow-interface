
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
    title: "Digital Marketplace",
    subtitle: "Discover and purchase high-quality educational resources created by experts in their fields.",
    background: "bg-gradient-to-r from-veno-primary to-blue-600",
    primaryButton: { text: "Shop Now", link: "/marketplace" },
    secondaryButton: { text: "Browse Categories", link: "/marketplace" }
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
    title: "Veno CBT",
    description: "Interactive educational platform for effective learning and assessment.",
    icon: Book,
    href: "/cbt",
  },
  {
    title: "Veno Tutorials",
    description: "Free tutorial videos on various subjects and topics.",
    icon: BookOpen,
    href: "/tutorial",
  },
  {
    title: "Veno Bot",
    description: "AI-powered assistant to help with your questions and tasks.",
    icon: Bot,
    href: "/bot",
  },
  {
    title: "Veno Blog",
    description: "Latest news, updates and insights from our team.",
    icon: FileText,
    href: "/blog",
  },
];

export const features = [
  {
    title: "Interactive Learning",
    description: "Engage with dynamic content and interactive assessments for better knowledge retention.",
    icon: Book,
  },
  {
    title: "Personalized Experience",
    description: "Tailored learning paths and recommendations based on your performance and preferences.",
    icon: CheckCircle,
  },
  {
    title: "AI-Powered Insights",
    description: "Get intelligent feedback and analysis to improve your learning outcomes.",
    icon: Bot,
  },
  {
    title: "Cross-Device Compatibility",
    description: "Access your learning materials anytime, anywhere, on any device.",
    icon: BookOpen,
  },
];

export const testimonial = {
  quote: "Veno has transformed how I approach learning and assessment. The interactive tools and personalized feedback have significantly improved my study efficiency and outcomes.",
  author: {
    name: "Toluwanimi Oyetade",
    image: "/lovable-uploads/cb8d05cb-602f-45e9-a069-f187aee51c74.png",
    role: "University Student"
  }
};
