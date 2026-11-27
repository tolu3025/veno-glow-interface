import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CountdownTimerProps {
  deadline: string; // ISO string
}

const CountdownTimer = ({ deadline }: CountdownTimerProps) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000 * 30); // update every 30s
    return () => clearInterval(id);
  }, []);

  const target = new Date(deadline).getTime();
  const diffMs = target - now;
  const isLate = diffMs < 0;
  const absMin = Math.floor(Math.abs(diffMs) / 60000);

  if (isLate) {
    return (
      <Badge className="gap-1 text-[10px] bg-destructive/15 text-destructive border-0">
        <AlertTriangle className="h-2.5 w-2.5" /> Delayed by {absMin}m
      </Badge>
    );
  }

  const isUrgent = absMin <= 5;
  return (
    <Badge
      className={`gap-1 text-[10px] border-0 ${
        isUrgent ? "bg-chart-4/20 text-chart-4 animate-pulse" : "bg-primary/15 text-primary"
      }`}
    >
      <Clock className="h-2.5 w-2.5" /> {absMin}m left
    </Badge>
  );
};

export default CountdownTimer;
