import { cn } from "@/lib/utils";

interface MobileWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Mobile-only experience: always render a 428px centered phone canvas,
 * even on desktop. The app is designed for mobile and does not adapt to
 * larger viewports.
 */
const MobileWrapper = ({ children, className }: MobileWrapperProps) => {
  return (
    <div className="min-h-screen bg-muted flex justify-center">
      <div
        className={cn(
          "w-full max-w-[428px] bg-background min-h-screen relative",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default MobileWrapper;
