import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Loader2, MapPin, Store, User, Bike, Flag, type LucideIcon } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

// Compatibility alias — MapLibre GL JS is a fork of Mapbox GL JS v1 with the
// same Map/Marker/Popup/LngLatBounds/GeoJSONSource API surface used below.
const mapboxgl = maplibregl as unknown as typeof import("mapbox-gl");
const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  type?: "requester" | "helper" | "delivery" | "merchant";
}

interface MapboxMapProps {
  markers: MapMarker[];
  className?: string;
  height?: string;
  interactive?: boolean;
  showRoute?: boolean;
  showLegend?: boolean;
  animateRunner?: boolean;
}

type MarkerType = NonNullable<MapMarker["type"]>;

type MarkerMeta = {
  cssVar: string;
  fallback: string;
  icon: LucideIcon;
  legend: string;
};

const TYPE_META: Record<MarkerType, MarkerMeta> = {
  requester: { cssVar: "--primary", fallback: "hsl(271 81% 40%)", icon: User, legend: "Requester" },
  helper: { cssVar: "--chart-4", fallback: "hsl(38 92% 50%)", icon: Bike, legend: "Runner" },
  delivery: { cssVar: "--accent", fallback: "hsl(82 78% 44%)", icon: Flag, legend: "Drop-off" },
  merchant: { cssVar: "--destructive", fallback: "hsl(0 84% 60%)", icon: Store, legend: "Pickup" },
};

const isValidMarker = (marker: MapMarker) => (
  Number.isFinite(marker.lat) &&
  Number.isFinite(marker.lng) &&
  Math.abs(marker.lat) <= 90 &&
  Math.abs(marker.lng) <= 180
);

const getTokenColor = (cssVar: string, fallback: string) => {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return value ? `hsl(${value})` : fallback;
};

const markerKey = (marker: MapMarker) => marker.type || marker.label;

const ensurePinStyles = () => {
  if (typeof document === "undefined" || document.getElementById("errand-mapbox-pin-styles")) return;
  const style = document.createElement("style");
  style.id = "errand-mapbox-pin-styles";
  style.textContent = `
    @keyframes errand-runner-pulse {
      0% { transform: scale(0.72); opacity: 0.7; }
      100% { transform: scale(1.55); opacity: 0; }
    }
    .errand-mapbox-pin { cursor: pointer; transform: translateZ(0); }
    .errand-mapbox-pin-label {
      position: absolute;
      left: 50%;
      top: 36px;
      transform: translateX(-50%);
      max-width: 92px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      border: 1px solid hsl(var(--border));
      background: hsl(var(--background) / 0.94);
      color: hsl(var(--foreground));
      border-radius: 999px;
      padding: 2px 7px;
      font: 700 10px/1.25 Syne, system-ui, sans-serif;
      box-shadow: 0 8px 20px hsl(var(--foreground) / 0.12);
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
};

const buildPin = (marker: MapMarker) => {
  ensurePinStyles();
  const type = marker.type || "requester";
  const meta = TYPE_META[type];
  const color = getTokenColor(meta.cssVar, meta.fallback);
  const Icon = meta.icon;
  const iconMarkup = renderToStaticMarkup(<Icon size={14} strokeWidth={2.6} color="currentColor" />);
  const wrapper = document.createElement("div");
  wrapper.className = "errand-mapbox-pin";
  wrapper.innerHTML = `
    <div style="position:relative;width:36px;height:54px;filter:drop-shadow(0 10px 16px hsl(var(--foreground) / 0.22));">
      ${type === "helper" ? `<span style="position:absolute;inset:4px 4px 14px 4px;border:2px solid ${color};border-radius:999px;animation:errand-runner-pulse 1.35s ease-out infinite;"></span>` : ""}
      <svg viewBox="0 0 36 46" width="36" height="46" xmlns="http://www.w3.org/2000/svg" style="position:relative;z-index:1;display:block;">
        <path d="M18 1.5C9.1 1.5 2 8.6 2 17.5c0 10.9 12.8 24 15 26.1.6.6 1.4.6 2 0 2.2-2.1 15-15.2 15-26.1 0-8.9-7.1-16-16-16Z" fill="${color}" stroke="hsl(var(--background))" stroke-width="2.5"/>
        <circle cx="18" cy="17.5" r="10.5" fill="hsl(var(--background))"/>
      </svg>
      <div style="position:absolute;z-index:2;top:8px;left:8px;width:20px;height:20px;border-radius:999px;background:${color};color:hsl(var(--primary-foreground));display:flex;align-items:center;justify-content:center;">
        ${iconMarkup}
      </div>
      <div class="errand-mapbox-pin-label">${marker.label}</div>
    </div>`;
  return wrapper;
};

const makeRouteFeature = (coordinates: [number, number][]) => ({
  type: "Feature" as const,
  properties: {},
  geometry: {
    type: "LineString" as const,
    coordinates,
  },
});

const makePointFeature = (coordinate: [number, number]) => ({
  type: "Feature" as const,
  properties: {},
  geometry: {
    type: "Point" as const,
    coordinates: coordinate,
  },
});

const dedupeCoordinates = (coordinates: [number, number][]) => coordinates.filter((coordinate, index) => {
  if (index === 0) return true;
  const previous = coordinates[index - 1];
  return previous[0] !== coordinate[0] || previous[1] !== coordinate[1];
});

const routeCoordinatesFor = (markers: MapMarker[], helperOverride?: [number, number] | null): [number, number][] => {
  const byType = markers.reduce<Partial<Record<MarkerType, MapMarker>>>((acc, marker) => {
    const type = marker.type || "requester";
    if (!acc[type]) acc[type] = marker;
    return acc;
  }, {});

  const coordinates: [number, number][] = [];
  if (byType.helper) coordinates.push(helperOverride || [byType.helper.lng, byType.helper.lat]);
  const pickup = byType.merchant || byType.requester;
  if (pickup) coordinates.push([pickup.lng, pickup.lat]);
  if (byType.delivery) coordinates.push([byType.delivery.lng, byType.delivery.lat]);

  const ordered = coordinates.length >= 2 ? coordinates : markers.map((marker) => [marker.lng, marker.lat] as [number, number]);
  return dedupeCoordinates(ordered);
};

const fitMapToMarkers = (map: mapboxgl.Map, markers: MapMarker[]) => {
  if (markers.length === 0) return;
  if (markers.length === 1) {
    map.easeTo({ center: [markers[0].lng, markers[0].lat], zoom: 15.6, duration: 500 });
    return;
  }
  const bounds = new mapboxgl.LngLatBounds();
  markers.forEach((marker) => bounds.extend([marker.lng, marker.lat]));
  map.fitBounds(bounds, { padding: { top: 44, right: 44, bottom: 76, left: 44 }, maxZoom: 16, duration: 650 });
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const MapboxMap = ({
  markers,
  className = "",
  height = "h-56",
  interactive = true,
  showRoute = true,
  showLegend = true,
  animateRunner = true,
}: MapboxMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRefs = useRef<Record<string, mapboxgl.Marker>>({});
  const lastHelperPositionRef = useRef<[number, number] | null>(null);
  const runnerAnimationRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [ready, setReady] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validMarkers = useMemo(() => markers.filter(isValidMarker), [markers]);
  const markerSignature = useMemo(() => JSON.stringify(validMarkers), [validMarkers]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setReady(false);
    setMapLoaded(false);

    const waitForSize = () => new Promise<void>((resolve) => {
      const element = containerRef.current;
      if (!element) return resolve();
      if (element.clientWidth > 0 && element.clientHeight > 0) return resolve();
      resizeObserverRef.current = new ResizeObserver(() => {
        if (element.clientWidth > 0 && element.clientHeight > 0) {
          resizeObserverRef.current?.disconnect();
          resolve();
        }
      });
      resizeObserverRef.current.observe(element);
      window.setTimeout(resolve, 900);
    });

    (async () => {
      if (!containerRef.current || validMarkers.length === 0) {
        setReady(true);
        return;
      }

      await waitForSize();
      if (cancelled || !containerRef.current) return;

      try {
        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: OPENFREEMAP_STYLE as any,
          center: [validMarkers[0].lng, validMarkers[0].lat],
          zoom: validMarkers.length === 1 ? 15.6 : 14,
          interactive,
          attributionControl: false,
          cooperativeGestures: interactive,
          fadeDuration: 160,
        });
        mapRef.current = map;

        if (interactive) {
          map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
        }

        const resizeMap = () => map.resize();
        resizeObserverRef.current = new ResizeObserver(resizeMap);
        resizeObserverRef.current.observe(containerRef.current);

        map.on("error", (event: any) => {
          const message = event?.error?.message || "";
          console.warn("[LibertyMap] error", message || event);
          if (!map.loaded() && !map.isStyleLoaded()) {
            setError("Map failed to load. Check your connection and try again.");
            setReady(true);
          }
        });

        map.once("load", () => {
          if (cancelled) return;
          setMapLoaded(true);
          map.resize();
          fitMapToMarkers(map, validMarkers);
          window.setTimeout(() => map.resize(), 120);
          window.setTimeout(() => map.resize(), 520);
        });

        map.once("idle", () => {
          if (!cancelled) setReady(true);
        });

        window.setTimeout(() => {
          if (!cancelled) setReady(true);
        }, 2200);
      } catch (e: any) {
        console.warn("[MapboxMap] init failed", e?.message);
        setError("Map failed to initialize.");
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
      if (runnerAnimationRef.current) cancelAnimationFrame(runnerAnimationRef.current);
      resizeObserverRef.current?.disconnect();
      Object.values(markerRefs.current).forEach((marker) => marker.remove());
      markerRefs.current = {};
      mapRef.current?.remove();
      mapRef.current = null;
      lastHelperPositionRef.current = null;
    };
  }, [validMarkers.length > 0, interactive]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || validMarkers.length === 0) return;

      const routeColor = getTokenColor("--primary", "hsl(271 81% 40%)");
      const foregroundColor = getTokenColor("--foreground", "hsl(270 10% 12%)");
      const backgroundColor = getTokenColor("--background", "hsl(0 0% 100%)");
    const routeCoords = routeCoordinatesFor(validMarkers);
    const setRouteData = (coords: [number, number][]) => {
      const source = map.getSource("errand-route") as mapboxgl.GeoJSONSource | undefined;
      if (source) source.setData(makeRouteFeature(coords) as any);
    };

    if (!map.getSource("errand-focus") && validMarkers[0]) {
      map.addSource("errand-focus", { type: "geojson", data: makePointFeature([validMarkers[0].lng, validMarkers[0].lat]) as any });
      map.addLayer({
        id: "errand-focus-ring",
        type: "circle",
        source: "errand-focus",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 13, 18, 17, 34],
          "circle-color": routeColor,
          "circle-opacity": 0.08,
          "circle-stroke-color": routeColor,
          "circle-stroke-width": 1.5,
          "circle-stroke-opacity": 0.22,
        },
      });
    } else if (validMarkers[0]) {
      const focusSource = map.getSource("errand-focus") as mapboxgl.GeoJSONSource | undefined;
      focusSource?.setData(makePointFeature([validMarkers[0].lng, validMarkers[0].lat]) as any);
    }

    if (showRoute && routeCoords.length > 1) {
      if (!map.getSource("errand-route")) {
        map.addSource("errand-route", { type: "geojson", data: makeRouteFeature(routeCoords) as any });
        map.addLayer({
          id: "errand-route-shadow",
          type: "line",
          source: "errand-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": foregroundColor,
            "line-width": 8,
            "line-opacity": 0.14,
          },
        });
        map.addLayer({
          id: "errand-route-casing",
          type: "line",
          source: "errand-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": backgroundColor,
            "line-width": 6,
            "line-opacity": 0.92,
          },
        });
        map.addLayer({
          id: "errand-route-line",
          type: "line",
          source: "errand-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": routeColor,
            "line-width": 4,
            "line-opacity": 0.9,
            "line-dasharray": [0.4, 1.4],
          },
        });
      } else {
        setRouteData(routeCoords);
        if (map.getLayer("errand-route-line")) map.setPaintProperty("errand-route-line", "line-color", routeColor);
      }
    }

    const nextKeys = new Set(validMarkers.map(markerKey));
    Object.entries(markerRefs.current).forEach(([key, marker]) => {
      if (!nextKeys.has(key)) {
        marker.remove();
        delete markerRefs.current[key];
      }
    });

    validMarkers.forEach((marker) => {
      const key = markerKey(marker);
      const nextPosition: [number, number] = [marker.lng, marker.lat];
      const existingMarker = markerRefs.current[key];

      if (!existingMarker) {
        markerRefs.current[key] = new mapboxgl.Marker({ element: buildPin(marker), anchor: "bottom" })
          .setLngLat(nextPosition)
          .setPopup(
            new mapboxgl.Popup({ offset: 34, closeButton: false }).setHTML(
              `<div style="font-family:Syne,system-ui,sans-serif;font-size:12px;font-weight:700;color:hsl(var(--foreground));">${marker.label}</div>`
            )
          )
          .addTo(map);

        if ((marker.type || "requester") === "helper") lastHelperPositionRef.current = nextPosition;
        return;
      }

      if ((marker.type || "requester") !== "helper" || !animateRunner) {
        existingMarker.setLngLat(nextPosition);
        return;
      }

      const previousPosition = lastHelperPositionRef.current || [existingMarker.getLngLat().lng, existingMarker.getLngLat().lat];
      const moved = previousPosition[0] !== nextPosition[0] || previousPosition[1] !== nextPosition[1];
      if (!moved) return;

      if (runnerAnimationRef.current) cancelAnimationFrame(runnerAnimationRef.current);
      const startedAt = performance.now();
      const duration = 1200;

      const step = (timestamp: number) => {
        const progress = Math.min((timestamp - startedAt) / duration, 1);
        const eased = easeOutCubic(progress);
        const currentPosition: [number, number] = [
          previousPosition[0] + (nextPosition[0] - previousPosition[0]) * eased,
          previousPosition[1] + (nextPosition[1] - previousPosition[1]) * eased,
        ];

        existingMarker.setLngLat(currentPosition);
        if (showRoute && routeCoords.length > 1) {
          setRouteData(routeCoordinatesFor(validMarkers, currentPosition));
        }

        if (progress < 1) {
          runnerAnimationRef.current = requestAnimationFrame(step);
        } else {
          existingMarker.setLngLat(nextPosition);
          lastHelperPositionRef.current = nextPosition;
          if (showRoute && routeCoords.length > 1) setRouteData(routeCoords);
        }
      };

      runnerAnimationRef.current = requestAnimationFrame(step);
    });

    fitMapToMarkers(map, validMarkers);
    map.resize();
  }, [animateRunner, mapLoaded, markerSignature, showRoute]);

  if (validMarkers.length === 0) return null;

  const usedTypes = Array.from(new Set(validMarkers.map((m) => m.type || "requester"))) as MarkerType[];

  return (
    <div className={`relative ${height} rounded-xl overflow-hidden border border-border shadow-sm bg-muted ${className}`}>
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/70 z-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 z-10 p-3 text-center gap-1">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{error}</p>
          <p className="text-[10px] text-muted-foreground">
            {validMarkers.map((m) => `${m.label}: ${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}`).join(" · ")}
          </p>
        </div>
      )}
      <div ref={containerRef} className="absolute inset-0 [&_.mapboxgl-canvas]:outline-none" />
      {showLegend && ready && !error && usedTypes.length > 0 && (
        <div className="absolute bottom-2 left-2 right-2 z-10 rounded-lg bg-background/90 backdrop-blur px-2 py-1.5 shadow-md border border-border flex flex-wrap gap-2">
          {usedTypes.map((type) => (
            <div key={type} className="flex items-center gap-1.5 text-[10px] font-medium min-w-0">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: getTokenColor(TYPE_META[type].cssVar, TYPE_META[type].fallback) }}
              />
              <span className="truncate">{TYPE_META[type].legend}</span>
            </div>
          ))}
          {showRoute && validMarkers.length === 1 && (
            <span className="ml-auto text-[10px] text-muted-foreground">Awaiting route</span>
          )}
        </div>
      )}
    </div>
  );
};

export default MapboxMap;
