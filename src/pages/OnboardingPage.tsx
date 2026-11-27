import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronsRight, Bitcoin, Bike } from "lucide-react";


const ONBOARDED_KEY = "kuka_onboarded_v1";

const PhoneFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative mx-auto" style={{ width: 210, height: 300 }}>
    <div className="absolute inset-0 rounded-[32px] bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden">
      <div className="absolute top-2 left-1/2 -translate-x-1/2 h-4 w-16 rounded-full bg-slate-200/80" />
      <div className="flex items-center justify-between px-4 pt-1.5 text-[9px] text-slate-500 font-medium">
        <span>9:41</span>
        <span>● ● ●</span>
      </div>
      <div className="px-3.5 pt-5 h-full">{children}</div>
    </div>
  </div>
);

const SendMockup = () => (
  <PhoneFrame>
    <div className="text-[10px] text-slate-400">Send Money</div>
    <div className="mt-3 rounded-2xl bg-slate-100 p-3">
      <div className="text-[9px] text-slate-500">To</div>
      <div className="text-[13px] font-semibold text-slate-800">@adaeze · KukaPay</div>
    </div>
    <div className="mt-2.5 rounded-2xl bg-violet-100 p-3">
      <div className="text-[9px] text-slate-500">Amount</div>
      <div className="text-lg font-bold text-slate-900">₦ 12,500.00</div>
    </div>
    <div className="mt-3 h-8 rounded-full bg-slate-900 text-white text-[11px] font-semibold flex items-center justify-center">
      Send Instantly
    </div>
    <div className="mt-1.5 text-[9px] text-center text-slate-400">Zero fees · Instant</div>
  </PhoneFrame>
);

const AirtimeMockup = () => (
  <PhoneFrame>
    <div className="text-[10px] text-slate-400">Buy Data</div>
    <div className="mt-2.5 grid grid-cols-4 gap-1.5">
      {["MTN", "Glo", "Airtel", "9mob"].map((n, i) => (
        <div key={n} className={`text-[9px] py-1.5 rounded-lg font-semibold text-center ${i === 0 ? "bg-violet-100 text-violet-700 ring-1 ring-violet-400" : "bg-slate-100 text-slate-500"}`}>{n}</div>
      ))}
    </div>
    <div className="mt-2.5 space-y-1.5">
      {[
        { n: "1GB · 1 Day", p: "₦350" },
        { n: "2.5GB · 30 Days", p: "₦1,500" },
        { n: "5GB · 30 Days", p: "₦2,750" },
      ].map((p, i) => (
        <div key={p.n} className={`flex justify-between text-[10px] px-3 py-1.5 rounded-xl ${i === 1 ? "bg-violet-50 text-violet-700 font-semibold" : "bg-slate-50 text-slate-600"}`}>
          <span>{p.n}</span><span>{p.p}</span>
        </div>
      ))}
    </div>
    <div className="mt-2.5 h-7 rounded-full bg-slate-900 text-white text-[10px] font-semibold flex items-center justify-center">
      Purchase
    </div>
  </PhoneFrame>
);

const AjoMockup = () => (
  <PhoneFrame>
    <div className="text-[10px] text-slate-400">Group Savings</div>
    <div className="mt-1.5 text-[13px] font-bold text-slate-900">Hostel Ajo · Cycle 3</div>
    <div className="mt-2.5 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-400 p-3 text-white">
      <div className="text-[9px] opacity-80">Pool this week</div>
      <div className="text-xl font-extrabold">₦ 84,000</div>
      <div className="mt-0.5 text-[9px] opacity-80">7 of 12 members paid</div>
      <div className="mt-1.5 h-1 rounded-full bg-white/20 overflow-hidden">
        <div className="h-full bg-white" style={{ width: "58%" }} />
      </div>
    </div>
    <div className="mt-2.5 flex -space-x-1.5">
      {["bg-amber-400", "bg-emerald-400", "bg-sky-400", "bg-rose-400", "bg-indigo-400"].map((c, i) => (
        <div key={i} className={`h-5 w-5 rounded-full ring-2 ring-white ${c}`} />
      ))}
      <div className="h-5 w-5 rounded-full bg-slate-200 ring-2 ring-white text-[8px] flex items-center justify-center text-slate-600 font-semibold">+7</div>
    </div>
  </PhoneFrame>
);

const ErrandMockup = () => (
  <PhoneFrame>
    <div className="text-[10px] text-slate-400">Campus Errand</div>
    <div className="mt-2 rounded-2xl bg-slate-50 p-2.5">
      <div className="flex items-start gap-2">
        <div className="h-7 w-7 rounded-full bg-amber-400 flex items-center justify-center">
          <Bike className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] font-semibold text-slate-900">Pick up from Mama Put</div>
          <div className="text-[9px] text-slate-500">Hall 4 → Hostel B · 0.6 km</div>
        </div>
        <div className="text-[10px] font-bold text-violet-600">₦300</div>
      </div>
    </div>
    <div className="mt-2.5 h-24 rounded-2xl bg-gradient-to-br from-emerald-100 via-sky-100 to-indigo-100 relative overflow-hidden">
      <div className="absolute top-3 left-4 h-2.5 w-2.5 rounded-full bg-rose-500 ring-4 ring-rose-500/20" />
      <div className="absolute bottom-4 right-5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M10 15 Q 50 50, 90 85" stroke="#0f172a" strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
      </svg>
    </div>
    <div className="mt-2.5 h-7 rounded-full bg-slate-900 text-white text-[10px] font-semibold flex items-center justify-center">
      Accept Errand
    </div>
  </PhoneFrame>
);

const CryptoMockup = () => (
  <PhoneFrame>
    <div className="text-[10px] text-slate-400">Crypto Invoice</div>
    <div className="mt-1.5 text-[9px] text-slate-500">Expires in 30 minutes once payment is initiated.</div>
    <div className="mt-2.5 rounded-2xl bg-slate-100 p-2.5 flex justify-between">
      <div>
        <div className="text-[8px] text-slate-500">Amount Payable</div>
        <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
          <Bitcoin className="h-3 w-3 text-amber-500" /> 0.1220 BTC
        </div>
      </div>
      <div>
        <div className="text-[8px] text-slate-500">Validity</div>
        <div className="text-[11px] font-bold text-slate-900">7 days</div>
      </div>
    </div>
    <div className="mt-2.5 text-[10px] font-semibold text-slate-800">Payment Method</div>
    <div className="mt-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-[10px] flex items-center gap-2">
      <div className="h-3.5 w-3.5 rounded-full bg-slate-900" />
      <span className="text-slate-700">Algorand</span>
      <span className="ml-auto text-slate-400">▾</span>
    </div>
    <div className="mt-1.5 rounded-xl bg-slate-50 px-2.5 py-1.5 text-[10px] text-slate-500">440.982</div>
  </PhoneFrame>
);

type Slide = { key: string; title: string; body: string; Mockup: React.FC };

const SLIDES: Slide[] = [
  { key: "send", title: "Send money\ninstantly", body: "Move money to any KukaPay user or Nigerian bank in seconds. Zero fees, always.", Mockup: SendMockup },
  { key: "airtime", title: "Airtime & data\non every network", body: "Top up MTN, Glo, Airtel and 9mobile in one tap. We auto-detect your number's network.", Mockup: AirtimeMockup },
  { key: "ajo", title: "Group savings\nbuilt for trust", body: "Start an Ajo with friends, classmates or your hostel. Automatic collection, transparent payouts.", Mockup: AjoMockup },
  { key: "errand", title: "Campus errands\non demand", body: "Post a delivery or run errands for cash. Live map tracking from pickup to drop-off.", Mockup: ErrandMockup },
  { key: "crypto", title: "Accept crypto\npayments with ease", body: "Receive payments in crypto and convert instantly to Naira or Cedis with our smart invoicing.", Mockup: CryptoMockup },
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const next = () => {
    if (isLast) {
      setLoading(true);
      try { localStorage.setItem(ONBOARDED_KEY, "1"); } catch {}
      navigate("/register");
      return;
    }
    setIndex(i => i + 1);
  };

  const skipToLogin = () => {
    try { localStorage.setItem(ONBOARDED_KEY, "1"); } catch {}
    navigate("/login");
  };

  const touch = useMemo(() => ({ x: 0 }), []);
  const onTouchStart = (e: React.TouchEvent) => { touch.x = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touch.x;
    if (dx < -40 && !isLast) setIndex(i => i + 1);
    if (dx > 40 && index > 0) setIndex(i => i - 1);
  };

  return (
    <div
      className="min-h-screen flex flex-col px-6 pt-6 pb-6 text-white"
      style={{ background: "linear-gradient(180deg, #0a0a2e 0%, #15124a 60%, #1a1456 100%)" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top: brand + skip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-white shadow-md flex items-center justify-center">
            <img src="/kukapay-icon.png" alt="KukaPay" className="h-5 w-5 object-contain" />
          </div>
          <span className="text-sm font-extrabold tracking-tight">KukaPay</span>
        </div>
        <button onClick={skipToLogin} className="text-xs font-semibold text-white/60 hover:text-white">
          Skip
        </button>
      </div>

      {/* Progress segments */}
      <div className="mt-4 flex gap-1.5">
        {SLIDES.map((s, i) => (
          <div
            key={s.key}
            className={`flex-1 h-[3px] rounded-full transition-colors ${i <= index ? "bg-white" : "bg-white/15"}`}
          />
        ))}
      </div>

      {/* Mockup */}
      <div className="flex-1 flex items-center justify-center py-5">
        <slide.Mockup />
      </div>

      {/* Title + body */}
      <div className="text-center space-y-2 px-2">
        <h1 className="text-2xl font-extrabold tracking-tight leading-[1.15] whitespace-pre-line">
          {slide.title}
        </h1>
        <p className="text-[13px] text-white/65 leading-relaxed max-w-xs mx-auto">
          {slide.body}
        </p>
      </div>

      {/* CTA */}
      <div className="mt-5 space-y-2.5">
        <button
          onClick={next}
          disabled={loading}
          className="relative w-full h-12 rounded-full bg-white text-[#0a0a2e] font-semibold text-sm shadow-lg flex items-center justify-center active:scale-[0.99] transition-transform"
        >
          {loading && (
            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-9 px-3 bg-[#0a0a2e] rounded-full flex items-center gap-2 text-white text-[11px] font-semibold">
              <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Loading…
            </span>
          )}
          {isLast ? "Get Started" : "Continue"}
        </button>

        <button
          onClick={skipToLogin}
          className="w-full flex items-center justify-center gap-1.5 text-white/75 text-[13px] font-semibold"
        >
          I already have an account
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>

      {/* Powered by */}
      <div className="mt-5 flex flex-col items-center pt-2 border-t border-white/10">
        <span className="text-[9px] uppercase tracking-[0.2em] text-white/40">Powered by</span>
        <span className="mt-0.5 text-[10px] font-semibold text-white/75 tracking-wide text-center">
          KUKA TECHNOLOGY AND INNOVATION LTD
        </span>
      </div>

    </div>
  );
};

export default OnboardingPage;
