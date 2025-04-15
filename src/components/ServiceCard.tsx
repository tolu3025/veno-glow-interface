
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon, BookOpen, Share2 } from "lucide-react";

type TutorialCardProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  href: string;
  onClick: () => void;
  className?: string;
  showShareButton?: boolean;
  onShare?: () => void;
};

const TutorialCard = ({
  title,
  description,
  icon: Icon = BookOpen, // Default to BookOpen icon if not provided
  onClick,
  className,
  showShareButton = false,
  onShare,
}: TutorialCardProps) => {
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
        
        {showShareButton && onShare && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="ml-auto p-2 rounded-full hover:bg-secondary/80"
          >
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
      <p className="text-muted-foreground text-sm">{description}</p>
    </motion.div>
  );
};

export default TutorialCard;
