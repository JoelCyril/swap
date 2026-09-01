import { useEffect, useRef, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { detectLocationFromCoords } from "@/lib/geo.functions";
import {
  MapPin,
  X,
  Navigation,
  Search,
  Check,
  Loader2,
  AlertCircle,
  RotateCw,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import type { DetectedLocationResult } from "./LocationDetectButton";

interface LocationMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (result: DetectedLocationResult) => void;
  initialEmirate?: string;
  initialLocation?: string;
}

type PermissionStatus = "idle" | "requesting" | "granted" | "denied" | "unavailable" | "timeout";

export function LocationMapModal({
  isOpen,
  onClose,
  onSelectLocation,
  initialEmirate,
  initialLocation,
}: LocationMapModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const isDraggingRef = useRef(false);

  const [detecting, setDetecting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("idle");
  const [hasPinned, setHasPinned] = useState<boolean>(Boolean(initialLocation));

  const [currentAddress, setCurrentAddress] = useState<DetectedLocationResult | null>(
    initialLocation && initialEmirate
      ? {
          emirate: initialEmirate,
          location: initialLocation,
          isKnownNeighbourhood: true,
          fullAddress: `${initialLocation}, ${initialEmirate}`,
        }
      : null,
  );

  const detectFn = useServerFn(detectLocationFromCoords);

  // Reverse geocode exact coordinates
  const geocodeCoords = useCallback(
    async (lat: number, lng: number) => {
      setDetecting(true);
      try {
        const result = await detectFn({
          data: { latitude: lat, longitude: lng },
        });
        if (result) {
          setCurrentAddress({
            ...result,
            latitude: lat,
            longitude: lng,
          });
          setHasPinned(true);
        }
      } catch (err) {
        console.warn("Geocoding failed for pin:", err);
      } finally {
        setDetecting(false);
      }
    },
    [detectFn],
  );

  // Trigger browser native Geolocation (prompts Google/Browser "Allow location" popup)
  const handleDetectLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setPermissionStatus("unavailable");
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setDetecting(true);
    setPermissionStatus("requesting");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setDetecting(false);
        setPermissionStatus("granted");

        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 16, { duration: 1.2 });
          markerInstanceRef.current.setLatLng([latitude, longitude]);
        }

        geocodeCoords(latitude, longitude);
        toast.success("📍 GPS location detected! You can drag the pin to fine-tune.");
      },
      (error) => {
        setDetecting(false);
        if (error.code === 1 || error.code === error.PERMISSION_DENIED) {
          setPermissionStatus("denied");
          toast.error("Location access is blocked in your browser settings.", {
            description: "Click the lock icon in your browser URL bar to allow location, or drag the pin manually.",
          });
        } else if (error.code === 2 || error.code === error.POSITION_UNAVAILABLE) {
          setPermissionStatus("unavailable");
          toast.error("Device location is unavailable. You can drag the pin manually.");
        } else if (error.code === 3 || error.code === error.TIMEOUT) {
          setPermissionStatus("timeout");
          toast.error("Location request timed out. Please try again or drag the pin.");
        } else {
          setPermissionStatus("unavailable");
          toast.error("Could not retrieve GPS location. Please drag the pin on the map.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, [geocodeCoords]);

  // Initialize Leaflet map when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    // Reset temporary error statuses
    setPermissionStatus("idle");

    // Dynamically import Leaflet to prevent SSR window reference error
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // UAE General Overview Center
      const defaultCenter: [number, number] = [24.4539, 54.3773];

      // Custom Clean Marker Icon
      const pinIcon = L.divIcon({
        className: "custom-map-pin",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: grab;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 10px; border-radius: 9999px; box-shadow: 0 12px 30px -4px rgba(234, 88, 12, 0.6); border: 2.5px solid white; display: flex; align-items: center; justify-content: center;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div style="width: 10px; height: 10px; background: rgba(0,0,0,0.35); border-radius: 9999px; filter: blur(2px); margin-top: -3px;"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 11,
          zoomControl: false,
        });

        // Add Zoom Control to bottom right
        L.control.zoom({ position: "bottomright" }).addTo(map);

        // Ultra-reliable OpenStreetMap Tile Layer
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          crossOrigin: true,
        }).addTo(map);

        const marker = L.marker(defaultCenter, {
          icon: pinIcon,
          draggable: true,
          autoPan: true,
        }).addTo(map);

        markerInstanceRef.current = marker;
        mapInstanceRef.current = map;

        // On marker drag
        marker.on("dragstart", () => {
          isDraggingRef.current = true;
        });

        marker.on("dragend", () => {
          isDraggingRef.current = false;
          const pos = marker.getLatLng();
          geocodeCoords(pos.lat, pos.lng);
        });

        // On map click: move marker to clicked position
        map.on("click", (e: any) => {
          marker.setLatLng(e.latlng);
          geocodeCoords(e.latlng.lat, e.latlng.lng);
        });
      }

      // Invalidate map size on open so tiles render immediately
      const resizeMap = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      };

      setTimeout(resizeMap, 50);
      setTimeout(resizeMap, 200);
      setTimeout(resizeMap, 500);

      const resizeObserver = new ResizeObserver(() => {
        resizeMap();
      });
      if (mapContainerRef.current) {
        resizeObserver.observe(mapContainerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, geocodeCoords]);

  // Clean up map when modal fully destroyed
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Search UAE location in English without submitting any parent form
  const executeSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ", United Arab Emirates")}&format=json&limit=1&accept-language=en`,
        { headers: { "User-Agent": "SwapUAE/1.0 (https://swapuae.com)" } },
      );
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lon = parseFloat(results[0].lon);
          if (mapInstanceRef.current && markerInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lon], 15, { duration: 1 });
            markerInstanceRef.current.setLatLng([lat, lon]);
          }
          geocodeCoords(lat, lon);
          toast.success(`Jumped to: ${results[0].display_name.split(",")[0]}`);
        } else {
          toast.error("Location not found. Try searching by community, building, or mall name.");
        }
      }
    } catch {
      toast.error("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  // Confirm selection: Always uses the CURRENT marker position
  const handleConfirm = () => {
    if (!currentAddress || !hasPinned) {
      if (markerInstanceRef.current) {
        const pos = markerInstanceRef.current.getLatLng();
        geocodeCoords(pos.lat, pos.lng).then(() => {
          toast.info("Location pinned. Tap Confirm again to proceed.");
        });
      }
      return;
    }

    const currentPos = markerInstanceRef.current ? markerInstanceRef.current.getLatLng() : null;
    const finalResult: DetectedLocationResult = {
      ...currentAddress,
      ...(currentPos ? { latitude: currentPos.lat, longitude: currentPos.lng } : {}),
    };

    onSelectLocation(finalResult);
    toast.success(`📍 Location confirmed: ${finalResult.location}, ${finalResult.emirate}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl h-[88vh] max-h-[720px] rounded-3xl bg-card border-2 border-primary/20 shadow-2xl overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-card/95 backdrop-blur shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-base text-foreground">Pin Your Location</h2>
              <p className="text-xs text-muted-foreground">
                Tap "Detect my location", search, or drag the orange pin to your area
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* MAP CONTAINER & OVERLAYS */}
        <div className="relative flex-1 w-full bg-muted overflow-hidden">
          {/* PERMISSION DENIED BANNER OVERLAY */}
          {permissionStatus === "denied" && (
            <div className="absolute top-16 left-4 right-4 z-[400] max-w-lg mx-auto rounded-2xl border-2 border-amber-500/40 bg-card/95 p-3.5 backdrop-blur-md shadow-2xl animate-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1.5">
                  <p className="font-bold text-foreground text-sm">Google Location Permission Blocked</p>
                  <p className="text-muted-foreground text-[12px] leading-relaxed">
                    Your browser previously blocked location for <strong>swapuae.com</strong>.
                  </p>
                  <div className="bg-muted/60 rounded-xl p-2 text-[11px] text-foreground space-y-1">
                    <p><strong>To see Google's Allow popup:</strong></p>
                    <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground">
                      <li>Click the lock / tune icon (🔒 / ⚙️) next to the website URL at the top.</li>
                      <li>Switch <strong>Location</strong> from <em>Block</em> to <strong>Allow</strong> (or Reset).</li>
                      <li>Click <strong>"Try Again"</strong> below to trigger the prompt.</li>
                    </ol>
                  </div>
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition cursor-pointer"
                    >
                      <RotateCw className="h-3.5 w-3.5" /> Try Again
                    </button>
                    <span className="text-[11px] text-muted-foreground">or simply drag the pin on the map</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEARCH BAR OVERLAY (DIV CONTAINER, NO FORM TO PREVENT NESTED FORM SUBMISSIONS) */}
          <div className="absolute top-4 left-4 right-4 z-[400] max-w-md">
            <div className="flex items-center gap-1.5 rounded-2xl border-2 border-primary/30 bg-card/95 p-1.5 shadow-lg backdrop-blur">
              <Search className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    executeSearch();
                  }
                }}
                placeholder="Search area, landmark, or street (e.g. Marina Mall, Corniche)…"
                className="flex-1 bg-transparent px-2 py-1 text-xs outline-none text-foreground"
              />
              <button
                type="button"
                onClick={executeSearch}
                disabled={searching || !searchQuery.trim()}
                className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 cursor-pointer"
              >
                {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
              </button>
            </div>
          </div>

          {/* DETECT MY LOCATION PROMINENT FLOATING BUTTON */}
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={detecting}
            className="absolute bottom-6 right-4 z-[400] flex items-center gap-2 rounded-full border-2 border-primary/40 bg-card px-4 py-2.5 text-xs font-black text-primary shadow-xl hover:bg-primary/10 transition cursor-pointer active:scale-95 disabled:opacity-60"
            title="Detect your device location using browser GPS"
          >
            {detecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Detecting location…</span>
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 text-primary fill-primary/20" />
                <span>📍 Detect my location</span>
              </>
            )}
          </button>

          {/* MAP DRAG HELPER BADGE */}
          {permissionStatus !== "denied" && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
              <span className="rounded-full bg-black/75 px-3 py-1 text-[11px] font-bold text-white shadow-md backdrop-blur">
                📍 Drag the pin to fine-tune your location
              </span>
            </div>
          )}

          {/* MAP CANVAS */}
          <div ref={mapContainerRef} className="h-full w-full" style={{ minHeight: "350px", zIndex: 1 }} />
        </div>

        {/* BOTTOM CONFIRMATION BAR */}
        <div className="p-4 sm:p-5 border-t border-border bg-card shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10">
          <div className="min-w-0">
            {currentAddress ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-black text-primary">
                    {currentAddress.emirate}
                  </span>
                  <p className="font-display font-bold text-base text-foreground truncate">
                    {currentAddress.location}
                  </p>
                  {detecting && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-xl">
                  {currentAddress.fullAddress}
                </p>
              </>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Info className="h-4 w-4 text-primary shrink-0" />
                <p className="text-xs">
                  Tap <strong>"Detect my location"</strong> or drag the pin to set your area
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-glow hover:opacity-90 transition cursor-pointer"
            >
              <Check className="h-4 w-4" /> Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
