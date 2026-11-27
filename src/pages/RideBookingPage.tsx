import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bus, CalendarDays, MapPin, Ticket, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PasscodePad } from "@/components/shared/PasscodePad";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import toyesekLogo from "@/assets/toyesek-logo.png.asset.json";
import {
  getRideCatalog, getRideAvailability, bookRide, listMyRides,
} from "@/lib/rides.functions";

const naira = (n: number) => `₦${Number(n || 0).toLocaleString()}`;

const RideBookingPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<any[]>([]);
  const [landmarks, setLandmarks] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  const [routeId, setRouteId] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [landmarkId, setLandmarkId] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [seats, setSeats] = useState(1);
  const [fare, setFare] = useState(0);
  const [seatsLeft, setSeatsLeft] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [cat, mine] = await Promise.all([getRideCatalog(), listMyRides()]);
        setRoutes(cat.routes ?? []);
        setLandmarks(cat.landmarks ?? []);
        setPeriods(cat.periods ?? []);
        setBookings(mine.bookings ?? []);
        if (cat.error) toast.error(cat.error);
      } catch {
        toast.error("Could not load trips right now. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const routeLandmarks = useMemo(
    () =>
      landmarks.filter(
        (l: any) => !routeId || l.route_id === routeId || l.routeId === routeId,
      ),
    [landmarks, routeId],
  );

  const routePeriods = useMemo(
    () =>
      periods.filter(
        (p: any) => !routeId || !p.route_id || p.route_id === routeId,
      ),
    [periods, routeId],
  );

  const selectedPeriod = periods.find((p) => p.id === periodId);
  const today = new Date().toISOString().slice(0, 10);
  const windowStart: string | null = selectedPeriod?.start_date ?? null;
  const windowEnd: string | null = selectedPeriod?.end_date ?? null;
  const minDate = windowStart && windowStart > today ? windowStart : (windowStart ?? today);
  const prettyDate = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "long" });
  const dateOutOfWindow = Boolean(
    travelDate && ((windowStart && travelDate < windowStart) || (windowEnd && travelDate > windowEnd)),
  );

  // Drop a date that no longer fits the selected travel window.
  useEffect(() => {
    if (dateOutOfWindow) setTravelDate("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodId]);

  const selectedRoute = routes.find((r) => r.id === routeId);
  const routeName = selectedRoute?.name ?? "";
  const landmarkName = routeLandmarks.find((l) => l.id === landmarkId)?.name ?? "";
  // Some travel windows carry no price of their own — fall back to the route fare.
  const effectiveFare = fare > 0 ? fare : Number(selectedRoute?.price ?? 0);
  const total = effectiveFare * seats;

  useEffect(() => {
    if (!periodId || !travelDate) {
      setSeatsLeft(null);
      return;
    }
    let cancelled = false;
    setChecking(true);
    getRideAvailability({ data: { vacation_period_id: periodId, travel_date: travelDate } })
      .then((r) => {
        if (cancelled) return;
        setSeatsLeft(r.available);
        if (r.price > 0) setFare(r.price);
        if (r.error) toast.error(r.error);
      })
      .catch(() => {})
      .finally(() => !cancelled && setChecking(false));
    return () => { cancelled = true; };
  }, [periodId, travelDate]);

  useEffect(() => {
    const p = periods.find((x) => x.id === periodId);
    setFare(Number(p?.price ?? 0));
  }, [periodId, periods]);

  const canBook = Boolean(
    routeId && periodId && landmarkId && travelDate && effectiveFare > 0 && !dateOutOfWindow,
  );

  const handlePin = async (pin: string) => {
    setSubmitting(true);
    try {
      const res = await bookRide({
        data: {
          vacation_period_id: periodId,
          landmark_id: landmarkId,
          travel_date: travelDate,
          pin,
          amount: effectiveFare,
          seats,
          route_id: routeId,
          route_name: routeName,
          landmark_name: landmarkName,
        },
      });
      if (!res.success) {
        toast.error(res.error ?? "Booking failed");
        return;
      }
      setShowPin(false);
      toast.success("Seat booked! Here is your receipt.");
      const mine = await listMyRides();
      const list = mine.bookings ?? [];
      setBookings(list);
      setReceipt(
        list.find((b: any) => b.payment_reference === res.reference) ?? {
          route_name: routeName,
          landmark_name: landmarkName,
          travel_date: travelDate,
          seats,
          amount: res.amount,
          payment_reference: res.reference,
          status: "confirmed",
          verification_code: (res as any).verification_code ?? null,
          qr_payload: (res as any).qr_payload ?? null,
          created_at: new Date().toISOString(),
        },
      );
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
      setPin("");
    }
  };

  if (showPin) {
    return (
      <div className="px-5 pt-10 pb-28 max-w-md mx-auto space-y-6">
        <button
          onClick={() => {
            setShowPin(false);
            setPin("");
          }}
          disabled={submitting}
          className="h-9 w-9 rounded-full bg-muted flex items-center justify-center disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PasscodePad
          value={pin}
          onChange={setPin}
          title="Confirm booking"
          subtitle={`Pay ${naira(total)} for ${seats} seat${seats > 1 ? "s" : ""}`}
          onComplete={handlePin}
          loading={submitting}
        />
      </div>
    );
  }



  return (
    <div className="px-5 pt-10 pb-28 space-y-5 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold">Book a Ride</h1>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-4 flex items-center gap-3">
          <img
            src={toyesekLogo.url}
            alt="Toyesek Transport System"
            className="h-11 w-11 rounded-xl object-cover"
          />
          <div>
            <p className="text-sm font-bold leading-tight">Toyesek Transport System</p>
            <p className="text-[12px] text-muted-foreground">
              Inter-state trips paid straight from your wallet
            </p>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Route</Label>
              <Select value={routeId} onValueChange={(v) => { setRouteId(v); setLandmarkId(""); }}>
                <SelectTrigger><SelectValue placeholder="Where are you going?" /></SelectTrigger>
                <SelectContent>
                  {routes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Travel window</Label>
              <Select value={periodId} onValueChange={setPeriodId}>
                <SelectTrigger>
                  <SelectValue placeholder={routePeriods.length ? "Select a window" : "No trips open yet"} />
                </SelectTrigger>
                <SelectContent>
                  {routePeriods.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name ?? p.title ?? "Trip window"}
                      {p.price ? ` — ${naira(p.price)}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!routePeriods.length && (
                <p className="text-[11px] text-muted-foreground">
                  Toyesek has no open trips right now. Check back soon.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Pickup point
              </Label>
              <Select value={landmarkId} onValueChange={setLandmarkId}>
                <SelectTrigger><SelectValue placeholder="Where should we pick you up?" /></SelectTrigger>
                <SelectContent>
                  {routeLandmarks.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> Travel date
                </Label>
                <Input
                  type="date"
                  value={travelDate}
                  min={minDate}
                  max={windowEnd ?? undefined}
                  onChange={(e) => setTravelDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Seats</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={seats}
                  onChange={(e) => setSeats(Math.max(1, Math.min(5, Number(e.target.value) || 1)))}
                />
              </div>
            </div>

            {windowStart && windowEnd && (
              <p className={`text-[11px] ${dateOutOfWindow ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                Choose a date between {prettyDate(windowStart)} and {prettyDate(windowEnd)}.
              </p>
            )}

            {checking && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Checking seats…
              </p>
            )}
            {seatsLeft !== null && !checking && (
              <p className="text-[11px] text-muted-foreground">
                {seatsLeft > 0 ? `${seatsLeft} seat(s) left on this date` : "No seats left on this date"}
              </p>
            )}

            <div className="rounded-xl bg-muted/60 p-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total</span>
              <span className="text-base font-bold">{effectiveFare > 0 ? naira(total) : "—"}</span>
            </div>

            <Button
              className="w-full gap-2"
              size="lg"
              disabled={!canBook || seatsLeft === 0}
              onClick={() => setShowPin(true)}
            >
              <Bus className="h-4 w-4" /> Pay & book seat
            </Button>
          </CardContent>
        </Card>
      )}

      {bookings.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">My bookings</h2>
          {bookings.map((b) => (
            <Card key={b.id} onClick={() => setReceipt(b)} className="cursor-pointer">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Ticket className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate">
                    {b.route_name ?? "Trip"} · {b.travel_date}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {b.landmark_name ?? "Pickup"} · {b.seats} seat(s) · {b.status}
                  </p>
                </div>
                <span className="text-[13px] font-bold">{naira(b.amount)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!receipt} onOpenChange={(o) => !o && setReceipt(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ride receipt</DialogTitle>
          </DialogHeader>
          {receipt && (
            <div className="space-y-3">
              <div className="text-center space-y-1">
                <div className="mx-auto h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Ticket className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold">{naira(receipt.amount)}</p>
                <p className="text-[12px] text-muted-foreground capitalize">
                  {receipt.status ?? "confirmed"}
                </p>
              </div>

              {(() => {
                const meta = receipt.metadata ?? {};
                const code = receipt.verification_code ?? meta.verification_code ?? null;
                const payload =
                  receipt.qr_payload ?? meta.qr_payload ?? code ?? receipt.payment_reference;
                if (!code && !payload) return null;
                return (
                  <div className="rounded-xl border p-4 flex flex-col items-center gap-3">
                    <div className="bg-white p-3 rounded-lg">
                      <QRCodeSVG value={String(payload)} size={148} level="M" />
                    </div>
                    {code && (
                      <div className="text-center">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                          Verification code
                        </p>
                        <p className="text-xl font-bold tracking-[0.3em] font-mono">{code}</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="rounded-xl bg-muted/60 p-3 space-y-2 text-[12px]">
                {[
                  ["Trip", receipt.route_name ?? "Trip"],
                  ["Pickup", receipt.landmark_name ?? "-"],
                  ["Travel date", receipt.travel_date],
                  ["Seats", String(receipt.seats ?? 1)],
                  ["Reference", receipt.payment_reference ?? "-"],
                  ["Booked", new Date(receipt.created_at ?? Date.now()).toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between gap-3">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium text-right break-all">{v}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                Show this QR code or verification code to the Toyesek driver at your pickup point.
              </p>
              <Button className="w-full" onClick={() => setReceipt(null)}>Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RideBookingPage;
