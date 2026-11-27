import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRightLeft, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useUsdWallet } from "@/hooks/useUsdWallet";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { fmtUSD, fmtNGN } from "@/lib/vaultChallenges";
import { toast } from "@/hooks/use-toast";

type Direction = "ngn_to_usd" | "usd_to_ngn";

interface Quote {
  quote_id: string;
  rate: number;
  ngn_amount: number;
  usd_amount: number;
  expires_at: string;
}

export default function ConvertPage() {
  const navigate = useNavigate();
  const { wallet: ngnWallet, refreshWallet } = useAuth();
  const { wallet: usdWallet, refresh: refreshUsd } = useUsdWallet();
  const [direction, setDirection] = useState<Direction>("ngn_to_usd");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const ngnBalance = Number(ngnWallet?.balance ?? 0);
  const usdBalance = Number(usdWallet?.available_usd ?? 0);

  useEffect(() => {
    if (!quote) return;
    const t = setInterval(() => {
      const s = Math.max(0, Math.floor((new Date(quote.expires_at).getTime() - Date.now()) / 1000));
      setSecondsLeft(s);
      if (s <= 0) { setQuote(null); clearInterval(t); }
    }, 500);
    return () => clearInterval(t);
  }, [quote]);

  const getQuote = async () => {
    const n = Number(amount);
    if (!n || n <= 0) return toast({ title: "Enter an amount", variant: "destructive" });
    setLoading(true);
    try {
      const body: any = { direction };
      if (direction === "ngn_to_usd") body.ngn_amount = n;
      else body.usd_amount = n;
      const q = await friendlyInvoke<Quote>("fx-quote", { body });
      setQuote(q);
    } catch (e: any) {
      toast({ title: e.message || "Could not fetch rate", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const confirm = async () => {
    if (!quote) return;
    setConfirming(true);
    try {
      const r = await friendlyInvoke<any>("fx-convert", { body: { quote_id: quote.quote_id } });
      await Promise.all([refreshWallet(), refreshUsd()]);
      toast({ title: "Conversion complete 🎉" });
      // On successful NGN→USD, offer to lock
      if (direction === "ngn_to_usd") {
        navigate("/vault/lock/select", { state: { justConverted: r.usd_amount } });
      } else {
        navigate("/vault");
      }
    } catch (e: any) {
      toast({ title: e.message || "Conversion failed", variant: "destructive" });
    } finally { setConfirming(false); }
  };

  const flip = () => {
    setDirection(direction === "ngn_to_usd" ? "usd_to_ngn" : "ngn_to_usd");
    setAmount("");
    setQuote(null);
  };

  return (
    <div className="px-5 pt-12 pb-[calc(9rem+env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="h-9 w-9 -ml-2 flex items-center justify-center rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[22px] font-bold tracking-tightish">Convert</h1>
      </header>

      {!quote ? (
        <>
          {/* From */}
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">From</span>
              <span className="text-xs text-muted-foreground">
                Bal: {direction === "ngn_to_usd" ? fmtNGN(ngnBalance) : fmtUSD(usdBalance)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{direction === "ngn_to_usd" ? "🇳🇬" : "🇺🇸"}</span>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border-0 shadow-none text-3xl font-bold h-14 p-0 focus-visible:ring-0 tabular-nums"
              />
              <span className="font-bold text-muted-foreground">{direction === "ngn_to_usd" ? "NGN" : "USD"}</span>
            </div>
          </div>

          {/* Flip */}
          <div className="flex justify-center my-2">
            <button onClick={flip} className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center press-scale">
              <ArrowRightLeft className="h-4 w-4 text-primary rotate-90" />
            </button>
          </div>

          {/* To */}
          <div className="rounded-2xl bg-muted/50 p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">To</div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{direction === "ngn_to_usd" ? "🇺🇸" : "🇳🇬"}</span>
              <span className="text-xl font-bold flex-1 text-muted-foreground">Tap "Get rate" to see</span>
              <span className="font-bold text-muted-foreground">{direction === "ngn_to_usd" ? "USD" : "NGN"}</span>
            </div>
          </div>

          <Button
            className="w-full h-14 rounded-2xl mt-6"
            size="lg"
            disabled={loading || !amount}
            onClick={getQuote}
          >
            {loading ? "Fetching rate..." : "Get rate"}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Minimum ₦1,000 / $1 · Live rate locked for 60 seconds at confirm
          </p>
        </>
      ) : (
        <>
          <div className="rounded-3xl p-6 text-white shadow-soft-lg"
               style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #4a90c2 100%)" }}>
            <div className="text-xs uppercase tracking-wider opacity-80">
              Locked rate
            </div>
            <div className="text-3xl font-bold mt-2 tabular-nums">
              $1 = {fmtNGN(quote.rate)}
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex justify-between">
                <span className="opacity-70">You pay</span>
                <span className="font-bold">
                  {direction === "ngn_to_usd" ? fmtNGN(quote.ngn_amount) : fmtUSD(quote.usd_amount)}
                </span>
              </div>
              <div className="flex justify-between text-xl">
                <span className="opacity-70">You get</span>
                <span className="font-bold">
                  {direction === "ngn_to_usd" ? fmtUSD(quote.usd_amount) : fmtNGN(quote.ngn_amount)}
                </span>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs opacity-80">
              <Timer className="h-4 w-4" />
              Expires in {secondsLeft}s
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <Button variant="outline" className="h-14 rounded-2xl" onClick={() => setQuote(null)}>
              Cancel
            </Button>
            <Button className="h-14 rounded-2xl" disabled={confirming || secondsLeft <= 0} onClick={confirm}>
              {confirming ? "Converting..." : "Confirm"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
