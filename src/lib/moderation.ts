/**
 * Deterministic content check for two things only:
 *  1. items illegal/restricted to sell in the UAE (+ vape / smoking items)
 *  2. profanity, slurs, hate speech, threats, sexually explicit language
 * Nothing else is judged.
 */
export type ModerationResult =
  | { flagged: false }
  | {
      flagged: true;
      type: "listing" | "chat";
      category: "banned_item" | "banned_word";
      terms: string[];
      reason: string;
    };

const BANNED_ITEMS = [
  // weapons / firearms
  "gun", "guns", "handgun", "firearm", "firearms", "pistol", "revolver", "rifle", "shotgun",
  "ammo", "ammunition", "bullet", "bullets", "silencer", "grenade", "explosive", "explosives",
  "taser", "stun gun", "knuckle duster", "switchblade", "flick knife", "butterfly knife",
  "brass knuckles", "pepper spray", "airsoft", "bb gun", "pellet gun",
  // drugs
  "cocaine", "heroin", "meth", "methamphetamine", "weed", "marijuana", "cannabis", "hashish",
  "hash oil", "thc", "cbd oil", "lsd", "ecstasy", "mdma", "ketamine", "opium", "poppy seeds",
  "bong", "shisha", "hookah", "narcotic", "narcotics",
  // alcohol
  "alcohol", "whiskey", "whisky", "vodka", "beer", "wine", "tequila", "rum", "gin",
  "liquor", "champagne", "brandy",
  // vape / smoking
  "vape", "vapes", "vaping", "vape pen", "e-cigarette", "ecigarette", "e cig", "juul",
  "nicotine", "cigarette", "cigarettes", "cigar", "cigars", "tobacco", "rolling papers", "lighter fluid",
  // counterfeit
  "counterfeit", "fake rolex", "replica rolex", "first copy", "master copy", "knockoff", "knock-off",
  // wildlife
  "ivory", "elephant tusk", "rhino horn", "shark fin", "pangolin", "tiger skin", "turtle shell",
  "endangered", "falcon", "exotic animal",
  // prescription meds
  "tramadol", "xanax", "valium", "adderall", "codeine", "oxycodone", "morphine", "viagra",
  "steroids", "prescription pills", "antibiotics",
  // gambling
  "casino chips", "gambling", "betting slip", "roulette wheel", "poker chips", "lottery ticket",
  // adult / remains
  "porn", "pornography", "pornographic", "sex toy", "sex toys", "dildo", "vibrator", "escort service",
  "human remains", "human bones", "human skull", "kidney for sale", "organ for sale", "human organ",
];

const BANNED_WORDS = [
  "fuck", "fucking", "fucker", "motherfucker", "shit", "bullshit", "bitch", "bitches",
  "asshole", "cunt", "dick", "cock", "pussy", "whore", "slut", "bastard", "wanker",
  "nigger", "nigga", "faggot", "fag", "retard", "retarded", "tranny", "kike", "spic",
  "chink", "paki", "raghead", "towelhead", "kafir",
  "kill you", "kill yourself", "kys", "i'll kill", "ill kill", "murder you", "beat you up",
  "stab you", "shoot you", "rape", "rapist", "molest", "pedophile", "paedophile",
  "blowjob", "handjob", "cum", "jizz", "horny", "nudes", "send nudes", "cumshot",
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function match(text: string, list: string[]): string[] {
  const hay = text.toLowerCase().replace(/[_*.\-]+/g, " ").replace(/\s+/g, " ");
  const hits: string[] = [];
  for (const term of list) {
    const re = new RegExp(`(^|[^a-z0-9])${escape(term)}([^a-z0-9]|$)`, "i");
    if (re.test(hay)) hits.push(term);
  }
  return hits;
}

export function moderate(text: string, type: "listing" | "chat"): ModerationResult {
  if (!text || !text.trim()) return { flagged: false };

  const itemHits = match(text, BANNED_ITEMS);
  if (itemHits.length) {
    return {
      flagged: true,
      type,
      category: "banned_item",
      terms: itemHits,
      reason: "Mentions items that are illegal or restricted to sell under UAE law.",
    };
  }

  const wordHits = match(text, BANNED_WORDS);
  if (wordHits.length) {
    return {
      flagged: true,
      type,
      category: "banned_word",
      terms: wordHits,
      reason: "Contains profanity, slurs, hate speech, threats or sexually explicit language.",
    };
  }

  return { flagged: false };
}
