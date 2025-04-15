
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import TutorialCard from "@/components/ServiceCard";
import { LucideIcon } from "lucide-react";

interface Tutorial {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

interface TutorialsSectionProps {
  tutorials: Tutorial[];
}

const TutorialsSection = ({ tutorials }: TutorialsSectionProps) => {
  const navigate = useNavigate();
  
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
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="mb-16"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-heading">Our Tutorials</h2>
          <p className="text-muted-foreground mt-2">Discover what Veno has to offer.</p>
        </div>
        <Button 
          variant="outline" 
          className="mt-4 md:mt-0"
          onClick={() => navigate("/tutorial")}
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
        {tutorials.map((tutorial) => (
          <motion.div key={tutorial.title} variants={itemVariants}>
            <TutorialCard
              title={tutorial.title}
              description={tutorial.description}
              icon={tutorial.icon}
              href={tutorial.href}
              onClick={() => navigate(tutorial.href)}
              showShareButton={true}
              onShare={() => {
                navigator.clipboard.writeText(`Check out this tutorial: ${window.location.origin}${tutorial.href}`);
                // You would typically add a toast notification here
              }}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default TutorialsSection;
