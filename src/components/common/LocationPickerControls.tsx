import type { DetectedLocationResult } from "./LocationDetectButton";

export type { DetectedLocationResult };

interface LocationPickerControlsProps {
  onLocationSelected?: (result: DetectedLocationResult) => void;
  currentEmirate?: string;
  currentLocation?: string;
  className?: string;
}

export function LocationPickerControls({
  onLocationSelected: _onLocationSelected,
  currentEmirate: _currentEmirate = "",
  currentLocation: _currentLocation = "",
  className: _className = "",
}: LocationPickerControlsProps) {
  return null;
}
