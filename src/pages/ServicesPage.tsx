
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ServiceCard from '@/components/ServiceCard';
import { Book, ShoppingCart, Bot, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const ServicesPage = () => {
  const navigate = useNavigate();
  
  const services = [
    {
      title: "Veno CBT",
      description: "Interactive educational platform for effective learning and assessment. Create, share and manage computer-based tests easily.",
      icon: Book,
      href: "/cbt",
    },
    {
      title: "Veno Marketplace",
      description: "Shop for digital products and services in our marketplace. Find educational resources, templates, and more.",
      icon: ShoppingCart,
      href: "/marketplace",
    },
    {
      title: "Veno Bot",
      description: "AI-powered assistant to help with your questions and tasks. Get instant answers and support for your learning journey.",
      icon: Bot,
      href: "/bot",
    },
    {
      title: "Veno Blog",
      description: "Latest news, updates and insights from our team. Learn about educational trends and best practices.",
      icon: FileText,
      href: "/blog",
    },
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
    <div className="container max-w-5xl py-8">
      <div className="flex items-center mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-secondary/70 hover:bg-secondary mr-4"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-3xl font-bold">Our Services</h1>
      </div>
      
      <p className="text-muted-foreground mb-10 max-w-3xl">
        Explore the full range of services offered by Veno to enhance your educational journey. 
        From interactive assessments to AI-powered learning, we've got you covered.
      </p>
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 grid-cols-1 md:grid-cols-2"
      >
        {services.map((service, index) => (
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
    </div>
  );
};

export default ServicesPage;
