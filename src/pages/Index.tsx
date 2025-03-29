
import { useNavigate } from "react-router-dom";
import { Book, ShoppingCart, Bot, FileText } from "lucide-react";
import ServiceCard from "@/components/ServiceCard";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  
  const services = [
    {
      title: "Veno CBT",
      description: "Computer-based training solutions for professional development.",
      icon: Book,
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

  // Animation variants for container and items
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

  return (
    <div className="pb-6">
      {/* Hero Banner */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative rounded-2xl overflow-hidden mb-10"
      >
        <div className="bg-gradient-to-r from-veno-primary to-veno-secondary h-[300px] md:h-[400px] flex items-center">
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-10"></div>
          <div className="container relative z-20">
            <div className="max-w-xl text-white">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Veno</h1>
                <p className="text-lg md:text-xl opacity-90 mb-8">
                  Your next-generation digital learning platform with personalized training, marketplace access, and AI assistance.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    size="lg" 
                    onClick={() => navigate("/cbt")}
                    className="bg-white text-veno-primary hover:bg-white/90"
                  >
                    Get Started
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/marketplace")}
                    className="bg-transparent border-white text-white hover:bg-white/20"
                  >
                    Explore Marketplace
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold tracking-tight">Our Services</h2>
        <p className="text-muted-foreground mt-2">Discover what Veno has to offer.</p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
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
    </div>
  );
};

export default Index;
