import {
  ArrowLeft, Plus, MapPin, Clock, Zap, AlertTriangle, CheckCircle,
  Play, Flag, Loader2, Briefcase, Navigation, Store, Truck,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { formatDistanceToNow } from "date-fns";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { haversineDistance, formatDistance } from "@/lib/haversine";
import { maskCoord } from "@/lib/mapbox";
import MapboxMap, { type MapMarker } from "@/components/errands/MapboxMap";
import ErrandTrackingCard from "@/components/errands/ErrandTrackingCard";
import CountdownTimer from "@/components/errands/CountdownTimer";
import CampusBadge from "@/components/shared/CampusBadge";
import { useCampusCoverage } from "@/hooks/useCampusCoverage";

// Zones fetched dynamically from DB

interface Errand {
  id: string;
  title: string;
  description: string | null;
  zone: string | null;
  amount: number;
  urgency: string;
  status: string;
  requester_id: string;
  helper_id: string | null;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  requester_lat: number | null;
  requester_lng: number | null;
  helper_lat: number | null;
  helper_lng: number | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  errand_type: string | null;
  merchant_id: string | null;
  item_cost: number;
  delivery_fee: number;
  estimated_minutes: number | null;
  delivery_deadline: string | null;
}

interface Assignment {
  id: string;
  errand_id: string;
  helper_id: string;
  status: string;
  amount_held: number;
  dispute_flag: boolean;
  created_at: string;
}

const ErrandsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { latitude, longitude, requestLocation, error: geoError } = useGeolocation();
  const { campus, hasRunners, loading: coverageLoading } = useCampusCoverage();
  const [zones, setZones] = useState<string[]>(["All Zones"]);
  const [zone, setZone] = useState("All Zones");
  const [errands, setErrands] = useState<Errand[]>([]);
  const [myErrands, setMyErrands] = useState<Errand[]>([]);
  const [helpingErrands, setHelpingErrands] = useState<Errand[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedErrand, setSelectedErrand] = useState<Errand | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [pendingAcceptId, setPendingAcceptId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [walkingDistances, setWalkingDistances] = useState<Record<string, { km: number; min: number }>>({});
  const [radiusKm, setRadiusKm] = useState<number>(5); // 2, 5, 10, or 0 (Any)

  // Fetch zones from DB
  useEffect(() => {
    supabase.from("errand_zones").select("name").eq("is_active", true).order("name").then(({ data }) => {
      if (data?.length) setZones(["All Zones", ...data.map((z: any) => z.name)]);
    });
  }, []);

  const fetchErrands = async () => {
    setLoading(true);
    let query = supabase.from("errand_requests").select("*").eq("status", "open").order("created_at", { ascending: false });
    if (zone !== "All Zones") query = query.eq("zone", zone);
    const { data } = await query;
    setErrands((data as Errand[]) ?? []);

    if (user) {
      const [{ data: mine }, { data: helping }, { data: assigns }] = await Promise.all([
        supabase.from("errand_requests").select("*").eq("requester_id", user.id).order("created_at", { ascending: false }),
        supabase.from("errand_requests").select("*").eq("helper_id", user.id).order("created_at", { ascending: false }),
        supabase.from("errand_assignments").select("*").eq("helper_id", user.id),
      ]);
      setMyErrands((mine as Errand[]) ?? []);
      setHelpingErrands((helping as Errand[]) ?? []);
      setAssignments((assigns as Assignment[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchErrands(); }, [zone, user]);

  // Request user location on mount for distance calculations
  useEffect(() => {
    requestLocation().then((coords) => {
      if (coords) setUserLocation(coords);
    });
  }, []);

  const getDistanceToErrand = useCallback((errand: Errand): string | null => {
    // Prefer Mapbox walking distance when available
    const walking = walkingDistances[errand.id];
    if (walking) return `${walking.km} km · ${walking.min} min walk`;
    if (!userLocation) return null;
    const eLat = errand.requester_lat || errand.delivery_lat;
    const eLng = errand.requester_lng || errand.delivery_lng;
    if (!eLat || !eLng) return null;
    const dist = haversineDistance(userLocation.lat, userLocation.lng, eLat, eLng);
    return formatDistance(dist);
  }, [userLocation, walkingDistances]);

  // Mapbox-based runner radius re-ranking: fetch real walking distances for nearby open errands
  useEffect(() => {
    if (!userLocation || errands.length === 0) return;
    const candidates = errands
      .map((e) => {
        const lat = e.requester_lat || e.delivery_lat;
        const lng = e.requester_lng || e.delivery_lng;
        if (!lat || !lng) return null;
        // Pre-filter with haversine to ~3km so we stay under the 24-destination Matrix cap
        const haversineKm = haversineDistance(userLocation.lat, userLocation.lng, lat, lng);
        if (haversineKm > 3) return null;
        return { id: e.id, lat, lng, haversineKm };
      })
      .filter((x): x is { id: string; lat: number; lng: number; haversineKm: number } => x !== null)
      .sort((a, b) => a.haversineKm - b.haversineKm)
      .slice(0, 24);

    if (candidates.length === 0) return;

    const handle = setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("mapbox-proxy", {
          body: {
            action: "matrix",
            origin: { lat: userLocation.lat, lng: userLocation.lng },
            destinations: candidates.map((c) => ({ lat: c.lat, lng: c.lng })),
            profile: "walking",
          },
        });
        if (error || !data?.success) return;
        const next: Record<string, { km: number; min: number }> = {};
        (data.results as Array<{ distance_km: number | null; duration_min: number | null }>).forEach((r, i) => {
          if (r.distance_km != null && r.duration_min != null) {
            next[candidates[i].id] = { km: r.distance_km, min: r.duration_min };
          }
        });
        setWalkingDistances(next);
      } catch (e) {
        // Silently fall back to haversine
        console.warn("[ErrandsPage] matrix re-rank failed", e);
      }
    }, 400); // debounce

    return () => clearTimeout(handle);
  }, [userLocation, errands]);

  // Build map markers from errands with coordinates
  // Mask coordinates on the public feed for privacy — runners only see approximate area until they accept
  const mapMarkers: MapMarker[] = errands
    .filter(e => e.requester_lat && e.requester_lng)
    .map(e => ({
      lat: maskCoord(e.requester_lat!),
      lng: maskCoord(e.requester_lng!),
      label: `${e.title} — ₦${e.amount.toLocaleString()} (approx. area)`,
      type: "requester" as const,
    }));

  const handleAcceptWithLocation = async (errandId: string) => {
    setPendingAcceptId(errandId);
    setShowLocationPrompt(true);
  };

  const handleLocationResponse = async (shareLocation: boolean) => {
    if (!pendingAcceptId) return;
    
    let helperCoords: { lat: number; lng: number } | null = null;
    if (shareLocation) {
      helperCoords = await requestLocation();
      if (!helperCoords && geoError) {
        toast.error(geoError);
        setShowLocationPrompt(false);
        setPendingAcceptId(null);
        return;
      }
    }

    setActionLoading(pendingAcceptId);
    setShowLocationPrompt(false);

    try {
      await friendlyInvoke("manage-errand", {
        body: {
          action: "accept",
          errand_id: pendingAcceptId,
          helper_lat: helperCoords?.lat,
          helper_lng: helperCoords?.lng,
        },
      }, "Failed to accept errand");
      toast.success("Errand accepted! Funds held in escrow.");
      setSelectedErrand(null);
      fetchErrands();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
      setPendingAcceptId(null);
    }
  };

  const handleUpdateStatus = async (errandId: string, newStatus: string) => {
    setActionLoading(errandId);
    try {
      await friendlyInvoke("manage-errand", {
        body: { action: "update_status", errand_id: errandId, status: newStatus },
      }, "Failed to update status");
      toast.success("Status updated!");
      fetchErrands();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (errandId: string) => {
    setActionLoading(errandId);
    try {
      await friendlyInvoke("manage-errand", {
        body: { action: "complete", errand_id: errandId },
      }, "Failed to complete errand");
      toast.success("Errand completed! Funds released to helper.");
      fetchErrands();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDispute = async (errandId: string) => {
    setActionLoading(errandId);
    try {
      await friendlyInvoke("manage-errand", {
        body: { action: "dispute", errand_id: errandId },
      }, "Failed to flag dispute");
      toast.success("Dispute flagged. Admin will review.");
      fetchErrands();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-accent/15 text-accent";
      case "accepted": return "bg-primary/15 text-primary";
      case "in_progress": return "bg-chart-4/15 text-chart-4";
      case "completed": return "bg-accent/15 text-accent";
      case "cancelled": return "bg-destructive/15 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Distance between requester and helper for active errands
  const getActiveDistance = (errand: Errand): string | null => {
    if (!errand.requester_lat || !errand.requester_lng || !errand.helper_lat || !errand.helper_lng) return null;
    const dist = haversineDistance(
      errand.requester_lat, errand.requester_lng,
      errand.helper_lat, errand.helper_lng
    );
    return formatDistance(dist);
  };

  const ErrandCard = ({ errand, showActions = false }: { errand: Errand; showActions?: boolean }) => {
    const isRequester = errand.requester_id === user?.id;
    const isHelper = errand.helper_id === user?.id;
    const assignment = assignments.find(a => a.errand_id === errand.id);
    const isLoading = actionLoading === errand.id;
    const distFromUser = showActions ? getDistanceToErrand(errand) : null;
    const activeDistance = getActiveDistance(errand);

    // Build markers for this specific errand's map
    const errandMarkers: MapMarker[] = [];
    if (errand.requester_lat && errand.requester_lng) {
      errandMarkers.push({ lat: errand.requester_lat, lng: errand.requester_lng, label: "Requester", type: "requester" });
    }
    if (errand.helper_lat && errand.helper_lng) {
      errandMarkers.push({ lat: errand.helper_lat, lng: errand.helper_lng, label: "Helper", type: "helper" });
    }
    if (errand.delivery_lat && errand.delivery_lng) {
      errandMarkers.push({ lat: errand.delivery_lat, lng: errand.delivery_lng, label: "Delivery", type: "delivery" });
    }

    return (
      <Card className="overflow-hidden cursor-pointer transition hover:border-primary/40" onClick={() => setSelectedErrand(errand)}>
        <CardContent className="p-4 space-y-3" onClickCapture={(e) => {
          // allow inner buttons to handle their own clicks
          const target = e.target as HTMLElement;
          if (target.closest("button")) e.stopPropagation();
        }}>
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {errand.errand_type === "merchant" && (
                  <Badge className="text-[9px] bg-primary/15 text-primary border-0 gap-0.5">
                    <Store className="h-2.5 w-2.5" /> Store
                  </Badge>
                )}
                <h3 className="font-semibold text-sm truncate">{errand.title}</h3>
              </div>
              {errand.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{errand.description}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              {errand.errand_type === "merchant" ? (
                <div className="space-y-0.5">
                  <p className="font-mono text-[10px] text-muted-foreground">Items: ₦{errand.item_cost.toLocaleString()}</p>
                  <p className="font-mono font-bold text-accent">
                    <Truck className="h-3 w-3 inline mr-0.5" />₦{errand.delivery_fee.toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="font-mono font-bold text-primary">₦{errand.amount.toLocaleString()}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {errand.zone && (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <MapPin className="h-2.5 w-2.5" /> {errand.zone}
              </Badge>
            )}
            {errand.urgency === "urgent" && (
              <Badge className="gap-1 text-[10px] bg-destructive/15 text-destructive border-0">
                <Zap className="h-2.5 w-2.5" /> Urgent
              </Badge>
            )}
            <Badge className={`text-[10px] border-0 ${statusColor(errand.status)}`}>
              {errand.status.replace("_", " ")}
            </Badge>
            {/* Distance from user */}
            {distFromUser && (
              <Badge variant="outline" className="gap-1 text-[10px] text-primary border-primary/30">
                <Navigation className="h-2.5 w-2.5" /> {distFromUser}
              </Badge>
            )}
            {/* Distance between requester and helper */}
            {activeDistance && (errand.status === "accepted" || errand.status === "in_progress") && (
              <Badge variant="outline" className="gap-1 text-[10px] text-accent border-accent/30">
                <Navigation className="h-2.5 w-2.5" /> Helper {activeDistance}
              </Badge>
            )}
            {/* Estimated time */}
            {errand.estimated_minutes && (errand.status === "accepted" || errand.status === "in_progress") && (
              <Badge variant="outline" className="gap-1 text-[10px] text-chart-4 border-chart-4/30">
                <Clock className="h-2.5 w-2.5" /> ~{errand.estimated_minutes} min
              </Badge>
            )}
            {/* Live countdown when deadline is set */}
            {errand.delivery_deadline && (errand.status === "accepted" || errand.status === "in_progress") && (
              <CountdownTimer deadline={errand.delivery_deadline} />
            )}
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-auto">
              <Clock className="h-2.5 w-2.5" />
              {formatDistanceToNow(new Date(errand.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Mini map for active errands with locations */}
          {errandMarkers.length > 1 && (isRequester || isHelper) && (
            <MapboxMap markers={errandMarkers} />
          )}

          {/* Actions for feed (open errands) */}
          {showActions && errand.status === "open" && !isRequester && (
            <Button
              size="sm"
              className="w-full gap-1"
              onClick={() => handleAcceptWithLocation(errand.id)}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Briefcase className="h-3 w-3" />}
              Accept Errand
            </Button>
          )}

          {/* Actions for my errands (as requester) */}
          {isRequester && errand.status === "in_progress" && (
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 gap-1" onClick={() => handleComplete(errand.id)} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                Confirm Done
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => handleDispute(errand.id)} disabled={isLoading}>
                <Flag className="h-3 w-3" /> Dispute
              </Button>
            </div>
          )}

          {isRequester && errand.status === "accepted" && (
            <p className="text-xs text-muted-foreground text-center">Waiting for helper to start...</p>
          )}

          {/* Actions for helping errands (as helper) */}
          {isHelper && errand.status === "accepted" && (
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 gap-1" onClick={() => handleUpdateStatus(errand.id, "in_progress")} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                Start Errand
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => handleDispute(errand.id)} disabled={isLoading}>
                <Flag className="h-3 w-3" /> Dispute
              </Button>
            </div>
          )}

          {isHelper && errand.status === "in_progress" && (
            <div className="flex gap-2">
              <p className="text-xs text-muted-foreground flex-1">Waiting for requester to confirm completion...</p>
              <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => handleDispute(errand.id)} disabled={isLoading}>
                <Flag className="h-3 w-3" />
              </Button>
            </div>
          )}

          {assignment?.dispute_flag && (
            <div className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3" /> Dispute flagged — admin reviewing
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Feed: filter by selected radius (when location known); when no location, show all
  const enrichedAll = errands.map((e) => {
    const walking = walkingDistances[e.id];
    const lat = e.requester_lat || e.delivery_lat;
    const lng = e.requester_lng || e.delivery_lng;
    const haversineKm = userLocation && lat && lng
      ? haversineDistance(userLocation.lat, userLocation.lng, lat, lng)
      : Infinity;
    const km = walking?.km ?? haversineKm;
    return { e, km };
  });
  const visibleErrands = (() => {
    if (!userLocation || radiusKm === 0) return enrichedAll.sort((a, b) => a.km - b.km).map((x) => x.e);
    return enrichedAll
      .filter((x) => x.km === Infinity || x.km <= radiusKm)
      .sort((a, b) => a.km - b.km)
      .map((x) => x.e);
  })();
  const hiddenCount = enrichedAll.length - visibleErrands.length;

  return (
    <div className="px-5 pt-10 pb-24 space-y-5 max-w-md mx-auto">
      {/* Location Prompt */}
      {showLocationPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5">
          <Card className="w-full max-w-sm">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Share Your Location?</h3>
                <Alert>
                  <MapPin className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Sharing your location helps the requester track your progress and makes delivery easier. This is optional.
                  </AlertDescription>
                </Alert>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleLocationResponse(false)}
                >
                  Skip
                </Button>
                <Button
                  className="flex-1 gap-1"
                  onClick={() => handleLocationResponse(true)}
                >
                  <MapPin className="h-4 w-4" />
                  Share Location
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <h1 className="text-lg font-bold">Errands</h1>
        </div>
        <Button size="sm" className="gap-1" onClick={() => navigate("/errands/new")} disabled={!coverageLoading && !!campus && !hasRunners}>
          <Plus className="h-4 w-4" /> Post
        </Button>
      </div>

      <CampusBadge variant="banner" />

      {!coverageLoading && campus && !hasRunners && (
        <Alert className="border-accent/30 bg-accent/5">
          <Briefcase className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Runners aren't active at <strong>{campus.name}</strong> yet. You can still browse, but posting is paused until the first runner joins your school.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4 mt-2">
        {/* My posted errands */}
        {myErrands.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Posted by me</h3>
            <div className="space-y-3">
              {myErrands.map(e => <ErrandCard key={e.id} errand={e} />)}
            </div>
          </div>
        )}

        {/* Errands I'm helping with (kept for users who already accepted before runner-portal split) */}
        {helpingErrands.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Helping with</h3>
            <div className="space-y-3">
              {helpingErrands.map(e => <ErrandCard key={e.id} errand={e} />)}
            </div>
          </div>
        )}

        {myErrands.length === 0 && helpingErrands.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <Briefcase className="h-10 w-10 text-muted-foreground/50 mx-auto" />
            <p className="text-sm text-muted-foreground">No errands yet</p>
            <Button size="sm" variant="outline" onClick={() => navigate("/errands/new")}>
              Post your first errand
            </Button>
          </div>
        )}
      </div>

      {/* Errand Detail Sheet — order details, map, delivery confirmation */}
      <Sheet open={!!selectedErrand} onOpenChange={(o) => !o && setSelectedErrand(null)}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
          {selectedErrand && (() => {
            const e = selectedErrand;
            const isRequester = e.requester_id === user?.id;
            const isHelper = e.helper_id === user?.id;
            const assignment = assignments.find(a => a.errand_id === e.id);
            const isLoading = actionLoading === e.id;
            const detailMarkers: MapMarker[] = [];
            if (e.requester_lat && e.requester_lng) detailMarkers.push({ lat: e.requester_lat, lng: e.requester_lng, label: "Pickup / Requester", type: "requester" });
            if (e.helper_lat && e.helper_lng) detailMarkers.push({ lat: e.helper_lat, lng: e.helper_lng, label: "Helper", type: "helper" });
            if (e.delivery_lat && e.delivery_lng) detailMarkers.push({ lat: e.delivery_lat, lng: e.delivery_lng, label: "Delivery", type: "delivery" });
            const distFromUser = getDistanceToErrand(e);
            return (
              <>
                <SheetHeader className="text-left">
                  <SheetTitle className="flex items-center gap-2">
                    {e.errand_type === "merchant" && <Store className="h-4 w-4 text-primary" />}
                    {e.title}
                  </SheetTitle>
                </SheetHeader>

                <div className="space-y-4 mt-4">
                  {/* Live tracking card (uber-eats-style) for active errands */}
                  {(e.status === "accepted" || e.status === "in_progress" || e.status === "completed") && (
                    <ErrandTrackingCard
                      status={e.status}
                      etaMinutes={e.estimated_minutes ?? null}
                      distanceText={getActiveDistance(e)}
                      address={e.zone}
                      markers={(isRequester || isHelper) ? detailMarkers : detailMarkers.map(m => ({ ...m, lat: maskCoord(m.lat), lng: maskCoord(m.lng), label: `${m.label} (approx.)` }))}
                      onRefresh={fetchErrands}
                      isRefreshing={loading}
                    />
                  )}

                  {/* Status & price */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <Badge className={`text-xs border-0 ${statusColor(e.status)}`}>{e.status.replace("_", " ")}</Badge>
                    {e.errand_type === "merchant" ? (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Items ₦{e.item_cost.toLocaleString()}</p>
                        <p className="font-mono font-bold text-accent">Delivery ₦{e.delivery_fee.toLocaleString()}</p>
                      </div>
                    ) : (
                      <p className="font-mono font-bold text-primary text-lg">₦{e.amount.toLocaleString()}</p>
                    )}
                  </div>

                  {/* Description */}
                  {e.description && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Order details</p>
                      <p className="text-sm whitespace-pre-wrap">{e.description}</p>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {e.zone && (
                      <div className="rounded-lg bg-muted p-2">
                        <p className="text-muted-foreground">Zone</p>
                        <p className="font-medium">{e.zone}</p>
                      </div>
                    )}
                    {e.urgency && (
                      <div className="rounded-lg bg-muted p-2">
                        <p className="text-muted-foreground">Urgency</p>
                        <p className="font-medium capitalize">{e.urgency}</p>
                      </div>
                    )}
                    {distFromUser && (
                      <div className="rounded-lg bg-muted p-2">
                        <p className="text-muted-foreground">Distance</p>
                        <p className="font-medium">{distFromUser}</p>
                      </div>
                    )}
                    {e.estimated_minutes && (
                      <div className="rounded-lg bg-muted p-2">
                        <p className="text-muted-foreground">ETA</p>
                        <p className="font-medium">~{e.estimated_minutes} min</p>
                      </div>
                    )}
                  </div>

                  {/* Countdown */}
                  {e.delivery_deadline && (e.status === "accepted" || e.status === "in_progress") && (
                    <div className="rounded-lg bg-muted p-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Time remaining</span>
                      <CountdownTimer deadline={e.delivery_deadline} />
                    </div>
                  )}

                  {/* Map — full coords for parties involved, masked for feed viewers */}
                  {detailMarkers.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Route map</p>
                      {(isRequester || isHelper) ? (
                        <MapboxMap markers={detailMarkers} height="h-56" />
                      ) : (
                        <MapboxMap
                          markers={detailMarkers.map(m => ({ ...m, lat: maskCoord(m.lat), lng: maskCoord(m.lng), label: `${m.label} (approx.)` }))}
                          height="h-56"
                        />
                      )}
                      {!isRequester && !isHelper && (
                        <p className="text-[10px] text-muted-foreground mt-1">Exact location is revealed after you accept.</p>
                      )}
                      {(isRequester || isHelper) && (
                        <div className="mt-2 flex flex-col gap-1.5">
                          {(!e.helper_lat || !e.helper_lng) && e.status !== "open" && (
                            <p className="text-[10px] text-muted-foreground">Runner location is needed to draw the live ETA route.</p>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full gap-1.5"
                            onClick={async () => {
                              const coords = await requestLocation();
                              if (!coords) { toast.error("Couldn't get your location"); return; }
                              const field = isHelper
                                ? { helper_lat: coords.lat, helper_lng: coords.lng }
                                : { requester_lat: coords.lat, requester_lng: coords.lng };
                              const { error } = await supabase
                                .from("errand_requests")
                                .update({ ...field, location_updated_at: new Date().toISOString() })
                                .eq("id", e.id);
                              if (error) { toast.error("Failed to share location"); return; }
                              toast.success(isHelper ? "Runner location updated!" : "Location shared!");
                              setSelectedErrand({ ...e, ...field });
                              fetchErrands();
                            }}
                          >
                            <Navigation className="h-3.5 w-3.5" /> {isHelper ? "Update runner live location" : "Share my live location"}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-3 space-y-2 text-center">
                      <p className="text-xs text-muted-foreground">No location attached to this errand yet.</p>
                      {(isRequester || isHelper) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={async () => {
                            const coords = await requestLocation();
                            if (!coords) { toast.error("Couldn't get your location"); return; }
                            const field = isHelper
                              ? { helper_lat: coords.lat, helper_lng: coords.lng }
                              : { requester_lat: coords.lat, requester_lng: coords.lng };
                            const { error } = await supabase
                              .from("errand_requests")
                              .update({ ...field, location_updated_at: new Date().toISOString() })
                              .eq("id", e.id);
                            if (error) { toast.error("Failed to share location"); return; }
                            toast.success("Location shared!");
                            setSelectedErrand({ ...e, ...field });
                            fetchErrands();
                          }}
                        >
                          <MapPin className="h-3.5 w-3.5" /> Share my live location
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Lock indicator — once accepted/in_progress order details cannot change */}
                  {(e.status === "accepted" || e.status === "in_progress") && (isRequester || isHelper) && (
                    <Alert className="border-accent/30 bg-accent/5">
                      <AlertTriangle className="h-4 w-4 text-accent" />
                      <AlertDescription className="text-xs">
                        Order details are locked. Use the dispute button if anything is wrong.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Actions */}
                  <div className="space-y-2 pt-2 border-t">
                    {e.status === "open" && !isRequester && (
                      <Button className="w-full gap-2" onClick={() => handleAcceptWithLocation(e.id)} disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Briefcase className="h-4 w-4" />}
                        Accept Errand
                      </Button>
                    )}
                    {isHelper && e.status === "accepted" && (
                      <Button className="w-full gap-2" onClick={() => handleUpdateStatus(e.id, "in_progress")} disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        Start Errand
                      </Button>
                    )}
                    {isRequester && e.status === "in_progress" && (
                      <Button className="w-full gap-2" onClick={() => handleComplete(e.id)} disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Confirm Delivery
                      </Button>
                    )}
                    {isRequester && e.status === "accepted" && (
                      <p className="text-xs text-center text-muted-foreground">Waiting for helper to start the errand…</p>
                    )}
                    {isHelper && e.status === "in_progress" && (
                      <p className="text-xs text-center text-muted-foreground">Waiting for requester to confirm delivery…</p>
                    )}
                    {(isRequester || isHelper) && (e.status === "accepted" || e.status === "in_progress") && (
                      <Button variant="outline" className="w-full gap-2 text-destructive" onClick={() => handleDispute(e.id)} disabled={isLoading}>
                        <Flag className="h-4 w-4" /> Flag a dispute
                      </Button>
                    )}
                    {assignment?.dispute_flag && (
                      <div className="flex items-center gap-2 text-xs text-destructive justify-center">
                        <AlertTriangle className="h-3 w-3" /> Dispute flagged — admin reviewing
                      </div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ErrandsPage;
