
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon, BookOpen } from "lucide-react";

type ServiceCardProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  href: string;
  onClick: () => void;
  className?: string;
};

const ServiceCard = ({
  title,
  description,
  icon: Icon = BookOpen, // Default to BookOpen icon if not provided
  onClick,
  className,
}: ServiceCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "veno-card p-5 cursor-pointer",
        className
      )}
    >
      <div className="flex items-center space-x-4 mb-2">
        <div className="rounded-xl bg-veno-primary/10 p-2.5 text-veno-primary">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="font-semibold text-lg text-foreground">{title}</h3>
      </div>
      <p className="text-muted-foreground text-sm">{description}</p>
    </motion.div>
  );
};

export default ServiceCard;
