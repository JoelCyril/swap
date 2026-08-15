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
  const l = (location ?? "").toLowerCase();
  if (!l) return null;
  const rules: [Emirate, string[]][] = [
    ["Abu Dhabi", ["abu dhabi", "reem", "yas island", "al raha", "khalifa city", "corniche", "bateen", "saadiyat", "mussafah", "al ain", "shakhbout", "ruwais", "masdar"]],
    ["Dubai", ["dubai", "jbr", "marina", "palm jumeirah", "jumeirah", "business bay", "deira", "bur dubai", "jlt", "silicon oasis", "mirdif", "barsha", "tecom", "motor city", "arabian ranches", "damac", "jvc"]],
    ["Sharjah", ["sharjah", "majaz", "muwaileh", "nahda", "khan", "qasimia", "kalba", "khor fakkan"]],
    ["Ajman", ["ajman", "nuaimiya", "rashidiya"]],
    ["Umm Al Quwain", ["umm al quwain", "umm al quwayn", "uaq"]],
    ["Ras Al Khaimah", ["ras al khaimah", "rak ", "al hamra", "mina al arab"]],
    ["Fujairah", ["fujairah", "dibba"]],
  ];
  for (const [emirate, keys] of rules) {
    if (keys.some((k) => l.includes(k))) return emirate;
  }
  return null;
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

