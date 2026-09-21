"use client";

import { LocationModal } from "@/components/location/LocationModal";
import { LocationPickerFields } from "@/components/location/LocationPickerFields";

/**
 * Universal location-select popup — THE one popup used everywhere.
 * Just render `{open && <LocationPopup onClose={...} />}` behind any
 * button that needs area picking (header pill, portal widget,
 * first-visit gate, not-found page).
 */
export function LocationPopup({ onClose }: { onClose: () => void }) {
  return (
    <LocationModal onClose={onClose}>
      <LocationPickerFields tone="light" />
    </LocationModal>
  );
}
