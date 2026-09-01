import type { Database } from "@/integrations/supabase/types";

export type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ItemRow = Database["public"]["Tables"]["items"]["Row"];
export type OfferRow = Database["public"]["Tables"]["offers"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type ItemCategory = Database["public"]["Enums"]["item_category"];
export type ItemCondition = Database["public"]["Enums"]["item_condition"];
export type ListingStatus = Database["public"]["Enums"]["listing_status"];
export type OfferStatus = Database["public"]["Enums"]["offer_status"];

export type ListingWithOwner = ListingRow & { owner: ProfileRow | null };

export const CATEGORIES: ItemCategory[] = [
  "Electronics",
  "Household Items",
  "Clothing",
  "Outdoors",
  "Accessories",
  "Books",
  "Toys",
  "Sports",
];

export const CONDITIONS: ItemCondition[] = ["New", "Like New", "Good", "Fair"];

export const NEIGHBOURHOODS = [
  "Downtown Abu Dhabi",
  "Al Reem Island",
  "Yas Island",
  "Al Raha",
  "Khalifa City",
  "Corniche",
  "Al Bateen",
  "Saadiyat Island",
  "Downtown Dubai",
  "Dubai Marina",
  "JBR",
  "Palm Jumeirah",
  "Business Bay",
  "Sharjah Al Majaz",
];

export const OTHER_LOCATION = "Other";

export const EMIRATES = [
  "Abu Dhabi",
  "Dubai",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
] as const;

export type Emirate = (typeof EMIRATES)[number];

/** Best-effort mapping of a free-text location to its emirate. */
export function emirateOf(location: string | null | undefined): Emirate | null {
  const l = (location ?? "").toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
  if (!l) return null;
  const rules: [Emirate, string[]][] = [
    [
      "Abu Dhabi",
      [
        "abu dhabi",
        "abudhabi",
        "abu zaby",
        "abu daby",
        "abu dabi",
        "zaby",
        "al ain",
        "alain",
        "reem",
        "yas island",
        "yas",
        "al raha",
        "khalifa city",
        "khalifa",
        "khalidiya",
        "khalidiyah",
        "corniche",
        "bateen",
        "al bateen",
        "saadiyat",
        "mussafah",
        "musaffah",
        "shakhbout",
        "ruwais",
        "masdar",
        "al maryah",
        "maryah",
        "al reef",
        "al shamkha",
        "mushrif",
        "karamah",
        "rawdah",
        "madinat zayed",
        "liwa",
        "al dhafra",
        "dhafra",
      ],
    ],
    [
      "Dubai",
      [
        "dubai",
        "jbr",
        "marina",
        "palm jumeirah",
        "jumeirah",
        "business bay",
        "deira",
        "bur dubai",
        "jlt",
        "silicon oasis",
        "mirdif",
        "barsha",
        "tecom",
        "motor city",
        "arabian ranches",
        "damac",
        "jvc",
        "jvt",
        "al quoz",
        "karama",
        "satwa",
        "difc",
        "downtown",
      ],
    ],
    [
      "Sharjah",
      [
        "sharjah",
        "majaz",
        "al majaz",
        "muwaileh",
        "nahda",
        "al nahda",
        "khan",
        "al khan",
        "qasimia",
        "kalba",
        "khor fakkan",
        "al taawun",
        "rollo",
      ],
    ],
    [
      "Ajman",
      ["ajman", "nuaimiya", "al nuaimiya", "rashidiya", "al rashidiya", "al jurf", "jurf", "al rawda"],
    ],
    [
      "Umm Al Quwain",
      ["umm al quwain", "umm al quwayn", "uaq", "al salamah", "falaj al mualla"],
    ],
    [
      "Ras Al Khaimah",
      ["ras al khaimah", "rak", "al hamra", "mina al arab", "nakheel", "khuzam", "jazeerah"],
    ],
    [
      "Fujairah",
      ["fujairah", "dibba", "khorfakkan", "mirbah", "qidfa"],
    ],
  ];
  for (const [emirate, keys] of rules) {
    if (keys.some((k) => l.includes(k))) return emirate;
  }
  return null;
}

/** Mathematical coordinate-based detection of UAE Emirate. */
export function getEmirateFromCoords(lat: number, lon: number): Emirate {
  // East coast / Fujairah
  if (lon > 56.12 || (lat >= 25.0 && lat <= 25.6 && lon >= 56.15)) {
    return "Fujairah";
  }
  // Ras Al Khaimah (Northern UAE)
  if (lat >= 25.60) {
    return "Ras Al Khaimah";
  }
  // Umm Al Quwain
  if (lat >= 25.48 && lat < 25.60 && lon >= 55.50 && lon <= 55.85) {
    return "Umm Al Quwain";
  }
  // Ajman
  if (lat >= 25.38 && lat < 25.46 && lon >= 55.45 && lon <= 55.58) {
    return "Ajman";
  }
  // Sharjah
  if (lat >= 25.30 && lat < 25.44 && lon >= 55.35 && lon <= 55.70) {
    return "Sharjah";
  }
  // Dubai (approx 24.85° to 25.32° N, 55.0° to 55.45° E)
  if (lat >= 24.85 && lat < 25.32 && lon >= 55.0 && lon <= 55.5) {
    return "Dubai";
  }
  // Abu Dhabi (lat < 24.85 or western/southern UAE)
  if (lat < 24.85 || lon < 55.0) {
    return "Abu Dhabi";
  }
  return "Abu Dhabi";
}


const gradients = [
  "from-orange-200 via-orange-100 to-amber-50",
  "from-amber-200 via-orange-100 to-rose-50",
  "from-orange-300 via-amber-200 to-yellow-100",
  "from-rose-200 via-orange-100 to-amber-100",
  "from-yellow-200 via-orange-200 to-orange-100",
  "from-orange-100 via-rose-100 to-amber-100",
];

export const gradientForId = (id: string) =>
  gradients[
    Math.abs([...id].reduce((a, c) => a + c.charCodeAt(0), 0)) % gradients.length
  ];

export function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/** Display handle for a user: their chosen username, prefixed with "@". */
export function handle(
  owner: { display_name?: string | null; username?: string | null } | null | undefined,
): string {
  // Always prefer the real username — display_name can still hold a legacy
  // email-derived value for older accounts.
  const name = owner?.username?.trim() || owner?.display_name?.trim();
  return name ? `@${name.replace(/^@/, "")}` : "@user";
}

