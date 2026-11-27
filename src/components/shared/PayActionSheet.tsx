import { Send, ArrowDownLeft, QrCode, FileText, Plus, ArrowUpFromLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface PayActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTIONS = [
  { icon: Send,            label: "Send",       sub: "to anyone",       path: "/send",      grad: "bg-grad-collections" },
  { icon: ArrowDownLeft,   label: "Request",    sub: "money back",      path: "/collect",   grad: "bg-grad-ajo" },
  { icon: QrCode,          label: "Scan QR",    sub: "pay merchant",    path: "/merchants", grad: "bg-grad-events" },
  { icon: FileText,        label: "Pay Bill",   sub: "collections",     path: "/collect",   grad: "bg-grad-airtime" },
  { icon: Plus,            label: "Add Money",  sub: "fund wallet",     path: "/add-money", grad: "bg-grad-merchants" },
  { icon: ArrowUpFromLine, label: "Withdraw",   sub: "to your bank",    path: "/withdraw",  grad: "bg-grad-errands" },
];

export const PayActionSheet = ({ open, onOpenChange }: PayActionSheetProps) => {
  const navigate = useNavigate();
  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t-0 px-5 pt-3 pb-8 max-w-[428px] md:max-w-2xl mx-auto"
      >
        <div className="mx-auto h-1.5 w-12 rounded-full bg-muted mb-5" />
        <div className="mb-5">
          <h2 className="text-[22px] font-bold tracking-tightish">Pay or send</h2>
          <p className="text-[13px] text-muted-foreground mt-0.5">Pick an action</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {ACTIONS.map((a) => (
            <button
              key={a.label}
              onClick={() => go(a.path)}
              className={`relative flex flex-col gap-3 p-4 rounded-[20px] text-left ${a.grad} press-scale`}
            >
              <div className="h-10 w-10 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <a.icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-foreground leading-tight">{a.label}</p>
                <p className="text-[11px] text-foreground/60 leading-tight mt-0.5">{a.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
