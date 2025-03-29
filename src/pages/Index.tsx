
import { useNavigate } from "react-router-dom";
import { Book, ShoppingCart, Bot, FileText } from "lucide-react";
import ServiceCard from "@/components/ServiceCard";
import { motion } from "framer-motion";

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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold tracking-tight">Welcome to <span className="text-veno-primary">Veno</span></h1>
        <p className="text-muted-foreground mt-2">Your next-generation digital companion.</p>
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
