
import { toast as sonnerToast } from "sonner";

// Toast types
type ToastProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success" | "warning";
  duration?: number; // Added support for duration
};

// Custom toast API that provides a more consistent interface
export function toast({
  title,
  description,
  action,
  variant = "default",
  duration,
}: ToastProps) {
  // Map our variant types to sonner's style
  const style = variant === "destructive" 
    ? { style: { backgroundColor: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" } }
    : variant === "success"
    ? { style: { backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } }
    : variant === "warning"
    ? { style: { backgroundColor: "hsl(var(--warning))", color: "hsl(var(--warning-foreground))" } }
    : {};

  return sonnerToast(title, {
    description,
    action,
    duration,
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

// Simple warning toast
toast.warning = (message: string) => {
  return sonnerToast(message, {
    style: { backgroundColor: "hsl(var(--warning))", color: "hsl(var(--warning-foreground))" }
  });
};

// For use with the Toaster component
export type ToasterToast = ToastProps & {
  id: string;
};

// Create a store for toasts
type ToastStore = {
  toasts: ToasterToast[];
};

// Mock store implementation for compatibility
const toastStore: ToastStore = {
  toasts: []
};

// Hook for component usage
export const useToast = () => {
  return {
    toast,
    toasts: toastStore.toasts
  };
};
