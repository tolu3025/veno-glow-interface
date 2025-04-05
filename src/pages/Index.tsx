import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CardContent, Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { BookOpen, BookText, BookMarked, GraduationCap, AwardIcon, TrendingUp } from "lucide-react";
import TestimonialSlider from '@/components/TestimonialSlider';
import ServiceCard from '@/components/ServiceCard';
import Spline from '@splinetool/react-spline';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const bannerSlides = [
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

  const services = [
    {
      title: "Veno CBT",
      description: "Interactive educational platform for effective learning and assessment.",
      icon: BookOpen,
      href: "/cbt",
    },
    {
      title: "Veno Marketplace",
      description: "Shop for digital products and services in our marketplace.",
      icon: ShoppingCart,
      href: "/marketplace",
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

  const features = [
    {
      title: "Interactive Learning",
      description: "Engage with dynamic content and interactive assessments for better knowledge retention.",
      icon: BookText,
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
      icon: ShoppingCart,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/cbt");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-veno-primary/10 via-background to-background">
          <div className="container px-4 md:px-6 flex flex-col lg:flex-row items-center space-y-8 lg:space-y-0 lg:space-x-8">
            <div className="space-y-4 lg:space-y-6 lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter">
                  Your Learning Journey <span className="text-veno-primary">Reimagined</span>
                </h1>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <p className="text-muted-foreground md:text-xl">
                  Comprehensive Educational Testing Platform with AI-Powered Assistance and Analytics
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col md:flex-row gap-4"
              >
                <Button size="lg" onClick={handleGetStarted} className="bg-veno-primary hover:bg-veno-primary/90">
                  Get Started
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/cbt')}>
                  Explore Tests
                </Button>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:w-1/2 h-[300px] md:h-[400px] w-full relative"
            >
              <Spline scene="https://prod.spline.design/LMc58EcjolE2ESOx/scene.splinecode" />
            </motion.div>
          </div>
        </section>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl font-bold tracking-tight font-heading mb-4">Transform Your Learning Experience</h2>
            <p className="text-muted-foreground text-lg">Discover how Veno's innovative approach to education can help you achieve your goals.</p>
          </div>
          
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="veno-card p-6 h-full flex flex-col">
                  <div className="rounded-full bg-veno-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <feature.icon className="text-veno-primary h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground flex-grow">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight font-heading">Our Services</h2>
              <p className="text-muted-foreground mt-2">Discover what Veno has to offer.</p>
            </div>
            <Button 
              variant="outline" 
              className="mt-4 md:mt-0"
              onClick={() => navigate("/services")}
            >
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-4 grid-cols-1 md:grid-cols-2"
          >
            {services.map((service) => (
              <motion.div key={service.title} variants={itemVariants}>
                <ServiceCard
                  title={service.title}
                  description={service.description}
                  icon={service.icon}
                  href={service.href}
                  onClick={() => navigate(service.href)}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="veno-card bg-gradient-to-br from-veno-primary/5 to-veno-secondary/5">
            <div className="p-8 md:p-12">
              <div className="max-w-3xl mx-auto text-center">
                <p className="text-lg font-handwriting text-veno-secondary mb-6">What Our Users Say</p>
                <blockquote className="text-xl md:text-2xl italic mb-6">
                  "Veno has transformed how I approach learning and assessment. The interactive tools and personalized feedback have significantly improved my study efficiency and outcomes."
                </blockquote>
                <div className="flex items-center justify-center">
                  <Avatar className="w-12 h-12 rounded-full border-2 border-veno-primary mr-4">
                    <AvatarImage src="/lovable-uploads/cb8d05cb-602f-45e9-a069-f187aee51c74.png" alt="Toluwanimi Oyetade" />
                    <AvatarFallback>TO</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-semibold">Toluwanimi Oyetade</p>
                    <p className="text-sm text-muted-foreground">University Student</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading">Ready to Transform Your Learning Experience?</h2>
            <p className="text-muted-foreground text-lg mb-8">Join thousands of students who are already using Veno to achieve their educational goals.</p>
            <Button 
              size="lg" 
              className="bg-veno-primary hover:bg-veno-primary/90"
              onClick={handleGetStarted}
            >
              {user ? "Go to Dashboard" : "Get Started for Free"}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;
