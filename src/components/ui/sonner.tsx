import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      style={{ fontFamily: "'Syne', sans-serif" }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:!bg-white group-[.toaster]:!text-black group-[.toaster]:border-2 group-[.toaster]:border-primary/20 group-[.toaster]:shadow-[0_8px_32px_-4px_hsl(271_81%_40%/0.15)] group-[.toaster]:rounded-2xl group-[.toaster]:px-5 group-[.toaster]:py-4 group-[.toaster]:backdrop-blur-xl group-[.toaster]:font-syne",
          title: "group-[.toast]:font-syne group-[.toast]:font-bold group-[.toast]:text-[15px] group-[.toast]:tracking-tight group-[.toast]:!text-black",
          description: "group-[.toast]:!text-black/70 group-[.toast]:text-sm group-[.toast]:font-syne group-[.toast]:mt-1",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-xl group-[.toast]:font-syne group-[.toast]:font-bold group-[.toast]:text-sm group-[.toast]:px-4 group-[.toast]:py-2",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-xl group-[.toast]:font-syne group-[.toast]:text-sm",
          success:
            "group-[.toaster]:!border-accent/40 group-[.toaster]:!shadow-[0_8px_32px_-4px_hsl(82_78%_44%/0.2),inset_0_1px_0_0_hsl(82_78%_44%/0.1)] group-[.toaster]:!bg-white",
          error:
            "group-[.toaster]:!border-destructive/40 group-[.toaster]:!shadow-[0_8px_32px_-4px_hsl(0_84%_60%/0.2),inset_0_1px_0_0_hsl(0_84%_60%/0.1)] group-[.toaster]:!bg-white",
          info:
            "group-[.toaster]:!border-primary/40 group-[.toaster]:!shadow-[0_8px_32px_-4px_hsl(271_81%_40%/0.2),inset_0_1px_0_0_hsl(271_81%_40%/0.1)] group-[.toaster]:!bg-white",
          warning:
            "group-[.toaster]:!border-orange-400/40 group-[.toaster]:!shadow-[0_8px_32px_-4px_rgba(251,146,60,0.2),inset_0_1px_0_0_rgba(251,146,60,0.1)] group-[.toaster]:!bg-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
