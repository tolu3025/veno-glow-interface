import { ReactNode } from "react";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export interface CartLine {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  lines: CartLine[];
  subtotal: number;
  onIncrement?: (id: string) => void;
  onDecrement?: (id: string) => void;
  onRemove?: (id: string) => void;
  /** Slot rendered between the cart lines and the footer — e.g. fulfillment + PIN inputs. */
  children?: ReactNode;
  /** Optional sticky footer (typically the checkout button). */
  footer?: ReactNode;
}

/**
 * Shared cart drawer — bottom sheet showing line items, subtotal,
 * a customizable middle section, and an optional footer.
 */
const CartDrawer = ({
  open,
  onOpenChange,
  title = "Your cart",
  lines,
  subtotal,
  onIncrement,
  onDecrement,
  onRemove,
  children,
  footer,
}: CartDrawerProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl p-0">
        <SheetHeader className="px-5 pt-5 pb-3 flex flex-row items-center justify-between space-y-0">
          <SheetTitle>{title}</SheetTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </SheetHeader>

        <div className="px-5 pb-6 space-y-4">
          {lines.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Your cart is empty.</p>
          ) : (
            <div className="space-y-2">
              {lines.map((line) => (
                <div key={line.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{line.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      ₦{line.price.toLocaleString()} × {line.qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {onDecrement && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => onDecrement(line.id)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    )}
                    <span className="w-6 text-center text-sm font-semibold">{line.qty}</span>
                    {onIncrement && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => onIncrement(line.id)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                    {onRemove && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => onRemove(line.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <span className="font-mono text-sm font-bold w-20 text-right">
                    ₦{(line.price * line.qty).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono font-bold">₦{subtotal.toLocaleString()}</span>
              </div>
            </div>
          )}

          {children}
        </div>

        {footer && (
          <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
