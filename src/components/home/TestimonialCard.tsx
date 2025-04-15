
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface TestimonialCardProps {
  quote: string;
  author: {
    name: string;
    image: string;
    role: string;
  };
}

const TestimonialCard = ({ quote, author }: TestimonialCardProps) => {
  return (
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
              "{quote}"
            </blockquote>
            <div className="flex items-center justify-center">
              <Avatar className="w-12 h-12 rounded-full border-2 border-veno-primary mr-4">
                <AvatarImage src={author.image} alt={author.name} />
                <AvatarFallback>{author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="font-semibold">{author.name}</p>
                <p className="text-sm text-muted-foreground">{author.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TestimonialCard;
