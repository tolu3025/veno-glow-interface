import { Bike, RefreshCw, MapPin, Check, ChefHat, Home } from "lucide-react";
import MapboxMap, { type MapMarker } from "./MapboxMap";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrandTrackingCardProps {
  status: string; // open | accepted | in_progress | completed | cancelled
  etaMinutes?: number | null;
  distanceText?: string | null;
  address?: string | null;
  markers: MapMarker[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const STEPS = [
  { key: "confirmed", label: "Order\nConfirmed", icon: Check },
  { key: "preparing", label: "Preparing\nYour Order", icon: ChefHat },
  { key: "on_way", label: "On the\nWay", icon: Bike },
  { key: "delivered", label: "Delivered", icon: Home },
] as const;

function activeIndex(status: string) {
  switch (status) {
    case "open":
      return 0;
    case "accepted":
      return 1;
    case "in_progress":
      return 2;
    case "completed":
      return 3;
    default:
      return 0;
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "open":
      return "Awaiting runner";
    case "accepted":
      return "Preparing";
    case "in_progress":
      return "On the way";
    case "completed":
      return "Delivered";
    default:
      return status.replace("_", " ");
  }
}

const ErrandTrackingCard = ({
  status,
  etaMinutes,
  distanceText,
  address,
  markers,
  onRefresh,
  isRefreshing,
}: ErrandTrackingCardProps) => {
  const idx = activeIndex(status);
  const showEta = (status === "accepted" || status === "in_progress") && etaMinutes;

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-soft">
      {/* ETA pill */}
      <div className="px-3 pt-3">
        <div className="flex items-center gap-2 rounded-2xl bg-muted/50 border border-border px-3 py-2">
          <Bike className="h-4 w-4 text-primary shrink-0" />
          {showEta ? (
            <>
              <span className="text-sm font-bold text-primary whitespace-nowrap">
                Arriving in {etaMinutes} mins
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground truncate">{statusLabel(status)}</span>
            </>
          ) : (
            <span className="text-sm font-semibold text-foreground truncate">
              {statusLabel(status)}
            </span>
          )}
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-7 w-7 rounded-lg"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            </Button>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="px-3 pt-3">
        {markers.length > 0 ? (
          <div className="rounded-2xl overflow-hidden">
            <MapboxMap markers={markers} height="h-56" />
          </div>
        ) : (
          <div className="h-56 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Map unavailable — location not shared yet</p>
          </div>
        )}
      </div>

      {/* Stepper */}
      <div className="px-5 py-5">
        <div className="flex items-start justify-between gap-1">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const done = i <= idx;
            const isLast = i === STEPS.length - 1;
            return (
              <div key={step.key} className="flex-1 flex flex-col items-center relative">
                {/* connector line */}
                {!isLast && (
                  <div
                    className={cn(
                      "absolute top-5 left-1/2 w-full h-0.5",
                      i < idx ? "bg-primary" : "bg-border"
                    )}
                    style={{ zIndex: 0 }}
                  />
                )}
                <div
                  className={cn(
                    "relative z-10 h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                    done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p
                  className={cn(
                    "mt-2 text-[10px] text-center leading-tight whitespace-pre-line font-medium",
                    done ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Address strip */}
      {(address || distanceText) && (
        <div className="mx-3 mb-3 rounded-xl bg-primary/5 border border-primary/15 px-3 py-2.5 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <p className="text-xs text-foreground flex-1 truncate">{address ?? "Delivery location"}</p>
          {distanceText && (
            <span className="text-xs font-semibold text-primary whitespace-nowrap">
              {distanceText} away
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrandTrackingCard;
