import { useState } from "react";
import { LocationMapModal } from "./LocationMapModal";
import { MapPin } from "lucide-react";
import type { DetectedLocationResult } from "./LocationDetectButton";

export type { DetectedLocationResult };

interface LocationPickerControlsProps {
  onLocationSelected: (result: DetectedLocationResult) => void;
  currentEmirate?: string;
  currentLocation?: string;
  className?: string;
}

export function LocationPickerControls({
  onLocationSelected,
  currentEmirate = "Dubai",
  currentLocation = "",
  className = "",
}: LocationPickerControlsProps) {
  const [isMapOpen, setIsMapOpen] = useState(false);

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {/* SINGLE MAP PIN BUTTON (AMAZON STYLE) */}
      <button
        type="button"
        onClick={() => setIsMapOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-gradient-to-r from-orange-500/10 to-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-primary hover:from-orange-500/20 hover:to-amber-500/20 transition cursor-pointer active:scale-95 shadow-xs"
        title="Open interactive map to pin your location or detect via GPS"
      >
        <MapPin className="h-3.5 w-3.5 text-primary fill-primary/20" />
        <span>Set on Map</span>
      </button>

      {/* MAP MODAL */}
      <LocationMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLocation={onLocationSelected}
        initialEmirate={currentEmirate}
        initialLocation={currentLocation}
      />
    </div>
  );
}
