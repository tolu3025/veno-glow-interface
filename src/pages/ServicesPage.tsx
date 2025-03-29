
import React from 'react';
import { ArrowLeft, Book, ShoppingCart, Bot, FileText, Landmark, BarChart, BookOpen, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ServiceCard from '@/components/ServiceCard';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const ServicesPage = () => {
  const navigate = useNavigate();
  
  const services = [
    {
      title: "Veno CBT",
      description: "Interactive educational platform for effective learning and assessment. Create, share and manage computer-based tests easily.",
      icon: Book,
      href: "/cbt",
      features: [
        "Create custom tests and quizzes",
        "Track learning progress",
        "Share assessments with students",
        "Detailed analytics and insights"
      ]
    },
    {
      title: "Veno Marketplace",
      description: "Shop for digital products and services in our marketplace. Find educational resources, templates, and more.",
      icon: ShoppingCart,
      href: "/marketplace",
      features: [
        "High-quality educational resources",
        "Peer-reviewed content",
        "Secure payment system",
        "Instant downloads"
      ]
    },
    {
      title: "Veno Bot",
      description: "AI-powered assistant to help with your questions and tasks. Get instant answers and support for your learning journey.",
      icon: Bot,
      href: "/bot",
      features: [
        "24/7 learning assistance",
        "Subject-specific guidance",
        "Personalized responses",
        "Exam preparation help"
      ]
    },
    {
      title: "Veno Blog",
      description: "Latest news, updates and insights from our team. Learn about educational trends and best practices.",
      icon: FileText,
      href: "/blog",
      features: [
        "Expert articles and guides",
        "Education industry news",
        "Learning strategies",
        "Success stories"
      ]
    },
    {
      title: "Veno Analytics",
      description: "Comprehensive data analysis tools to track and improve student performance and engagement.",
      icon: BarChart,
      href: "/cbt/analytics",
      features: [
        "Performance tracking",
        "Custom reports",
        "Learning pattern analysis",
        "Actionable insights"
      ]
    },
    {
      title: "Veno Library",
      description: "Digital library with a vast collection of educational resources, books, and study materials.",
      icon: BookOpen,
      href: "/cbt",
      features: [
        "Categorized study materials",
        "Easy search functionality",
        "Downloadable resources",
        "Regular content updates"
      ]
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
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

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex items-center mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-secondary/70 hover:bg-secondary mr-4"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-3xl font-bold">Our Services</h1>
      </div>
      
      <div className="mb-10">
        <p className="text-muted-foreground max-w-3xl mb-6">
          Explore the full range of services offered by Veno to enhance your educational journey. 
          From interactive assessments to AI-powered learning, we've got you covered.
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={() => document.getElementById('cbt')?.scrollIntoView({ behavior: 'smooth' })}>
            CBT
          </Button>
          <Button variant="outline" size="sm" onClick={() => document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' })}>
            Marketplace
          </Button>
          <Button variant="outline" size="sm" onClick={() => document.getElementById('bot')?.scrollIntoView({ behavior: 'smooth' })}>
            Bot
          </Button>
          <Button variant="outline" size="sm" onClick={() => document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth' })}>
            Blog
          </Button>
        </div>
      </div>
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-8 grid-cols-1 md:grid-cols-2"
      >
        {services.map((service, index) => (
          <motion.div key={service.title} variants={itemVariants} id={service.href.replace("/", "")} className="relative">
            <ServiceCard
              title={service.title}
              description={service.description}
              icon={service.icon}
              href={service.href}
              onClick={() => navigate(service.href)}
            />
            
            <div className="mt-4 bg-muted p-4 rounded-md">
              <h3 className="text-sm font-medium mb-2">Features</h3>
              <ul className="space-y-2">
                {service.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-veno-primary mr-2 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-16 bg-primary/5 rounded-lg p-6 sm:p-10 border">
        <h2 className="text-2xl font-bold mb-4">Need a custom solution?</h2>
        <p className="text-muted-foreground mb-6">
          Contact our team to discuss how we can tailor our services to meet your specific educational needs.
        </p>
        <Button onClick={() => navigate("/contact")}>
          Contact Us
        </Button>
      </div>
    </div>
  );
};

export default ServicesPage;
