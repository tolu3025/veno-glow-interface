
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";

interface CallToActionProps {
  title?: string;
  description?: string;
  buttonText?: string;
}

const CallToAction = ({ 
  title = "Ready to Transform Your Learning Experience?",
  description = "Join thousands of students who are already using Veno to achieve their educational goals.",
  buttonText
}: CallToActionProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/cbt");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading">{title}</h2>
        <p className="text-muted-foreground text-lg mb-8">{description}</p>
        <Button 
          size="lg" 
          className="bg-veno-primary hover:bg-veno-primary/90"
          onClick={handleGetStarted}
        >
          {buttonText || (user ? "Go to Dashboard" : "Get Started for Free")}
        </Button>
      </div>
    </motion.div>
  );
};

export default CallToAction;
