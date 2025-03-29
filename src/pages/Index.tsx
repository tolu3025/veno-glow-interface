
import { useNavigate } from "react-router-dom";
import { Book, ShoppingCart, Bot, FileText, CheckCircle, ArrowRight, LucideIcon } from "lucide-react";
import ServiceCard from "@/components/ServiceCard";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const services = [
    {
      title: "Veno CBT",
      description: "Interactive educational platform for effective learning and assessment.",
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

  const features = [
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
      icon: ShoppingCart,
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

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/cbt");
    }
  };

  return (
    <div className="pb-6 relative overflow-hidden">
      {/* Animated iPhone Bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="device-bubble w-48 h-48 -top-12 left-1/4"
          animate={{ 
            y: [0, -40, -10, 0],
            x: [0, 30, -20, 0],
            rotate: [0, 10, -5, 0]
          }}
          transition={{ 
            duration: 15, 
            ease: "easeInOut", 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        >
          <img 
            src="/placeholder.svg" 
            alt="iPhone" 
            className="w-full h-full object-cover opacity-70"
          />
        </motion.div>
        
        <motion.div
          className="device-bubble w-32 h-32 top-1/3 -right-10"
          animate={{
            y: [0, 30, -20, 0],
            x: [0, -20, 10, 0],
            rotate: [0, -5, 10, 0]
          }}
          transition={{
            duration: 18,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
            delay: 2
          }}
        >
          <img 
            src="/placeholder.svg" 
            alt="iPhone" 
            className="w-full h-full object-cover opacity-60"
          />
        </motion.div>
        
        <motion.div
          className="device-bubble w-40 h-40 bottom-20 left-10"
          animate={{
            y: [0, -30, 20, 0],
            x: [0, 20, -30, 0],
            rotate: [0, -10, 5, 0]
          }}
          transition={{
            duration: 20,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
            delay: 1
          }}
        >
          <img 
            src="/placeholder.svg" 
            alt="iPhone" 
            className="w-full h-full object-cover opacity-50"
          />
        </motion.div>
      </div>

      {/* Hero Banner */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative rounded-2xl overflow-hidden mb-10"
      >
        <div className="bg-gradient-to-r from-veno-primary to-veno-secondary h-[400px] md:h-[500px] flex items-center">
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-10"></div>
          <div className="container relative z-20">
            <div className="max-w-xl text-white">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-4xl md:text-6xl font-bold mb-4 font-heading">
                  Education <span className="text-veno-accent">Reimagined</span>
                </h1>
                <p className="text-lg md:text-xl opacity-90 mb-8 leading-relaxed">
                  Your comprehensive educational platform with interactive learning, assessments, and personalized study tools designed for the modern learner.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    size="lg" 
                    onClick={handleGetStarted}
                    className="bg-white text-veno-primary hover:bg-white/90"
                  >
                    {user ? "Go to Dashboard" : "Get Started"}
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
      
      {/* Features Section */}
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

      {/* Services Section */}
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
            onClick={() => navigate("/cbt")}
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

      {/* Testimonial Section */}
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
                <div className="w-12 h-12 rounded-full bg-gray-300 mr-4"></div>
                <div className="text-left">
                  <p className="font-semibold">Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">University Student</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CTA Section */}
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
  );
};

export default Index;
