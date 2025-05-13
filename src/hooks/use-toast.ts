
import { toast as sonnerToast } from "sonner";

// Toast types
type ToastProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
};

// Custom toast API that provides a more consistent interface
export function toast({
  title,
  description,
  action,
  variant = "default",
}: ToastProps) {
  // Map our variant types to sonner's style
  const style = variant === "destructive" 
    ? { style: { backgroundColor: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" } }
    : variant === "success"
    ? { style: { backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } }
    : {};

  return sonnerToast(title, {
    description,
    action,
    ...style,
  });
}

// Simple error toast
toast.error = (message: string) => {
  return sonnerToast.error(message);
};

// Simple success toast
toast.success = (message: string) => {
  return sonnerToast.success(message);
};

// Simple info toast
toast.info = (message: string) => {
  return sonnerToast(message);
};

// Hook for component usage
export const useToast = () => {
  return {
    toast,
  };
};
