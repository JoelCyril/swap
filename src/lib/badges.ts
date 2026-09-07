export interface ListingCustomBadge {
  id?: string;
  name: string;
  imageUrl: string;
  glowColor?: string | null;
  created_at?: string;
}

export const PRESET_GLOW_COLORS = [
  { label: "Electric Purple", hex: "#a855f7" },
  { label: "Cyber Cyan", hex: "#06b6d4" },
  { label: "Radiant Gold", hex: "#f59e0b" },
  { label: "Neon Pink", hex: "#ec4899" },
  { label: "Emerald Green", hex: "#10b981" },
  { label: "Crimson Flame", hex: "#ef4444" },
  { label: "Hyper Blue", hex: "#3b82f6" },
];

/**
 * Extracts custom badge data embedded in a listing's moderation note.
 * Format: [BADGE:{"id":"...","name":"...","imageUrl":"...","glowColor":"#..."}]
 */
export function extractListingBadge(note?: string | null): ListingCustomBadge | null {
  if (!note) return null;
  const match = note.match(/\[(?:CUSTOM_)?BADGE:(.+?)\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    if (parsed && typeof parsed.name === "string" && typeof parsed.imageUrl === "string") {
      return {
        id: parsed.id || undefined,
        name: parsed.name,
        imageUrl: parsed.imageUrl,
        glowColor: parsed.glowColor || null,
      };
    }
  } catch (err) {
    // Malformed JSON payload in note - gracefully ignore
  }
  return null;
}

/**
 * Returns a new moderation note string with the given badge added or replaced.
 * If badge is null, removes any existing custom badge tag.
 */
export function formatNoteWithBadge(
  existingNote: string | null | undefined,
  badge: ListingCustomBadge | null
): string | null {
  let cleaned = (existingNote || "")
    .replace(/\[(?:CUSTOM_)?BADGE:\{.*?\}\]/g, "")
    .trim();

  if (badge) {
    const payload = JSON.stringify({
      id: badge.id,
      name: badge.name.trim(),
      imageUrl: badge.imageUrl.trim(),
      glowColor: badge.glowColor?.trim() || null,
    });
    const tag = `[BADGE:${payload}]`;
    cleaned = cleaned ? `${cleaned} ${tag}` : tag;
  }

  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Generates dynamic glow styles for a listing card based on the custom badge's glowColor.
 */
export function getListingGlowStyle(glowColor?: string | null): React.CSSProperties | undefined {
  if (!glowColor) return undefined;
  const hex = glowColor.startsWith("#") ? glowColor : `#${glowColor}`;
  return {
    borderColor: hex,
    boxShadow: `0 0 20px ${hex}55, 0 0 45px ${hex}28`,
  };
}
