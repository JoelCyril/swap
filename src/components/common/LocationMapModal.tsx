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
  Maximize2,
  Compass,
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

export function LocationMapModal({
  isOpen,
  onClose,
  onSelectLocation,
  initialEmirate = "Dubai",
  initialLocation = "",
}: LocationMapModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const isDraggingRef = useRef(false);
  const debounceTimerRef = useRef<any>(null);

  const [detecting, setDetecting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentAddress, setCurrentAddress] = useState<DetectedLocationResult>({
    emirate: initialEmirate || "Dubai",
    location: initialLocation || "Dubai",
    isKnownNeighbourhood: false,
    fullAddress: "Move map or search to place pin",
  });

  const detectFn = useServerFn(detectLocationFromCoords);

  // Reverse geocode given coordinates
  const geocodeCoords = useCallback(
    async (lat: number, lng: number) => {
      setDetecting(true);
      try {
        const result = await detectFn({
          data: { latitude: lat, longitude: lng },
        });
        if (result) {
          setCurrentAddress(result);
        }
      } catch (err) {
        console.warn("Geocoding failed for pin:", err);
      } finally {
        setDetecting(false);
      }
    },
    [detectFn],
  );

  // Initialize Leaflet map when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    // Dynamically import Leaflet to prevent SSR window reference error
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Default UAE Center (Dubai)
      const defaultCenter: [number, number] = [25.2048, 55.2708];

      // Custom Clean Marker Icon
      const pinIcon = L.divIcon({
        className: "custom-map-pin",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 8px; border-radius: 9999px; box-shadow: 0 10px 25px -5px rgba(234, 88, 12, 0.5); border: 2px solid white;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div style="width: 8px; height: 8px; background: rgba(0,0,0,0.3); border-radius: 9999px; filter: blur(2px); margin-top: -2px;"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 12,
          zoomControl: false,
        });

        // Add Zoom Control to bottom right
        L.control.zoom({ position: "bottomright" }).addTo(map);

        // OpenStreetMap clean tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        const marker = L.marker(defaultCenter, {
          icon: pinIcon,
          draggable: true,
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

        // On map click: move marker
        map.on("click", (e: any) => {
          marker.setLatLng(e.latlng);
          geocodeCoords(e.latlng.lat, e.latlng.lng);
        });

        // On map pan/move: optional center sync
        map.on("move", () => {
          if (isDraggingRef.current) return;
        });

        // Auto-detect current device location to center initially
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (!isMounted) return;
              const { latitude, longitude } = pos.coords;
              map.setView([latitude, longitude], 14);
              marker.setLatLng([latitude, longitude]);
              geocodeCoords(latitude, longitude);
            },
            () => {
              // fallback to default center
              geocodeCoords(defaultCenter[0], defaultCenter[1]);
            },
            { timeout: 5000, maximumAge: 60000 },
          );
        } else {
          geocodeCoords(defaultCenter[0], defaultCenter[1]);
        }
      }

      // Re-trigger size update in case container resized
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
    });

    return () => {
      isMounted = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
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

  // Center on current GPS
  const handleLocateMe = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not supported");
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 15);
          markerInstanceRef.current.setLatLng([latitude, longitude]);
        }
        geocodeCoords(latitude, longitude);
      },
      () => {
        toast.error("Could not get current GPS location");
        setDetecting(false);
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  };

  // Search UAE location
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ", UAE")}&format=json&limit=1`,
        { headers: { "User-Agent": "SwapUAE/1.0 (https://swapuae.com)" } },
      );
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lon = parseFloat(results[0].lon);
          if (mapInstanceRef.current && markerInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lon], 15);
            markerInstanceRef.current.setLatLng([lat, lon]);
          }
          geocodeCoords(lat, lon);
          toast.success(`Jumped to: ${results[0].display_name.split(",")[0]}`);
        } else {
          toast.error("Location not found in UAE. Try another search.");
        }
      }
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    onSelectLocation(currentAddress);
    toast.success(`📍 Selected: ${currentAddress.location}, ${currentAddress.emirate}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl h-[88vh] max-h-[720px] rounded-3xl bg-card border-2 border-primary/20 shadow-2xl overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-card/90 backdrop-blur shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-base text-foreground">Pin Your Location</h2>
              <p className="text-xs text-muted-foreground">
                Drag the pin or click anywhere on the map to set your area
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
          {/* SEARCH BAR OVERLAY */}
          <div className="absolute top-4 left-4 right-4 z-[400] max-w-md">
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-1.5 rounded-2xl border-2 border-primary/30 bg-card/95 p-1.5 shadow-lg backdrop-blur"
            >
              <Search className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search area, landmark, or street (e.g. Marina Mall, JVC)…"
                className="flex-1 bg-transparent px-2 py-1 text-xs outline-none text-foreground"
              />
              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 cursor-pointer"
              >
                {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
              </button>
            </form>
          </div>

          {/* LOCATE ME FLOATING BUTTON */}
          <button
            type="button"
            onClick={handleLocateMe}
            className="absolute bottom-6 right-4 z-[400] flex items-center gap-1.5 rounded-full border-2 border-primary/30 bg-card px-3.5 py-2 text-xs font-bold text-primary shadow-xl hover:bg-primary-soft transition cursor-pointer active:scale-95"
            title="Center map on my device location"
          >
            <Navigation className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">Use GPS Location</span>
          </button>

          {/* MAP CANVAS */}
          <div ref={mapContainerRef} className="h-full w-full" />
        </div>

        {/* BOTTOM CONFIRMATION BAR */}
        <div className="p-4 sm:p-5 border-t border-border bg-card shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10">
          <div className="min-w-0">
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
