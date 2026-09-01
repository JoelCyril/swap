import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { detectLocationFromCoords } from "@/lib/geo.functions";
import { Navigation, Loader2, CheckCircle2, MapPin } from "lucide-react";
import { toast } from "sonner";

export interface DetectedLocationResult {
  emirate: string;
  location: string;
  isKnownNeighbourhood: boolean;
  fullAddress: string;
}

interface LocationDetectButtonProps {
  onDetected: (result: DetectedLocationResult) => void;
  className?: string;
  label?: string;
}

export function LocationDetectButton({
  onDetected,
  className = "",
  label = "Auto-detect my location",
}: LocationDetectButtonProps) {
  const [detecting, setDetecting] = useState(false);
  const detectFn = useServerFn(detectLocationFromCoords);

  const handleDetect = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const result = await detectFn({
            data: { latitude, longitude },
          });

          if (result) {
            onDetected(result);
            toast.success(`📍 Location detected: ${result.location}, ${result.emirate}`, {
              description: "Emirate and Area have been automatically filled in.",
            });
          }
        } catch (err) {
          console.error("Location detection error:", err);
          toast.error("Could not determine exact neighbourhood", {
            description: "Please select your Emirate and Area from the dropdown.",
          });
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        setDetecting(false);
        console.warn("Geolocation permission error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied", {
            description: "Please enable location access in your browser settings or choose manually.",
          });
        } else if (error.code === error.TIMEOUT) {
          toast.error("Location detection timed out. Please try again or select manually.");
        } else {
          toast.error("Unable to retrieve your location. Please select manually.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
    );
  };

  return (
    <button
      type="button"
      onClick={handleDetect}
      disabled={detecting}
      className={`inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 hover:border-primary transition disabled:opacity-60 cursor-pointer active:scale-95 ${className}`}
      title="Automatically detect your Emirate and Neighbourhood using GPS"
    >
      {detecting ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span>Detecting location…</span>
        </>
      ) : (
        <>
          <Navigation className="h-3.5 w-3.5 text-primary" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
