import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { detectLocationFromCoords } from "@/lib/geo.functions";
import { Navigation, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface DetectedLocationResult {
  emirate: string;
  location: string;
  isKnownNeighbourhood: boolean;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
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

  const fallbackToNetwork = async () => {
    try {
      const result = await detectFn({ data: {} });
      if (result) {
        onDetected(result);
        toast.success(`📍 Location detected: ${result.location}, ${result.emirate}`, {
          description: "Emirate and Area have been automatically filled in.",
        });
      }
    } catch (err) {
      console.error("Network location error:", err);
      toast.error("Could not automatically determine location", {
        description: "Please select your Emirate and Area from the dropdown.",
      });
    } finally {
      setDetecting(false);
    }
  };

  const handleDetect = () => {
    setDetecting(true);

    if (!("geolocation" in navigator)) {
      fallbackToNetwork();
      return;
    }

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
          } else {
            await fallbackToNetwork();
          }
        } catch (err) {
          console.warn("GPS reverse geocode error, trying network fallback:", err);
          await fallbackToNetwork();
        } finally {
          setDetecting(false);
        }
      },
      async (error) => {
        console.warn("Browser geolocation unavailable or blocked, falling back to network/IP:", error);
        await fallbackToNetwork();
      },
      {
        enableHighAccuracy: false,
        timeout: 6000,
        maximumAge: 60000,
      },
    );
  };

  return (
    <button
      type="button"
      onClick={handleDetect}
      disabled={detecting}
      className={`inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 hover:border-primary transition disabled:opacity-60 cursor-pointer active:scale-95 ${className}`}
      title="Automatically detect your Emirate and Neighbourhood"
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
