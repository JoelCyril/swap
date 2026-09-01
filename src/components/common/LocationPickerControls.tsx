import { useState } from "react";
import { LocationDetectButton, type DetectedLocationResult } from "./LocationDetectButton";
import { LocationMapModal } from "./LocationMapModal";
import { Map } from "lucide-react";

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
      {/* 1. PIN ON MAP (AMAZON STYLE) */}
      <button
        type="button"
        onClick={() => setIsMapOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-gradient-to-r from-orange-500/10 to-amber-500/10 px-3 py-1.5 text-xs font-bold text-primary hover:from-orange-500/20 hover:to-amber-500/20 transition cursor-pointer active:scale-95 shadow-xs"
        title="Open interactive map to pin your location"
      >
        <Map className="h-3.5 w-3.5 text-primary" />
        <span>Pin on Map</span>
      </button>

      {/* 2. AUTO-DETECT GPS */}
      <LocationDetectButton
        onDetected={onLocationSelected}
        label="Auto-detect"
      />

      {/* 3. MAP MODAL */}
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
