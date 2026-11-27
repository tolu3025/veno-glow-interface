import { useEffect, useState } from "react";

const pad = (n: number) => n.toString().padStart(2, "0");

export function LockCountdown({ matureAt, compact }: { matureAt: string; compact?: boolean }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = new Date(matureAt).getTime() - now;
  if (ms <= 0) return <span className="text-accent font-semibold">Unlocked ✨</span>;
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (compact) return <span className="tabular-nums">{d}d {pad(h)}:{pad(m)}:{pad(s)}</span>;
  return (
    <div className="flex gap-2 tabular-nums">
      <TimeBlock v={d} label="days" />
      <TimeBlock v={h} label="hrs" />
      <TimeBlock v={m} label="min" />
      <TimeBlock v={s} label="sec" />
    </div>
  );
}

function TimeBlock({ v, label }: { v: number; label: string }) {
  return (
    <div className="flex-1 rounded-xl bg-white/10 backdrop-blur px-3 py-2 text-center">
      <div className="text-2xl font-bold leading-none">{pad(v)}</div>
      <div className="text-[10px] uppercase tracking-wider opacity-70 mt-1">{label}</div>
    </div>
  );
}
